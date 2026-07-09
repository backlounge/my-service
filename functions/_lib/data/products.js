// 商品データの単一情報源。商品が増えたら配列に1件追加するだけでよい構成にしている。
// status: "live"(販売中) | "coming-soon"(準備中)
export const PRODUCTS = [
  {
    slug: "quote-management",
    status: "live",
    name: "見積管理システム",
    tagline: "顧客・案件・見積・PDFを、これひとつで。",
    summary:
      "顧客管理・案件管理・見積書発行(PDF)ができる業務システムです。現時点では買い切り型を基本としており、ご自身のCloudflareアカウントに設置してお使いいただけます。",
    priceNote: "買い切り型を基本に提供(価格はお問い合わせください)",
    heroImage: "/images/products/quote-management/dashboard.png",
    painPoints: [
      "顧客の連絡先や商談履歴がExcelや紙にバラバラに残っている",
      "見積書を作るたびに、前回のファイルを探してフォーマットを直している",
      "案件がどこまで進んでいるか、担当者しか把握していない",
    ],
    features: [
      { title: "顧客管理", desc: "会社名・連絡先・メモを一元管理。検索もかんたんです。" },
      { title: "案件管理", desc: "顧客ごとの案件をステータス管理。進捗が一目でわかります。" },
      { title: "見積書作成", desc: "明細を入力するだけで、金額・消費税を自動計算します。" },
      { title: "PDF出力", desc: "会社ロゴ・角印入りの見積書を、そのままPDFとして出力できます。" },
      { title: "変更履歴", desc: "保存のたびに履歴を自動記録。前の内容にも戻せます。" },
      { title: "権限管理", desc: "管理者・閲覧専用ユーザーを分けて運用できます。" },
      { title: "ファイル管理", desc: "仕様書などの画像・PDFをアップロードし、URLで共有できます。" },
      { title: "お問い合わせ受付", desc: "公開フォームからの問い合わせを「顧客化」ボタンでワンクリック変換します。" },
    ],
    notIncluded: [
      "見積書のメール自動送信(PDFの表示・ダウンロードは可能です)",
      "決済・課金機能",
      "複数事業者(マルチテナント)対応。1回の設置につき1事業者向けです",
      "ユーザーが自分でアカウントを作る会員登録画面",
    ],
    requirements: [
      "Cloudflareアカウント(無料プランの範囲内で利用できます)",
      "Node.jsがインストールされたパソコン",
      "Git",
      "ターミナル(コマンドプロンプト)の基本的な操作",
    ],
    faqs: [
      {
        q: "プログラミングの知識がなくても使えますか?",
        a: "日々の利用(顧客登録・案件管理・見積作成)にプログラミング知識は不要です。最初のセットアップのみ、手順書に沿ったコマンド操作が必要になります。",
      },
      {
        q: "月額費用はかかりますか?",
        a: "現時点では買い切り型を基本としており、月額費用は発生しません。データ量が非常に多くなった場合のみ、Cloudflare側の従量課金が発生する可能性があります。なお、将来的に保守・サポート等のオプションを別途ご用意する可能性はあります。",
      },
      {
        q: "複数のスタッフで使えますか?",
        a: "はい。管理者アカウントのほかに、閲覧専用の一般ユーザーアカウントを追加で作成できます。",
      },
      {
        q: "会社ロゴや印鑑(角印)を見積書に入れられますか?",
        a: "はい。管理画面からロゴ画像・角印画像をアップロードすると、見積書PDFに反映されます。",
      },
      {
        q: "既存の顧客データを取り込めますか?",
        a: "現在のバージョンにはExcel等からの一括取り込み機能は含まれていません。管理画面から1件ずつ登録していただく形になります。",
      },
    ],
    screenshots: [
      { src: "/images/products/quote-management/dashboard.png", alt: "ダッシュボード画面。顧客数・案件数・見積状況が一目でわかる" },
      { src: "/images/products/quote-management/quote-edit.png", alt: "見積編集画面。明細を入力すると金額が自動計算される" },
      { src: "/images/products/quote-management/pdf.png", alt: "会社ロゴ・角印入りで出力される見積書PDF" },
    ],
    videoSrc: "/videos/quote-management-intro.mp4",
  },
  {
    slug: "customer-management",
    status: "coming-soon",
    name: "顧客管理システム",
    tagline: "顧客情報と来店履歴を、探さず、迷わず。",
    summary:
      "顧客の登録・検索・来店履歴管理ができるデスクトップ型の顧客管理システムです。登録件数に応じたライト版・スタンダード版をご用意し、この製品サイトでの取り扱いを準備中です。",
    priceNote: "買い切り型を予定(準備中)",
  },
  {
    slug: "inventory-management",
    status: "coming-soon",
    name: "在庫管理システム",
    tagline: "入出庫と在庫金額を、リアルタイムに。",
    summary:
      "商品登録・入出庫管理・在庫金額の把握ができるデスクトップ型の在庫管理システムです。ゼロ在庫のアラート表示にも対応。この製品サイトでの取り扱いを準備中です。",
    priceNote: "買い切り型を予定(準備中)",
  },
  {
    slug: "reservation-management",
    status: "coming-soon",
    name: "予約管理システム",
    tagline: "予約の受付から当日の管理まで。",
    summary:
      "予約の受付・空き状況の管理・当日運用をまとめて行える業務システムです。現在開発を検討しています。",
    priceNote: "準備中",
  },
];

export function getProductBySlug(slug) {
  return PRODUCTS.find((p) => p.slug === slug) || null;
}

export function getLiveProducts() {
  return PRODUCTS.filter((p) => p.status === "live");
}
