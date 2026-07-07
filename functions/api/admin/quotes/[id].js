import { json } from "../../../_lib/response.js";
import { ALLOWED_STATUS } from "../quotes.js";
import { calculateQuoteTotals } from "../../../_lib/quote-calc.js";

async function getQuoteWithItems(env, id) {
  const quote = await env.DB.prepare(
    `SELECT quotes.*, projects.title as project_title, projects.customer_name, projects.customer_email
     FROM quotes JOIN projects ON projects.id = quotes.project_id
     WHERE quotes.id = ?`
  )
    .bind(id)
    .first();
  if (!quote) return null;

  const { results: items } = await env.DB.prepare(
    "SELECT * FROM quote_items WHERE quote_id = ? ORDER BY sort_order ASC, id ASC"
  )
    .bind(id)
    .all();

  return { quote, items };
}

export async function onRequestGet(context) {
  const { env, params } = context;

  const id = Number(params.id);
  if (!Number.isInteger(id) || id <= 0) {
    return json({ success: false, message: "不正なIDです。" }, 400);
  }

  const result = await getQuoteWithItems(env, id);
  if (!result) {
    return json({ success: false, message: "対象の見積が見つかりません。" }, 404);
  }

  return json({ success: true, quote: result.quote, items: result.items });
}

function normalizeItems(rawItems) {
  if (!Array.isArray(rawItems)) return { error: "明細の形式が不正です。" };

  const items = [];
  for (const raw of rawItems) {
    const productName = (raw.product_name || "").toString().trim();
    if (!productName) return { error: "商品名は必須です。" };
    if (productName.length > 200) return { error: "商品名が長すぎます。" };

    items.push({
      product_name: productName,
      quantity: Number(raw.quantity) || 0,
      unit: (raw.unit || "").toString().trim() || null,
      unit_price: Number(raw.unit_price) || 0,
      discount: Number(raw.discount) || 0,
      tax_rate: Number(raw.tax_rate) || 0,
      note: (raw.note || "").toString().trim() || null,
    });
  }
  return { items };
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

  const existing = await env.DB.prepare("SELECT id, version FROM quotes WHERE id = ?").bind(id).first();
  if (!existing) {
    return json({ success: false, message: "対象の見積が見つかりません。" }, 404);
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return json({ success: false, message: "不正なリクエストです。" }, 400);
  }

  if (body.status !== undefined && !ALLOWED_STATUS.includes(body.status)) {
    return json({ success: false, message: "不正なステータスです。" }, 400);
  }

  const { items, error } = normalizeItems(body.items || []);
  if (error) {
    return json({ success: false, message: error }, 400);
  }

  const totals = calculateQuoteTotals(items);
  const nextVersion = existing.version + 1;

  const quoteDate = (body.quote_date || "").toString().trim();
  const validUntil = (body.valid_until || "").toString().trim() || null;
  const assignee = (body.assignee || "").toString().trim() || null;
  const status = body.status || undefined;

  const statements = [
    env.DB.prepare(
      `UPDATE quotes SET
         quote_date = COALESCE(NULLIF(?, ''), quote_date),
         valid_until = ?,
         assignee = ?,
         status = COALESCE(?, status),
         subtotal = ?,
         tax_total = ?,
         total = ?,
         version = ?,
         updated_at = datetime('now')
       WHERE id = ?`
    ).bind(quoteDate, validUntil, assignee, status ?? null, totals.subtotal, totals.taxTotal, totals.total, nextVersion, id),
    env.DB.prepare("DELETE FROM quote_items WHERE quote_id = ?").bind(id),
  ];

  items.forEach((item, index) => {
    statements.push(
      env.DB.prepare(
        `INSERT INTO quote_items (quote_id, sort_order, product_name, quantity, unit, unit_price, discount, tax_rate, note)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
      ).bind(id, index, item.product_name, item.quantity, item.unit, item.unit_price, item.discount, item.tax_rate, item.note)
    );
  });

  await env.DB.batch(statements);

  const updated = await getQuoteWithItems(env, id);

  await env.DB.prepare(
    `INSERT INTO quote_versions (quote_id, version_number, snapshot, created_by, created_at)
     VALUES (?, ?, ?, ?, datetime('now'))`
  )
    .bind(id, nextVersion, JSON.stringify(updated), data.user.id)
    .run();

  return json({ success: true, quote: updated.quote, items: updated.items });
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

  const quote = await env.DB.prepare("SELECT id FROM quotes WHERE id = ?").bind(id).first();
  if (!quote) {
    return json({ success: false, message: "対象の見積が見つかりません。" }, 404);
  }

  if (env.FILES_BUCKET) {
    const { results: attachedFiles } = await env.DB.prepare("SELECT r2_key FROM files WHERE quote_id = ?")
      .bind(id)
      .all();
    for (const file of attachedFiles) {
      await env.FILES_BUCKET.delete(file.r2_key).catch((err) => {
        console.error(`[admin/quotes] 添付ファイルのR2削除に失敗しました: ${err.message}`);
      });
    }
  }

  await env.DB.batch([
    env.DB.prepare("DELETE FROM files WHERE quote_id = ?").bind(id),
    env.DB.prepare("DELETE FROM quote_items WHERE quote_id = ?").bind(id),
    env.DB.prepare("DELETE FROM quote_versions WHERE quote_id = ?").bind(id),
    env.DB.prepare("DELETE FROM quotes WHERE id = ?").bind(id),
  ]);

  return json({ success: true });
}
