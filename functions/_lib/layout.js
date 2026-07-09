import { SITE_NAME, SITE_URL, SITE_TAGLINE, NAV_ITEMS, escapeHtml } from "./site.js";
import { PRODUCTS } from "./data/products.js";
import { renderStatusPill } from "./components.js";

const ORG_SCHEMA = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: SITE_NAME,
  url: SITE_URL,
  description: SITE_TAGLINE,
};

function renderProductsDropdown(activePath) {
  const items = PRODUCTS.map((p) => {
    const isActive = activePath === `/products/${p.slug}`;
    return `
      <a href="/products/${p.slug}" class="nav-dropdown-item${isActive ? " bg-brand-50 text-brand-700" : ""}">
        <span>${escapeHtml(p.name)}</span>
        ${renderStatusPill(p.status)}
      </a>
    `;
  }).join("");

  return `
    <div class="relative nav-has-dropdown">
      <a href="/products" class="nav-link inline-flex items-center gap-1">
        商品一覧
        <svg class="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true"><path fill-rule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 10.94l3.71-3.71a.75.75 0 111.06 1.06l-4.24 4.25a.75.75 0 01-1.06 0L5.21 8.29a.75.75 0 01.02-1.08z" clip-rule="evenodd"/></svg>
      </a>
      <div class="nav-dropdown-panel">${items}</div>
    </div>
  `;
}

function renderHeader(activeNav, activePath) {
  const navLinks = NAV_ITEMS.map((item) => {
    if (item.key === "products") return renderProductsDropdown(activePath);
    const activeClass = activeNav === item.key ? "text-brand-600" : "";
    return `<a href="${item.href}" class="nav-link ${activeClass}">${escapeHtml(item.label)}</a>`;
  }).join("");

  const mobileLinks = NAV_ITEMS.flatMap((item) => {
    if (item.key === "products") {
      return [
        `<a href="/products" class="nav-link py-2">商品一覧</a>`,
        ...PRODUCTS.map((p) => `<a href="/products/${p.slug}" class="nav-link py-2 pl-4 text-slate-500">・${escapeHtml(p.name)}</a>`),
      ];
    }
    return [`<a href="${item.href}" class="nav-link py-2">${escapeHtml(item.label)}</a>`];
  }).join("");

  return `
  <header class="sticky top-0 z-50 border-b border-slate-100 bg-white/80 backdrop-blur">
    <div class="mx-auto flex max-w-7xl items-center justify-between px-6 py-4 lg:px-8">
      <a href="/" class="flex items-center gap-2 text-lg font-bold text-slate-900">
        <span class="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-600 text-white">G</span>
        <span>${escapeHtml(SITE_NAME)}</span>
      </a>

      <nav class="hidden items-center gap-8 md:flex">
        ${navLinks}
      </nav>

      <div class="hidden md:block">
        <a href="/contact" class="btn-primary">お問い合わせ</a>
      </div>

      <button id="menu-toggle" type="button" class="md:hidden" aria-label="メニューを開く" aria-expanded="false" aria-controls="mobile-menu">
        <svg id="icon-open" class="h-7 w-7 text-slate-700" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.8">
          <path stroke-linecap="round" stroke-linejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5M3.75 17.25h16.5" />
        </svg>
        <svg id="icon-close" class="hidden h-7 w-7 text-slate-700" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.8">
          <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>

    <div id="mobile-menu" class="hidden border-t border-slate-100 bg-white md:hidden">
      <div class="flex flex-col gap-1 px-6 py-4">
        ${mobileLinks}
        <a href="/contact" class="btn-primary mt-3 w-full">お問い合わせ</a>
      </div>
    </div>
  </header>
  `;
}

