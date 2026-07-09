# 業務システム紹介LP

中小企業・個人事業主向けの**業務システム製品サイト**です(旧称: 業務システム紹介LP。
単発の会社紹介ページから、複数商品を扱う製品サイトへ再設計済み)。
Tailwind CSSベースの複数ページサイト + Cloudflare Pages Functions + Cloudflare D1 + Cloudflare R2 による
自前のお問い合わせフォーム・自社運営用の簡易管理画面(問い合わせ・案件・見積管理)を備えています。

公開サイト(`/`以下)と管理画面(`/admin`以下)は役割が完全に分かれています。
公開サイトは商品を売るための製品サイト、管理画面はこの会社自身の問い合わせ・案件・見積を
管理するための社内業務ツールです(商品を購入したお客様がログインする場所ではありません)。

## 公開サイトの構成(製品サイト)

ページはすべて `functions/` 配下のPages Functionsが動的に生成します(`public/*.html`のような
静的HTMLファイルではありません)。共通のヘッダー・フッター・meta/OGP・構造化データ(JSON-LD)は
`functions/_lib/layout.js` が一括で生成し、各ページは本文(`bodyHtml`)だけを組み立てます。

```
functions/
  index.js                    ← GET /(トップページ)
  about.js                     ← GET /about(私たちについて)
  products/
    index.js                    ← GET /products(商品一覧)
    [slug].js                    ← GET /products/:slug(商品詳細。準備中商品は簡易ページ+noindex)
  blog/
    index.js                    ← GET /blog(ブログ一覧)
    [slug].js                    ← GET /blog/:slug(記事詳細)
  case-studies/
    index.js                    ← GET /case-studies(導入事例一覧)
    [slug].js                    ← GET /case-studies/:slug(事例詳細)
  faq.js                       ← GET /faq(全体共通FAQ。商品固有FAQは商品詳細ページ側)
  contact.js                   ← GET /contact(お問い合わせフォーム。?product=スラッグ で商品名を引き継ぐ)
  legal.js                     ← GET /legal(特定商取引法に基づく表記。現状は枠のみ・noindex)
  privacy.js                   ← GET /privacy(プライバシーポリシー。現状は枠のみ・noindex)

  _lib/
    layout.js                   ← 全ページ共通のヘッダー/フッター/meta/OGP/JSON-LDを生成
    components.js                ← パンくず・FAQアコーディオン・商品カード等の再利用パーツ
    site.js                      ← サイト全体の定数(SITE_NAME, SITE_URL, ナビ項目)・HTMLエスケープ
    data/
      products.js                 ← 商品データ(単一情報源。商品追加はここに1件足すだけでよい)
      blog-posts.js                ← ブログ記事データ(本文はbodyHtmlとして直接記述)
      case-studies.js              ← 導入事例データ(実績が無い間は「想定活用シーン」として明示)
      faqs.js                      ← 全体共通FAQ
```

**コンテンツの管理方法について**: 商品・ブログ・導入事例・FAQは管理画面(CMS)からは編集できません。
`functions/_lib/data/` 配下のファイルを直接編集する運用です(商品が増えるたびに管理画面を作り直す
必要がないよう、あえてコード側で一元管理する設計にしています)。見積書PDF用の会社情報のみ、
従来通り `/admin/settings` から編集できます(下記「サイト編集(CMS)機能について」を参照)。

## 管理画面(/admin)の構成(自社運営用)

