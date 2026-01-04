# データベースマイグレーション完全ガイド

## 重要な注意事項

**このガイドに従って、データベースを完全に再セットアップしてください。**

## 問題の原因

現在、複数のマイグレーションファイルが存在し、RLSポリシーが正しく適用されていない可能性があります。これにより、組織作成時にRLSエラーが発生しています。

## 解決方法

### ステップ1: Supabase DashboardでSQL Editorを開く

1. https://supabase.com/dashboard にアクセス
2. プロジェクトを選択
3. 左メニューから「SQL Editor」をクリック

### ステップ2: 完全なマイグレーションを実行

`supabase/migrations/000_complete_database_setup.sql`の内容を**すべて**コピーして、SQL Editorに貼り付けて「Run」ボタンをクリックしてください。

このファイルは以下を実行します：
- すべてのテーブルの作成
- RLSの有効化
- 正しいRLSポリシーの設定
- 更新日時トリガーの設定

### ステップ3: 動作確認

1. ブラウザをリフレッシュ（F5）
2. 再度ログイン
3. 「wevnal」組織が自動的に作成され、アクセスできることを確認

## マイグレーションファイルの整理

以下のマイグレーションファイルは、`000_complete_database_setup.sql`に統合されています：
- `001_initial_schema.sql` - テーブル定義
- `002_rls_policies.sql` - RLSポリシー（古いバージョン）
- `003_drop_all_policies.sql` - ポリシー削除
- `004_fix_organization_insert_policy.sql` - INSERTポリシー修正
- `005_complete_rls_fix.sql` - RLS修正
- `006_fix_users_and_organizations_rls.sql` - RLS修正
- `007_final_rls_fix.sql` - RLS修正
- `008_fix_infinite_recursion.sql` - 無限再帰修正
- `009_complete_rls_no_recursion.sql` - 無限再帰修正
- `010_final_no_recursion_fix.sql` - 無限再帰修正
- `011_ultimate_no_recursion_fix.sql` - 無限再帰修正
- `012_fix_organization_insert.sql` - INSERTポリシー修正
- `013_complete_rls_setup.sql` - RLSセットアップ

**今後は`000_complete_database_setup.sql`のみを使用してください。**

## RLSポリシーの重要なポイント

### Organizations テーブル

- **SELECT**: 自分がメンバーである組織のみ閲覧可能
- **INSERT**: 認証済みユーザーは誰でも作成可能（`auth.uid() IS NOT NULL`のみチェック）
- **UPDATE**: 自分がadminまたはmanagerである組織のみ更新可能

### Organization Members テーブル

- **SELECT**: 自分自身のレコードのみ閲覧可能（無限再帰を回避）
- **INSERT**: 自分自身を追加する場合のみ許可
- **UPDATE**: 自分自身のレコードのみ更新可能

### Users テーブル

- **SELECT**: 自分自身のみ閲覧可能
- **INSERT**: 自分自身のレコードのみ作成可能
- **UPDATE**: 自分自身のみ更新可能

## トラブルシューティング

### エラーが発生する場合

1. エラーメッセージを確認
2. Supabase Dashboard → Logs でエラーを確認
3. ポリシーが正しく設定されているか確認：
   ```sql
   SELECT 
       tablename, 
       policyname, 
       cmd,
       with_check
   FROM pg_policies 
   WHERE tablename IN ('organizations', 'organization_members', 'users')
   ORDER BY tablename, policyname;
   ```

### ポリシーが適用されない場合

1. RLSが有効になっているか確認：
   ```sql
   SELECT tablename, rowsecurity 
   FROM pg_tables 
   WHERE schemaname = 'public' 
   AND tablename IN ('organizations', 'users', 'organization_members');
   ```
   すべて`true`である必要があります。

2. 認証状態を確認：
   ```javascript
   const { data: { session } } = await supabase.auth.getSession()
   console.log('Session:', session)
   ```

## 完了後の確認

マイグレーション実行後、以下を確認してください：

1. ✅ すべてのテーブルが作成されている
2. ✅ RLSが有効になっている
3. ✅ ポリシーが正しく設定されている
4. ✅ ログイン後に組織を作成できる
5. ✅ 「wevnal」組織にアクセスできる

