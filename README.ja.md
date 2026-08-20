# Random Picker

[![GitHub Pages](https://github.com/ttomohisa/htmlapps-random-picker/actions/workflows/deploy-pages.yml/badge.svg)](https://github.com/ttomohisa/htmlapps-random-picker/actions/workflows/deploy-pages.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![Single HTML](https://img.shields.io/badge/distribution-single%20HTML-0ea5e9)](https://ttomohisa.github.io/htmlapps-random-picker/)

[English README](README.md)

1行1候補のリストから、抽選・順番決め・チーム分け・ルーレットをすぐ使える軽量な単一HTMLアプリです。

## 🚀 デモ

### [GitHub PagesでRandom Pickerを開く](https://ttomohisa.github.io/htmlapps-random-picker/)

インストールやアカウント登録は不要です。候補を入力または貼り付けて、モードを選ぶだけですぐ使えます。

入力した候補、保存リスト、設定、ランダム処理はブラウザー内で扱われます。このアプリから入力した候補をサーバーへ送信する処理はありません。

## 特徴

- 1件または複数件をランダム抽選
- 選んだ候補を次回以降の抽選から除外
- 全員を選び終えたら「全員戻してもう一度」ですぐ次の抽選へ
- 候補全体をランダムな順番に並び替え
- 順番を大きな表示で1人ずつ発表
- 以下のどちらからでも人数差が最大1人になるチーム分け
  - チーム数
  - 1チームの人数
- 回転演出付きルーレット
- ルーレットを回している途中から大きく表示可能
- 抽選・順番・チーム・ルーレットそれぞれに適した大きな結果表示
- モードごとに読みやすい形式で結果をコピー
- 対応ブラウザーでは共有シートから結果を共有
- 抽選履歴
- 候補リストを名前付きで複数保存
- 現在の候補と設定を次回アクセス時に自動復元
- Excel / スプレッドシートの複数列貼り付けを検出して候補列を選択
- 同じ文字列の候補も、明示的に重複削除しない限り別候補として保持
- 空行削除・前後空白整理・重複削除とUndo
- 日本語 / English 切替
- SVG favicon内包
- 第三者ランタイム依存なし
- HTML読み込み後の実行時通信なし

抽選にはブラウザー標準の `crypto.getRandomValues()` を使用し、modulo biasを避けるためrejection samplingを行っています。

## クイックスタート

### Webデモを使う

[デモを開く](https://ttomohisa.github.io/htmlapps-random-picker/)だけで使えます。インストールやアカウント登録は不要です。

### 単一HTMLを使う

1. このリポジトリまたはGitHub Actionsのビルド成果物から `dist/index.html` をダウンロードします。
2. 現在のChromium系ブラウザー、Firefox、Safariで開きます。
3. そのまま候補を入力して使えます。ローカルWebサーバーは不要です。

### 自分でビルドする

1. Windowsでこのリポジトリをダウンロードまたはcloneします。
2. `build-standalone.bat` をダブルクリックします。
3. 生成物は `dist/` に出力されます。
4. ビルド成功後、`dist/index.html` が自動で開きます。

Python、Node.js、npm、ローカルWebサーバーは不要です。ビルドにはWindows PowerShellを使用します。

## 使い方

1. 候補を1行に1つずつ入力または貼り付けます。
2. `抽選` / `順番` / `チーム` / `ルーレット` を選びます。
3. 選んだモード専用の設定だけを必要に応じて調整します。
4. 実行ボタンを押します。
5. 結果をコピー・共有・大きく表示したり、そのまま次の操作へ進みます。

### 抽選

当選者選び、くじ引き、担当決め、候補から1つ選びたいときなどに使います。

- 1回に選ぶ人数を指定できます。
- 「選んだ候補を除外」を有効にすると、そのラウンドでは同じ候補が再び選ばれません。
- 全員を選び終えると **全員戻してもう一度** から、全候補を戻してそのまま次の抽選を開始できます。

### 順番

候補全体の順番をランダムに決めます。

- 全員の順番を一覧で確認する
- 大きな表示で1人ずつ発表する

の2通りで使えます。1人ずつ発表すれば、後の順番を先に見せずに進行できます。

### チーム

人数差が最大1人になるように候補を分けます。

以下のどちらからでも指定できます。

- `3チームに分ける` のようにチーム数を指定
- `4人ずつ` のように1チームの人数を指定

実行前に、何チーム・何人程度になるかの見込みも表示します。

### ルーレット

抽選結果だけでなく、選ばれる過程も見せたいときに使います。

- ルーレット本体または実行ボタンから回転できます。
- 回転前に大きく表示して、その大きさのまま演出を見せられます。
- 停止後は結果をそのまま大きく確認できます。

ルーレットは最大200候補です。それより多い場合は通常の抽選を使ってください。

### 保存リスト

よく使う候補を名前付きで保存できます。

例えば、クラス名簿、チームメンバー、昼食候補、発表メンバーなどを保存しておけば、次回すぐに読み込めます。

保存先は現在のブラウザー / 端末内で、最大30件まで保存できます。

### Excel / スプレッドシートから貼り付け

タブ区切りの複数列データを貼り付けると表データとして検出し、どの列を候補として使うか選べます。

必要な場合は、元のデータをそのまま貼り付けることもできます。

## GitHub Pagesで公開

このリポジトリには、単一HTMLをビルド・検証して `dist/` をGitHub Pagesへ公開するWorkflowが含まれています。

1. リポジトリ名を `htmlapps-random-picker` としてGitHubへpushします。
2. **Settings → Pages → Build and deployment → Source** で **GitHub Actions** を選択します。
3. `main` へpushするか、Actionsから **Deploy standalone app to GitHub Pages** を手動実行します。
4. デプロイ成功後、`https://ttomohisa.github.io/htmlapps-random-picker/` で利用できます。

`main` へのpush時には、デプロイ前に単一HTMLの再ビルドと検証が行われます。`main` 向けPull Requestでも、関連するソースやビルド設定を変更すると単一HTMLの検証が走ります。

## 開発・ビルド構成

```text
.
├─ src/
│  └─ index.template.html          # アプリ本体のテンプレート
├─ dist/
│  ├─ index.html                   # 読みやすい単一HTML版
│  └─ index.self-extract.html      # gzip自己展開版
├─ scripts/
│  ├─ check-repository.ps1         # リポジトリ / ビルド検証
│  ├─ verify-standalone.ps1        # 単一HTML検証
│  ├─ build-self-extract.ps1       # 自己展開版ビルド
│  └─ verify-self-extract.ps1      # 自己展開版検証
├─ app.config.json                 # アプリ情報・ビルド設定
├─ dependencies.json               # ランタイム依存定義
├─ build-standalone.bat            # Windows用ビルド入口
├─ build-standalone.ps1            # 単一HTMLビルダー
└─ .github/workflows/
   ├─ build-standalone.yml         # Pull Request時のビルド検証
   └─ deploy-pages.yml             # GitHub Pages公開
```

生成された `dist/` のHTMLは直接編集せず、`src/index.template.html` を変更して再ビルドしてください。

### リポジトリを検証する

以下を実行します。

```powershell
powershell.exe -NoLogo -NoProfile -ExecutionPolicy Bypass -File .\scripts\check-repository.ps1
```

アプリのビルド、単一HTMLの確認、自己展開版の検証、生成サイズの確認などがまとめて行われます。

## プライバシーと端末保存

候補データはブラウザー内で処理されます。

使いやすさのため、ブラウザーのストレージには主に以下を保存します。

- 現在の候補リスト
- 選択中のモードと設定
- 抽選モードの除外状態
- 最近の抽選履歴
- 名前付き保存リスト

アカウント登録は不要です。ブラウザーやサイトのデータを削除すると、保存リストや設定も削除される場合があります。

GitHub Pages版では最初にHTMLを取得するための通信が必要ですが、読み込み後の実行にCDN、外部ライブラリ、API接続は必要ありません。

## 制限

- 候補は最大10,000件です。
- ルーレットは最大200候補です。
- 同じ文字列の候補は、明示的に重複削除しない限り別々の候補として扱います。
- 名前付きリストは現在のブラウザー / 端末内だけに保存され、別端末へ同期されません。
- ブラウザーのストレージを削除すると、保存リスト、設定、履歴、現在の候補が消える場合があります。
- 共有機能はWeb Share API対応状況に依存します。未対応環境でもコピーは利用できます。
- v1.0.0では重み付き抽選、クラウドアカウント、CSVファイル読込、Google Sheets連携には対応していません。

## 依存ライブラリ

Random Picker v1.0.0は第三者ランタイム依存を使用していません。アプリ本体、ルーレット描画、UI、端末保存、ランダム処理はブラウザー標準APIで実装しています。

依存関係と通知については [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md) を参照してください。

## Contributing

バグ報告や機能提案はGitHub Issuesから歓迎します。開発時のルールは [CONTRIBUTING.md](CONTRIBUTING.md) を参照してください。

## ライセンス

Copyright © 2026 ttomohisa

[MIT License](LICENSE) で公開しています。
