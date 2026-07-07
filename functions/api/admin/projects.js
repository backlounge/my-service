import { json } from "../../_lib/response.js";

export const ALLOWED_STATUS = ["new", "hearing", "quotation", "contract", "development", "completed", "cancel"];

export async function onRequestGet(context) {
  const { env, request } = context;

  const url = new URL(request.url);
  const q = (url.searchParams.get("q") || "").trim();
  const status = url.searchParams.get("status");

  let query = "SELECT * FROM projects";
  const conditions = [];
  const bindings = [];

  if (q) {
    conditions.push("(title LIKE ? OR customer_name LIKE ?)");
    bindings.push(`%${q}%`, `%${q}%`);
  }
  if (status && ALLOWED_STATUS.includes(status)) {
    conditions.push("status = ?");
    bindings.push(status);
  }
  if (conditions.length) {
    query += " WHERE " + conditions.join(" AND ");
  }
  query += " ORDER BY updated_at DESC LIMIT 200";

  const stmt = env.DB.prepare(query);
  const { results } = bindings.length ? await stmt.bind(...bindings).all() : await stmt.all();

  return json({ success: true, projects: results });
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

  let title;
  let customerName;
  let customerEmail;
  let memo;

  if (body.contact_id) {
    const contactId = Number(body.contact_id);
    if (!Number.isInteger(contactId) || contactId <= 0) {
      return json({ success: false, message: "不正な問い合わせIDです。" }, 400);
    }

    const contact = await env.DB.prepare("SELECT * FROM contacts WHERE id = ?").bind(contactId).first();
    if (!contact) {
      return json({ success: false, message: "対象の問い合わせが見つかりません。" }, 404);
    }

    title = (body.title || `${contact.name}様の案件`).toString().trim();
    customerName = contact.name;
    customerEmail = contact.email;
    memo = (body.memo || contact.message || "").toString();
  } else {
    title = (body.title || "").toString().trim();
    customerName = (body.customer_name || "").toString().trim();
    customerEmail = (body.customer_email || "").toString().trim() || null;
    memo = (body.memo || "").toString();

    if (!title || !customerName) {
      return json({ success: false, message: "案件名と顧客名は必須です。" }, 400);
    }
  }

  if (title.length > 200 || customerName.length > 100) {
    return json({ success: false, message: "入力内容が長すぎます。" }, 400);
  }

  const status = body.status && ALLOWED_STATUS.includes(body.status) ? body.status : "new";

  const result = await env.DB.prepare(
    `INSERT INTO projects (title, customer_name, customer_email, status, memo, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, datetime('now'), datetime('now'))`
  )
    .bind(title, customerName, customerEmail, status, memo)
    .run();

  const project = await env.DB.prepare("SELECT * FROM projects WHERE id = ?").bind(result.meta.last_row_id).first();

  return json({ success: true, project });
}
