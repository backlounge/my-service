// 見積書PDFのヘッダーに使用する会社情報の編集項目一覧(/admin/settings で編集)。
//
// 旧トップページ(public/index.html)向けの data-cms 連動フィールド(サイト名・ヒーロー・
// 料金プラン・レビュー・ブログ紹介文)は、製品サイト再設計(functions/index.js 以下を
// コンテンツ直書きの複数ページ構成に変更)にともない削除した。トップページの文言は
// コード側で管理し、会社情報(見積書PDF用)のみ引き続きこの管理画面から編集できる。
export const CMS_FIELDS = [
  { key: "company-name", label: "会社名(見積書に表示)", type: "text", maxLength: 100, group: "会社情報(見積書用)" },
  { key: "company-address", label: "住所(見積書に表示)", type: "textarea", maxLength: 200, group: "会社情報(見積書用)" },
  { key: "company-registration-number", label: "登録番号(インボイス制度等)", type: "text", maxLength: 40, group: "会社情報(見積書用)" },
  {
    key: "company-logo-url",
    label: "会社ロゴ画像URL(ファイル管理でアップロードしたURLを貼り付け)",
    type: "text",
    maxLength: 300,
    group: "会社情報(見積書用)",
  },
  {
    key: "company-stamp-url",
    label: "角印画像URL(ファイル管理でアップロードしたURLを貼り付け)",
    type: "text",
    maxLength: 300,
    group: "会社情報(見積書用)",
  },
];

export const CMS_KEYS = CMS_FIELDS.map((field) => field.key);
