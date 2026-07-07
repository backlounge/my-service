// トップページ(public/index.html)の data-cms="..." 属性と1:1で対応するキー一覧。
// ここに定義したキーだけが編集画面(/admin/settings)・保存API・表示側で扱われる。
export const CMS_FIELDS = [
  { key: "site-name", label: "サイト名", type: "text", maxLength: 60, group: "基本情報" },
  { key: "hero-title", label: "ヒーロータイトル", type: "text", maxLength: 120, group: "ヒーロー" },
  { key: "hero-description", label: "ヒーロー説明文", type: "textarea", maxLength: 400, group: "ヒーロー" },
  { key: "cta-text", label: "CTAボタン文言(ヒーロー主要ボタン)", type: "text", maxLength: 40, group: "ヒーロー" },

  { key: "plan1-name", label: "料金プラン名", type: "text", maxLength: 40, group: "料金プラン1" },
  { key: "plan1-price", label: "料金 例: ¥0", type: "text", maxLength: 20, group: "料金プラン1" },
  { key: "plan1-description", label: "料金説明", type: "text", maxLength: 100, group: "料金プラン1" },

  { key: "plan2-name", label: "料金プラン名", type: "text", maxLength: 40, group: "料金プラン2" },
  { key: "plan2-price", label: "料金 例: ¥4,980", type: "text", maxLength: 20, group: "料金プラン2" },
  { key: "plan2-description", label: "料金説明", type: "text", maxLength: 100, group: "料金プラン2" },

  { key: "plan3-name", label: "料金プラン名", type: "text", maxLength: 40, group: "料金プラン3" },
  { key: "plan3-price", label: "料金 例: ¥9,800", type: "text", maxLength: 20, group: "料金プラン3" },
  { key: "plan3-description", label: "料金説明", type: "text", maxLength: 100, group: "料金プラン3" },

  { key: "review1-text", label: "レビュー文", type: "textarea", maxLength: 300, group: "レビュー1" },
  { key: "review2-text", label: "レビュー文", type: "textarea", maxLength: 300, group: "レビュー2" },
  { key: "review3-text", label: "レビュー文", type: "textarea", maxLength: 300, group: "レビュー3" },

  { key: "blog1-title", label: "ブログタイトル", type: "text", maxLength: 100, group: "ブログ1" },
  { key: "blog1-summary", label: "ブログ概要", type: "textarea", maxLength: 300, group: "ブログ1" },
  { key: "blog2-title", label: "ブログタイトル", type: "text", maxLength: 100, group: "ブログ2" },
  { key: "blog2-summary", label: "ブログ概要", type: "textarea", maxLength: 300, group: "ブログ2" },
  { key: "blog3-title", label: "ブログタイトル", type: "text", maxLength: 100, group: "ブログ3" },
  { key: "blog3-summary", label: "ブログ概要", type: "textarea", maxLength: 300, group: "ブログ3" },

  // 見積書PDFのヘッダーに使用する会社情報。data-cms属性としてトップページには表示されないが、
  // /admin/settings の編集画面には他の項目と同じ仕組みで表示される。
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