```
public/
  admin/
    dashboard.html              ← 管理画面ダッシュボード(件数サマリー・推移グラフ・システム情報)
    index.html                 ← 問い合わせ管理画面(ログイン必須)
    login.html                 ← 管理画面ログインページ
    settings.html               ← サイト編集画面(見積書PDF用の会社情報のみ。管理者のみ)
    files.html                   ← ファイル管理画面(アップロード・検索・削除・URLコピー)
    projects.html                ← 案件一覧画面(検索・ステータス絞込・新規作成・削除)
    project-detail.html           ← 案件詳細画面(編集・ステータス変更・ファイル添付・見積作成)
    quotes.html                    ← 見積一覧画面(検索・ステータス絞込)
    quote-detail.html               ← 見積詳細画面(明細編集・自動計算・PDF・履歴・ファイル添付)
  404.html
  robots.txt
  sitemap.xml
  build-info.json            ← ビルド時に自動生成(Git Commit・ブランチ・ビルド日時。手動編集不要)
  fonts/SawarabiGothic-Regular.ttf ← 見積書PDFで使用する日本語フォント(静的TTF)
  css/style.css              ← Tailwindのビルド済みCSS(コミット済みなのでビルド不要でもそのまま動作)
  images/products/quote-management/ ← 見積管理システムのスクリーンショット
  videos/quote-management-intro.mp4 ← 見積管理システムの紹介動画
  js/main.js                 ← モバイルメニュー・お問い合わせフォーム送信処理
  js/admin-common.js         ← 管理画面共通処理(ログインユーザー表示・ログアウト・ナビ制御)
  js/admin-dashboard.js      ← ダッシュボードの集計表示・推移グラフ描画
  js/admin.js                ← 問い合わせ一覧の表示・ステータス変更
  js/admin-login.js          ← 管理画面ログインフォームの送信処理
  js/admin-settings.js       ← サイト編集フォームの読み込み・保存処理
  js/admin-files.js          ← ファイル管理(一覧・検索・D&Dアップロード・削除・URLコピー)
  js/admin-projects.js       ← 案件一覧の表示・検索・ステータス絞込・新規作成・削除
  js/admin-project-detail.js ← 案件詳細の編集・削除・添付ファイル管理・見積作成
  js/admin-quotes.js         ← 見積一覧の表示・検索・ステータス絞込・削除
  js/admin-quote-detail.js   ← 見積詳細の編集・明細操作・自動計算・複製・履歴・添付ファイル管理

functions/
  admin/
    _middleware.js             ← 静的ページ /admin/* の保護(未ログインは/admin/loginへ302)
  files/
    [key].js                   ← GET /files/:key (R2からファイルを配信。認証不要の公開URL)
  api/
    contact.js                ← POST /api/contact (お問い合わせ受付・D1保存。公開サイトの/contactから送信)
    auth/
      login.js                  ← POST /api/auth/login (メール+パスワードでログイン)
      logout.js                 ← POST /api/auth/logout
      me.js                     ← GET /api/auth/me (現在ログイン中のユーザー情報)
    admin/
      _middleware.js            ← /api/admin/* の認証チェック(ログイン必須)
      contacts.js                ← GET /api/admin/contacts (一覧取得。ログイン済みなら誰でも可)
      contacts/[id].js            ← PATCH /api/admin/contacts/:id (ステータス更新。管理者roleのみ)
      settings.js                ← GET/PUT /api/admin/settings (会社情報の取得・保存。管理者roleのみ)
      stats.js                   ← GET /api/admin/stats (ダッシュボード集計。ログイン済みなら誰でも可)
      files.js                   ← GET(一覧・検索。ログイン済みなら誰でも可) / POST(アップロード。管理者roleのみ) /api/admin/files
      files/[id].js               ← DELETE /api/admin/files/:id (ファイル削除。管理者roleのみ)
      projects.js                 ← GET(一覧・検索・ステータス絞込) / POST(新規作成 or 問い合わせから案件化) /api/admin/projects
      projects/[id].js             ← GET(詳細+添付ファイル) / PATCH(編集・ステータス変更) / DELETE(添付ファイルごと削除)
      quotes.js                   ← GET(一覧・検索・ステータス/案件絞込) / POST(案件から見積作成、自動採番) /api/admin/quotes
      quotes/[id].js                ← GET(詳細+明細) / PATCH(明細まるごと更新・自動計算・バージョン保存) / DELETE
      quotes/[id]/duplicate.js       ← POST /api/admin/quotes/:id/duplicate (見積を複製)
      quotes/[id]/versions.js        ← GET(変更履歴一覧) / POST(指定バージョンへ復元)
      quotes/[id]/pdf.js             ← GET /api/admin/quotes/:id/pdf (見積書PDFを生成)
  _lib/
    auth.js                    ← 署名付きセッションCookieの発行・検証(SESSION_SECRET)
    password.js                 ← bcryptjsによるパスワードのハッシュ化・照合
    response.js                 ← JSONレスポンス生成ヘルパー
    cms-keys.js                 ← サイト編集で扱う項目一覧の定義(現在は見積書PDF用の会社情報のみ)
    quote-calc.js                ← 見積の小計・消費税(税率ごと)・合計を計算する共通ロジック
    quote-number.js              ← 見積番号の自動採番(例: Q-2026-0001)

scripts/
  create-user.mjs             ← 管理者・一般ユーザーをD1に作成するCLIスクリプト
  generate-build-info.mjs     ← ビルド時にpublic/build-info.jsonを生成(npm run buildから自動実行)

schema.sql                  ← D1のテーブル定義(contacts, users, login_attempts, site_settings, files, projects, quotes, quote_items, quote_versions)
wrangler.toml                ← Cloudflare Pages / D1 / R2 / デプロイ設定
.dev.vars.example            ← ローカル開発用の環境変数サンプル(SESSION_SECRET)
src/input.css                ← Tailwindのソース(コンポーネントクラスの追加・変更はここを編集してビルド)
tailwind.config.js            ← content配列は public/**/*.{html,js} と functions/**/*.js の両方を含む
                                (公開ページのクラスはfunctions側のJS文字列に書かれているため)
postcss.config.js
package.json
```

