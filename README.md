# とけいマスター

小学1年生がアナログ時計の読み方を学ぶための、ブラウザ完結型の学習 Web アプリです。

- 公開URL: <https://hurumeki.github.io/tokei-master/>
- 仕様書: [docs/SPEC.md](docs/SPEC.md)

## できること

- アナログ時計の長針・短針をドラッグして好きな時刻に合わせる（1分単位スナップ）。
- 「何時何分」を **ふりがな付き** で大きく表示。`いっぷん／じっぷん／よじ` などの音便も網羅。
- 日本語・英語の両方で読み上げ（Web Speech API）。
- 「いまのじかん」ボタンで端末の現在時刻に合わせる。
- 大人が時刻＋テキストを **スケジュール** として保存。タイル表示・並び替え・削除に対応。
- PWA としてホーム画面にインストール可能。オフラインでも動作。

## 動作環境

- Android Chrome / iOS Safari（タブレット横持ち基準でレスポンシブ）。
- フロントエンドのみで完結。データはブラウザの `localStorage` に保存します。

## 開発

```sh
npm install
npm run dev      # http://localhost:5173
npm run build    # dist/ を出力
npm run preview  # ビルド後の動作確認
```

PWA アイコンを更新したい場合は `public/icons/icon.svg` を編集して以下を実行:

```sh
node scripts/build-icons.mjs
```

## デプロイ

`main` ブランチへ push すると、GitHub Actions が `dist/` をビルドし GitHub Pages に公開します（`.github/workflows/deploy.yml`）。

初回のみリポジトリ Settings → Pages → **Source** を `GitHub Actions` に設定してください。

## ライセンス

MIT
