# 業務システム紹介LP

中小企業・個人事業主向け業務システムの紹介用ランディングページ(トップページのみ)です。
Tailwind CSSを使用した静的サイトで、Cloudflare Pagesへそのまま公開できる構成になっています。

## 構成

```
public/                 ← 公開されるファイル一式(Cloudflare Pagesの公開フォルダ)
  index.html            ← トップページ本体
  404.html               ← 404ページ
  robots.txt
  sitemap.xml
  css/style.css          ← Tailwindのビルド済みCSS(コミット済みなのでビルド不要でもそのまま動作)
  js/main.js             ← モバイルメニュー・お問い合わせフォーム送信処理
  images/screenshots/    ← スクリーンショット画像を後から追加する場所
  images/og/             ← SNSシェア用OGP画像を追加する場所
src/input.css            ← Tailwindのソース(カスタマイズ時はここを編集してビルド)
tailwind.config.js
postcss.config.js
package.json
```

## ローカルでの確認方法

`public/index.html` はビルド済みCSSを含んでいるため、そのままブラウザで開いても表示を確認できます。

デザインを変更する場合は以下の手順でビルドしてください(要 Node.js)。

```bash
npm install
npm run dev    # 保存するたびに自動でCSSを再生成(開発時)
npm run build  # 本番用に圧縮したCSSを生成
```

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
4. 「保存してデプロイ」を実行

※ `public/css/style.css` は既にビルド済みの状態でリポジトリに含めているため、
ビルドコマンドを設定しなくても表示自体は可能です。デザイン変更時に反映が必要なため、
上記の設定を推奨します。

## お問い合わせフォームの設定(必須)

お問い合わせフォームには [Web3Forms](https://web3forms.com/)(無料・サーバー不要)を使用しています。

1. https://web3forms.com にアクセスし、メールアドレスを登録してアクセスキーを取得
2. `public/index.html` 内の以下の行を、取得したキーに置き換える

```html
<input type="hidden" name="access_key" value="YOUR_ACCESS_KEY_HERE" />
```

これだけで、フォーム送信内容が登録したメールアドレスに届くようになります。

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
- お問い合わせフォームの `access_key`
- 料金・レビュー・ブログ記事などのダミー文言を実際の内容に置き換え