## お問い合わせフォームの仕組み

- フロント(`/contact`ページ、`functions/contact.js`)のフォームは `/api/contact` へPOSTします(Web3Forms等の外部サービスは使用しません)。
- `functions/api/contact.js` が入力チェック・スパム対策を行い、Cloudflare D1の `contacts` テーブルに保存します。
- 保存項目: `name`, `email`, `company`, `message`, `status`(初期値 `new`), `ip`, `created_at`
- スパム・連続送信対策:
  - ハニーポット項目(`botcheck`): 人には見えない項目が埋まっていたら送信を無視(成功したふりだけ返す)
  - 同一IPからの連続送信を30秒間ブロック
  - 同一IPからの送信を1日10件までに制限

## 認証・管理画面(/admin)の仕組み

`https://あなたのドメイン/admin` は**ログインしないとアクセスできません**。
未ログインの状態でアクセスすると `/admin/login` へ自動的にリダイレクトされます
(ページ表示自体をブロックするミドルウェアと、APIを保護するミドルウェアの二重構成です)。

- ユーザーはメールアドレス + パスワードでログインします(D1の `users` テーブルで管理)
- パスワードは平文では保存せず、**bcrypt** でハッシュ化してD1に保存します
- ログインに成功すると、署名付きセッションCookie(HttpOnly / Secure / SameSite=Lax、有効期限8時間)が発行されます
- ブルートフォース対策として、同一IPからの**ログイン失敗**が15分間に8回を超えると一時的にブロックします(`login_attempts` テーブルで記録)

### 権限(role)の違い

| 操作 | admin | user |
| --- | --- | --- |
| 問い合わせ一覧の閲覧 | ○ | ○ |
| 問い合わせのステータス変更(new/doing/done) | ○ | ×(403) |

一般ユーザー(`user`)は閲覧のみ可能で、ステータス変更ボタンは無効化されます。

### 初期管理者・ユーザーの作成

Web上に「ユーザー登録フォーム」は用意していません(セキュリティ上、誰でもアカウントを作れると危険なため)。
ユーザーの作成は、Cloudflareにアクセスできる人だけがCLIから行います。

```bash
# 本番(リモートD1)に最初の管理者を作成する例
npm run create-user -- admin@example.com "十分に複雑なパスワード" admin

# 一般ユーザーを追加する場合
npm run create-user -- staff@example.com "十分に複雑なパスワード" user

# ローカルD1に作る場合は末尾に --local を付ける
npm run create-user -- admin@example.com "TestPassword123" admin --local
```

パスワードは8文字以上にしてください。同じメールアドレスのユーザーは重複登録できません。

## 管理画面ダッシュボードについて

`/admin/dashboard`(ヘッダーの「ダッシュボード」リンク)で、お問い合わせ状況を一目で確認できます。
ログイン済みであれば admin / user どちらのroleでも閲覧できます(編集操作は行わないため)。

表示内容(すべて `functions/api/admin/stats.js` がD1から集計):

- 総問い合わせ件数 / 未対応(new) / 対応中(doing) / 完了(done) の件数
- 今日の問い合わせ件数 / 今月の問い合わせ件数
- 最新のお問い合わせ5件
- お問い合わせ推移グラフ(日別・直近30日、棒グラフ・ホバーで件数を表示)
- システム情報
  - **Git Commit**: デプロイ元のコミットハッシュ(先頭7文字)
  - **デプロイ日時**: `npm run build` を実行した日時
  - **DB接続状態**: D1への接続・クエリが成功しているかどうか

