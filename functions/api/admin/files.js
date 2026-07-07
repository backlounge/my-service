import { json } from "../../_lib/response.js";

const MAX_FILE_SIZE = 20 * 1024 * 1024; // 20MB

function sanitizeFilename(name) {
  const trimmed = name.trim().slice(-150); // 拡張子を残しつつ長すぎる名前を末尾優先で切り詰め
  return trimmed.replace(/[^a-zA-Z0-9._-]/g, "_");
}

function fileUrl(r2Key) {
  return `/files/${r2Key}`;
}

export async function onRequestGet(context) {
  const { env, request } = context;

  const url = new URL(request.url);
  const q = (url.searchParams.get("q") || "").trim();
  const projectId = url.searchParams.get("project_id");
  const quoteId = url.searchParams.get("quote_id");

  let query = `
    SELECT files.id, files.filename, files.original_name, files.mime_type, files.size,
           files.r2_key, files.project_id, files.quote_id, files.created_at, users.email as uploaded_by_email
    FROM files
    LEFT JOIN users ON users.id = files.uploaded_by
  `;
  const conditions = [];
  const bindings = [];

  if (q) {
    conditions.push("files.original_name LIKE ?");
    bindings.push(`%${q}%`);
  }
  if (projectId) {
    conditions.push("files.project_id = ?");
    bindings.push(Number(projectId));
  }
  if (quoteId) {
    conditions.push("files.quote_id = ?");
    bindings.push(Number(quoteId));
  }
  if (conditions.length) {
    query += " WHERE " + conditions.join(" AND ");
  }
  query += " ORDER BY files.created_at DESC LIMIT 200";

  const stmt = env.DB.prepare(query);
  const { results } = bindings.length ? await stmt.bind(...bindings).all() : await stmt.all();

  const files = results.map((row) => ({ ...row, url: fileUrl(row.r2_key) }));

  return json({ success: true, files });
}

export async function onRequestPost(context) {
  const { env, request, data } = context;

  if (data.user.role !== "admin") {
    return json({ success: false, message: "この操作には管理者権限が必要です。" }, 403);
  }

  if (!env.FILES_BUCKET) {
    return json({ success: false, message: "サーバー側の設定エラーです(R2未接続)。" }, 500);
  }

  let form;
  try {
    form = await request.formData();
  } catch {
    return json({ success: false, message: "不正なリクエストです。" }, 400);
  }

  const file = form.get("file");
  if (!(file instanceof File)) {
    return json({ success: false, message: "アップロードするファイルを選択してください。" }, 400);
  }

  if (file.size === 0) {
    return json({ success: false, message: "空のファイルはアップロードできません。" }, 400);
  }
  if (file.size > MAX_FILE_SIZE) {
    return json(
      { success: false, message: `ファイルサイズが大きすぎます(上限: ${MAX_FILE_SIZE / 1024 / 1024}MB)。` },
      400
    );
  }

  const safeName = sanitizeFilename(file.name || "file");
  const r2Key = `${crypto.randomUUID()}-${safeName}`;
  const mimeType = file.type || "application/octet-stream";

  const rawProjectId = form.get("project_id");
  let projectId = null;
  if (rawProjectId) {
    const parsed = Number(rawProjectId);
    if (!Number.isInteger(parsed) || parsed <= 0) {
      return json({ success: false, message: "不正な案件IDです。" }, 400);
    }
    const project = await env.DB.prepare("SELECT id FROM projects WHERE id = ?").bind(parsed).first();
    if (!project) {
      return json({ success: false, message: "対象の案件が見つかりません。" }, 404);
    }
    projectId = parsed;
  }

  const rawQuoteId = form.get("quote_id");
  let quoteId = null;
  if (rawQuoteId) {
    const parsed = Number(rawQuoteId);
    if (!Number.isInteger(parsed) || parsed <= 0) {
      return json({ success: false, message: "不正な見積IDです。" }, 400);
    }
    const quote = await env.DB.prepare("SELECT id FROM quotes WHERE id = ?").bind(parsed).first();
    if (!quote) {
      return json({ success: false, message: "対象の見積が見つかりません。" }, 404);
    }
    quoteId = parsed;
  }

  try {
    await env.FILES_BUCKET.put(r2Key, file, {
      httpMetadata: { contentType: mimeType },
    });
  } catch (error) {
    console.error(`[admin/files] R2アップロードに失敗しました: ${error.message}`);
    return json({ success: false, message: "アップロードに失敗しました。時間をおいて再度お試しください。" }, 500);
  }

  let inserted;
  try {
    const result = await env.DB.prepare(
      `INSERT INTO files (filename, original_name, mime_type, size, r2_key, uploaded_by, project_id, quote_id, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))`
    )
      .bind(safeName, file.name || safeName, mimeType, file.size, r2Key, data.user.id, projectId, quoteId)
      .run();
    inserted = result.meta.last_row_id;
  } catch (error) {
    console.error(`[admin/files] D1保存に失敗しました: ${error.message}`);
    // D1保存に失敗した場合はR2側にゴミが残らないよう削除しておく
    await env.FILES_BUCKET.delete(r2Key).catch(() => {});
    return json({ success: false, message: "保存に失敗しました。時間をおいて再度お試しください。" }, 500);
  }

  return json({
    success: true,
    file: {
      id: inserted,
      filename: safeName,
      original_name: file.name || safeName,
      mime_type: mimeType,
      size: file.size,
      r2_key: r2Key,
      project_id: projectId,
      quote_id: quoteId,
      url: fileUrl(r2Key),
    },
  });
}
