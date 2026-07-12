import { renderLayout } from "./_lib/layout.js";
import { renderProductCard, renderBlogCard, renderCaseStudyCard, renderFaqList } from "./_lib/components.js";
import { PRODUCTS } from "./_lib/data/products.js";
import { BLOG_POSTS } from "./_lib/data/blog-posts.js";
import { CASE_STUDIES } from "./_lib/data/case-studies.js";
import { GENERAL_FAQS } from "./_lib/data/faqs.js";

export async function onRequestGet() {
  const latestPosts = BLOG_POSTS.slice(0, 3);
  const featuredCaseStudies = CASE_STUDIES.slice(0, 3);
  const topFaqs = GENERAL_FAQS.slice(0, 3);

  const bodyHtml = `
    <!-- Hero -->
    <section class="relative overflow-hidden bg-gradient-to-b from-brand-50 via-white to-white">
      <div class="mx-auto max-w-4xl px-6 py-24 text-center lg:px-8">
        <span class="badge">中小企業・個人事業主向け 業務システム</span>
        <h1 class="mt-6 text-4xl font-extrabold leading-tight tracking-tight text-slate-900 sm:text-5xl">
          中小企業・個人事業主のための、<br class="hidden sm:block" />買い切り型を基本とした業務システム。
        </h1>
        <p class="section-subtitle mx-auto max-w-2xl">
          顧客管理、見積管理、在庫管理、予約管理。日々の業務に必要なシステムを、現時点では買い切り型を基本にご提供しています。
          ダウンロードして展開するだけで、すぐにお使いいただけます。
        </p>
        <div class="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <a href="/products" class="btn-primary">商品一覧を見る</a>
          <a href="/contact" class="btn-secondary">お問い合わせ</a>
        </div>
      </div>
    </section>

    <!-- 信頼シグナル -->
    <section class="border-y border-slate-100 bg-white">
      <div class="mx-auto grid max-w-5xl grid-cols-1 gap-6 px-6 py-10 text-center sm:grid-cols-3 lg:px-8">
        <div>
          <p class="text-lg font-bold text-slate-900">買い切り型が基本</p>
          <p class="mt-1 text-sm text-slate-500">現時点では、購入後の継続課金が発生しない形を基本としています</p>
        </div>
        <div>
          <p class="text-lg font-bold text-slate-900">インストール不要</p>
          <p class="mt-1 text-sm text-slate-500">ダウンロードして展開するだけ。データはお手元のパソコンで管理</p>
        </div>
        <div>
          <p class="text-lg font-bold text-slate-900">含まれない機能も明記</p>
          <p class="mt-1 text-sm text-slate-500">購入後に「知らなかった」を作りません</p>
        </div>
      </div>
    </section>

    <!-- 商品ラインナップ -->
    <section id="products" class="mx-auto max-w-7xl px-6 py-20 lg:px-8">
      <div class="mx-auto max-w-2xl text-center">
        <p class="section-eyebrow">Products</p>
        <h2 class="section-title">商品ラインナップ</h2>
        <p class="section-subtitle">業務のお困りごとに合わせて、必要な商品をお選びいただけます。</p>
      </div>
      <div class="mt-14 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        ${PRODUCTS.map(renderProductCard).join("")}
      </div>
      <div class="mt-10 text-center">
        <a href="/products" class="btn-secondary">商品一覧をすべて見る</a>
      </div>
    </section>

    <!-- 選ばれる理由 -->
    <section class="bg-slate-50 py-20">
      <div class="mx-auto max-w-7xl px-6 lg:px-8">
        <div class="mx-auto max-w-2xl text-center">
          <p class="section-eyebrow">Why us</p>
          <h2 class="section-title">選ばれる理由</h2>
        </div>
        <div class="mt-14 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          <div class="card">
            <h3 class="text-lg font-semibold text-slate-900">買い切り型が基本</h3>
            <p class="mt-2 text-slate-600">現時点では、購入後は月額費用なしで使い続けられる形を基本にしています。</p>
          </div>
          <div class="card">
            <h3 class="text-lg font-semibold text-slate-900">自社所有・自社運用</h3>
            <p class="mt-2 text-slate-600">データは他社のクラウドではなく、自社のアカウントに置かれます。</p>
          </div>
          <div class="card">
            <h3 class="text-lg font-semibold text-slate-900">導入手順書つき</h3>
            <p class="mt-2 text-slate-600">セットアップから初期設定まで、手順書に沿って進められます。</p>
          </div>
          <div class="card">
            <h3 class="text-lg font-semibold text-slate-900">含まれない機能も明記</h3>
            <p class="mt-2 text-slate-600">できることだけでなく、できないことも購入前にご案内します。</p>
          </div>
        </div>
      </div>
    </section>

    <!-- 導入事例 -->
    <section class="mx-auto max-w-7xl px-6 py-20 lg:px-8">
      <div class="mx-auto max-w-2xl text-center">
        <p class="section-eyebrow">Case Studies</p>
        <h2 class="section-title">活用イメージ</h2>
        <p class="section-subtitle">業種ごとにどう使えるか、想定活用シーンをご紹介します。</p>
      </div>
      <div class="mt-14 grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
        ${featuredCaseStudies.map(renderCaseStudyCard).join("")}
      </div>
      <div class="mt-10 text-center">
        <a href="/case-studies" class="btn-secondary">活用イメージをもっと見る</a>
      </div>
    </section>

    <!-- ブログ -->
    <section class="bg-slate-50 py-20">
      <div class="mx-auto max-w-7xl px-6 lg:px-8">
        <div class="mx-auto max-w-2xl text-center">
          <p class="section-eyebrow">Blog</p>
          <h2 class="section-title">お役立ちブログ</h2>
          <p class="section-subtitle">業務効率化のヒントを発信しています。</p>
        </div>
        <div class="mt-14 grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
          ${latestPosts.map(renderBlogCard).join("")}
        </div>
        <div class="mt-10 text-center">
          <a href="/blog" class="btn-secondary">ブログ一覧を見る</a>
        </div>
      </div>
    </section>

    <!-- FAQ抜粋 -->
    <section class="mx-auto max-w-3xl px-6 py-20 lg:px-8">
      <div class="mx-auto max-w-2xl text-center">
        <p class="section-eyebrow">FAQ</p>
        <h2 class="section-title">よくあるご質問</h2>
      </div>
      <div class="mt-10">${renderFaqList(topFaqs)}</div>
      <div class="mt-8 text-center">
        <a href="/faq" class="btn-secondary">FAQをもっと見る</a>
      </div>
    </section>

    <!-- 最終CTA -->
    <section class="bg-brand-600">
      <div class="mx-auto max-w-4xl px-6 py-16 text-center lg:px-8">
        <h2 class="text-3xl font-bold text-white">まずは商品一覧からご覧ください。</h2>
        <p class="mt-4 text-brand-100">導入のご相談・お見積りは無料です。お気軽にお問い合わせください。</p>
        <div class="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <a href="/products" class="btn-primary bg-white !text-brand-700 hover:bg-brand-50">商品一覧を見る</a>
          <a href="/contact" class="btn-secondary !border-white/40 !bg-transparent !text-white hover:!bg-white/10">お問い合わせ</a>
        </div>
      </div>
    </section>
  `;

  return renderLayout({
    title: "ギョウムラク | 中小企業・個人事業主向け業務システム(買い切り型)",
    description:
      "顧客管理・見積管理・在庫管理・予約管理など、中小企業・個人事業主向けの業務システムを提供。現時点では買い切り型を基本とし、ダウンロードして展開するだけでお使いいただけます。",
    path: "/",
    activeNav: null,
    bodyHtml,
  });
}
