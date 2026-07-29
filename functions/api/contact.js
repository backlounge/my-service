import { json } from "../_lib/response.js";
import { sendEmail } from "../_lib/email.js";

const RATE_LIMIT_COOLDOWN_CLAUSE = "created_at > datetime('now', '-30 seconds')";
const DAILY_LIMIT_CLAUSE = "created_at > datetime('now', '-1 day')";
const DAILY_LIMIT_MAX = 10;

export async function onRequestPost(context) {
  const { request, env } = context;

  let form;
  try {
    form = await request.formData();
  } catch {
    return json({ success: false, message: "不正なリクエストです。" }, 400);
  }

  // ハニーポット: 人には見えないフィールドが埋まっていればボットとみなし、
  // 成功したふりをして実際の保存はスキップする(DBには書き込まない)
  if ((form.get("botcheck") || "").toString().length > 0) {
    console.log("[contact] honeypot triggered - skipping DB write, returning fake success");
    return json({ success: true });
  }

  const name = (form.get("name") || "").toString().trim();
  const email = (form.get("email") || "").toString().trim();
  const company = (form.get("company") || "").toString().trim();
  const rawMessage = (form.get("message") || "").toString().trim();
  let message = rawMessage;
  // 商品詳細ページから遷移した場合、どの商品(・プラン)についての問い合わせかを本文の先頭に付記する
  const productName = (form.get("product_name") || "").toString().trim();
  const editionName = (form.get("edition_name") || "").toString().trim();
  // 「購入を申し込む」導線からの送信かどうか。product_nameの有無だけで判定すると、商品ページの
  // 「まず相談する」(通常問い合わせ)まで購入申込扱いになってしまうため、intentフィールドで判定する。
  const intent = (form.get("intent") || "").toString().trim();
  const isPurchase = intent === "purchase" && Boolean(productName);

  if (!name || !email || !message) {
    return json({ success: false, message: "必須項目が入力されていません。" }, 400);
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return json({ success: false, message: "メールアドレスの形式が正しくありません。" }, 400);
  }
  if (name.length > 100 || email.length > 200 || company.length > 200 || message.length > 4000 || editionName.length > 100) {
    return json({ success: false, message: "入力内容が長すぎます。" }, 400);
  }
  if (productName) {
    const label = editionName ? `${productName.slice(0, 100)}（${editionName.slice(0, 100)}）` : productName.slice(0, 100);
    message = `【対象商品: ${label}】\n${message}`;
  }

  const ip = request.headers.get("CF-Connecting-IP") || "unknown";
  const requestId = crypto.randomUUID();

  if (!env.DB) {
    console.error(`[contact:${requestId}] D1 binding "DB" is not available in this environment.`);
    return json(
      { success: false, message: "サーバー側の設定エラーです。時間をおいて再度お試しください。", requestId },
      500
    );
  }

  try {
    const recent = await env.DB.prepare(
      `SELECT id FROM contacts WHERE ip = ? AND ${RATE_LIMIT_COOLDOWN_CLAUSE} LIMIT 1`
    )
      .bind(ip)
      .first();
    if (recent) {
      return json(
        { success: false, message: "送信間隔が短すぎます。しばらくしてから再度お試しください。" },
        429
      );
    }

    const dailyCount = await env.DB.prepare(
      `SELECT COUNT(*) as count FROM contacts WHERE ip = ? AND ${DAILY_LIMIT_CLAUSE}`
    )
      .bind(ip)
      .first();
    if (dailyCount && dailyCount.count >= DAILY_LIMIT_MAX) {
      return json({ success: false, message: "本日の送信上限に達しました。" }, 429);
    }

    const insertResult = await env.DB.prepare(
      `INSERT INTO contacts (name, email, company, message, status, ip, created_at)
       VALUES (?, ?, ?, ?, 'new', ?, datetime('now'))`
    )
      .bind(name, email, company, message, ip)
      .run();

    if (!insertResult.success || !insertResult.meta || insertResult.meta.changes !== 1) {
      console.error(
        `[contact:${requestId}] INSERT did not report success. result=${JSON.stringify(insertResult)}`
      );
      return json(
        { success: false, message: "保存に失敗しました。時間をおいて再度お試しください。", requestId },
        500
      );
    }

    const contactId = insertResult.meta.last_row_id;
    console.log(
      `[contact:${requestId}] INSERT ok. id=${contactId} changes=${insertResult.meta.changes}`
    );

    // 申込データ本体(D1)の保存が確定した後にメール送信を試みる。
    // メール送信に失敗しても、この申込自体は保存済みとして扱う(以下でcatchしてログに残すのみ)。
    await notifyByEmail(env, {
      requestId,
      contactId,
      name,
      email,
      company,
      rawMessage,
      productName,
      editionName,
      isPurchase,
    });

    return json({ success: true });
  } catch (error) {
    console.error(`[contact:${requestId}] D1 operation threw: ${error.message}`, error.stack);
    return json(
      { success: false, message: "サーバーエラーが発生しました。時間をおいて再度お試しください。", requestId },
      500
    );
  }
}

