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
];

export const CMS_KEYS = CMS_FIELDS.map((field) => field.key);