function renderFooter() {
  const productLinks = PRODUCTS.map(
    (p) => `<a href="/products/${p.slug}" class="footer-col-link">${escapeHtml(p.name)}${p.status === "coming-soon" ? "(準備中)" : ""}</a>`
  ).join("");

  return `
  <footer class="border-t border-slate-100 bg-slate-50">
    <div class="mx-auto max-w-7xl px-6 py-14 lg:px-8">
      <div class="grid grid-cols-2 gap-8 sm:grid-cols-4">
        <div>
          <p class="footer-col-title">商品</p>
          ${productLinks}
        </div>
        <div>
          <p class="footer-col-title">コンテンツ</p>
          <a href="/blog" class="footer-col-link">ブログ</a>
          <a href="/case-studies" class="footer-col-link">導入事例</a>
          <a href="/faq" class="footer-col-link">FAQ</a>
        </div>
        <div>
          <p class="footer-col-title">会社</p>
          <a href="/about" class="footer-col-link">私たちについて</a>
          <a href="/contact" class="footer-col-link">お問い合わせ</a>
        </div>
        <div>
          <p class="footer-col-title">規約</p>
          <a href="/legal" class="footer-col-link">特定商取引法に基づく表記</a>
          <a href="/privacy" class="footer-col-link">プライバシーポリシー</a>
        </div>
      </div>

      <div class="mt-12 flex flex-col items-center justify-between gap-4 border-t border-slate-200 pt-8 sm:flex-row">
        <a href="/" class="flex items-center gap-2 text-base font-bold text-slate-900">
          <span class="flex h-7 w-7 items-center justify-center rounded-lg bg-brand-600 text-white text-sm">G</span>
          <span>${escapeHtml(SITE_NAME)}</span>
        </a>
        <p class="text-xs text-slate-400">&copy; <span id="year"></span> ${escapeHtml(SITE_NAME)}. All rights reserved.</p>
      </div>
    </div>
  </footer>
  `;
}

// options:
//   title, description, path, activeNav, bodyHtml
//   structuredData: 追加のJSON-LDオブジェクトの配列(任意)
//   noindex: true でクローラーに非表示にする(準備中ページ・規約ページ等)
//   ogImage: 省略時は共通OGP画像
export function renderLayout(options) {
  const {
    title,
    description,
    path = "/",
    activeNav = null,
    bodyHtml = "",
    structuredData = [],
    noindex = false,
  } = options;

  const fullTitle = path === "/" ? title : `${title} | ${SITE_NAME}`;
  const canonical = `${SITE_URL}${path}`;
  const ogImage = options.ogImage || `${SITE_URL}/images/og/ogp.png`;
  const schemas = [ORG_SCHEMA, ...structuredData];

  const html = `<!doctype html>
<html lang="ja">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${escapeHtml(fullTitle)}</title>
  <meta name="description" content="${escapeHtml(description)}" />
  <link rel="canonical" href="${canonical}" />
  ${noindex ? '<meta name="robots" content="noindex, follow" />' : ""}

  <meta property="og:type" content="website" />
  <meta property="og:site_name" content="${escapeHtml(SITE_NAME)}" />
  <meta property="og:title" content="${escapeHtml(fullTitle)}" />
  <meta property="og:description" content="${escapeHtml(description)}" />
  <meta property="og:url" content="${canonical}" />
  <meta property="og:image" content="${ogImage}" />
  <meta property="og:locale" content="ja_JP" />

  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content="${escapeHtml(fullTitle)}" />
  <meta name="twitter:description" content="${escapeHtml(description)}" />
  <meta name="twitter:image" content="${ogImage}" />

  <link rel="icon" href="data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><rect width=%22100%22 height=%22100%22 rx=%2220%22 fill=%22%234f46e5%22/><text x=%2250%22 y=%2266%22 font-size=%2260%22 text-anchor=%22middle%22 fill=%22white%22 font-family=%22sans-serif%22>G</text></svg>" />

  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link href="https://fonts.googleapis.com/css2?family=Noto+Sans+JP:wght@400;500;600;700;800&display=swap" rel="stylesheet" />

  <link rel="stylesheet" href="/css/style.css" />

  ${schemas.map((s) => `<script type="application/ld+json">${JSON.stringify(s)}</script>`).join("\n  ")}
</head>
<body class="scroll-smooth bg-white font-sans text-slate-800 antialiased">
  ${renderHeader(activeNav, path)}
  <main>
    ${bodyHtml}
  </main>
  ${renderFooter()}
  <script src="/js/main.js"></script>
</body>
</html>`;

  return new Response(html, {
    headers: { "Content-Type": "text/html; charset=UTF-8" },
  });
}
