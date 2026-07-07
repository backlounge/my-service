import { json } from "../../_lib/response.js";

const ALLOWED_STATUS = ["new", "doing", "done"];

export async function onRequestGet(context) {
  const { env, request } = context;
  const url = new URL(request.url);
  const status = url.searchParams.get("status");

  let query = "SELECT id, name, email, company, message, status, created_at FROM contacts";
  const bindings = [];

  if (status && ALLOWED_STATUS.includes(status)) {
    query += " WHERE status = ?";
    bindings.push(status);
  }
  query += " ORDER BY created_at DESC LIMIT 200";

  const stmt = env.DB.prepare(query);
  const { results } = bindings.length ? await stmt.bind(...bindings).all() : await stmt.all();

  return json({ success: true, contacts: results });
}
