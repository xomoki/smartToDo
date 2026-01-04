# 本番環境セットアップガイド

## 実装完了内容

### 1. 認証機能
- ✅ ログイン・サインアップページ (`/login`)
- ✅ 認証ガード（ダッシュボードページへのアクセス制御）
- ✅ ログアウト機能

### 2. Supabase連携
- ✅ 組織・チーム・メンバーの取得
- ✅ タスクのCRUD操作
- ✅ メンバー招待機能

### 3. ダミーデータの削除
- ✅ All Tasksページのダミーデータを削除し、Supabaseから取得
- ✅ Sidebarのダミーデータを削除し、Supabaseから取得

### 4. エラーハンドリング
- ✅ ローディング状態の表示
- ✅ エラーメッセージの表示
- ✅ フォーム送信時のバリデーション

## セットアップ手順

### 1. Supabaseデータベースのセットアップ

1. Supabase DashboardでSQL Editorを開く
2. `supabase/migrations/001_initial_schema.sql`の内容を実行
3. Settings → APIから以下を取得：
   - Project URL
   - Anon Key

### 2. 環境変数の設定

#### ローカル環境 (`.env.local`)
```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
OPENAI_API_KEY=your_openai_api_key_here
```

#### Vercel環境変数
Vercel Dashboard → Settings → Environment Variables で以下を設定：
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `OPENAI_API_KEY`

### 3. 初回ユーザー作成

1. `/login`にアクセス
2. 「新規登録」タブでアカウントを作成
3. メール確認（Supabaseの設定による）
4. ログイン後、組織を作成

### 4. 組織とチームの作成

1. Sidebarの「Organization」セレクタで「+」ボタンをクリック
2. 組織名を入力して作成
3. Settingsページでチームを作成
4. メンバーを招待

## 実装済み機能

### All Tasksページ
- ✅ Supabaseからタスクを取得
- ✅ タスクの作成（単一・一括）
- ✅ タスクの更新
- ✅ メンバーリストの取得（組織・チーム別）
- ✅ AI機能（カテゴリー判定・時間見積もり）

### Sidebar
- ✅ 組織一覧の取得
- ✅ チーム一覧の取得
- ✅ 組織の作成
- ✅ ログアウト

### 認証
- ✅ ログイン
- ✅ サインアップ
- ✅ セッション管理
- ✅ 認証ガード

## 今後の実装予定

### Dashboardページ
- [ ] KPICards: Supabaseからデータを取得して計算
- [ ] FocusTaskList: Supabaseから注意すべきタスクを取得
- [ ] WorkloadHeatmap: Supabaseから工数データを取得
- [ ] DailyTrend: Supabaseから日次データを取得

### Reportsページ
- [ ] Supabaseからレポートデータを取得
- [ ] チーム別・期間別の集計

### Settingsページ
- [ ] Supabaseからメンバーリストを取得
- [ ] メンバー招待の実装（Supabase経由）
- [ ] 通知設定の保存

## トラブルシューティング

### 認証エラー
- Supabaseの認証設定を確認
- メール確認が有効な場合、メールを確認

### データが表示されない
- SupabaseのRLSポリシーを確認
- 組織・チームが正しく作成されているか確認
- ブラウザのコンソールでエラーを確認

### 環境変数エラー
- `.env.local`ファイルが正しく設定されているか確認
- Vercelの環境変数が設定されているか確認
- 開発サーバーを再起動

## データベース構造

主要なテーブル：
- `organizations`: 組織
- `teams`: チーム
- `users`: ユーザー（Supabase Authと連携）
- `organization_members`: 組織メンバー
- `team_members`: チームメンバー
- `tasks`: タスク
- `task_time_logs`: 工数ログ
- `invitations`: 招待

詳細は`supabase/migrations/001_initial_schema.sql`を参照してください。

