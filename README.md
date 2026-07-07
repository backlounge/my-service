# 業務システム紹介LP

中小企業・個人事業主向け業務システムの紹介用ランディングページ(トップページのみ)です。
Tailwind CSSの静的サイト + Cloudflare Pages Functions + Cloudflare D1 による
自前のお問い合わせフォーム・簡易管理画面を備えています。

## 構成

```
public/                      ← 公開されるファイル一式(Cloudflare Pagesの公開フォルダ)
  index.html                 ← トップページ本体(お問い合わせフォームあり)
  admin.html                 ← 問い合わせ管理画面(要パスワードログイン)
  404.html
  robots.txt
  sitemap.xml
  css/style.css              ← Tailwindのビルド済みCSS(コミット済みなのでビルド不要でもそのまま動作)
  js/main.js                 ← モバイルメニュー・お問い合わせフォーム送信処理
  js/admin.js                ← 管理画面のログイン・一覧表示・ステータス変更処理
  images/screenshots/        ← スクリーンショット画像を後から追加する場所
  images/og/                 ← SNSシェア用OGP画像を追加する場所

functions/                   ← Cloudflare Pages Functions(サーバーサイドAPI)
  api/
    contact.js                ← POST /api/contact (お問い合わせ受付・D1保存)
    admin/
      _middleware.js           ← /api/admin/* の認証チェック(login/logout以外)
      login.js                 ← POST /api/admin/login
      logout.js                ← POST /api/admin/logout
      contacts.js               ← GET /api/admin/contacts (一覧取得)
      contacts/[id].js           ← PATCH /api/admin/contacts/:id (ステータス更新)
  _lib/
    auth.js                    ← 署名付きセッションCookieの発行・検証
    response.js                ← JSONレスポンス生成ヘルパー

schema.sql                  ← D1のテーブル定義(contacts)
wrangler.toml                ← Cloudflare Pages / D1 / デプロイ設定
.dev.vars.example            ← ローカル開発用の環境変数サンプル(ADMIN_PASSWORD)
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

## 管理画面(/admin)の使い方

`https://あなたのドメイン/admin` にアクセスするとパスワード入力画面が表示されます。

- 正しいパスワードでログインすると、問い合わせ一覧(新しい順)が表示されます
- 上部のタブで `new` / `doing` / `done` による絞り込みができます
- 各カードのプルダウンでステータスを変更すると、その場でD1に保存されます
- 「ログアウト」でセッションCookieを破棄します

管理画面のパスワードは環境変数 `ADMIN_PASSWORD` で設定します(後述)。

## ローカルでの確認方法

`public/index.html` はビルド済みCSSを含んでいるため、そのままブラウザで開いても見た目は確認できます。
ただし **お問い合わせフォームや管理画面はCloudflareの実行環境(Functions + D1)が必要**なため、
`wrangler pages dev` を使ってローカルで動かして確認してください。

```bash
npm install

# 1. Tailwind CSSをビルド(デザインを変更した場合のみ)
npm run build

# 2. ローカルD1にテーブルを作成
npm run d1:migrate:local

# 3. ローカル用の管理画面パスワードを設定
cp .dev.vars.example .dev.vars
# .dev.vars を開いて ADMIN_PASSWORD を好きな値に変更しておく

# 4. ローカルサーバーを起動(Functions + D1込みで動作確認できる)
npm run pages:dev
```

ブラウザで `http://localhost:8788/` を開けばトップページを、
`http://localhost:8788/admin` を開けば管理画面を確認できます。

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
6. Pagesプロジェクトの **Settings → Environment variables** で
   - `ADMIN_PASSWORD` に管理画面用のパスワードをSecretとして設定する
7. 設定変更を反映するため、Pagesの「再デプロイ」を実行する

## 管理画面パスワードの設定(本番)

Cloudflareダッシュボードの Pages プロジェクト設定から、環境変数 `ADMIN_PASSWORD` を
**Secret(暗号化)** として設定してください(Production / Preview 両方に設定することを推奨)。
CLIから設定する場合は以下でも可能です。

```bash
npx wrangler pages secret put ADMIN_PASSWORD --project-name=gyomu-system-lp
```

## セキュリティに関する注意

- 管理画面のログインは、パスワード一致時にHMAC署名付きの有効期限8時間のCookie(HttpOnly / Secure / SameSite=Lax)を発行するシンプルな方式です。
- 「ログアウト」はブラウザ側のCookieを削除しますが、発行済みのトークン自体をサーバー側で強制失効させる仕組みではありません(ステートレス設計のため)。トークンが第三者に漏れない限り実運用上の問題はありませんが、より厳格な失効管理が必要な場合はD1にセッションテーブルを追加するなどの拡張が必要です。
- `ADMIN_PASSWORD` は推測されにくい値を設定し、共有時も安全な方法で伝えてください。

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
- Cloudflare Pages側のD1バインディングと `ADMIN_PASSWORD` の設定
- 料金・レビュー・ブログ記事などのダミー文言を実際の内容に置き換え
