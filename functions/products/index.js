import { renderLayout } from "../_lib/layout.js";
import { renderBreadcrumb, renderProductCard } from "../_lib/components.js";
import { PRODUCTS } from "../_lib/data/products.js";

export async function onRequestGet() {
  const bodyHtml = `
    <section class="mx-auto max-w-7xl px-6 py-16 lg:px-8">
      ${renderBreadcrumb([{ label: "ホーム", href: "/" }, { label: "商品一覧" }])}

      <div class="mx-auto mt-6 max-w-2xl text-center">
        <p class="section-eyebrow">Products</p>
        <h1 class="section-title">商品一覧</h1>
        <p class="section-subtitle">
          現時点では買い切り型を基本とした、自社アカウントへの設置型です。気になる商品の詳細ページから、機能や価格をご確認ください。
        </p>
      </div>

      <div class="mt-14 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        ${PRODUCTS.map(renderProductCard).join("")}
      </div>
    </section>
  `;

  return renderLayout({
    title: "商品一覧",
    description: "顧客管理・見積管理・在庫管理・予約管理など、中小企業・個人事業主向けの業務システム一覧です(現時点では買い切り型が基本です)。",
    path: "/products",
    activeNav: "products",
    bodyHtml,
    structuredData: [
      {
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "ホーム", item: "https://example.com/" },
          { "@type": "ListItem", position: 2, name: "商品一覧", item: "https://example.com/products" },
        ],
      },
    ],
  });
}
