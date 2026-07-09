import { renderLayout } from "../_lib/layout.js";
import { renderBreadcrumb } from "../_lib/components.js";
import { getCaseStudyBySlug } from "../_lib/data/case-studies.js";
import { getProductBySlug } from "../_lib/data/products.js";
import { isValidSlug, escapeHtml, SITE_URL } from "../_lib/site.js";

export async function onRequestGet(context) {
  const { params } = context;
  const slug = params.slug;

  if (!isValidSlug(slug)) {
    return new Response("Not Found", { status: 404 });
  }

  const caseStudy = getCaseStudyBySlug(slug);
  if (!caseStudy) {
    return new Response("Not Found", { status: 404 });
  }

  const relatedProduct = caseStudy.relatedProductSlug ? getProductBySlug(caseStudy.relatedProductSlug) : null;

  const bodyHtml = `
    <article class="mx-auto max-w-3xl px-6 py-16 lg:px-8">
      ${renderBreadcrumb([{ label: "ホーム", href: "/" }, { label: "導入事例", href: "/case-studies" }, { label: caseStudy.title }])}

      <header class="mt-6">
        <p class="text-sm font-semibold text-brand-600">${escapeHtml(caseStudy.industry)}</p>
        <h1 class="mt-2 text-3xl font-extrabold leading-snug text-slate-900 sm:text-4xl">${escapeHtml(caseStudy.title)}</h1>
        ${
          caseStudy.isHypothetical
            ? `<p class="mt-4 inline-block rounded-full bg-amber-50 px-4 py-1 text-xs font-semibold text-amber-800">想定活用シーン(実際の導入事例ではありません)</p>`
            : ""
        }
      </header>

      <div class="article-body mt-10">
        ${caseStudy.bodyHtml}
      </div>

      ${
        relatedProduct
          ? `
      <div class="card mt-14">
        <p class="text-sm font-semibold text-brand-600">この事例で使われている商品</p>
        <h2 class="mt-2 text-xl font-bold text-slate-900">${escapeHtml(relatedProduct.name)}</h2>
        <p class="mt-2 text-slate-600">${escapeHtml(relatedProduct.tagline)}</p>
        <a href="/products/${escapeHtml(relatedProduct.slug)}" class="btn-primary mt-6">商品詳細を見る</a>
      </div>`
          : ""
      }

      <div class="mt-14 text-center">
        <a href="/case-studies" class="btn-secondary">導入事例一覧に戻る</a>
      </div>
    </article>
  `;

  return renderLayout({
    title: caseStudy.title,
    description: caseStudy.summary,
    path: `/case-studies/${caseStudy.slug}`,
    activeNav: "case-studies",
    bodyHtml,
    structuredData: [
      {
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "ホーム", item: `${SITE_URL}/` },
          { "@type": "ListItem", position: 2, name: "導入事例", item: `${SITE_URL}/case-studies` },
          { "@type": "ListItem", position: 3, name: caseStudy.title, item: `${SITE_URL}/case-studies/${caseStudy.slug}` },
        ],
      },
    ],
  });
}
