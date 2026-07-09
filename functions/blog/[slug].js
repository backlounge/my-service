import { renderLayout } from "../_lib/layout.js";
import { renderBreadcrumb } from "../_lib/components.js";
import { getPostBySlug } from "../_lib/data/blog-posts.js";
import { getProductBySlug } from "../_lib/data/products.js";
import { isValidSlug, escapeHtml, SITE_URL } from "../_lib/site.js";

export async function onRequestGet(context) {
  const { params } = context;
  const slug = params.slug;

  if (!isValidSlug(slug)) {
    return new Response("Not Found", { status: 404 });
  }

  const post = getPostBySlug(slug);
  if (!post) {
    return new Response("Not Found", { status: 404 });
  }

  const relatedProduct = post.relatedProductSlug ? getProductBySlug(post.relatedProductSlug) : null;

  const bodyHtml = `
    <article class="mx-auto max-w-3xl px-6 py-16 lg:px-8">
      ${renderBreadcrumb([{ label: "ホーム", href: "/" }, { label: "ブログ", href: "/blog" }, { label: post.title }])}

      <header class="mt-6">
        <p class="text-sm font-semibold text-slate-400">${escapeHtml(post.dateLabel)}</p>
        <h1 class="mt-2 text-3xl font-extrabold leading-snug text-slate-900 sm:text-4xl">${escapeHtml(post.title)}</h1>
      </header>

      <div class="article-body mt-10">
        ${post.bodyHtml}
      </div>

      ${
        relatedProduct
          ? `
      <div class="card mt-14">
        <p class="text-sm font-semibold text-brand-600">この記事に関連する商品</p>
        <h2 class="mt-2 text-xl font-bold text-slate-900">${escapeHtml(relatedProduct.name)}</h2>
        <p class="mt-2 text-slate-600">${escapeHtml(relatedProduct.tagline)}</p>
        <a href="/products/${escapeHtml(relatedProduct.slug)}" class="btn-primary mt-6">商品詳細を見る</a>
      </div>`
          : ""
      }

      <div class="mt-14 text-center">
        <a href="/blog" class="btn-secondary">ブログ一覧に戻る</a>
      </div>
    </article>
  `;

  return renderLayout({
    title: post.title,
    description: post.summary,
    path: `/blog/${post.slug}`,
    activeNav: "blog",
    bodyHtml,
    structuredData: [
      {
        "@context": "https://schema.org",
        "@type": "Article",
        headline: post.title,
        description: post.summary,
        datePublished: post.date,
        url: `${SITE_URL}/blog/${post.slug}`,
      },
      {
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "ホーム", item: `${SITE_URL}/` },
          { "@type": "ListItem", position: 2, name: "ブログ", item: `${SITE_URL}/blog` },
          { "@type": "ListItem", position: 3, name: post.title, item: `${SITE_URL}/blog/${post.slug}` },
        ],
      },
    ],
  });
}
