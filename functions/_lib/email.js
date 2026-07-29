// Resend (https://resend.com) のREST APIを使ったメール送信。
// APIキーはCloudflare Secret(RESEND_API_KEY)から、送信元アドレスは呼び出し側が
// 環境変数(CONTACT_FROM_EMAIL)経由で渡す。宛先・件名・本文はここでは持たない
// (テンプレートはfunctions/api/contact.js側で組み立てる)。
//
// 実際の購入者・問い合わせ者(第三者)へ送信するには、Resend側で送信元ドメインの検証が必要。
// onboarding@resend.dev はResendアカウント所有者自身への動作確認にしか使えない。
//
// 失敗時は例外を投げるだけで、リトライ等は行わない。呼び出し側でログを残し、
// D1への保存(申込データ本体)には影響させないこと。
//
// idempotencyKey: 同一の申込に対してメール送信が二重実行された場合でも、Resend側で
// 重複送信を防ぐためのキー。呼び出し側(contact.js)がD1のcontactId+送信種別から組み立てる。

const RESEND_API_URL = "https://api.resend.com/emails";

export async function sendEmail(env, { to, from, replyTo, subject, text, idempotencyKey }) {
  if (!env.RESEND_API_KEY) {
    throw new Error("RESEND_API_KEY is not configured");
  }
  if (!from) {
    throw new Error("from address is not configured (CONTACT_FROM_EMAIL)");
  }
  if (!to) {
    throw new Error("to address is not configured");
  }

  const payload = {
    from,
    to: Array.isArray(to) ? to : [to],
    subject,
    text,
  };
  if (replyTo) {
    payload.reply_to = replyTo;
  }

  const headers = {
    Authorization: `Bearer ${env.RESEND_API_KEY}`,
    "Content-Type": "application/json",
  };
  if (idempotencyKey) {
    headers["Idempotency-Key"] = idempotencyKey;
  }

  const res = await fetch(RESEND_API_URL, {
    method: "POST",
    headers,
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const bodyText = await res.text().catch(() => "");
    throw new Error(`Resend API error (${res.status}): ${bodyText.slice(0, 500)}`);
  }

  return res.json();
}
