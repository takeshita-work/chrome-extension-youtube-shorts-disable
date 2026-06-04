# YouTube Shorts Disabler

YouTube のショート動画を無効化する Chrome 拡張機能（Manifest V3）。

## 機能

- **Shorts を非表示**: ホーム / 検索結果 / 登録チャンネル / サイドバー / チャンネルページの Shorts タブなどを CSS で非表示
- **URL リダイレクト**: `youtube.com/shorts/...` へのアクセスを YouTube トップ（`youtube.com/`）へ自動転送
- **状態でアイコンが変化**: アイコンは Shorts ロゴ＋禁止線。有効＝カラー（赤）、無効＝グレースケール
- **ポップアップで切替**: 「無効化」「リダイレクト」を個別に ON/OFF（設定は `chrome.storage.sync` に保存され端末間で同期）
- SPA 遷移（ページ内のページ移動）にも追従

## インストール（開発者モード）

1. Chrome で `chrome://extensions` を開く
2. 右上の **デベロッパーモード** を ON
3. **パッケージ化されていない拡張機能を読み込む** をクリック
4. このリポジトリの `src` フォルダを選択

設定変更後は、開いている YouTube タブを再読み込みしてください。

## ディレクトリ構成

```
youtube-shorts-disable/
├─ README.md
├─ tools/                ← アイコン素材と生成スクリプト
│  ├─ icon.svg           ← アイコンのマスター（カラー＝有効）
│  └─ render-icons.ps1   ← SVG を PNG へ書き出す
└─ src/                 ← 拡張機能のルート（ここを読み込む）
   ├─ manifest.json     ← Manifest V3 定義
   ├─ background.js     ← 状態に応じてツールバーアイコンを切替
   ├─ content.js        ← 非表示クラス付与 / リダイレクト / SPA 追従
   ├─ styles.css        ← Shorts 関連UIを隠すCSS
   ├─ popup.html        ← 設定ポップアップ
   ├─ popup.js          ← 設定の読み書き
   └─ icons/            ← アイコン（icon* = 有効/カラー, icon_off* = 無効/グレー, 16/48/128px）
```

### アイコンの再生成

`tools/icon.svg` がマスター（カラー＝有効）です。これを編集して次を実行すると、
カラー版（`icon*.png`）と脱色したグレー版（`icon_off*.png`）が `src/icons/` に書き出されます。

```powershell
tools\render-icons.ps1            # 16/48/128px を生成
tools\render-icons.ps1 -Preview   # 256px のプレビューも tools/ に出力
```

レンダリングはヘッドレス Chrome（SVG 描画）＋ ImageMagick（トリム・脱色・中央寄せ）で行います。

## 仕組み

- `content.js` を `document_start` で実行し、`<html>` に `ysd-hide-shorts` クラスを付与。`styles.css` はこのクラスが付いているときだけ Shorts 要素を `display: none` にする（誤検知時に外しやすい・ちらつきが少ない）。
- Shorts の DOM は `:has()` セレクタでリンク先が `/shorts/` の要素や Shorts 専用レンダラー（`ytd-reel-shelf-renderer` など）を対象に非表示化。
- リダイレクトは `location.pathname` が `/shorts/...` の場合に `location.replace` で YouTube トップへ転送。

## 注意

- YouTube の DOM 構造（要素タグ名・属性）は予告なく変わるため、効かなくなった場合は `styles.css` のセレクタ調整が必要です。
- `:has()` セレクタを利用するため、比較的新しい Chrome（105 以降）が必要です。
