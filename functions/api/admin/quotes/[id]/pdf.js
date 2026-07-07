import { PDFDocument, rgb } from "pdf-lib";
import fontkit from "@pdf-lib/fontkit";
import { json } from "../../../../_lib/response.js";

const PAGE_WIDTH = 595.28; // A4 pt
const PAGE_HEIGHT = 841.89;
const MARGIN = 40;
const CONTENT_WIDTH = PAGE_WIDTH - MARGIN * 2;

const COMPANY_KEYS = [
  "company-name",
  "company-address",
  "company-registration-number",
  "company-logo-url",
  "company-stamp-url",
];

const COLUMNS = [
  { key: "product_name", label: "商品名・仕様", width: 195, align: "left" },
  { key: "quantity", label: "数量", width: 40, align: "right" },
  { key: "unit", label: "単位", width: 35, align: "center" },
  { key: "unit_price", label: "単価", width: 70, align: "right" },
  { key: "discount", label: "値引", width: 55, align: "right" },
  { key: "tax_rate", label: "税率", width: 35, align: "right" },
  { key: "amount", label: "金額", width: 80, align: "right" },
];

function formatYen(amount) {
  return `¥${Math.round(Number(amount) || 0).toLocaleString("ja-JP")}`;
}

function formatDateJp(value) {
  if (!value) return "";
  return value.toString().slice(0, 10);
}

async function loadCompanySettings(env) {
  const placeholders = COMPANY_KEYS.map(() => "?").join(",");
  const { results } = await env.DB.prepare(`SELECT key, value FROM site_settings WHERE key IN (${placeholders})`)
    .bind(...COMPANY_KEYS)
    .all();
  return Object.fromEntries(results.map((row) => [row.key, row.value]));
}

async function fetchAssetBytes(env, url) {
  if (!url) return null;
  try {
    if (url.startsWith("/files/")) {
      if (!env.FILES_BUCKET) return null;
      const key = url.slice("/files/".length);
      const object = await env.FILES_BUCKET.get(key);
      if (!object) return null;
      return new Uint8Array(await object.arrayBuffer());
    }
    const response = await fetch(url);
    if (!response.ok) return null;
    return new Uint8Array(await response.arrayBuffer());
  } catch {
    return null;
  }
}

async function loadJapaneseFontBytes(env, request) {
  const origin = new URL(request.url).origin;
  const response = await env.ASSETS.fetch(new Request(new URL("/fonts/SawarabiGothic-Regular.ttf", origin)));
  return new Uint8Array(await response.arrayBuffer());
}

async function embedImageSmart(pdfDoc, bytes) {
  if (!bytes) return null;
  try {
    return await pdfDoc.embedPng(bytes);
  } catch {
    try {
      return await pdfDoc.embedJpg(bytes);
    } catch {
      return null;
    }
  }
}

// 日本語向けの簡易折り返し(1文字ずつ幅を測って収まる範囲で改行する)
function wrapText(text, font, size, maxWidth) {
  if (!text) return [""];
  const lines = [];
  let current = "";
  for (const char of text) {
    const candidate = current + char;
    if (font.widthOfTextAtSize(candidate, size) > maxWidth && current) {
      lines.push(current);
      current = char;
    } else {
      current = candidate;
    }
  }
  if (current) lines.push(current);
  return lines.length ? lines : [""];
}

class QuotePdfWriter {
  constructor(pdfDoc, font) {
    this.pdfDoc = pdfDoc;
    this.font = font;
    this.page = pdfDoc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
    this.y = PAGE_HEIGHT - MARGIN;
  }

  ensureSpace(height) {
    if (this.y - height < MARGIN) {
      this.page = this.pdfDoc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
      this.y = PAGE_HEIGHT - MARGIN;
    }
  }

  text(str, x, size, options = {}) {
    this.page.drawText(str, {
      x,
      y: this.y,
      size,
      font: this.font,
      color: options.color || rgb(0.1, 0.1, 0.12),
    });
  }

  textRightAligned(str, rightX, size, options = {}) {
    const w = this.font.widthOfTextAtSize(str, size);
    this.text(str, rightX - w, size, options);
  }

  textCentered(str, centerX, size, options = {}) {
    const w = this.font.widthOfTextAtSize(str, size);
    this.text(str, centerX - w / 2, size, options);
  }

  line(x1, y1, x2, y2, thickness = 0.75, color = rgb(0.75, 0.75, 0.78)) {
    this.page.drawLine({ start: { x: x1, y: y1 }, end: { x: x2, y: y2 }, thickness, color });
  }

