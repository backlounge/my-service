import { SITE_URL } from "./_lib/site.js";

// 独自ドメイン移行前に使っていたCloudflare Pagesの既定ドメイン。
// 生きたままだと同一内容が2つのURLで見えてしまい、Google Search Consoleで
// 「重複しています。ユーザーがマークしたページと異なるページが正規ページとして選択されました」
// の原因になる。canonicalタグだけでは弱い信号なので、301リダイレクトで明確にする。
const LEGACY_HOSTS = new Set(["my-service-4bi.pages.dev"]);

export async function onRequest(context) {
  const { request, next } = context;
  const url = new URL(request.url);

  if (LEGACY_HOSTS.has(url.hostname)) {
    const target = `${SITE_URL}${url.pathname}${url.search}`;
    return Response.redirect(target, 301);
  }

  return next();
}
