import { json } from "../../../../_lib/response.js";
import { calculateQuoteTotals } from "../../../../_lib/quote-calc.js";

export async function onRequestGet(context) {
  const { env, params } = context;

  const id = Number(params.id);
  if (!Number.isInteger(id) || id <= 0) {
    return json({ success: false, message: "不正なIDです。" }, 400);
  }

  const { results } = await env.DB.prepare(
    `SELECT quote_versions.id, quote_versions.version_number, quote_versions.created_at, users.email as created_by_email
     FROM quote_versions
     LEFT JOIN users ON users.id = quote_versions.created_by
     WHERE quote_versions.quote_id = ?
     ORDER BY quote_versions.version_number DESC`
  )
    .bind(id)
    .all();

  return json({ success: true, versions: results });
}

export async function onRequestPost(context) {
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

  const versionNumber = Number(body.version_number);
  if (!Number.isInteger(versionNumber) || versionNumber <= 0) {
    return json({ success: false, message: "復元するバージョンを指定してください。" }, 400);
  }

  const quote = await env.DB.prepare("SELECT id, version FROM quotes WHERE id = ?").bind(id).first();
  if (!quote) {
    return json({ success: false, message: "対象の見積が見つかりません。" }, 404);
  }

  const versionRow = await env.DB.prepare(
    "SELECT snapshot FROM quote_versions WHERE quote_id = ? AND version_number = ?"
  )
    .bind(id, versionNumber)
    .first();
  if (!versionRow) {
    return json({ success: false, message: "対象のバージョンが見つかりません。" }, 404);
  }

  const snapshot = JSON.parse(versionRow.snapshot);
  const items = snapshot.items || [];
  const totals = calculateQuoteTotals(items);
  const nextVersion = quote.version + 1;

  const statements = [
    env.DB.prepare(
      `UPDATE quotes SET
         quote_date = ?, valid_until = ?, assignee = ?, status = ?,
         subtotal = ?, tax_total = ?, total = ?, version = ?, updated_at = datetime('now')
       WHERE id = ?`
    ).bind(
      snapshot.quote.quote_date,
      snapshot.quote.valid_until,
      snapshot.quote.assignee,
      snapshot.quote.status,
      totals.subtotal,
      totals.taxTotal,
      totals.total,
      nextVersion,
      id
    ),
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

  const restoredQuote = await env.DB.prepare("SELECT * FROM quotes WHERE id = ?").bind(id).first();
  const { results: restoredItems } = await env.DB.prepare(
    "SELECT * FROM quote_items WHERE quote_id = ? ORDER BY sort_order ASC, id ASC"
  )
    .bind(id)
    .all();

  await env.DB.prepare(
    `INSERT INTO quote_versions (quote_id, version_number, snapshot, created_by, created_at)
     VALUES (?, ?, ?, ?, datetime('now'))`
  )
    .bind(id, nextVersion, JSON.stringify({ quote: restoredQuote, items: restoredItems }), data.user.id)
    .run();

  return json({ success: true, quote: restoredQuote, items: restoredItems });
}
