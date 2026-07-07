import { json } from "../../../_lib/response.js";

export async function onRequestDelete(context) {
  const { env, params, data } = context;

  if (data.user.role !== "admin") {
    return json({ success: false, message: "この操作には管理者権限が必要です。" }, 403);
  }

  const id = Number(params.id);
  if (!Number.isInteger(id) || id <= 0) {
    return json({ success: false, message: "不正なIDです。" }, 400);
  }

  const file = await env.DB.prepare("SELECT r2_key FROM files WHERE id = ?").bind(id).first();
  if (!file) {
    return json({ success: false, message: "対象のファイルが見つかりません。" }, 404);
  }

  try {
    if (env.FILES_BUCKET) {
      await env.FILES_BUCKET.delete(file.r2_key);
    }
  } catch (error) {
    console.error(`[admin/files] R2からの削除に失敗しました: ${error.message}`);
    return json({ success: false, message: "ファイルの削除に失敗しました。時間をおいて再度お試しください。" }, 500);
  }

  await env.DB.prepare("DELETE FROM files WHERE id = ?").bind(id).run();

  return json({ success: true });
}
