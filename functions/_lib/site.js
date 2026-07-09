// サイト全体で共有する定数。ドメインが決まったらSITE_URLを実際の値に差し替える。
export const SITE_NAME = "ギョウムラク";
export const SITE_URL = "https://example.com";
export const SITE_TAGLINE = "中小企業・個人事業主のための業務システム";

export const NAV_ITEMS = [
  { key: "products", label: "商品一覧", href: "/products" },
  { key: "case-studies", label: "導入事例", href: "/case-studies" },
  { key: "blog", label: "ブログ", href: "/blog" },
  { key: "faq", label: "FAQ", href: "/faq" },
  { key: "about", label: "私たちについて", href: "/about" },
];

export function escapeHtml(value) {
  return String(value ?? "").replace(/[&<>"']/g, (ch) => (
    { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[ch]
  ));
}

// /products/[slug] のような1階層の動的ルートで使うスラッグの妥当性チェック。
// 想定外の文字列が来た場合はここで弾き、HTMLへの埋め込みを安全にする。
export function isValidSlug(slug) {
  return typeof slug === "string" && /^[a-z0-9-]+$/.test(slug);
}
