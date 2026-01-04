# SmartToDo

AI搭載型チーム生産性統合プラットフォーム

## 概要

SmartToDoは、既存ツール（Jira, Salesforce, Notion等）からタスクデータを吸い上げ、AIによる「標準化」「分析」「予測」を行い、統合ダッシュボードで可視化・フィードバックを行うSaaSプラットフォームです。

## 機能

### ダッシュボード（v1.0）

- **サマリーKPI**: Completion Rate、AI Estim. Gap、Stalled Tasksを表示
- **Workload Heatmap**: 曜日×時間帯×カテゴリーでの稼働状況を可視化
- **Daily Trend**: 日ごとの予定工数と実績工数を比較
- **AI Weekly Insight**: AIによる具体的な改善提案
- **Focus Task List**: 注意すべきタスクをAIが自動選別

## ドキュメント

- [エレベーターピッチ](./elevator-pitch.md)
- [ビジネス要件定義書](./business-requirements-document.md)
- [プロダクト開発要求定義書](./product-requirements-document.md)
- [ダッシュボード・ワイヤーフレーム](./wireframe-dashboard-v1.md)

## 開発環境のセットアップ

```bash
# 依存関係のインストール
npm install

# 開発サーバーの起動
npm run dev
```

ブラウザで [http://localhost:3000](http://localhost:3000) を開いてください。

### 主要ページ

- `/` - ホームページ
- `/dashboard` - メインダッシュボード（チーム生産性の可視化）
- `/elevator-pitch` - エレベーターピッチ
- `/business-requirements` - ビジネス要件定義書
- `/product-requirements` - プロダクト開発要求定義書

## デプロイ

このプロジェクトはVercelにデプロイされています。

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/YOUR_USERNAME/smartToDo)

## ライセンス

Copyright (c) 2024 SmartToDo

