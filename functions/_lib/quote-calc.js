// 見積明細1行分の税抜金額(数量×単価-値引き)を計算する
export function calculateLineSubtotal(item) {
  const quantity = Number(item.quantity) || 0;
  const unitPrice = Number(item.unit_price) || 0;
  const discount = Number(item.discount) || 0;
  return Math.round(quantity * unitPrice - discount);
}

// 明細一覧から小計・消費税(税率ごとにグループ化して計算)・合計を求める
export function calculateQuoteTotals(items) {
  let subtotal = 0;
  const subtotalByTaxRate = new Map();

  for (const item of items) {
    const lineSubtotal = calculateLineSubtotal(item);
    subtotal += lineSubtotal;

    const taxRate = Number(item.tax_rate) || 0;
    subtotalByTaxRate.set(taxRate, (subtotalByTaxRate.get(taxRate) || 0) + lineSubtotal);
  }

  let taxTotal = 0;
  for (const [taxRate, groupSubtotal] of subtotalByTaxRate) {
    taxTotal += Math.round(groupSubtotal * (taxRate / 100));
  }

  return { subtotal, taxTotal, total: subtotal + taxTotal };
}