### Git Commit / デプロイ日時の仕組み

`npm run build` の最後に `scripts/generate-build-info.mjs` が実行され、
`public/build-info.json` に以下の内容を書き出します。

```json
{ "commitSha": "...", "branch": "...", "builtAt": "2026-01-01T00:00:00.000Z" }
```

- Cloudflare Pages経由のビルド(Git連携)では、Cloudflareが自動設定する
  `CF_PAGES_COMMIT_SHA` / `CF_PAGES_BRANCH` を使用します。
- 手元から `npm run deploy` 等でビルドした場合は、ローカルの `git rev-parse HEAD` を代わりに使用します。
- ダッシュボードはこのファイルを `functions/api/admin/stats.js` が
  (`functions/index.js` と同じ `env.ASSETS.fetch` の仕組みで)読み込んで表示します。
  ファイルが無い場合は「不明」と表示されるだけで、エラーにはなりません。

## サイト編集(CMS)機能について

管理画面(`/admin/settings`、ヘッダーの「サイト編集」リンク)から編集できるのは、
**見積書PDFに表示する会社情報のみ**です。**管理者(admin role)のみ**編集可能です。

製品サイト再設計(トップページ以下の複数ページ化)にともない、以前はここで編集できた
サイト名・ヒーロー文言・料金プラン・レビュー・ブログ紹介文は廃止しました。これらは
`functions/index.js` 等のページ本体、または `functions/_lib/data/` 配下のデータファイルに
直接記述する方式に変更しています(理由は前述の「コンテンツの管理方法について」を参照)。

### 編集できる項目

- 会社名(見積書に表示)
- 住所(見積書に表示)
- 登録番号(インボイス制度等)
- 会社ロゴ画像URL・角印画像URL(`/admin/files` でアップロードしたURLを貼り付け)

対象項目の一覧は `functions/_lib/cms-keys.js` の `CMS_FIELDS` で定義されています。

### 仕組み

- 保存内容は D1 の `site_settings` テーブルに `key` / `value` の形で保存されます。
- 見積書PDF生成(`functions/api/admin/quotes/[id]/pdf.js`)がこの値を読み込んで、
  PDFのヘッダーに会社名・住所・登録番号・ロゴ・角印を描画します。
- 未設定の項目はPDF上でそのまま省略されます(エラーにはなりません)。

### 使い方

1. 管理者アカウントで `/admin` にログインする
2. ヘッダーの「サイト編集」をクリックする(このリンクは管理者にのみ表示されます)
3. 変更したい項目に入力し、「保存する」を押す
4. 見積書PDFを表示・ダウンロードすると反映されています(未入力のまま保存した項目は変更されません)

### マイグレーション

`site_settings` テーブルは `schema.sql` に含まれているため、他のテーブルと同様に
以下のコマンドで作成できます(既存のD1に対して追加実行してもエラーにはなりません)。

```bash
npm run d1:migrate:local   # ローカルD1に反映
npm run d1:migrate:remote  # 本番(リモート)D1に反映
```

## ファイル管理機能について

`/admin/files`(ヘッダーの「ファイル管理」リンク)から、画像・PDFなどのファイルを
アップロード・検索・削除できます。今後作る他のシステムからも共通して使えることを
想定した、Cloudflare R2 + D1によるシンプルなファイル管理基盤です。

### 機能

- ファイルのアップロード(ボタンクリックまたはドラッグ&ドロップ、**管理者のみ**)
- 画像はサムネイル表示、PDFはアイコン表示(クリックで新しいタブに開き、ブラウザ内蔵のPDFビューアで閲覧できます)
- ファイル名での検索
- 「URLをコピー」でファイルの公開URLをクリップボードにコピー(サイト編集の本文などに貼り付けて使えます)
- 削除(**管理者のみ**)

一覧の閲覧・検索・URLコピーは一般ユーザー(user role)でも可能です。
アップロードと削除は管理者(admin role)のみ行えます(既存の認証・権限の仕組みをそのまま利用しています)。

### 保存の仕組み

- ファイルの実体は **Cloudflare R2**(`FILES_BUCKET` バインディング)に保存します。
- ファイル名・サイズ・アップロードした人などの情報は **D1の`files`テーブル**に保存します。

