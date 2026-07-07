import { getSessionUser } from "../../_lib/auth.js";
import { json } from "../../_lib/response.js";

export async function onRequestGet(context) {
  const { request, env } = context;

  const session = await getSessionUser(request, env);
  if (!session) {
    return json({ success: false }, 401);
  }

  const user = await env.DB.prepare("SELECT id, email, role FROM users WHERE id = ?").bind(session.id).first();
  if (!user) {
    return json({ success: false }, 401);
  }

  return json({ success: true, user });
}
