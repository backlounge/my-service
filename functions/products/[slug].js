import { renderLayout } from "../_lib/layout.js";
import { renderBreadcrumb, renderStatusPill, renderFaqList, renderFaqSchema, renderBlogCard, renderCaseStudyCard } from "../_lib/components.js";
import { getProductBySlug, PRODUCTS } from "../_lib/data/products.js";
import { getPostsByProduct } from "../_lib/data/blog-posts.js";
import { CASE_STUDIES } from "../_lib/data/case-studies.js";
import { isValidSlug, escapeHtml, SITE_URL } from "../_lib/site.js";

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
  const otherLiveProducts = PRODUCTS.filter((candidate) => candidate.status === "live" && candidate.slug !== product.slug);

  const screenshotsHtml = (product.screenshots || [])
    .map(
      (s) => `
      <figure>
        <button type="button" class="group block w-full cursor-zoom-in text-left" data-screenshot-src="${escapeHtml(s.src)}" data-screenshot-alt="${escapeHtml(s.alt)}" aria-label="${escapeHtml(s.alt)}を拡大表示">
          <img src="${escapeHtml(s.src)}" alt="${escapeHtml(s.alt)}" class="w-full rounded-xl border border-slate-200 shadow-sm transition group-hover:shadow-md" loading="lazy" />
          <span class="mt-2 block text-sm text-slate-500">クリックして拡大</span>
        </button>
      </figure>
    `
    )
    .join("");

  // hasSinglePrice: 見積管理システムのような単一価格の商品(priceNoteを直接使う)。
  // hasEditionPricing: 顧客管理システムのようにプランごとに価格が異なる商品(editions[].priceを正とする)。
  const hasSinglePrice = Boolean(product.priceNote);
  const hasEditionPricing = Boolean(
    product.purchaseEnabled && product.editions && product.editions.some((e) => e.price)
  );
  const isPurchasable = hasSinglePrice || hasEditionPricing;
  // 価格は確定しているが購入導線(振込口座・納品運用)がまだ整っていない商品向けの中間状態。
  const pricingAnnounced = isPurchasable || Boolean(product.pricingAnnounced);

  return `
    <section class="mx-auto max-w-5xl px-6 pt-10 lg:px-8">
      ${renderBreadcrumb([{ label: "ホーム", href: "/" }, { label: "商品一覧", href: "/products" }, { label: product.name }])}
    </section>

    <!-- Hero -->
    <section class="mx-auto max-w-5xl px-6 pb-16 pt-8 lg:px-8">
      <div class="flex flex-wrap items-center gap-3">
        ${
          isPurchasable
            ? renderStatusPill(product.status)
            : pricingAnnounced
              ? `<span class="status-pill bg-amber-50 text-amber-700">価格確定・お申し込み準備中</span>`
              : `<span class="status-pill bg-slate-100 text-slate-600">価格未定</span>`
        }
        ${pricingAnnounced ? `<span class="status-pill bg-slate-100 text-slate-600">買い切り型が基本</span>` : ""}
      </div>
      <h1 class="mt-5 text-4xl font-extrabold leading-tight tracking-tight text-slate-900 sm:text-5xl">${escapeHtml(product.name)}</h1>
      <p class="mt-3 text-xl font-medium text-brand-600">${escapeHtml(product.tagline)}</p>
      <p class="section-subtitle max-w-2xl">${escapeHtml(product.summary)}</p>
      <div class="mt-8 flex flex-col gap-3 sm:flex-row">
        ${
          hasSinglePrice
            ? `
        <a href="/contact?product=${encodeURIComponent(product.slug)}&intent=purchase" class="btn-primary">購入を申し込む</a>
        <a href="/contact?product=${encodeURIComponent(product.slug)}" class="btn-secondary">まず相談する</a>`
            : hasEditionPricing
              ? `
        <a href="#editions" class="btn-primary">プランを見て申し込む</a>
        <a href="/contact?product=${encodeURIComponent(product.slug)}" class="btn-secondary">まず相談する</a>`
              : `<a href="/contact?product=${encodeURIComponent(product.slug)}" class="btn-primary">お問い合わせする</a>`
        }
      </div>
      <p class="mt-3 text-sm text-slate-500">
        ${
          hasSinglePrice
            ? `オンライン決済ページはありません。お申し込み後、メールでお支払い方法をご案内し、ご入金確認後にZIPをお届けします(<a href="#purchase-flow" class="underline hover:text-brand-600">ご購入の流れ</a>)。`
            : hasEditionPricing
              ? `料金・お申し込みはプランごとに異なります。下記の比較表にある各プランの「購入を申し込む」ボタンからお申し込みください。オンライン決済ページはありません(<a href="#purchase-flow" class="underline hover:text-brand-600">ご購入の流れ</a>)。`
              : pricingAnnounced
                ? `価格は確定しています(下記のライト版・スタンダード版の比較をご確認ください)。お申し込み方法は現在ご案内の準備を進めており、開始まで今しばらくお待ちください。ご興味をお持ちの方はお問い合わせください。`
                : `価格・お申し込み方法は現在ご案内の準備を進めています。決まり次第このページでご案内しますので、ご興味をお持ちの方はお問い合わせください。`
        }
      </p>
    </section>

    ${
      otherLiveProducts.length
        ? `
    <section class="border-y border-slate-100 bg-slate-50 py-10">
      <div class="mx-auto max-w-5xl px-6 lg:px-8">
        <p class="text-sm font-semibold text-brand-600">あわせて検討される商品</p>
        <h2 class="mt-2 text-2xl font-bold text-slate-900">別の業務の困りごとも、まとめて解決できます</h2>
        <p class="mt-3 max-w-2xl text-slate-600">必要な機能からお選びください。各商品は買い切り型で、個別にお申し込みいただけます。</p>
        <div class="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
          ${otherLiveProducts
            .map((candidate) => {
              const priceText =
                candidate.priceNote ||
                (candidate.editions || [])
                  .filter((edition) => edition.priceValue)
                  .map((edition) => `${edition.name} ${edition.priceValue.toLocaleString("ja-JP")}円`)
                  .join(" ／ ");
              return `
              <a href="/products/${encodeURIComponent(candidate.slug)}" class="rounded-xl border border-slate-200 bg-white p-5 transition hover:border-brand-400 hover:shadow-sm">
                <p class="font-semibold text-slate-900">${escapeHtml(candidate.name)}</p>
                <p class="mt-1 text-sm text-slate-600">${escapeHtml(candidate.tagline)}</p>
                ${priceText ? `<p class="mt-3 text-sm font-semibold text-brand-700">${escapeHtml(priceText)}</p>` : ""}
                <span class="mt-4 inline-block text-sm font-semibold text-brand-600">詳しく見る →</span>
              </a>`;
            })
            .join("")}
        </div>
      </div>
    </section>`
        : ""
    }

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
      product.editions
        ? `
    <!-- プラン比較 -->
    <section id="editions" class="bg-slate-50 py-16">
      <div class="mx-auto max-w-5xl px-6 lg:px-8">
        <h2 class="text-2xl font-bold text-slate-900">ライト版・スタンダード版の比較</h2>
        <p class="mt-2 text-slate-600">登録できる顧客数と、集計・レポート機能の有無が主な違いです。価格は各プランのカードに記載のとおりです。</p>
        <div class="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2">
          ${product.editions
            .map(
              (e) => `
          <div class="card flex flex-col">
            <h3 class="text-lg font-semibold text-slate-900">${escapeHtml(e.name)}</h3>
            <p class="mt-1 text-sm font-medium text-brand-600">${escapeHtml(e.subtitle)}</p>
            <p class="mt-1 text-sm text-slate-500">${escapeHtml(e.limit)}</p>
            ${e.price ? `<p class="mt-3 text-2xl font-bold text-slate-900">${escapeHtml(e.price)}</p>` : ""}
            <ul class="mt-4 flex-1 space-y-2">
              ${e.highlights.map((h) => `<li class="flex gap-2 text-sm text-slate-700"><span class="text-brand-600">✓</span><span>${escapeHtml(h)}</span></li>`).join("")}
              ${(e.notIncluded || []).map((n) => `<li class="flex gap-2 text-sm text-slate-400"><span>–</span><span>${escapeHtml(n)}</span></li>`).join("")}
            </ul>
            ${
              hasEditionPricing && e.key
                ? `<a href="/contact?product=${encodeURIComponent(product.slug)}&edition=${encodeURIComponent(e.key)}&intent=purchase" class="btn-primary mt-6 text-center">購入を申し込む</a>`
                : ""
            }
          </div>`
            )
            .join("")}
        </div>
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
    </section>

    <dialog id="screenshot-lightbox" class="m-auto w-[min(96vw,1100px)] max-w-none rounded-2xl bg-transparent p-0 backdrop:bg-slate-950/80">
      <div class="relative">
        <button type="button" id="screenshot-lightbox-close" class="absolute right-3 top-3 z-10 rounded-full bg-white/95 px-4 py-2 text-sm font-bold text-slate-800 shadow hover:bg-white" aria-label="拡大表示を閉じる">閉じる</button>
        <img id="screenshot-lightbox-image" src="" alt="" class="max-h-[90vh] w-full rounded-2xl bg-white object-contain shadow-2xl" />
      </div>
    </dialog>`
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
    <!-- 動作環境(利用時に必要なもの) -->
    <section class="bg-slate-50 py-16">
      <div class="mx-auto max-w-3xl px-6 lg:px-8">
        <h2 class="text-2xl font-bold text-slate-900">動作環境</h2>
        <p class="mt-2 text-slate-600">日常的にご利用いただく際に必要なものです。</p>
        <ul class="mt-6 space-y-3">
          ${product.requirements.map((r) => `<li class="flex gap-3 text-slate-700"><span class="text-brand-600">✓</span><span>${escapeHtml(r)}</span></li>`).join("")}
        </ul>
      </div>
    </section>`
        : ""
    }

    ${
      product.setupNote
        ? `
    <!-- 導入(セットアップ)について -->
    <section class="mx-auto max-w-3xl px-6 py-16 lg:px-8">
      <h2 class="text-2xl font-bold text-slate-900">導入について</h2>
      <p class="mt-4 text-slate-700">${escapeHtml(product.setupNote)}</p>
      <p class="mt-3 text-sm text-slate-500">
        導入作業そのものが不安な場合は、お問い合わせ時にその旨をお知らせください。
      </p>
    </section>`
        : ""
    }

    ${
      product.purchaseFlow
        ? `
    <!-- ご購入の流れ -->
    <section id="purchase-flow" class="bg-slate-50 py-16">
      <div class="mx-auto max-w-5xl px-6 lg:px-8">
        <h2 class="text-2xl font-bold text-slate-900">ご購入の流れ</h2>
        <p class="mt-2 text-slate-600">当サイトから直接、個別にお届けします(オンライン決済ページはありません)。</p>
        <ol class="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
          ${product.purchaseFlow
            .map(
              (s, i) => `
            <li class="card">
              <div class="flex h-8 w-8 items-center justify-center rounded-full bg-brand-600 text-sm font-bold text-white">${i + 1}</div>
              <h3 class="mt-3 text-base font-semibold text-slate-900">${escapeHtml(s.title)}</h3>
              <p class="mt-1 text-sm leading-relaxed text-slate-600">${escapeHtml(s.desc)}</p>
            </li>`
            )
            .join("")}
        </ol>
        ${
          product.deliveryNote
            ? `<div class="mt-8 rounded-xl border border-slate-200 bg-white px-5 py-4 text-sm text-slate-700"><strong class="text-slate-900">納品方法:</strong> ${escapeHtml(product.deliveryNote)}</div>`
            : ""
        }
        ${
          hasSinglePrice
            ? `
        <div class="mt-8">
          <a href="/contact?product=${encodeURIComponent(product.slug)}&intent=purchase" class="btn-primary">購入を申し込む</a>
        </div>`
            : hasEditionPricing
              ? `
        <div class="mt-8">
          <a href="#editions" class="btn-primary">プランを見て申し込む</a>
        </div>`
              : ""
        }
      </div>
    </section>`
        : ""
    }

    ${
      hasSinglePrice
        ? `
    <!-- 価格 -->
    <section class="mx-auto max-w-3xl px-6 py-16 text-center lg:px-8">
      <h2 class="text-2xl font-bold text-slate-900">価格</h2>
      <p class="mt-4 text-3xl font-bold text-slate-900">${escapeHtml(product.priceNote)}</p>
      <p class="mt-3 text-slate-600">${escapeHtml(product.priceSubNote || "価格は個別にご案内しています。金額をご確認のうえで購入をお決めいただけます。")}</p>
      <div class="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
        <a href="/contact?product=${encodeURIComponent(product.slug)}&intent=purchase" class="btn-primary">購入を申し込む</a>
        <a href="/contact?product=${encodeURIComponent(product.slug)}" class="btn-secondary">価格を問い合わせる</a>
      </div>
    </section>`
        : ""
    }

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
        ${
          isPurchasable
            ? `
        <h2 class="text-3xl font-bold text-white">${escapeHtml(product.name)}を購入する</h2>
        <p class="mt-4 text-brand-100">導入のご相談・お見積りは無料です。まずはお気軽にお申し込み・お問い合わせください。</p>
        <div class="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
          ${
            hasSinglePrice
              ? `<a href="/contact?product=${encodeURIComponent(product.slug)}&intent=purchase" class="btn-primary bg-white !text-brand-700 hover:bg-brand-50">購入を申し込む</a>`
              : `<a href="#editions" class="btn-primary bg-white !text-brand-700 hover:bg-brand-50">プランを見て申し込む</a>`
          }
          <a href="/contact?product=${encodeURIComponent(product.slug)}" class="text-sm font-semibold text-white underline hover:text-brand-100">まず相談する</a>
        </div>`
            : `
        <h2 class="text-3xl font-bold text-white">${escapeHtml(product.name)}について相談する</h2>
        <p class="mt-4 text-brand-100">${
          pricingAnnounced
            ? "価格は確定しております。お申し込み方法のご案内は準備中です。ご興味をお持ちの方はお気軽にお問い合わせください。"
            : "価格・導入方法のご案内は現在準備中です。ご興味をお持ちの方はお気軽にお問い合わせください。"
        }</p>
        <div class="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <a href="/contact?product=${encodeURIComponent(product.slug)}" class="btn-primary bg-white !text-brand-700 hover:bg-brand-50">お問い合わせする</a>
        </div>`
        }
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

  const productUrl = `${SITE_URL}/products/${product.slug}`;

  const structuredData = [
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "ホーム", item: `${SITE_URL}/` },
        { "@type": "ListItem", position: 2, name: "商品一覧", item: `${SITE_URL}/products` },
        { "@type": "ListItem", position: 3, name: product.name, item: productUrl },
      ],
    },
  ];

  // 価格が未確定の商品では、価格を偽って構造化データに載せないよう、
  // 実際の価格情報(priceValue または editions[].priceValue)がある場合のみ出力する。
  const editionPrices = (product.editions || []).map((e) => e.priceValue).filter((v) => typeof v === "number");
  if (product.status === "live" && product.priceValue) {
    structuredData.push({
      "@context": "https://schema.org",
      "@type": "SoftwareApplication",
      name: product.name,
      url: productUrl,
      applicationCategory: "BusinessApplication",
      operatingSystem: "Windows",
      description: product.summary,
      offers: {
        "@type": "Offer",
        price: String(product.priceValue),
        priceCurrency: "JPY",
        availability: "https://schema.org/InStock",
        url: productUrl,
      },
    });
  } else if (product.status === "live" && editionPrices.length) {
    // プランごとに価格が異なる商品(顧客管理システム等)は、単一価格ではなくAggregateOfferで表す。
    structuredData.push({
      "@context": "https://schema.org",
      "@type": "SoftwareApplication",
      name: product.name,
      url: productUrl,
      applicationCategory: "BusinessApplication",
      operatingSystem: "Windows",
      description: product.summary,
      offers: {
        "@type": "AggregateOffer",
        lowPrice: String(Math.min(...editionPrices)),
        highPrice: String(Math.max(...editionPrices)),
        priceCurrency: "JPY",
        offerCount: editionPrices.length,
        availability: "https://schema.org/InStock",
        url: productUrl,
      },
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
