// 見積番号を自動採番する(例: Q-2026-0001)。年ごとに連番をリセットする。
export async function generateQuoteNumber(env) {
  const year = new Date().getUTCFullYear();
  const prefix = `Q-${year}-`;

  const row = await env.DB.prepare(
    "SELECT quote_number FROM quotes WHERE quote_number LIKE ? ORDER BY quote_number DESC LIMIT 1"
  )
    .bind(`${prefix}%`)
    .first();

  let nextSequence = 1;
  if (row) {
    const match = row.quote_number.match(/-(\d+)$/);
    if (match) nextSequence = Number(match[1]) + 1;
  }

  return `${prefix}${String(nextSequence).padStart(4, "0")}`;
}
