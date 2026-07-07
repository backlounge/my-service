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

  let query = `
    SELECT files.id, files.filename, files.original_name, files.mime_type, files.size,
           files.r2_key, files.created_at, users.email as uploaded_by_email
    FROM files
    LEFT JOIN users ON users.id = files.uploaded_by
  `;
  const bindings = [];

  if (q) {
    query += " WHERE files.original_name LIKE ?";
    bindings.push(`%${q}%`);
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
      `INSERT INTO files (filename, original_name, mime_type, size, r2_key, uploaded_by, created_at)
       VALUES (?, ?, ?, ?, ?, ?, datetime('now'))`
    )
      .bind(safeName, file.name || safeName, mimeType, file.size, r2Key, data.user.id)
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
      url: fileUrl(r2Key),
    },
  });
}