| カラム | 内容 |
| --- | --- |
| id | 連番ID |
| filename | 保存用にサニタイズしたファイル名 |
| original_name | アップロード時の元のファイル名(表示用) |
| mime_type | ファイルの種類(image/png, application/pdf など) |
| size | バイト数 |
| r2_key | R2上のオブジェクトキー(`{ランダムなUUID}-{ファイル名}`) |
| uploaded_by | アップロードした`users.id` |
| created_at | アップロード日時 |

### 公開URLについて

ファイルの配信(`/files/{r2_key}`)は**認証不要の公開URL**です。
「URLをコピー」した結果をトップページの画像や他の場所に貼り付けてそのまま使えるようにするための設計です。
一方で、ファイルの**一覧・検索・アップロード・削除**は管理画面のログインが必須です。
「誰がどんなファイルを持っているか」の一覧は非公開のまま、個々のファイルのURLだけが公開される形になります。

- アップロードできるファイルサイズの上限は1ファイルあたり **20MB** です
  (`functions/api/admin/files.js` の `MAX_FILE_SIZE` で変更できます)。
- 画像のサムネイルはR2に保存された画像をそのままCSSで縮小表示しているだけで、
  別途縮小版を生成しているわけではありません。

## 案件管理機能について

`/admin/projects`(ヘッダーの「案件管理」リンク)から、問い合わせ→案件→見積→受注までを
一元管理できます。既存の認証・D1・R2・サイト編集機能の仕組みをそのまま利用しています。

### ステータス

`new`(新規) → `hearing`(ヒアリング) → `quotation`(見積) → `contract`(受注) →
`development`(開発中) → `completed`(完了) の順に進む想定で、`cancel`(キャンセル)は
どの段階からでも設定できます。

### 機能

- 案件の一覧・検索(案件名・顧客名)・ステータスによる絞り込み
- 新規作成・編集・削除・ステータス変更(**作成・編集・削除・ステータス変更は管理者のみ**)
- お問い合わせ一覧の各カードにある「この問い合わせを案件化」ボタンから、
  問い合わせの名前・メールアドレス・本文を引き継いだ案件を1クリックで作成
- 案件詳細画面(`/admin/project-detail?id=案件ID`)からファイルを添付(既存のファイル管理・R2の仕組みをそのまま利用)
  - 添付したファイルは `files` テーブルの `project_id` にひもづきます
  - 案件を削除すると、添付ファイルもR2・D1の両方から削除されます(まとめて片付く設計です)

閲覧・検索は一般ユーザー(user role)でも可能です。

### ダッシュボードの案件指標

`/admin/dashboard` に以下の4つを追加しています。

- **案件数**: 全案件の件数
- **進行中案件**: `completed` / `cancel` 以外のステータスの件数
- **受注数**: `contract` / `development` / `completed` のいずれか(受注に至った案件の累計)
- **完了数**: `completed` の件数

### マイグレーションに関する注意

`projects` テーブルは新規追加ですが、既存の `files` テーブルには `project_id` 列を
追加しています。**まだ一度もこの機能のマイグレーションを実行していないD1に対しては**、
`npm run d1:migrate:local` / `npm run d1:migrate:remote` の前に、次のコマンドを1回だけ実行してください
(このリポジトリのD1に対しては既に適用済みです)。

```bash
npx wrangler d1 execute gyomu_system_lp_db --local  --command="ALTER TABLE files ADD COLUMN project_id INTEGER;"
npx wrangler d1 execute gyomu_system_lp_db --remote --command="ALTER TABLE files ADD COLUMN project_id INTEGER;"
```

すでに `project_id` 列がある状態で再実行すると `duplicate column name` エラーになりますが、
その場合は無視して問題ありません(列はすでに存在しています)。

## 見積システムについて

`/admin/quotes`(ヘッダーの「見積管理」リンク)、および案件詳細画面の「見積作成」ボタンから、
問い合わせ→案件→見積→受注までを一元管理できます。既存の認証・D1・R2・案件管理の仕組みをそのまま利用しています。

### できること

