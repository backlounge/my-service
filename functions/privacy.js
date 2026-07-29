import { renderLayout } from "./_lib/layout.js";
import { renderBreadcrumb } from "./_lib/components.js";

// プライバシーポリシー。
const SECTIONS = [
  {
    title: "事業者情報",
    body: "本サイトは、佐藤 慧（屋号：BackLounge、以下「当方」といいます）が運営しています。",
  },
  {
    title: "収集する情報",
    body:
      "お問い合わせフォーム・購入お申し込みフォームより、氏名、会社名・屋号、メールアドレス、" +
      "お問い合わせ・お申し込み内容(ご希望の商品・エディション等を含みます)を取得します。" +
      "また、不正送信対策のため、送信時のIPアドレスを取得します。",
  },
  {
    title: "利用目的",
    body:
      "取得した情報は、次の目的で利用します。" +
      "(1)お問い合わせ・ご相談への対応、(2)商品の購入手続き・お支払い方法のご案内、" +
      "(3)商品(プログラム一式)の納品、(4)購入後のサポート対応、(5)不正送信・スパム対策。",
  },
  {
    title: "保存先",
    body: "取得した情報は、Cloudflare, Inc.が提供するデータベースサービス「Cloudflare D1」上に保存し、管理しています。",
  },
  {
    title: "第三者提供について",
    body: "法令に基づく場合を除き、ご本人の同意なく取得した情報を第三者に提供することはありません。",
  },
  {
    title: "安全管理について",
    body: "通信の暗号化(SSL/TLS)、アクセス制限など、取得した情報の漏えい・滅失・毀損を防ぐための適切な安全管理措置を講じています。",
  },
  {
    title: "保存期間",
    body: "お問い合わせ・購入お申し込みに関する情報は、対応完了後3年間保存し、その後削除します。",
  },
  {
    title: "Cookie・広告計測について",
    body: "現時点では、広告計測・アクセス解析のためのCookieは使用していません。今後導入する場合は、本ページの内容を更新のうえお知らせします。",
  },
  {
    title: "開示・訂正・削除等のお問い合わせ窓口",
    body:
      "保有する個人情報の開示・訂正・削除等をご希望の場合は、backlounge1206@gmail.com" +
      "(またはお問い合わせフォーム)までご連絡ください。ご本人確認のうえ、法令に従い対応いたします。",
  },
];

export async function onRequestGet() {
  const bodyHtml = `
    <section class="mx-auto max-w-2xl px-6 py-16 lg:px-8">
      ${renderBreadcrumb([{ label: "ホーム", href: "/" }, { label: "プライバシーポリシー" }])}
      <h1 class="section-title mt-6">プライバシーポリシー</h1>

      <div class="article-body mt-10">
        ${SECTIONS.map((s) => `<h2>${s.title}</h2><p>${s.body}</p>`).join("")}
      </div>
    </section>
  `;

  return renderLayout({
    title: "プライバシーポリシー",
    description: "プライバシーポリシーです。",
    path: "/privacy",
    bodyHtml,
  });
}
