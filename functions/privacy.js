import { renderLayout } from "./_lib/layout.js";
import { renderBreadcrumb } from "./_lib/components.js";

// プライバシーポリシー(ページ枠のみ)。
// 内容は自社サイト内での購入導線(決済含む)を実装するタイミングで正式に記載する。
const SECTIONS = [
  { title: "収集する情報", body: "準備中(お問い合わせフォームで取得する氏名・メールアドレス等を記載予定)" },
  { title: "利用目的", body: "準備中(お問い合わせ対応、商品のご案内等を記載予定)" },
  { title: "第三者提供について", body: "準備中" },
  { title: "Cookie等の利用について", body: "準備中" },
  { title: "お問い合わせ窓口", body: "お問い合わせフォームよりご連絡ください" },
];

export async function onRequestGet() {
  const bodyHtml = `
    <section class="mx-auto max-w-2xl px-6 py-16 lg:px-8">
      ${renderBreadcrumb([{ label: "ホーム", href: "/" }, { label: "プライバシーポリシー" }])}
      <h1 class="section-title mt-6">プライバシーポリシー</h1>
      <p class="mt-4 rounded-xl border border-amber-200 bg-amber-50 px-5 py-4 text-sm text-amber-800">
        このページは準備中です。自社サイト内での購入導線(決済含む)を実装するタイミングで、正式な内容を記載します。
      </p>

      <div class="article-body mt-10">
        ${SECTIONS.map((s) => `<h2>${s.title}</h2><p>${s.body}</p>`).join("")}
      </div>
    </section>
  `;

  return renderLayout({
    title: "プライバシーポリシー",
    description: "プライバシーポリシー(準備中)。",
    path: "/privacy",
    bodyHtml,
    noindex: true,
  });
}
