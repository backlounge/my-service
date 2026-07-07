import { isAuthenticated } from "../../_lib/auth.js";
import { json } from "../../_lib/response.js";

export async function onRequest(context) {
  const { request, env, next } = context;
  const url = new URL(request.url);

  // ログイン・ログアウトは認証チェック対象外
  if (url.pathname === "/api/admin/login" || url.pathname === "/api/admin/logout") {
    return next();
  }

  const ok = await isAuthenticated(request, env);
  if (!ok) {
    return json({ success: false, message: "認証が必要です。" }, 401);
  }

  return next();
}
