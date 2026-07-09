import { renderLayout } from "../_lib/layout.js";
import { renderBreadcrumb, renderStatusPill, renderFaqList, renderFaqSchema, renderBlogCard, renderCaseStudyCard } from "../_lib/components.js";
import { getProductBySlug } from "../_lib/data/products.js";
import { getPostsByProduct } from "../_lib/data/blog-posts.js";
import { CASE_STUDIES } from "../_lib/data/case-studies.js";
import { isValidSlug, escapeHtml } from "../_lib/site.js";

function renderComingSoon(product) {
  return `
    <section class="mx-auto max-w-3xl px-6 py-20 text-center lg:px-8">
      ${renderBreadcrumb([{ label: "ホーム", href: "/" }, { label: "商品一覧", href: "/products" }, { label: product.name }])}
      <div class="mt-8">
        ${renderStatusPill(product.status)}
        <h1 class="mt-4 text-3xl font-extrabold text-slate-900 sm:text-4xl">${escapeHtml(product.name)}</h1>
        <p class="mt-3 text-lg font-medium text-brand-600">${escapeHtml(product.tagline)}</p>
        <p class="section-subtitle mx-auto max-w-xl">${escapeHtml(product.summary)}</p>
        <div class="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <a href="/contact?product=${encodeURIComponent(product.slug)}" class="btn-primary">入荷のご連絡を希望する</a>
          <a href="/products" class="btn-secondary">他の商品を見る</a>
        </div>
      </div>
    </section>
  `;
}

