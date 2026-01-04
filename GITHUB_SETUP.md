# GitHub連携とVercelデプロイ手順

## 1. GitHubリポジトリの作成

1. [GitHub](https://github.com)にログインします
2. 右上の「+」ボタンをクリックし、「New repository」を選択
3. リポジトリ名を `smartToDo` に設定
4. 説明を入力（オプション）: "AI搭載型チーム生産性統合プラットフォーム"
5. **Public** または **Private** を選択
6. **「Initialize this repository with a README」のチェックを外す**（既にローカルにリポジトリがあるため）
7. 「Create repository」をクリック

## 2. ローカルリポジトリをGitHubに接続

GitHubでリポジトリを作成したら、表示されるURL（例: `https://github.com/YOUR_USERNAME/smartToDo.git`）をコピーして、以下のコマンドを実行してください：

```bash
# リモートリポジトリを追加（YOUR_USERNAMEを実際のユーザー名に置き換えてください）
git remote add origin https://github.com/YOUR_USERNAME/smartToDo.git

# ブランチ名をmainに設定（既にmainの場合は不要）
git branch -M main

# GitHubにプッシュ
git push -u origin main
```

## 3. Vercelへのデプロイ

### 方法1: Vercelダッシュボードから（推奨）

1. [Vercel](https://vercel.com)にログイン（GitHubアカウントでログイン可能）
2. 「Add New Project」をクリック
3. GitHubリポジトリ `smartToDo` を選択
4. プロジェクト設定を確認：
   - **Framework Preset:** Next.js（自動検出されるはず）
   - **Root Directory:** `./`（そのまま）
   - **Build Command:** `npm run build`（自動設定）
   - **Output Directory:** `.next`（自動設定）
5. 「Deploy」をクリック
6. デプロイが完了すると、URLが表示されます（例: `https://smarttodo.vercel.app`）

### 方法2: Vercel CLIから

```bash
# Vercel CLIをインストール（未インストールの場合）
npm i -g vercel

# プロジェクトディレクトリで実行
cd /Users/morikawatomoki/smartToDo
vercel

# 初回はログインとプロジェクト設定が必要
# その後、自動的にデプロイされます
```

## 4. 今後の更新方法

コードを更新したら、以下のコマンドでGitHubとVercelに反映されます：

```bash
# 変更をコミット
git add .
git commit -m "更新内容の説明"

# GitHubにプッシュ
git push origin main

# Vercelは自動的にGitHubの変更を検知して再デプロイします
```

## 5. 環境変数（必要に応じて）

将来的に環境変数が必要になった場合：

1. Vercelダッシュボードでプロジェクトを開く
2. 「Settings」→「Environment Variables」を選択
3. 必要な環境変数を追加

## トラブルシューティング

### ビルドエラーが発生する場合

```bash
# ローカルでビルドをテスト
npm install
npm run build

# エラーがあれば修正してから再度デプロイ
```

### GitHubへのプッシュで認証エラーが発生する場合

HTTPSの代わりにSSHを使用する場合：

```bash
# SSH URLに変更
git remote set-url origin git@github.com:YOUR_USERNAME/smartToDo.git
```

または、Personal Access Tokenを使用してHTTPS認証を行うこともできます。

