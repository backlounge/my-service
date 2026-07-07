import { json } from "../_lib/response.js";

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
  const message = (form.get("message") || "").toString().trim();

  if (!name || !email || !message) {
    return json({ success: false, message: "必須項目が入力されていません。" }, 400);
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return json({ success: false, message: "メールアドレスの形式が正しくありません。" }, 400);
  }
  if (name.length > 100 || email.length > 200 || company.length > 200 || message.length > 4000) {
    return json({ success: false, message: "入力内容が長すぎます。" }, 400);
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

    console.log(
      `[contact:${requestId}] INSERT ok. id=${insertResult.meta.last_row_id} changes=${insertResult.meta.changes}`
    );

    return json({ success: true });
  } catch (error) {
    console.error(`[contact:${requestId}] D1 operation threw: ${error.message}`, error.stack);
    return json(
      { success: false, message: "サーバーエラーが発生しました。時間をおいて再度お試しください。", requestId },
      500
    );
  }
}