function renderLiveProduct(product) {
  const relatedPosts = getPostsByProduct(product.slug);
  const relatedCaseStudies = CASE_STUDIES.filter((c) => c.relatedProductSlug === product.slug).slice(0, 2);

  const screenshotsHtml = (product.screenshots || [])
    .map(
      (s) => `
      <figure>
        <img src="${escapeHtml(s.src)}" alt="${escapeHtml(s.alt)}" class="w-full rounded-xl border border-slate-200 shadow-sm" loading="lazy" />
      </figure>
    `
    )
    .join("");

  return `
    <section class="mx-auto max-w-5xl px-6 pt-10 lg:px-8">
      ${renderBreadcrumb([{ label: "ホーム", href: "/" }, { label: "商品一覧", href: "/products" }, { label: product.name }])}
    </section>

    <!-- Hero -->
    <section class="mx-auto max-w-5xl px-6 pb-16 pt-8 lg:px-8">
      <div class="flex flex-wrap items-center gap-3">
        ${renderStatusPill(product.status)}
        <span class="status-pill bg-slate-100 text-slate-600">買い切り型が基本</span>
      </div>
      <h1 class="mt-5 text-4xl font-extrabold leading-tight tracking-tight text-slate-900 sm:text-5xl">${escapeHtml(product.name)}</h1>
      <p class="mt-3 text-xl font-medium text-brand-600">${escapeHtml(product.tagline)}</p>
      <p class="section-subtitle max-w-2xl">${escapeHtml(product.summary)}</p>
      <div class="mt-8 flex flex-col gap-3 sm:flex-row">
        <a href="/contact?product=${encodeURIComponent(product.slug)}" class="btn-primary">この商品について問い合わせる</a>
        <a href="#screenshots" class="btn-secondary">画面イメージを見る</a>
      </div>
    </section>

    ${
      product.painPoints
        ? `
    <!-- 課題提起 -->
    <section class="bg-slate-50 py-16">
      <div class="mx-auto max-w-5xl px-6 lg:px-8">
        <h2 class="text-2xl font-bold text-slate-900">こんな課題はありませんか?</h2>
        <div class="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
          ${product.painPoints.map((p) => `<div class="card"><p class="text-slate-700">${escapeHtml(p)}</p></div>`).join("")}
        </div>
      </div>
    </section>`
        : ""
    }

    ${
      product.features
        ? `
    <!-- できること -->
    <section class="mx-auto max-w-5xl px-6 py-16 lg:px-8">
      <h2 class="text-2xl font-bold text-slate-900">できること</h2>
      <div class="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        ${product.features
          .map(
            (f) => `
          <div class="card">
            <h3 class="text-lg font-semibold text-slate-900">${escapeHtml(f.title)}</h3>
            <p class="mt-2 text-slate-600">${escapeHtml(f.desc)}</p>
          </div>`
          )
          .join("")}
      </div>
    </section>`
        : ""
    }

    ${
      (product.screenshots && product.screenshots.length) || product.videoSrc
        ? `
    <!-- スクリーンショット・動画 -->
    <section id="screenshots" class="bg-slate-50 py-16">
      <div class="mx-auto max-w-5xl px-6 lg:px-8">
        <h2 class="text-2xl font-bold text-slate-900">画面イメージ</h2>
        ${
          product.videoSrc
            ? `
        <div class="mt-8 overflow-hidden rounded-2xl border border-slate-200 shadow-sm">
          <video controls preload="metadata" class="w-full" poster="${escapeHtml(product.heroImage || "")}">
            <source src="${escapeHtml(product.videoSrc)}" type="video/mp4" />
          </video>
        </div>`
            : ""
        }
        <div class="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          ${screenshotsHtml}
        </div>
      </div>
    </section>`
        : ""
    }

    ${
      product.notIncluded
        ? `
    <!-- 含まれないもの -->
    <section class="mx-auto max-w-3xl px-6 py-16 lg:px-8">
      <h2 class="text-2xl font-bold text-slate-900">含まれない機能</h2>
      <p class="mt-2 text-slate-600">購入後に「知らなかった」とならないよう、あらかじめ明記しています。</p>
      <ul class="mt-6 space-y-3">
        ${product.notIncluded.map((n) => `<li class="flex gap-3 text-slate-700"><span class="text-slate-400">–</span><span>${escapeHtml(n)}</span></li>`).join("")}
      </ul>
    </section>`
        : ""
    }

    ${
      product.requirements
        ? `
    <!-- 動作環境 -->
    <section class="bg-slate-50 py-16">
      <div class="mx-auto max-w-3xl px-6 lg:px-8">
        <h2 class="text-2xl font-bold text-slate-900">動作環境</h2>
        <ul class="mt-6 space-y-3">
          ${product.requirements.map((r) => `<li class="flex gap-3 text-slate-700"><span class="text-brand-600">✓</span><span>${escapeHtml(r)}</span></li>`).join("")}
        </ul>
      </div>
    </section>`
        : ""
    }

    <!-- 価格 -->
    <section class="mx-auto max-w-3xl px-6 py-16 text-center lg:px-8">
      <h2 class="text-2xl font-bold text-slate-900">価格</h2>
      <p class="mt-4 text-3xl font-bold text-slate-900">${escapeHtml(product.priceNote)}</p>
      <p class="mt-3 text-slate-600">価格は個別にご案内しています。まずはお問い合わせください。</p>
      <a href="/contact?product=${encodeURIComponent(product.slug)}" class="btn-primary mt-8">この商品について問い合わせる</a>
    </section>

    ${
      product.faqs
        ? `
    <!-- 商品別FAQ -->
    <section class="bg-slate-50 py-16">
      <div class="mx-auto max-w-3xl px-6 lg:px-8">
        <h2 class="text-2xl font-bold text-slate-900">${escapeHtml(product.name)}についてのFAQ</h2>
        <div class="mt-8">${renderFaqList(product.faqs)}</div>
      </div>
    </section>`
        : ""
    }

    ${
      relatedPosts.length || relatedCaseStudies.length
        ? `
    <!-- 関連コンテンツ -->
    <section class="mx-auto max-w-5xl px-6 py-16 lg:px-8">
      <h2 class="text-2xl font-bold text-slate-900">関連コンテンツ</h2>
      <div class="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        ${relatedCaseStudies.map(renderCaseStudyCard).join("")}
        ${relatedPosts.map(renderBlogCard).join("")}
      </div>
    </section>`
        : ""
    }

    <!-- 最終CTA -->
    <section class="bg-brand-600">
      <div class="mx-auto max-w-4xl px-6 py-16 text-center lg:px-8">
        <h2 class="text-3xl font-bold text-white">${escapeHtml(product.name)}について相談する</h2>
        <p class="mt-4 text-brand-100">導入のご相談・お見積りは無料です。お気軽にお問い合わせください。</p>
        <a href="/contact?product=${encodeURIComponent(product.slug)}" class="btn-primary mt-8 bg-white !text-brand-700 hover:bg-brand-50">この商品について問い合わせる</a>
      </div>
    </section>
  `;
}

export async function onRequestGet(context) {
  const { params } = context;
  const slug = params.slug;

  if (!isValidSlug(slug)) {
    return new Response("Not Found", { status: 404 });
  }

  const product = getProductBySlug(slug);
  if (!product) {
    return new Response("Not Found", { status: 404 });
  }

  const bodyHtml = product.status === "live" ? renderLiveProduct(product) : renderComingSoon(product);

  const structuredData = [
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "ホーム", item: "https://example.com/" },
        { "@type": "ListItem", position: 2, name: "商品一覧", item: "https://example.com/products" },
        { "@type": "ListItem", position: 3, name: product.name, item: `https://example.com/products/${product.slug}` },
      ],
    },
  ];

  if (product.status === "live") {
    structuredData.push({
      "@context": "https://schema.org",
      "@type": "SoftwareApplication",
      name: product.name,
      applicationCategory: "BusinessApplication",
      operatingSystem: "Web",
      description: product.summary,
      offers: { "@type": "Offer", priceCurrency: "JPY", availability: "https://schema.org/InStock" },
    });
  }
  if (product.faqs) {
    structuredData.push(renderFaqSchema(product.faqs));
  }

  return renderLayout({
    title: product.status === "live" ? `${product.name} — ${product.tagline}` : `${product.name}(準備中)`,
    description: product.summary,
    path: `/products/${product.slug}`,
    activeNav: "products",
    bodyHtml,
    noindex: product.status !== "live",
    structuredData,
  });
}
