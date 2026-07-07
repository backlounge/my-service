import { json } from "../../../_lib/response.js";
import { ALLOWED_STATUS } from "../projects.js";

export async function onRequestGet(context) {
  const { env, params } = context;

  const id = Number(params.id);
  if (!Number.isInteger(id) || id <= 0) {
    return json({ success: false, message: "不正なIDです。" }, 400);
  }

  const project = await env.DB.prepare("SELECT * FROM projects WHERE id = ?").bind(id).first();
  if (!project) {
    return json({ success: false, message: "対象の案件が見つかりません。" }, 404);
  }

  const { results } = await env.DB.prepare(
    "SELECT id, original_name, mime_type, size, r2_key, created_at FROM files WHERE project_id = ? ORDER BY created_at DESC"
  )
    .bind(id)
    .all();

  const files = results.map((f) => ({ ...f, url: `/files/${f.r2_key}` }));

  return json({ success: true, project, files });
}

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

  const fields = [];
  const bindings = [];

  if (body.title !== undefined) {
    const title = body.title.toString().trim();
    if (!title) return json({ success: false, message: "案件名は必須です。" }, 400);
    if (title.length > 200) return json({ success: false, message: "案件名が長すぎます。" }, 400);
    fields.push("title = ?");
    bindings.push(title);
  }
  if (body.customer_name !== undefined) {
    const customerName = body.customer_name.toString().trim();
    if (!customerName) return json({ success: false, message: "顧客名は必須です。" }, 400);
    if (customerName.length > 100) return json({ success: false, message: "顧客名が長すぎます。" }, 400);
    fields.push("customer_name = ?");
    bindings.push(customerName);
  }
  if (body.customer_email !== undefined) {
    fields.push("customer_email = ?");
    bindings.push((body.customer_email || "").toString().trim() || null);
  }
  if (body.memo !== undefined) {
    fields.push("memo = ?");
    bindings.push((body.memo || "").toString());
  }
  if (body.status !== undefined) {
    if (!ALLOWED_STATUS.includes(body.status)) {
      return json({ success: false, message: "不正なステータスです。" }, 400);
    }
    fields.push("status = ?");
    bindings.push(body.status);
  }

  if (fields.length === 0) {
    return json({ success: false, message: "更新する項目がありません。" }, 400);
  }

  fields.push("updated_at = datetime('now')");
  bindings.push(id);

  const result = await env.DB.prepare(`UPDATE projects SET ${fields.join(", ")} WHERE id = ?`)
    .bind(...bindings)
    .run();

  if (result.meta.changes === 0) {
    return json({ success: false, message: "対象の案件が見つかりません。" }, 404);
  }

  const project = await env.DB.prepare("SELECT * FROM projects WHERE id = ?").bind(id).first();
  return json({ success: true, project });
}

export async function onRequestDelete(context) {
  const { env, params, data } = context;

  if (data.user.role !== "admin") {
    return json({ success: false, message: "この操作には管理者権限が必要です。" }, 403);
  }

  const id = Number(params.id);
  if (!Number.isInteger(id) || id <= 0) {
    return json({ success: false, message: "不正なIDです。" }, 400);
  }

  const project = await env.DB.prepare("SELECT id FROM projects WHERE id = ?").bind(id).first();
  if (!project) {
    return json({ success: false, message: "対象の案件が見つかりません。" }, 404);
  }

  if (env.FILES_BUCKET) {
    const { results: attachedFiles } = await env.DB.prepare("SELECT r2_key FROM files WHERE project_id = ?")
      .bind(id)
      .all();
    for (const file of attachedFiles) {
      await env.FILES_BUCKET.delete(file.r2_key).catch((error) => {
        console.error(`[admin/projects] 添付ファイルのR2削除に失敗しました: ${error.message}`);
      });
    }
  }

  await env.DB.prepare("DELETE FROM files WHERE project_id = ?").bind(id).run();
  await env.DB.prepare("DELETE FROM projects WHERE id = ?").bind(id).run();

  return json({ success: true });
}
