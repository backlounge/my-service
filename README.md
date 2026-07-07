# 業務システム紹介LP

中小企業・個人事業主向け業務システムの紹介用ランディングページ(トップページのみ)です。
Tailwind CSSの静的サイト + Cloudflare Pages Functions + Cloudflare D1 + Cloudflare R2 による
自前のお問い合わせフォーム・簡易管理画面(問い合わせ管理・サイト編集・ファイル管理)を備えています。

## 構成

```
public/                      ← 公開されるファイル一式(Cloudflare Pagesの公開フォルダ)
  index.html                 ← トップページ本体(お問い合わせフォーム・data-cms属性あり)
  admin/
    dashboard.html              ← 管理画面ダッシュボード(件数サマリー・推移グラフ・システム情報)
    index.html                 ← 問い合わせ管理画面(ログイン必須)
    login.html                 ← 管理画面ログインページ
    settings.html               ← サイト編集画面(トップページの内容を編集。管理者のみ)
    files.html                   ← ファイル管理画面(アップロード・検索・削除・URLコピー)
  404.html
  robots.txt
  sitemap.xml
  build-info.json            ← ビルド時に自動生成(Git Commit・ブランチ・ビルド日時。手動編集不要)
  css/style.css              ← Tailwindのビルド済みCSS(コミット済みなのでビルド不要でもそのまま動作)
  js/main.js                 ← モバイルメニュー・お問い合わせフォーム送信処理
  js/admin-common.js         ← 管理画面共通処理(ログインユーザー表示・ログアウト・ナビ制御)
  js/admin-dashboard.js      ← ダッシュボードの集計表示・推移グラフ描画
  js/admin.js                ← 問い合わせ一覧の表示・ステータス変更
  js/admin-login.js          ← 管理画面ログインフォームの送信処理
  js/admin-settings.js       ← サイト編集フォームの読み込み・保存処理
  js/admin-files.js          ← ファイル管理(一覧・検索・D&Dアップロード・削除・URLコピー)
  images/screenshots/        ← スクリーンショット画像を後から追加する場所
  images/og/                 ← SNSシェア用OGP画像を追加する場所

functions/                   ← Cloudflare Pages Functions(サーバーサイドAPI)
  index.js                    ← GET / (トップページ)。静的HTMLにsite_settingsの内容を注入して返す
  admin/
    _middleware.js             ← 静的ページ /admin/* の保護(未ログインは/admin/loginへ302)
  files/
    [key].js                   ← GET /files/:key (R2からファイルを配信。認証不要の公開URL)
  api/
    contact.js                ← POST /api/contact (お問い合わせ受付・D1保存)
    auth/
      login.js                  ← POST /api/auth/login (メール+パスワードでログイン)
      logout.js                 ← POST /api/auth/logout
      me.js                     ← GET /api/auth/me (現在ログイン中のユーザー情報)
    admin/
      _middleware.js            ← /api/admin/* の認証チェック(ログイン必須)
      contacts.js                ← GET /api/admin/contacts (一覧取得。ログイン済みなら誰でも可)
      contacts/[id].js            ← PATCH /api/admin/contacts/:id (ステータス更新。管理者roleのみ)
      settings.js                ← GET/PUT /api/admin/settings (サイト編集内容の取得・保存。管理者roleのみ)
      stats.js                   ← GET /api/admin/stats (ダッシュボード集計。ログイン済みなら誰でも可)
      files.js                   ← GET(一覧・検索。ログイン済みなら誰でも可) / POST(アップロード。管理者roleのみ) /api/admin/files
      files/[id].js               ← DELETE /api/admin/files/:id (ファイル削除。管理者roleのみ)
  _lib/
    auth.js                    ← 署名付きセッションCookieの発行・検証(SESSION_SECRET)
    password.js                 ← bcryptjsによるパスワードのハッシュ化・照合
    response.js                 ← JSONレスポンス生成ヘルパー
    cms-keys.js                 ← サイト編集で扱う項目一覧の定義(キー・ラベル・入力タイプ・文字数上限)

scripts/
  create-user.mjs             ← 管理者・一般ユーザーをD1に作成するCLIスクリプト
  generate-build-info.mjs     ← ビルド時にpublic/build-info.jsonを生成(npm run buildから自動実行)

schema.sql                  ← D1のテーブル定義(contacts, users, login_attempts, site_settings, files)
wrangler.toml                ← Cloudflare Pages / D1 / R2 / デプロイ設定
.dev.vars.example            ← ローカル開発用の環境変数サンプル(SESSION_SECRET)
src/input.css                ← Tailwindのソース(カスタマイズ時はここを編集してビルド)
tailwind.config.js
postcss.config.js
package.json
```

