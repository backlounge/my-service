このフォルダにスクリーンショット画像を追加してください。

推奨サイズ: 横1280px以上、16:9(横長)
対応形式: png, jpg, webp

画像を追加したら、public/index.html 内の以下2箇所にある
"screenshot-placeholder" の div を <img> タグに置き換えてください。

1. ヒーローセクション(id="top" 直下)
2. 画面イメージセクション(id="screenshots")

置き換え例:
<img src="/images/screenshots/dashboard.png" alt="ダッシュボード画面" class="w-full rounded-xl shadow-sm" />
