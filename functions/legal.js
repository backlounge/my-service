import { renderLayout } from "./_lib/layout.js";
import { renderBreadcrumb } from "./_lib/components.js";

// 特定商取引法に基づく表記。
// 所在地・電話番号は非公開(請求があれば遅滞なく開示する方式)のため、ここにも記載しない。
// 開示請求への対応は運営者が個別に行う(サイト・コード側では扱わない)。
const ROWS = [
  ["販売事業者", "佐藤 慧（屋号：BackLounge）"],
  ["運営責任者", "佐藤 慧"],
  ["所在地", "請求があれば遅滞なく開示いたします。開示をご希望の方は下記の連絡先までご連絡ください。"],
  ["電話番号", "請求があれば遅滞なく開示いたします。開示をご希望の方は下記の連絡先までご連絡ください。"],
  ["連絡先", "backlounge1206@gmail.com（お問い合わせフォームからもご連絡いただけます）"],
  ["販売価格", "各商品ページに記載しています"],
  ["商品代金以外の必要料金", "銀行振込の手数料はお客様のご負担となります。ダウンロード・ご利用にかかる通信費用はお客様のご負担です"],
  ["お支払い方法", "銀行振込"],
  ["お支払い時期", "お申し込み後7日以内にお振込みください"],
  ["商品の引き渡し時期", "ご入金の確認後、通常1〜2営業日以内に、ダウンロード用のURL(ZIPファイル)をメールでお送りします"],
  ["返品・キャンセルについて", "デジタル商品(ダウンロード提供のソフトウェア)のため、ご購入後の返品・返金は原則お受けしておりません。動作の不具合があった場合は、修正版の提供で対応します"],
];

export async function onRequestGet() {
  const bodyHtml = `
    <section class="mx-auto max-w-2xl px-6 py-16 lg:px-8">
      ${renderBreadcrumb([{ label: "ホーム", href: "/" }, { label: "特定商取引法に基づく表記" }])}
      <h1 class="section-title mt-6">特定商取引法に基づく表記</h1>

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
    description: "特定商取引法に基づく表記です。",
    path: "/legal",
    bodyHtml,
  });
}
