import { getSessionUser } from "../../_lib/auth.js";
import { json } from "../../_lib/response.js";

export async function onRequest(context) {
  const { request, env, next, data } = context;

  const user = await getSessionUser(request, env);
  if (!user) {
    return json({ success: false, message: "認証が必要です。" }, 401);
  }

  data.user = user;
  return next();
}
