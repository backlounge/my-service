import { json } from "../../_lib/response.js";
import { generateQuoteNumber } from "../../_lib/quote-number.js";

export const ALLOWED_STATUS = ["draft", "sent", "accepted", "rejected"];

export async function onRequestGet(context) {
  const { env, request } = context;

  const url = new URL(request.url);
  const q = (url.searchParams.get("q") || "").trim();
  const status = url.searchParams.get("status");
  const projectId = url.searchParams.get("project_id");

  let query = `
    SELECT quotes.*, projects.title as project_title, projects.customer_name, projects.customer_email
    FROM quotes
    JOIN projects ON projects.id = quotes.project_id
  `;
  const conditions = [];
  const bindings = [];

  if (q) {
    conditions.push("(quotes.quote_number LIKE ? OR projects.title LIKE ? OR projects.customer_name LIKE ?)");
    bindings.push(`%${q}%`, `%${q}%`, `%${q}%`);
  }
  if (status && ALLOWED_STATUS.includes(status)) {
    conditions.push("quotes.status = ?");
    bindings.push(status);
  }
  if (projectId) {
    conditions.push("quotes.project_id = ?");
    bindings.push(Number(projectId));
  }
  if (conditions.length) {
    query += " WHERE " + conditions.join(" AND ");
  }
  query += " ORDER BY quotes.updated_at DESC LIMIT 200";

  const stmt = env.DB.prepare(query);
  const { results } = bindings.length ? await stmt.bind(...bindings).all() : await stmt.all();

  return json({ success: true, quotes: results });
}

export async function onRequestPost(context) {
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

  const projectId = Number(body.project_id);
  if (!Number.isInteger(projectId) || projectId <= 0) {
    return json({ success: false, message: "案件を指定してください。" }, 400);
  }

  const project = await env.DB.prepare("SELECT id FROM projects WHERE id = ?").bind(projectId).first();
  if (!project) {
    return json({ success: false, message: "対象の案件が見つかりません。" }, 404);
  }

  const quoteNumber = await generateQuoteNumber(env);
  const quoteDate = (body.quote_date || "").toString().trim() || new Date().toISOString().slice(0, 10);
  const validUntil = (body.valid_until || "").toString().trim() || null;
  const assignee = (body.assignee || data.user.email || "").toString().trim() || null;

  const result = await env.DB.prepare(
    `INSERT INTO quotes (quote_number, project_id, status, quote_date, valid_until, assignee, created_by, created_at, updated_at)
     VALUES (?, ?, 'draft', ?, ?, ?, ?, datetime('now'), datetime('now'))`
  )
    .bind(quoteNumber, projectId, quoteDate, validUntil, assignee, data.user.id)
    .run();

  const quote = await env.DB.prepare("SELECT * FROM quotes WHERE id = ?").bind(result.meta.last_row_id).first();

  await env.DB.prepare(
    `INSERT INTO quote_versions (quote_id, version_number, snapshot, created_by, created_at)
     VALUES (?, 1, ?, ?, datetime('now'))`
  )
    .bind(quote.id, JSON.stringify({ quote, items: [] }), data.user.id)
    .run();

  return json({ success: true, quote });
}
