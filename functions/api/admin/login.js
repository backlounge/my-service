import { createSessionCookie } from "../../_lib/auth.js";
import { json } from "../../_lib/response.js";

export async function onRequestPost(context) {
  const { request, env } = context;

  if (!env.ADMIN_PASSWORD) {
    return json({ success: false, message: "サーバー側の設定が未完了です(ADMIN_PASSWORD未設定)。" }, 500);
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return json({ success: false, message: "不正なリクエストです。" }, 400);
  }

  const password = (body.password || "").toString();
  if (!password || password !== env.ADMIN_PASSWORD) {
    return json({ success: false, message: "パスワードが正しくありません。" }, 401);
  }

  const cookie = await createSessionCookie(env);
  return json({ success: true }, 200, { "Set-Cookie": cookie });
}