  rect(x, y, w, h, options = {}) {
    this.page.drawRectangle({ x, y, width: w, height: h, ...options });
  }
}

export async function onRequestGet(context) {
  const { env, params, request } = context;

  const id = Number(params.id);
  if (!Number.isInteger(id) || id <= 0) {
    return json({ success: false, message: "不正なIDです。" }, 400);
  }

  const quote = await env.DB.prepare(
    `SELECT quotes.*, projects.title as project_title, projects.customer_name, projects.customer_email
     FROM quotes JOIN projects ON projects.id = quotes.project_id
     WHERE quotes.id = ?`
  )
    .bind(id)
    .first();
  if (!quote) {
    return json({ success: false, message: "対象の見積が見つかりません。" }, 404);
  }

  const { results: items } = await env.DB.prepare(
    "SELECT * FROM quote_items WHERE quote_id = ? ORDER BY sort_order ASC, id ASC"
  )
    .bind(id)
    .all();

  const company = await loadCompanySettings(env);

  const [fontBytes, logoBytes, stampBytes] = await Promise.all([
    loadJapaneseFontBytes(env, request),
    fetchAssetBytes(env, company["company-logo-url"]),
    fetchAssetBytes(env, company["company-stamp-url"]),
  ]);

  const pdfDoc = await PDFDocument.create();
  pdfDoc.registerFontkit(fontkit);
  // subset: true でこの日本語フォントを埋め込むと一部のグリフが欠落するため、
  // ファイルサイズは大きくなるがフル埋め込みにしている(既知の不具合の回避)
  const font = await pdfDoc.embedFont(fontBytes, { subset: false });

  const logoImage = await embedImageSmart(pdfDoc, logoBytes);
  const stampImage = await embedImageSmart(pdfDoc, stampBytes);

  const w = new QuotePdfWriter(pdfDoc, font);

  // タイトル
  w.textCentered("御 見 積 書", PAGE_WIDTH / 2, 22);
  w.y -= 40;

  // 左: 宛先 / 右: 見積情報
  const rightColX = PAGE_WIDTH - MARGIN;
  const headerTopY = w.y;

  w.text(`${quote.customer_name} 様`, MARGIN, 15);
  w.y -= 20;
  if (quote.customer_email) {
    w.text(quote.customer_email, MARGIN, 9, { color: rgb(0.4, 0.4, 0.45) });
    w.y -= 16;
  }
  w.text(`件名: ${quote.project_title}`, MARGIN, 10);

  w.y = headerTopY;
  w.textRightAligned(`見積番号: ${quote.quote_number}`, rightColX, 10);
  w.y -= 14;
  w.textRightAligned(`見積日: ${formatDateJp(quote.quote_date)}`, rightColX, 10);
  w.y -= 14;
  if (quote.valid_until) {
    w.textRightAligned(`有効期限: ${formatDateJp(quote.valid_until)}`, rightColX, 10);
    w.y -= 14;
  }
  if (quote.assignee) {
    w.textRightAligned(`担当: ${quote.assignee}`, rightColX, 10);
    w.y -= 14;
  }

  w.y = headerTopY - 70;

  // 会社情報(右側にロゴ・角印・会社名・住所)
  let companyBlockY = w.y;
  if (logoImage) {
    const maxLogoWidth = 120;
    const maxLogoHeight = 50;
    const aspect = logoImage.height / logoImage.width;
    let logoWidth = maxLogoWidth;
    let logoHeight = aspect * logoWidth;
    if (logoHeight > maxLogoHeight) {
      logoHeight = maxLogoHeight;
      logoWidth = logoHeight / aspect;
    }
    w.page.drawImage(logoImage, {
      x: rightColX - logoWidth,
      y: companyBlockY - logoHeight + 10,
      width: logoWidth,
      height: logoHeight,
    });
    companyBlockY -= logoHeight + 4;
  }
  if (company["company-name"]) {
    w.y = companyBlockY;
    w.textRightAligned(company["company-name"], rightColX - (stampImage ? 42 : 0), 11);
    if (stampImage) {
      const stampSize = 36;
      w.page.drawImage(stampImage, {
        x: rightColX - stampSize,
        y: w.y - 10,
        width: stampSize,
        height: stampSize,
      });
    }
    companyBlockY -= 16;
  }
  if (company["company-address"]) {
    for (const line of company["company-address"].split("\n")) {
      w.y = companyBlockY;
      w.textRightAligned(line, rightColX, 8, { color: rgb(0.4, 0.4, 0.45) });
      companyBlockY -= 12;
    }
  }
  if (company["company-registration-number"]) {
    w.y = companyBlockY;
    w.textRightAligned(`登録番号: ${company["company-registration-number"]}`, rightColX, 8, {
      color: rgb(0.4, 0.4, 0.45),
    });
    companyBlockY -= 12;
  }

  w.y = Math.min(headerTopY - 130, companyBlockY - 10);

  // 合計金額(税込)ボックス
  w.rect(MARGIN, w.y - 34, CONTENT_WIDTH, 34, { color: rgb(0.96, 0.96, 0.99), borderColor: rgb(0.85, 0.85, 0.9), borderWidth: 1 });
  w.text("ご請求金額(税込)", MARGIN + 14, 11, { color: rgb(0.35, 0.35, 0.4) });
  w.textRightAligned(`${formatYen(quote.total)}-`, MARGIN + CONTENT_WIDTH - 14, 18);
  w.y -= 34 + 24;

  // 明細テーブル
  const colX = [];
  {
    let x = MARGIN;
    for (const col of COLUMNS) {
      colX.push(x);
      x += col.width;
    }
  }

  function drawTableHeader() {
    w.ensureSpace(24);
    w.rect(MARGIN, w.y - 18, CONTENT_WIDTH, 18, { color: rgb(0.93, 0.93, 0.96) });
    COLUMNS.forEach((col, i) => {
      const cx = colX[i];
      if (col.align === "left") w.text(col.label, cx + 4, 9);
      else if (col.align === "right") w.textRightAligned(col.label, cx + col.width - 4, 9);
      else w.textCentered(col.label, cx + col.width / 2, 9);
    });
    w.y -= 18;
    w.line(MARGIN, w.y, MARGIN + CONTENT_WIDTH, w.y);
  }

  drawTableHeader();

  for (const item of items) {
    const lineSubtotal = Math.round((Number(item.quantity) || 0) * (Number(item.unit_price) || 0) - (Number(item.discount) || 0));
    const nameLines = wrapText(item.product_name, font, 9, COLUMNS[0].width - 8);
    const noteLines = item.note ? wrapText(`備考: ${item.note}`, font, 7.5, COLUMNS[0].width - 8) : [];
    const rowHeight = Math.max(18, (nameLines.length + noteLines.length) * 11 + 6);

    w.ensureSpace(rowHeight + 4);
    const rowTopY = w.y;

    let lineY = rowTopY - 11;
    for (const line of nameLines) {
      w.y = lineY;
      w.text(line, colX[0] + 4, 9);
      lineY -= 11;
    }
    for (const line of noteLines) {
      w.y = lineY;
      w.text(line, colX[0] + 4, 7.5, { color: rgb(0.45, 0.45, 0.5) });
      lineY -= 11;
    }

    w.y = rowTopY - 11;
    w.textRightAligned(String(item.quantity), colX[1] + COLUMNS[1].width - 4, 9);
    w.textCentered(item.unit || "", colX[2] + COLUMNS[2].width / 2, 9);
    w.textRightAligned(formatYen(item.unit_price), colX[3] + COLUMNS[3].width - 4, 9);
    w.textRightAligned(item.discount ? formatYen(item.discount) : "-", colX[4] + COLUMNS[4].width - 4, 9);
    w.textRightAligned(`${item.tax_rate}%`, colX[5] + COLUMNS[5].width - 4, 9);
    w.textRightAligned(formatYen(lineSubtotal), colX[6] + COLUMNS[6].width - 4, 9);

    w.y = rowTopY - rowHeight;
    w.line(MARGIN, w.y, MARGIN + CONTENT_WIDTH, w.y, 0.5, rgb(0.9, 0.9, 0.93));
  }

  // 合計欄
  w.ensureSpace(70);
  w.y -= 10;
  const summaryLabelX = MARGIN + CONTENT_WIDTH - 160;
  const summaryValueX = MARGIN + CONTENT_WIDTH;

  w.text("小計", summaryLabelX, 10);
  w.textRightAligned(formatYen(quote.subtotal), summaryValueX, 10);
  w.y -= 16;
  w.text("消費税", summaryLabelX, 10);
  w.textRightAligned(formatYen(quote.tax_total), summaryValueX, 10);
  w.y -= 16;
  w.line(summaryLabelX, w.y + 6, summaryValueX, w.y + 6);
  w.text("合計(税込)", summaryLabelX, 12);
  w.textRightAligned(formatYen(quote.total), summaryValueX, 12);

  const pdfBytes = await pdfDoc.save();

  const download = new URL(request.url).searchParams.get("download");
  return new Response(pdfBytes, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `${download ? "attachment" : "inline"}; filename="${quote.quote_number}.pdf"`,
      "Cache-Control": "no-store",
    },
  });
}
