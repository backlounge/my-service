import { renderLayout } from "../_lib/layout.js";
import { renderBreadcrumb, renderBlogCard } from "../_lib/components.js";
import { BLOG_POSTS } from "../_lib/data/blog-posts.js";

export async function onRequestGet() {
  const posts = [...BLOG_POSTS].sort((a, b) => (a.date < b.date ? 1 : -1));

  const bodyHtml = `
    <section class="mx-auto max-w-7xl px-6 py-16 lg:px-8">
      ${renderBreadcrumb([{ label: "ホーム", href: "/" }, { label: "ブログ" }])}
      <div class="mx-auto mt-6 max-w-2xl text-center">
        <p class="section-eyebrow">Blog</p>
        <h1 class="section-title">ブログ</h1>
        <p class="section-subtitle">業務効率化のヒントや、業務システムの選び方を発信しています。</p>
      </div>

      <div class="mt-14 grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
        ${posts.map(renderBlogCard).join("")}
      </div>
    </section>
  `;

  return renderLayout({
    title: "ブログ",
    description: "業務効率化のヒントや、業務システムの選び方に関する記事を発信しています。",
    path: "/blog",
    activeNav: "blog",
    bodyHtml,
  });
}
