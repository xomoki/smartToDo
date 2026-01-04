# Row Level Security (RLS) ポリシー設定ガイド

## 問題

組織を新規作成しようとした際に以下のエラーが発生する場合があります：

```
エラー: new row violates row-level security policy for table "organizations"
```

これは、SupabaseのRow Level Security (RLS) ポリシーが適切に設定されていないためです。

## 解決方法

### 1. RLSポリシーファイルの実行

1. Supabase Dashboardにログイン
2. **SQL Editor**を開く
3. **New Query**をクリック
4. `supabase/migrations/002_rls_policies.sql`の内容をすべてコピー
5. SQL Editorに貼り付けて**Run**をクリック

### 2. ポリシーの確認

SQL Editorで以下を実行して、ポリシーが正しく設定されているか確認：

```sql
-- 組織テーブルのポリシーを確認
SELECT * FROM pg_policies WHERE tablename = 'organizations';
```

### 3. 認証状態の確認

RLSポリシーは`auth.uid()`を使用するため、ユーザーが正しく認証されている必要があります。

ブラウザのコンソールで以下を確認：

```javascript
// Supabaseクライアントでセッションを確認
const { data: { session } } = await supabase.auth.getSession()
console.log('Session:', session)
```

## 設定されるポリシー

### Organizations (組織)
- **SELECT**: 自分がメンバーである組織のみ閲覧可能
- **INSERT**: 認証済みユーザーは誰でも作成可能
- **UPDATE**: 自分がadminまたはmanagerである組織のみ更新可能

### Teams (チーム)
- **SELECT**: 自分が所属する組織のチームのみ閲覧可能
- **INSERT**: 自分が所属する組織のチームのみ作成可能
- **UPDATE**: 自分がadminまたはmanagerである組織のチームのみ更新可能

### Tasks (タスク)
- **SELECT**: 自分が所属する組織のタスクのみ閲覧可能
- **INSERT**: 自分が所属する組織のタスクのみ作成可能
- **UPDATE**: 自分が所属する組織のタスクのみ更新可能
- **DELETE**: 自分がadminまたはmanagerである組織のタスクのみ削除可能

その他のテーブルについても同様のポリシーが設定されます。

## トラブルシューティング

### ポリシーが適用されない場合

1. **RLSが有効になっているか確認**:
```sql
SELECT tablename, rowsecurity FROM pg_tables WHERE schemaname = 'public';
```

2. **ポリシーが存在するか確認**:
```sql
SELECT schemaname, tablename, policyname FROM pg_policies;
```

3. **認証状態を確認**:
```sql
-- 現在のユーザーIDを確認（SupabaseのSQL Editorでは直接確認できないため、アプリケーション側で確認）
```

### ユーザーが作成されない場合

`signUp`関数は`auth.users`にユーザーを作成しますが、`users`テーブルにもレコードを作成する必要があります。

`lib/auth.ts`の`signUp`関数が正しく実装されているか確認してください。

## 注意事項

- RLSポリシーは即座に適用されます
- 既存のデータにアクセスできない場合、ポリシーを一時的に無効化して確認することもできます（本番環境では推奨しません）
- ポリシーの変更後は、アプリケーションを再起動する必要はありません