- 案件詳細画面から「見積作成」で見積を作成(見積番号は `Q-2026-0001` の形式で自動採番、年ごとに連番)
- 明細行の追加・削除・並び替え(▲▼ボタン)、商品名・数量・単位・単価・値引・税率・備考を編集
- 保存すると自動的に小計・消費税(税率ごとにグループ化して計算)・合計(税込)を再計算
- ステータス管理: `draft`(下書き) → `sent`(送付済み) → `accepted`(受注) / `rejected`(却下)
- 複製(既存の見積の内容をコピーして新しい見積番号で新規作成)
- 変更履歴: 保存するたびにバージョンが記録され、過去のバージョンへの復元が可能
- ファイル添付(既存のファイル管理・R2の仕組みをそのまま利用。案件と同様に`files.quote_id`にひもづく)
- PDF出力(A4、日本語対応、会社ロゴ・角印画像に対応。「PDFを表示」で印刷、「PDFをダウンロード」でファイル保存)

「編集・ステータス変更・複製・削除・PDF生成対象の操作」は**管理者(admin role)のみ**、閲覧・検索・PDF閲覧は一般ユーザー(user role)でも可能です。

### 案件・顧客との紐付け

見積は必ず案件(`project_id`)にひもづきます。顧客名・メールアドレスは案件側の情報をそのまま参照して表示するため、
見積側に顧客情報を重複して持たせていません(案件の顧客情報を編集すれば、ひもづく見積の表示にも反映されます)。

### 見積書PDFに表示する会社情報の設定

`/admin/settings`(サイト編集画面)の「会社情報(見積書用)」グループから設定します。

- 会社名・住所・登録番号(インボイス制度の登録番号など)
- 会社ロゴ画像URL・角印画像URL: `/admin/files`(ファイル管理)で画像をアップロードし、
  「URLをコピー」した値をそのまま貼り付けてください

未設定の項目はPDF上でそのまま省略されます(エラーにはなりません)。

### 日本語フォントについて(重要な実装メモ)

