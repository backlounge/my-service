import { renderLayout } from "./_lib/layout.js";
import { renderBreadcrumb } from "./_lib/components.js";
import { getProductBySlug } from "./_lib/data/products.js";
import { escapeHtml } from "./_lib/site.js";

export async function onRequestGet(context) {
  const { request } = context;
  const url = new URL(request.url);
  const productSlug = url.searchParams.get("product") || "";
  const product = productSlug ? getProductBySlug(productSlug) : null;

  const bodyHtml = `
    <section class="mx-auto max-w-2xl px-6 py-16 lg:px-8">
      ${renderBreadcrumb([{ label: "ホーム", href: "/" }, { label: "お問い合わせ" }])}

      <div class="mx-auto mt-6 max-w-2xl text-center">
        <p class="section-eyebrow">Contact</p>
        <h1 class="section-title">お問い合わせ</h1>
        <p class="section-subtitle">導入のご相談・お見積りなど、お気軽にお問い合わせください。1〜2営業日以内にご返信いたします。</p>
      </div>

      ${
        product
          ? `<div class="mt-8 rounded-xl border border-brand-100 bg-brand-50 px-5 py-4 text-center text-sm text-brand-800">
              <strong>${escapeHtml(product.name)}</strong>についてのお問い合わせとして送信されます
            </div>`
          : ""
      }

      <form id="contact-form" class="mt-10 space-y-6" action="/api/contact" method="POST">
        <input type="checkbox" name="botcheck" class="hidden" style="display:none" tabindex="-1" autocomplete="off" />
        ${product ? `<input type="hidden" name="product_name" value="${escapeHtml(product.name)}" />` : ""}

        <div class="grid grid-cols-1 gap-6 sm:grid-cols-2">
          <div>
            <label for="name" class="mb-2 block text-sm font-medium text-slate-700">お名前 <span class="text-red-500">*</span></label>
            <input id="name" name="name" type="text" required class="input-field" placeholder="山田 太郎" />
          </div>
          <div>
            <label for="company" class="mb-2 block text-sm font-medium text-slate-700">会社名・屋号</label>
            <input id="company" name="company" type="text" class="input-field" placeholder="株式会社サンプル" />
          </div>
        </div>

        <div>
          <label for="email" class="mb-2 block text-sm font-medium text-slate-700">メールアドレス <span class="text-red-500">*</span></label>
          <input id="email" name="email" type="email" required class="input-field" placeholder="you@example.com" />
        </div>

        <div>
          <label for="message" class="mb-2 block text-sm font-medium text-slate-700">お問い合わせ内容 <span class="text-red-500">*</span></label>
          <textarea id="message" name="message" rows="6" required class="input-field" placeholder="ご相談内容をご記入ください"></textarea>
        </div>

        <button type="submit" class="btn-primary w-full sm:w-auto">送信する</button>

        <p id="form-status" class="hidden text-sm" role="status"></p>
      </form>
    </section>
  `;

  return renderLayout({
    title: "お問い合わせ",
    description: "導入のご相談・お見積りのご依頼など、お気軽にお問い合わせください。",
    path: "/contact",
    activeNav: "contact",
    bodyHtml,
  });
}
