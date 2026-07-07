import { getSessionUser } from "../_lib/auth.js";

export async function onRequest(context) {
  const { request, env, next } = context;
  const url = new URL(request.url);

  // ログインページ自体は未ログインでもアクセス可能
  if (url.pathname === "/admin/login" || url.pathname === "/admin/login.html") {
    return next();
  }

  const user = await getSessionUser(request, env);
  if (!user) {
    return Response.redirect(`${url.origin}/admin/login`, 302);
  }

  return next();
}