async function notifyByEmail(env, { requestId, contactId, name, email, company, rawMessage, productName, editionName, isPurchase }) {
  const submittedAt = new Date().toLocaleString("ja-JP", {
    timeZone: "Asia/Tokyo",
    dateStyle: "medium",
    timeStyle: "short",
  });

  const adminEmail = buildAdminNotificationEmail({
    name,
    email,
    company,
    rawMessage,
    productName,
    editionName,
    isPurchase,
    submittedAt,
  });
  const applicantEmail = buildApplicantReceiptEmail({
    name,
    rawMessage,
    productName,
    editionName,
    isPurchase,
    submittedAt,
  });

  // 同一申込(contactId)に対して送信処理が二重実行されても、Resend側で重複送信されないように
  // 申込ID+送信種別からIdempotency-Keyを組み立てる。
  const results = await Promise.allSettled([
    sendEmail(env, {
      to: env.CONTACT_NOTIFY_TO,
      from: env.CONTACT_FROM_EMAIL,
      replyTo: email,
      subject: adminEmail.subject,
      text: adminEmail.text,
      idempotencyKey: `backlounge-contact-${contactId}-admin`,
    }),
    sendEmail(env, {
      to: email,
      from: env.CONTACT_FROM_EMAIL,
      replyTo: env.CONTACT_NOTIFY_TO,
      subject: applicantEmail.subject,
      text: applicantEmail.text,
      idempotencyKey: `backlounge-contact-${contactId}-applicant`,
    }),
  ]);

  const [adminResult, applicantResult] = results;
  if (adminResult.status === "rejected") {
    console.error(
      `[contact:${requestId}] admin notification email FAILED (contactId=${contactId}): ${adminResult.reason?.message || adminResult.reason}`
    );
  } else {
    console.log(`[contact:${requestId}] admin notification email sent (contactId=${contactId})`);
  }
  if (applicantResult.status === "rejected") {
    console.error(
      `[contact:${requestId}] applicant receipt email FAILED (contactId=${contactId}, to=${email}): ${applicantResult.reason?.message || applicantResult.reason}`
    );
  } else {
    console.log(`[contact:${requestId}] applicant receipt email sent (contactId=${contactId})`);
  }
}

function buildAdminNotificationEmail({ name, email, company, rawMessage, productName, editionName, isPurchase, submittedAt }) {
  const subject = isPurchase
    ? `【購入申込】${productName}${editionName ? `（${editionName}）` : ""}`
    : `【お問い合わせ】${name}様より`;

  const text = [
    `新しい${isPurchase ? "購入申込" : "お問い合わせ"}がありました。`,
    "",
    `■ お名前: ${name}`,
    `■ 会社名・屋号: ${company || "(未入力)"}`,
    `■ メールアドレス: ${email}`,
    `■ 対象商品: ${productName || "(指定なし)"}`,
    `■ プラン: ${editionName || "(指定なし)"}`,
    `■ 申込日時: ${submittedAt}`,
    "",
    `■ ${isPurchase ? "お申し込み内容" : "お問い合わせ内容"}:`,
    rawMessage,
    "",
    "----------------------------------------",
    "このメールはBackLoungeサイトのフォームから自動送信されています。",
    "このメールにそのまま返信すると、送信者のメールアドレス宛に届きます。",
  ].join("\n");

  return { subject, text };
}

function buildApplicantReceiptEmail({ name, rawMessage, productName, editionName, isPurchase, submittedAt }) {
  if (isPurchase) {
    const planLine = editionName ? `（${editionName}）` : "";
    const subject = `【BackLounge】${productName}のお申し込みを受け付けました`;
    const text = [
      `${name} 様`,
      "",
      `この度は${productName}${planLine}のお申し込みをいただき、誠にありがとうございます。`,
      "以下の内容で承りました。",
      "",
      `■ 対象商品: ${productName}`,
      `■ プラン: ${editionName || "(指定なし)"}`,
      `■ お申し込み日時: ${submittedAt}`,
      "",
      "■ お申し込み内容:",
      rawMessage,
      "",
      "----------------------------------------",
      "今後の流れについて",
      "----------------------------------------",
      "1〜2営業日以内に、担当者より金額とお振込先(銀行振込)をメールでご案内いたします。",
      "振込期限は、ご案内メールの送付日から7日以内です。",
      "ご入金確認後、通常1〜2営業日以内にダウンロード用のURL(ZIPファイル)をメールでお届けします。",
      "",
      "ご不明点がございましたら、このメールにそのままご返信ください。",
      "",
      "BackLounge",
    ].join("\n");
    return { subject, text };
  }

  const subject = "【BackLounge】お問い合わせを受け付けました";
  const text = [
    `${name} 様`,
    "",
    "お問い合わせいただき、誠にありがとうございます。",
    "以下の内容で承りました。",
    "",
    "■ お問い合わせ内容:",
    rawMessage,
    "",
    "1〜2営業日以内に、担当者よりご返信いたします。今しばらくお待ちください。",
    "",
    "ご不明点がございましたら、このメールにそのままご返信ください。",
    "",
    "BackLounge",
  ].join("\n");
  return { subject, text };
}
