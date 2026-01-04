# 環境変数設定ガイド

## ローカル開発環境用の設定

プロジェクトルートに`.env.local`ファイルを作成し、以下の環境変数を設定してください：

```bash
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://fnrthlbgogvxtsfnqodh.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here

# OpenAI Configuration
OPENAI_API_KEY=your_openai_api_key_here
```

## 設定手順

1. プロジェクトルートに`.env.local`ファイルを作成
2. 上記の内容をコピー
3. `NEXT_PUBLIC_SUPABASE_ANON_KEY`の`your_anon_key_here`を実際のAnon Keyに置き換え
4. 開発サーバーを再起動（`npm run dev`）

## 注意事項

- `.env.local`ファイルは`.gitignore`に含まれているため、Gitにコミットされません
- 環境変数を変更した場合は、必ず開発サーバーを再起動してください
- Vercelの環境変数とローカルの環境変数は別々に管理されます

## 動作確認

環境変数が正しく設定されているか確認：

```bash
# 開発サーバーを起動
npm run dev
```

以下の機能が動作することを確認：
- All Tasksページで「AI判定」「AI見積」ボタンが動作する
- DashboardページでAI Weekly Insightが表示される
- Supabaseへの接続が正常に動作する

