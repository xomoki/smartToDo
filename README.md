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

### 1. 依存関係のインストール

```bash
npm install
```

### 2. 環境変数の設定

プロジェクトルートに`.env.local`ファイルを作成し、以下を設定してください：

```bash
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://fnrthlbgogvxtsfnqodh.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key_here

# OpenAI Configuration
OPENAI_API_KEY=your_openai_api_key_here
```

詳細は[SUPABASE_SETUP.md](./SUPABASE_SETUP.md)を参照してください。

### 3. Supabaseデータベースのセットアップ

1. [Supabase Dashboard](https://app.supabase.com)にログイン
2. SQL Editorで`supabase/migrations/001_initial_schema.sql`を実行
3. Settings → APIからAnon Keyを取得して`.env.local`に設定

### 4. 開発サーバーの起動

```bash
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

