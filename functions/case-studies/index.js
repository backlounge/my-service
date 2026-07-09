import { renderLayout } from "../_lib/layout.js";
import { renderBreadcrumb, renderCaseStudyCard } from "../_lib/components.js";
import { CASE_STUDIES } from "../_lib/data/case-studies.js";

export async function onRequestGet() {
  const hasHypothetical = CASE_STUDIES.some((c) => c.isHypothetical);

  const bodyHtml = `
    <section class="mx-auto max-w-7xl px-6 py-16 lg:px-8">
      ${renderBreadcrumb([{ label: "ホーム", href: "/" }, { label: "導入事例" }])}
      <div class="mx-auto mt-6 max-w-2xl text-center">
        <p class="section-eyebrow">Case Studies</p>
        <h1 class="section-title">導入事例</h1>
        <p class="section-subtitle">業種ごとにどう活用できるかをご紹介します。</p>
      </div>

      ${
        hasHypothetical
          ? `
      <div class="mx-auto mt-8 max-w-2xl rounded-xl border border-amber-200 bg-amber-50 px-5 py-4 text-center text-sm text-amber-800">
        現在掲載している事例には、実際の導入実績ではなく、業種特性をもとにした「想定活用シーン」を含みます。各事例のページで明記しています。
      </div>`
          : ""
      }

      <div class="mt-14 grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
        ${CASE_STUDIES.map(renderCaseStudyCard).join("")}
      </div>
    </section>
  `;

  return renderLayout({
    title: "導入事例",
    description: "業務システムの業種別の活用イメージ・導入事例をご紹介します。",
    path: "/case-studies",
    activeNav: "case-studies",
    bodyHtml,
  });
}
