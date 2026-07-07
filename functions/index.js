import { CMS_KEYS } from "./_lib/cms-keys.js";

class TextSetter {
  constructor(value) {
    this.value = value;
  }
  element(element) {
    element.setInnerContent(this.value);
  }
}

export async function onRequestGet(context) {
  const { request, env } = context;

  // まず静的な public/index.html をそのまま取得する。
  // これが「D1に値がない場合の初期値(現在のHTMLの内容)」そのものになる。
  const response = await env.ASSETS.fetch(request);

  if (!env.DB) return response;

  let rows;
  try {
    const placeholders = CMS_KEYS.map(() => "?").join(",");
    const result = await env.DB.prepare(`SELECT key, value FROM site_settings WHERE key IN (${placeholders})`)
      .bind(...CMS_KEYS)
      .all();
    rows = result.results;
  } catch (error) {
    console.error(`[index] site_settings の取得に失敗しました: ${error.message}`);
    return response;
  }

  if (!rows || rows.length === 0) return response;

  const rewriter = new HTMLRewriter();
  for (const row of rows) {
    rewriter.on(`[data-cms="${row.key}"]`, new TextSetter(row.value));
  }

  return rewriter.transform(response);
}
