import { renderLayout } from "./_lib/layout.js";
import { renderBreadcrumb } from "./_lib/components.js";

// 特定商取引法に基づく表記(ページ枠のみ)。
// 内容は自社サイト内での購入導線を実装するタイミングで正式に記載する。
const ROWS = [
  ["販売事業者", "準備中(販売開始前に記載)"],
  ["運営責任者", "準備中(販売開始前に記載)"],
  ["所在地", "準備中(請求があった場合には遅滞なく開示します)"],
  ["連絡先", "お問い合わせフォームよりご連絡ください(メールアドレスは請求があった場合に遅滞なく開示します)"],
  ["販売価格", "各商品ページに記載、またはお申し込み・お問い合わせ時にご案内します"],
  ["商品代金以外の必要料金", "銀行振込の手数料はお客様のご負担となります。ダウンロード・ご利用にかかる通信費用はお客様のご負担です"],
  ["お支払い方法", "銀行振込"],
  ["お支払い時期", "お申し込み後にご案内する期日までにお振込みください"],
  ["商品の引き渡し時期", "ご入金の確認後、通常1〜2営業日以内に、ダウンロード用のURL(ZIPファイル)をメールでお送りします"],
  ["返品・キャンセルについて", "ダウンロード提供のデジタルソフトウェアの性質上、ご購入後の返品・返金は原則お受けしておりません。動作の不具合があった場合は修正版の提供で対応します"],
];

export async function onRequestGet() {
  const bodyHtml = `
    <section class="mx-auto max-w-2xl px-6 py-16 lg:px-8">
      ${renderBreadcrumb([{ label: "ホーム", href: "/" }, { label: "特定商取引法に基づく表記" }])}
      <h1 class="section-title mt-6">特定商取引法に基づく表記</h1>
      <p class="mt-4 rounded-xl border border-amber-200 bg-amber-50 px-5 py-4 text-sm text-amber-800">
        このページは準備中です。自社サイト内での購入導線(決済)を実装するタイミングで、正式な内容を記載します。
      </p>

      <dl class="mt-10 divide-y divide-slate-200 border-y border-slate-200">
        ${ROWS.map(
          ([label, value]) => `
          <div class="grid grid-cols-1 gap-1 py-4 sm:grid-cols-3 sm:gap-4">
            <dt class="text-sm font-semibold text-slate-500">${label}</dt>
            <dd class="text-sm text-slate-800 sm:col-span-2">${value}</dd>
          </div>`
        ).join("")}
      </dl>
    </section>
  `;

  return renderLayout({
    title: "特定商取引法に基づく表記",
    description: "特定商取引法に基づく表記(準備中)。",
    path: "/legal",
    bodyHtml,
    noindex: true,
  });
}