見積書PDFの生成には [pdf-lib](https://pdf-lib.js.org/) を使用し、日本語フォントとして
`public/fonts/SawarabiGothic-Regular.ttf`(Google Fonts, OFLライセンス)を埋め込んでいます。

実装時に、pdf-libの `embedFont(..., { subset: true })`(使用文字だけを抽出して埋め込む機能)を
このフォントで使うと、一部の漢字グリフが欠落して表示されない不具合を確認しました
(バリアブルフォントや大きなCID-keyed OTFフォントでも同様の問題が発生しました)。
そのため `functions/api/admin/quotes/[id]/pdf.js` では **`subset: false`(フォント全体を埋め込む)** を
明示的に使用しています。この影響で生成されるPDFのファイルサイズは1つあたり約1.1MB
(フォント埋め込み分)になりますが、文字化けを避けるためのトレードオフです。

フォントを別のものに差し替えたい場合は、静的(バリアブルではない)なTrueType(.ttf)フォントを
`public/fonts/` に配置し、`pdf.js` 内のファイル名を変更してください。CID-keyed OTF(多くの
Noto Sans CJKなど)は同様の不具合が出る可能性があるため、TrueType(glyfアウトライン)形式を推奨します。

### メール送信について(未実装)

見積書をメールで送信する機能は、今回はまだ実装していません
(Cloudflare WorkersにSMTP機能がないため、Resend等の外部メール送信APIとの連携が必要になります)。
PDF生成の仕組みは既に用意できているため、必要になったタイミングで
`functions/api/admin/quotes/[id]/send.js` のようなエンドポイントを追加し、
生成済みのPDFをメール送信APIに添付する形で実装できます。

### マイグレーションに関する注意

`quotes` / `quote_items` / `quote_versions` は新規テーブルですが、既存の `files` テーブルには
`quote_id` 列を追加しています。**まだこの機能のマイグレーションを実行していないD1に対しては**、
`npm run d1:migrate:local` / `npm run d1:migrate:remote` の前に次のコマンドを1回だけ実行してください
(このリポジトリのD1に対しては既に適用済みです)。

```bash
npx wrangler d1 execute gyomu_system_lp_db --local  --command="ALTER TABLE files ADD COLUMN quote_id INTEGER;"
npx wrangler d1 execute gyomu_system_lp_db --remote --command="ALTER TABLE files ADD COLUMN quote_id INTEGER;"
```

## Cloudflare R2の作成手順

1. Cloudflareアカウントで **R2 Object Storage** を有効化する(初回のみ。ダッシュボードの
   「R2 Object Storage」から有効化できます。無料枠内でも支払い情報の登録を求められる場合があります)
2. 以下を実行してバケットを作成する

   ```bash
   npm run r2:create
   ```

3. `wrangler.toml` には次の設定が既に含まれています(バケット名を変えた場合はここも変更する)

   ```toml
   [[r2_buckets]]
   binding = "FILES_BUCKET"
   bucket_name = "gyomu-system-lp-files"
   ```

4. Cloudflare Pagesの管理画面で、Pagesプロジェクトの **Settings → Functions → R2 bucket bindings** から
   - Variable name: `FILES_BUCKET`
   - R2 bucket: 手順2で作成したバケット
   を設定し、設定を反映させるために**新しいデプロイを作成する**(D1やSESSION_SECRETと同様、設定変更は既存デプロイには反映されません)

## ローカルでの確認方法

公開サイトはすべて Cloudflare Pages Functions が動的にHTMLを生成する構成のため
(静的HTMLをブラウザで直接開いても表示されません)、`wrangler pages dev` を使って
ローカルで動かして確認してください。

```bash
npm install

# 1. Tailwind CSSをビルド(デザインを変更した場合のみ)
npm run build

# 2. ローカルD1にテーブルを作成(contacts, users, login_attempts)
npm run d1:migrate:local

# 3. ローカル用のセッション署名キーを設定
cp .dev.vars.example .dev.vars
# .dev.vars を開いて SESSION_SECRET を好きなランダム文字列に変更しておく

# 4. ローカルD1に管理者ユーザーを作成
npm run create-user -- admin@example.com "TestPassword123" admin --local

# 5. ローカルサーバーを起動(Functions + D1込みで動作確認できる)
npm run pages:dev
```

ブラウザで `http://localhost:8788/` を開けばトップページを、
`http://localhost:8788/admin` を開けば管理画面(未ログインならログインページ)を確認できます。

## Cloudflare D1の作成手順

1. Cloudflareアカウントにログインした状態で以下を実行し、D1データベースを作成する

   ```bash
   npm run d1:create
   ```

2. コマンドの出力に表示される `database_id` をコピーし、`wrangler.toml` の
   `REPLACE_WITH_YOUR_DATABASE_ID` の部分を置き換える

   ```toml
   [[d1_databases]]
   binding = "DB"
   database_name = "gyomu_system_lp_db"
   database_id = "ここに実際のIDを貼り付ける"
   ```

3. 本番(リモート)のD1にテーブルを作成する

   ```bash
   npm run d1:migrate:remote
   ```

## wranglerの設定

`wrangler.toml` にてPages出力ディレクトリとD1バインディングを定義しています。

```toml
name = "gyomu-system-lp"
pages_build_output_dir = "public"
compatibility_date = "2024-09-23"

[[d1_databases]]
binding = "DB"
database_name = "gyomu_system_lp_db"
database_id = "REPLACE_WITH_YOUR_DATABASE_ID"
```

`binding = "DB"` の名前は `functions/` 配下のコードで `env.DB` として参照しているため、
変更する場合はコード側の `env.DB` も合わせて変更してください。

## GitHubへのpush手順

```bash
git init
git add .
git commit -m "Initial commit: 業務システム紹介LP"
git branch -M main
git remote add origin <あなたのGitHubリポジトリURL>
git push -u origin main
```

## Cloudflare Pagesへの公開手順

1. Cloudflare ダッシュボード → Workers & Pages → 「アプリケーションを作成」→「Pages」→「Gitに接続」
2. 上記でpushしたGitHubリポジトリを選択
3. ビルド設定は以下を指定
   - フレームワークプリセット: `None`
   - ビルドコマンド: `npm run build`
   - ビルド出力ディレクトリ: `public`
4. 「保存してデプロイ」を実行(初回はまだAPIが動かない状態でOK)
5. デプロイ後、Pagesプロジェクトの **Settings → Functions → D1 database bindings** で
   - Variable name: `DB`
   - D1 database: 手順「Cloudflare D1の作成手順」で作成したデータベース
   を設定する
6. 同じく **Settings → Functions → R2 bucket bindings** で
   - Variable name: `FILES_BUCKET`
   - R2 bucket: 手順「Cloudflare R2の作成手順」で作成したバケット
   を設定する
7. Pagesプロジェクトの **Settings → Environment variables** で
   - `SESSION_SECRET` にランダムな長い文字列をSecretとして設定する(後述)
8. 設定変更を反映するため、Pagesの「再デプロイ」を実行する(**設定を変えただけでは既存のデプロイには反映されません**。必ず新しいデプロイを作成してください)
9. `npm run create-user -- <email> <password> admin` でリモートD1に最初の管理者を作成する

## セッション署名キー(SESSION_SECRET)の設定(本番)

ログインセッションのCookieを署名するための秘密鍵です。パスワードそのものではないので、
第三者に推測されない十分に長いランダム文字列を設定してください。

Cloudflareダッシュボードの Pages プロジェクト設定から、環境変数 `SESSION_SECRET` を
**Secret(暗号化)** として設定してください(Production / Preview 両方に設定することを推奨)。
CLIから設定する場合は以下でも可能です。

```bash
npx wrangler pages secret put SESSION_SECRET --project-name=my-service
```

> 以前のバージョンで使用していた `ADMIN_PASSWORD` は不要になりました。
> Cloudflareダッシュボードに残っている場合は削除して構いません。

## セキュリティに関する注意

- パスワードは **bcrypt** でハッシュ化してD1に保存しており、平文では保持していません。
- ログインに成功すると、HMAC署名付きの有効期限8時間のセッションCookie(HttpOnly / Secure / SameSite=Lax)を発行します。
- 「ログアウト」はブラウザ側のCookieを削除しますが、発行済みのトークン自体をサーバー側で強制失効させる仕組みではありません(ステートレス設計のため)。トークンが第三者に漏れない限り実運用上の問題はありませんが、より厳格な失効管理が必要な場合はD1にセッションテーブルを追加するなどの拡張が必要です。
- ログイン失敗はIPごとに記録しており、15分間に8回失敗すると一時的にブロックされます(ブルートフォース対策)。
- `SESSION_SECRET` は推測されにくい値を設定し、Gitにはコミットしないでください(`.dev.vars` は `.gitignore` 済みです)。

## 商品・ブログ・導入事例の追加方法

いずれも管理画面ではなく、`functions/_lib/data/` 配下のファイルを直接編集します。

- **商品を追加する**: `products.js` の配列に1件追加する(`status: "coming-soon"` で先に
  枠だけ用意し、内容が整ったら `"live"` に変更して `features` / `faqs` 等を追加する運用も可能)。
  追加すると `/products` 一覧・ヘッダーの商品一覧ドロップダウン・フッターに自動的に反映されます。
- **ブログ記事を追加する**: `blog-posts.js` の配列に1件追加する。`bodyHtml` には見出しに
  `<h2>` / `<h3>`、本文に `<p>` / `<ul>` を使う(スタイルは `src/input.css` の `.article-body` で定義)。
- **導入事例を追加する**: `case-studies.js` の配列に1件追加する。実際の顧客の声ではなく
  想定シーンを掲載する場合は `isHypothetical: true` を付け、本文にもその旨を明記すること
  (誇大広告にあたらないよう、実績と想定シーンは明確に区別する)。

画像を追加する場合は `public/images/products/<商品スラッグ>/` に配置し、
`products.js` の `screenshots` / `heroImage` から相対パスで参照してください。

## OGP画像について(未対応)

`public/images/og/ogp.png` はまだ配置していません。サイト全体のデザインが固まった段階で
1200×630pxのブランド画像を作成し、このパスに配置してください
(`functions/_lib/layout.js` は `${SITE_URL}/images/og/ogp.png` を参照しているため、
ファイルさえ配置すれば自動的に反映されます)。

## 公開前に必ず変更する項目

- `functions/_lib/site.js` の `SITE_URL`(現在 `https://example.com` のプレースホルダー)を
  独自ドメイン確定後に実際の値へ変更する(canonical・OGP・構造化データすべてに反映される)
- `robots.txt` / `sitemap.xml` 内のドメインも同様に置き換え
- OGP画像(`public/images/og/ogp.png`)の追加(上記参照)
- `wrangler.toml` の `database_id`
- Cloudflare Pages側のD1バインディング・R2バケットバインディング・`SESSION_SECRET` の設定
- `npm run create-user` で本番用の管理者アカウントを作成
- 「準備中」商品(顧客管理・在庫管理・予約管理システム)が実際に販売可能になったら、
  `products.js` の該当エントリを `status: "live"` に変更し、`features` / `faqs` 等の
  実コンテンツを追加したうえで `sitemap.xml` にもURLを追加する
