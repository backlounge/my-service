import { verifyPassword } from "../../_lib/password.js";
import { createSessionCookie } from "../../_lib/auth.js";
import { json } from "../../_lib/response.js";

const MAX_RECENT_FAILURES = 8;
const WINDOW_CLAUSE = "created_at > datetime('now', '-15 minutes')";

export async function onRequestPost(context) {
  const { request, env } = context;

  if (!env.SESSION_SECRET) {
    return json({ success: false, message: "サーバー側の設定が未完了です(SESSION_SECRET未設定)。" }, 500);
  }
  if (!env.DB) {
    return json({ success: false, message: "サーバー側の設定が未完了です(D1未接続)。" }, 500);
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return json({ success: false, message: "不正なリクエストです。" }, 400);
  }

  const email = (body.email || "").toString().trim().toLowerCase();
  const password = (body.password || "").toString();
  const ip = request.headers.get("CF-Connecting-IP") || "unknown";

  if (!email || !password) {
    return json({ success: false, message: "メールアドレスとパスワードを入力してください。" }, 400);
  }

  const recentFailures = await env.DB.prepare(
    `SELECT COUNT(*) as count FROM login_attempts WHERE ip = ? AND success = 0 AND ${WINDOW_CLAUSE}`
  )
    .bind(ip)
    .first();
  if (recentFailures && recentFailures.count >= MAX_RECENT_FAILURES) {
    return json(
      { success: false, message: "試行回数が多すぎます。しばらくしてから再度お試しください。" },
      429
    );
  }

  const user = await env.DB.prepare("SELECT id, email, password_hash, role FROM users WHERE email = ?")
    .bind(email)
    .first();

  const ok = user ? await verifyPassword(password, user.password_hash) : false;

  await env.DB.prepare("INSERT INTO login_attempts (email, ip, success, created_at) VALUES (?, ?, ?, datetime('now'))")
    .bind(email, ip, ok ? 1 : 0)
    .run();

  if (!ok) {
    return json({ success: false, message: "メールアドレスまたはパスワードが正しくありません。" }, 401);
  }

  const cookie = await createSessionCookie(env, user);
  return json({ success: true, role: user.role }, 200, { "Set-Cookie": cookie });
}
