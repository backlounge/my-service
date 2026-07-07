import { json } from "../../../../_lib/response.js";
import { generateQuoteNumber } from "../../../../_lib/quote-number.js";
import { calculateQuoteTotals } from "../../../../_lib/quote-calc.js";

export async function onRequestPost(context) {
  const { env, params, data } = context;

  if (data.user.role !== "admin") {
    return json({ success: false, message: "この操作には管理者権限が必要です。" }, 403);
  }

  const id = Number(params.id);
  if (!Number.isInteger(id) || id <= 0) {
    return json({ success: false, message: "不正なIDです。" }, 400);
  }

  const source = await env.DB.prepare("SELECT * FROM quotes WHERE id = ?").bind(id).first();
  if (!source) {
    return json({ success: false, message: "対象の見積が見つかりません。" }, 404);
  }

  const { results: sourceItems } = await env.DB.prepare(
    "SELECT * FROM quote_items WHERE quote_id = ? ORDER BY sort_order ASC, id ASC"
  )
    .bind(id)
    .all();

  const totals = calculateQuoteTotals(sourceItems);
  const quoteNumber = await generateQuoteNumber(env);
  const today = new Date().toISOString().slice(0, 10);

  const result = await env.DB.prepare(
    `INSERT INTO quotes (quote_number, project_id, status, quote_date, valid_until, assignee, subtotal, tax_total, total, version, created_by, created_at, updated_at)
     VALUES (?, ?, 'draft', ?, NULL, ?, ?, ?, ?, 1, ?, datetime('now'), datetime('now'))`
  )
    .bind(
      quoteNumber,
      source.project_id,
      today,
      source.assignee,
      totals.subtotal,
      totals.taxTotal,
      totals.total,
      data.user.id
    )
    .run();

  const newQuoteId = result.meta.last_row_id;

  const statements = sourceItems.map((item, index) =>
    env.DB.prepare(
      `INSERT INTO quote_items (quote_id, sort_order, product_name, quantity, unit, unit_price, discount, tax_rate, note)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
    ).bind(newQuoteId, index, item.product_name, item.quantity, item.unit, item.unit_price, item.discount, item.tax_rate, item.note)
  );
  if (statements.length) {
    await env.DB.batch(statements);
  }

  const newQuote = await env.DB.prepare("SELECT * FROM quotes WHERE id = ?").bind(newQuoteId).first();
  const { results: newItems } = await env.DB.prepare(
    "SELECT * FROM quote_items WHERE quote_id = ? ORDER BY sort_order ASC, id ASC"
  )
    .bind(newQuoteId)
    .all();

  await env.DB.prepare(
    `INSERT INTO quote_versions (quote_id, version_number, snapshot, created_by, created_at)
     VALUES (?, 1, ?, ?, datetime('now'))`
  )
    .bind(newQuoteId, JSON.stringify({ quote: newQuote, items: newItems }), data.user.id)
    .run();

  return json({ success: true, quote: newQuote });
}
