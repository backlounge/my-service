import { renderLayout } from "./_lib/layout.js";
import { renderBreadcrumb } from "./_lib/components.js";

// 特定商取引法に基づく表記(ページ枠のみ)。
// 内容は自社サイト内での購入導線を実装するタイミングで正式に記載する。
const ROWS = [
  ["販売事業者", "準備中"],
  ["運営責任者", "準備中"],
  ["所在地", "準備中(請求があった場合には遅滞なく開示します)"],
  ["連絡先", "お問い合わせフォームよりご連絡ください"],
  ["販売価格", "各商品ページに記載、またはお問い合わせ時にご案内"],
  ["商品代金以外の必要料金", "準備中"],
  ["お支払い方法", "準備中"],
  ["お支払い時期", "準備中"],
  ["商品の引き渡し時期", "準備中"],
  ["返品・キャンセルについて", "デジタルコンテンツの性質上、購入後の返品・返金は原則お受けしておりません"],
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