## お問い合わせフォームの仕組み

- フロント(`public/index.html`)のフォームは `/api/contact` へPOSTします(Web3Forms等の外部サービスは使用しません)。
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

コードを触らずに、管理画面(`/admin/settings`、ヘッダーの「サイト編集」リンク)から
トップページの一部の文言を編集できます。**管理者(admin role)のみ**編集可能です。

### 編集できる項目

- サイト名
- ヒーロータイトル / ヒーロー説明文 / CTAボタン文言(ヒーローの主要ボタンのみ)
- 料金プラン1〜3 それぞれの「プラン名」「料金」「料金説明」
- レビュー1〜3 のレビュー文
- ブログ1〜3 の「タイトル」「概要」

対象項目の一覧は `functions/_lib/cms-keys.js` の `CMS_FIELDS` で定義されています。
項目を追加・変更したい場合は、このファイルと `public/index.html` の該当箇所に付けた
`data-cms="..."` 属性をあわせて編集してください。

### 仕組み

- 保存内容は D1 の `site_settings` テーブルに `key` / `value` の形で保存されます
  (`key` は `hero-title` のように `data-cms` 属性の値と一致させています)。
- トップページ(`/`)へのアクセスは `functions/index.js` が処理します。
  静的な `public/index.html` を取得したうえで、`site_settings` に値がある項目だけを
  `HTMLRewriter` で該当の `data-cms` 要素に上書きします。
- **D1に値がない項目は何も上書きされないため、`public/index.html` に書かれている
  現在の内容がそのまま初期値として表示されます**(要件6はこの仕組みで満たしています)。
- 料金の「¥4,980」のような数値部分だけを `<span data-cms="plan2-price">` で囲んでいるため、
  「/ 月」などの単位表記は編集対象にせずそのまま残ります。
- ヒーロータイトルは元のHTMLでは改行(`<br>`)が入っていますが、編集して保存すると
  1行のプレーンテキストに置き換わります(改行を含めた入力はできません)。

### 使い方

1. 管理者アカウントで `/admin` にログインする
2. ヘッダーの「サイト編集」をクリックする(このリンクは管理者にのみ表示されます)
3. 変更したい項目に入力し、「保存する」を押す
4. トップページを開き直すと反映されています(未入力のまま保存した項目は変更されません)

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

`public/index.html` はビルド済みCSSを含んでいるため、そのままブラウザで開いても見た目は確認できます。
ただし **お問い合わせフォームや管理画面はCloudflareの実行環境(Functions + D1)が必要**なため、
`wrangler pages dev` を使ってローカルで動かして確認してください。

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

## スクリーンショットの追加方法

`public/images/screenshots/` に画像を追加し、`public/index.html` 内の
`screenshot-placeholder` の div(2箇所)を `<img>` タグに置き換えてください。
詳細は `public/images/screenshots/README.txt` を参照してください。

## OGP画像の追加方法

`public/images/og/` に `ogp.png`(推奨1200×630px)を追加し、
`index.html` の `<head>` 内にある `og:image` / `twitter:image` のURLを更新してください。

## ブログ一覧ページについて

現時点ではトップページ内にブログ記事のプレビュー(3件)のみを掲載しています。
将来的に記事が増えた際は `/blog` 一覧ページを別途作成し、
トップページの「ブログ一覧を見る」ボタンのリンク先を `/blog` に変更してください。

## 公開前に必ず変更する項目

- `index.html` 内の `https://example.com/` (canonical, OGP等) を実際の独自ドメインに置き換え
- `robots.txt` / `sitemap.xml` 内のドメインも同様に置き換え
- `wrangler.toml` の `database_id`
- Cloudflare Pages側のD1バインディング・R2バケットバインディング・`SESSION_SECRET` の設定
- `npm run create-user` で本番用の管理者アカウントを作成
- 料金・レビュー・ブログ記事などのダミー文言を実際の内容に置き換え(直接HTMLを編集するか、`/admin/settings` のサイト編集機能から変更)
