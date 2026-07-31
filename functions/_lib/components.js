import { escapeHtml } from "./site.js";

export function renderBreadcrumb(items) {
  // items: [{ label, href? }]  最後の項目はリンクなし(現在地)として扱う
  const parts = items.map((item, index) => {
    const isLast = index === items.length - 1;
    const label = escapeHtml(item.label);
    const node = item.href && !isLast ? `<a href="${escapeHtml(item.href)}">${label}</a>` : `<span aria-current="page">${label}</span>`;
    return index === 0 ? node : `<span aria-hidden="true">/</span>${node}`;
  });
  return `<nav class="breadcrumb" aria-label="パンくずリスト">${parts.join("")}</nav>`;
}

export function renderStatusPill(status) {
  return status === "live"
    ? `<span class="status-pill is-live">販売中</span>`
    : `<span class="status-pill is-prep">準備中</span>`;
}

export function renderProductCard(product) {
  const summary = escapeHtml(product.summary);
  const name = escapeHtml(product.name);
  const tagline = escapeHtml(product.tagline);
  const cta =
    product.status === "live"
      ? `<span class="mt-6 inline-block text-sm font-semibold text-brand-600">詳しく見る →</span>`
      : `<span class="mt-6 inline-block text-sm font-semibold text-slate-400">準備が整い次第ご案内します</span>`;

  // hasSinglePrice: 見積管理システムのような単一価格の商品(priceNoteを直接使う)。
  // hasEditionPricing: 顧客管理システムのようにプランごとに価格が異なる商品(editions[]の各価格を使う)。
  // functions/products/[slug].js の同名ロジックと揃えている。
  const hasSinglePrice = Boolean(product.priceNote);
  const hasEditionPricing = Boolean(
    product.purchaseEnabled && product.editions && product.editions.some((e) => e.price)
  );
  const isPurchasable = hasSinglePrice || hasEditionPricing;
  // pricingAnnounced: 価格は確定しているが、購入受付(振込口座・納品運用等)がまだの状態。
  const pricingAnnounced = isPurchasable || Boolean(product.pricingAnnounced);

  const pill =
    product.status === "live" && !isPurchasable
      ? pricingAnnounced
        ? `<span class="status-pill bg-amber-50 text-amber-700">価格確定・お申し込み準備中</span>`
        : `<span class="status-pill bg-slate-100 text-slate-600">価格未定</span>`
      : renderStatusPill(product.status);

  const priceLine = hasEditionPricing
    ? `<p class="mt-1 text-sm font-semibold text-slate-800">${product.editions
        .map((e) => `${escapeHtml(e.name)}${e.priceValue.toLocaleString("ja-JP")}円`)
        .join("／")}</p>`
    : hasSinglePrice
      ? `<p class="mt-1 text-sm font-semibold text-slate-800">${escapeHtml(product.priceNote)}</p>`
      : "";

  return `
    <a href="/products/${escapeHtml(product.slug)}" class="product-card">
      <div class="flex items-start justify-between gap-3">
        <h3 class="text-lg font-semibold text-slate-900">${name}</h3>
        ${pill}
      </div>
      <p class="mt-2 text-sm font-medium text-brand-600">${tagline}</p>
      ${priceLine}
      <p class="mt-3 flex-1 text-sm leading-relaxed text-slate-600">${summary}</p>
      ${cta}
    </a>
  `;
}

let faqUid = 0;
export function renderFaqItem(question, answer) {
  faqUid += 1;
  return `
    <details class="faq-item group" id="faq-${faqUid}">
      <summary>
        <span class="flex items-center justify-between gap-4">
          <span>${escapeHtml(question)}</span>
          <span class="shrink-0 text-xl leading-none text-slate-400 transition-transform duration-200 group-open:rotate-45" aria-hidden="true">+</span>
        </span>
      </summary>
      <p class="pb-1 text-sm leading-relaxed text-slate-600">${escapeHtml(answer)}</p>
    </details>
  `;
}

export function renderFaqList(faqs) {
  return `<div class="space-y-3">${faqs.map((f) => renderFaqItem(f.q, f.a)).join("")}</div>`;
}

export function renderFaqSchema(faqs) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((f) => ({
      "@type": "Question",
      name: f.q,
      acceptedAnswer: { "@type": "Answer", text: f.a },
    })),
  };
}

export function renderBlogCard(post) {
  return `
    <a href="/blog/${escapeHtml(post.slug)}" class="card block">
      <p class="text-xs font-semibold text-slate-400">${escapeHtml(post.dateLabel)}</p>
      <h3 class="mt-2 text-lg font-semibold text-slate-900">${escapeHtml(post.title)}</h3>
      <p class="mt-2 text-sm text-slate-600">${escapeHtml(post.summary)}</p>
      <span class="mt-4 inline-block text-sm font-semibold text-brand-600">続きを読む →</span>
    </a>
  `;
}

export function renderCaseStudyCard(cs) {
  return `
    <a href="/case-studies/${escapeHtml(cs.slug)}" class="card block">
      <p class="text-xs font-semibold text-brand-600">${escapeHtml(cs.industry)}</p>
      <h3 class="mt-2 text-lg font-semibold text-slate-900">${escapeHtml(cs.title)}</h3>
      <p class="mt-2 text-sm text-slate-600">${escapeHtml(cs.summary)}</p>
      <span class="mt-4 inline-block text-sm font-semibold text-brand-600">事例を見る →</span>
    </a>
  `;
}
