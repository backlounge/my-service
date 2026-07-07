import { CMS_FIELDS, CMS_KEYS } from "../../_lib/cms-keys.js";
import { json } from "../../_lib/response.js";

const MAX_LENGTH_FALLBACK = 500;

export async function onRequestGet(context) {
  const { env, data } = context;

  if (data.user.role !== "admin") {
    return json({ success: false, message: "この操作には管理者権限が必要です。" }, 403);
  }

  const placeholders = CMS_KEYS.map(() => "?").join(",");
  const { results } = await env.DB.prepare(`SELECT key, value FROM site_settings WHERE key IN (${placeholders})`)
    .bind(...CMS_KEYS)
    .all();

  const values = Object.fromEntries(results.map((row) => [row.key, row.value]));

  return json({ success: true, fields: CMS_FIELDS, values });
}

export async function onRequestPut(context) {
  const { env, request, data } = context;

  if (data.user.role !== "admin") {
    return json({ success: false, message: "この操作には管理者権限が必要です。" }, 403);
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return json({ success: false, message: "不正なリクエストです。" }, 400);
  }

  const values = body.values && typeof body.values === "object" ? body.values : null;
  if (!values) {
    return json({ success: false, message: "保存する値がありません。" }, 400);
  }

  const fieldByKey = Object.fromEntries(CMS_FIELDS.map((f) => [f.key, f]));
  const updates = [];

  for (const [key, rawValue] of Object.entries(values)) {
    const field = fieldByKey[key];
    if (!field) continue; // 未知のキーは無視(想定外の項目を保存させない)

    const value = (rawValue ?? "").toString();
    const maxLength = field.maxLength || MAX_LENGTH_FALLBACK;
    if (value.length > maxLength) {
      return json(
        { success: false, message: `「${field.label}」は${maxLength}文字以内で入力してください。` },
        400
      );
    }
    updates.push({ key, value });
  }

  if (updates.length === 0) {
    return json({ success: false, message: "保存できる項目がありませんでした。" }, 400);
  }

  const statements = updates.map(({ key, value }) =>
    env.DB.prepare(
      `INSERT INTO site_settings (key, value, updated_at) VALUES (?, ?, datetime('now'))
       ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at`
    ).bind(key, value)
  );

  try {
    await env.DB.batch(statements);
  } catch (error) {
    console.error(`[admin/settings] 保存に失敗しました: ${error.message}`);
    return json({ success: false, message: "保存に失敗しました。時間をおいて再度お試しください。" }, 500);
  }

  return json({ success: true });
}
