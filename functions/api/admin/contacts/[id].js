import { json } from "../../../_lib/response.js";

const ALLOWED_STATUS = ["new", "doing", "done"];

export async function onRequestPatch(context) {
  const { env, request, params, data } = context;

  if (data.user.role !== "admin") {
    return json({ success: false, message: "この操作には管理者権限が必要です。" }, 403);
  }

  const id = Number(params.id);
  if (!Number.isInteger(id) || id <= 0) {
    return json({ success: false, message: "不正なIDです。" }, 400);
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return json({ success: false, message: "不正なリクエストです。" }, 400);
  }

  const status = (body.status || "").toString();
  if (!ALLOWED_STATUS.includes(status)) {
    return json({ success: false, message: "不正なステータスです。" }, 400);
  }

  const result = await env.DB.prepare("UPDATE contacts SET status = ? WHERE id = ?").bind(status, id).run();
  if (result.meta.changes === 0) {
    return json({ success: false, message: "対象のお問い合わせが見つかりません。" }, 404);
  }

  return json({ success: true });
}
