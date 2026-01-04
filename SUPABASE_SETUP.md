# Supabase セットアップガイド

## 1. Supabaseプロジェクトの設定

### プロジェクト情報
- **Project URL**: https://fnrthlbgogvxtsfnqodh.supabase.co

### 手順

1. [Supabase Dashboard](https://app.supabase.com)にログイン
2. プロジェクトを選択
3. **SQL Editor**に移動
4. `supabase/migrations/001_initial_schema.sql`の内容をコピーして実行

## 2. 環境変数の設定

### .env.localファイルの作成

プロジェクトルートに`.env.local`ファイルを作成し、以下を設定してください：

```bash
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://fnrthlbgogvxtsfnqodh.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key_here

# OpenAI Configuration
OPENAI_API_KEY=your_openai_api_key_here
```

### Supabase Anon Keyの取得方法

1. Supabase Dashboardでプロジェクトを開く
2. **Settings** → **API**に移動
3. **anon public**キーをコピー
4. `.env.local`の`NEXT_PUBLIC_SUPABASE_ANON_KEY`に設定

## 3. データベースマイグレーションの実行

### SQL Editorでの実行

1. Supabase Dashboardで**SQL Editor**を開く
2. `supabase/migrations/001_initial_schema.sql`の内容を貼り付け
3. **Run**ボタンをクリック

### 確認

以下のテーブルが作成されていることを確認：
- organizations
- users
- teams
- organization_members
- team_members
- integrations
- tasks
- task_time_logs
- ai_learning_data
- notifications
- invitations
- ai_insights

## 4. Row Level Security (RLS) の設定

基本的なRLSポリシーはマイグレーションファイルに含まれていますが、本番環境ではより詳細な設定が必要です。

### 推奨設定

各テーブルに対して、組織メンバーのみがアクセス可能なポリシーを設定してください。

## 5. 動作確認

### 開発サーバーの起動

```bash
npm install
npm run dev
```

### APIエンドポイントの確認

以下のエンドポイントが動作することを確認：
- `/api/ai/auto-tag` - 自動タグ付け
- `/api/ai/decompose-task` - タスク分解
- `/api/ai/estimate-time` - 工数見積もり
- `/api/ai/weekly-insight` - 週次インサイト

## 6. トラブルシューティング

### 環境変数が読み込まれない

- `.env.local`ファイルがプロジェクトルートにあることを確認
- 開発サーバーを再起動

### Supabase接続エラー

- `NEXT_PUBLIC_SUPABASE_URL`と`NEXT_PUBLIC_SUPABASE_ANON_KEY`が正しく設定されているか確認
- Supabaseプロジェクトがアクティブか確認

### OpenAI APIエラー

- `OPENAI_API_KEY`が正しく設定されているか確認
- APIキーの有効期限を確認
- レート制限に達していないか確認

## 7. 本番環境へのデプロイ

### Vercelでの環境変数設定

1. Vercel Dashboardでプロジェクトを開く
2. **Settings** → **Environment Variables**に移動
3. 以下の環境変数を追加：
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `OPENAI_API_KEY`

### 注意事項

- `OPENAI_API_KEY`は**サーバーサイドのみ**で使用されるため、`NEXT_PUBLIC_`プレフィックスは不要
- SupabaseのAnon Keyは公開されても問題ありませんが、Service Role Keyは絶対に公開しないでください

