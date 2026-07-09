import { renderLayout } from "./_lib/layout.js";
import { renderBreadcrumb, renderFaqList, renderFaqSchema } from "./_lib/components.js";
import { GENERAL_FAQS } from "./_lib/data/faqs.js";
import { PRODUCTS } from "./_lib/data/products.js";

export async function onRequestGet() {
  const liveProducts = PRODUCTS.filter((p) => p.status === "live" && p.faqs);

  const bodyHtml = `
    <section class="mx-auto max-w-3xl px-6 py-16 lg:px-8">
      ${renderBreadcrumb([{ label: "ホーム", href: "/" }, { label: "FAQ" }])}
      <div class="mx-auto mt-6 max-w-2xl text-center">
        <p class="section-eyebrow">FAQ</p>
        <h1 class="section-title">よくあるご質問</h1>
        <p class="section-subtitle">購入方法やサポート範囲など、全商品共通のご質問です。商品ごとのご質問は各商品ページにも掲載しています。</p>
      </div>

      <div class="mt-12">${renderFaqList(GENERAL_FAQS)}</div>

      ${
        liveProducts.length
          ? `
      <div class="mt-16 text-center">
        <p class="text-sm text-slate-500">商品ごとのFAQは、各商品の詳細ページでもご確認いただけます。</p>
        <div class="mt-4 flex flex-wrap justify-center gap-3">
          ${liveProducts
            .map((p) => `<a href="/products/${p.slug}" class="btn-secondary">${p.name}のFAQを見る</a>`)
            .join("")}
        </div>
      </div>`
          : ""
      }
    </section>
  `;

  return renderLayout({
    title: "よくあるご質問",
    description: "購入方法・サポート範囲など、業務システム全般に関するよくあるご質問をまとめています。",
    path: "/faq",
    activeNav: "faq",
    bodyHtml,
    structuredData: [renderFaqSchema(GENERAL_FAQS)],
  });
}
