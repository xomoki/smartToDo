# 認証とRLSポリシーの確認手順

## 重要な注意事項

**SQL Editorから実行した場合、`auth.uid()`が`null`になるのは正常です。**
SQL Editorは認証コンテキストを持たないため、`auth.uid()`は常に`null`を返します。

**アプリケーション側（ブラウザ）での認証状態を確認する必要があります。**

## ステップ1: アプリケーション側の認証状態を確認

### ブラウザのコンソールで確認

1. アプリケーションにログインしている状態で、ブラウザの開発者ツールを開く（F12）
2. Consoleタブで以下を実行：

```javascript
// Supabaseクライアントをインポート（必要に応じて）
// または、アプリケーションのコードから直接確認

// 方法1: ブラウザコンソールから直接確認
// （アプリケーションがグローバルにsupabaseを公開している場合）
const { data: { session }, error } = await supabase.auth.getSession()
console.log('=== 認証状態 ===')
console.log('Session:', session)
console.log('User ID:', session?.user?.id)
console.log('Email:', session?.user?.email)
console.log('Error:', error)

// 方法2: 現在のユーザーを取得
const { data: { user }, error: userError } = await supabase.auth.getUser()
console.log('=== 現在のユーザー ===')
console.log('User:', user)
console.log('User ID:', user?.id)
console.log('Error:', userError)
```

### 期待される結果

- `session` が `null` でない
- `user.id` が存在する（UUID形式）
- `user.email` が `t-morikawa@wevnal.co.jp` である

### 認証されていない場合

1. 再度ログインしてください
2. ログイン後、上記の確認を再度実行

## ステップ2: RLSポリシーの確認（SQL Editorから）

SQL Editorから実行する場合、`auth.uid()`は常に`null`になりますが、ポリシーの存在は確認できます。

### ポリシーの存在を確認

```sql
-- organizations テーブルのINSERTポリシーを確認
SELECT 
    policyname,
    cmd,
    with_check,
    permissive,
    roles
FROM pg_policies 
WHERE tablename = 'organizations' 
AND cmd = 'INSERT';
```

### 期待される結果

- `policyname`: `Users can create organizations`
- `cmd`: `INSERT`
- `with_check`: `(auth.uid() IS NOT NULL)` または類似の式
- `permissive`: `PERMISSIVE`
- `roles`: `{authenticated}` または `{public}`

### ポリシーが存在しない、または正しくない場合

`supabase/migrations/014_force_rls_fix.sql` を実行してください。

## ステップ3: 強制修正スクリプトを実行

1. Supabase Dashboard → SQL Editor を開く
2. `supabase/migrations/014_force_rls_fix.sql` の内容をすべてコピー
3. SQL Editorに貼り付けて「Run」ボタンをクリック
4. エラーが発生しないことを確認

## ステップ4: アプリケーション側でのテスト

### ブラウザコンソールで直接テスト

ログイン後、ブラウザコンソールで以下を実行：

```javascript
// 組織作成をテスト
const { data, error } = await supabase
  .from('organizations')
  .insert({
    name: 'Test Organization',
    slug: 'test-org-' + Date.now(),
    plan: 'free'
  })
  .select()
  .single()

console.log('=== 組織作成テスト ===')
console.log('Data:', data)
console.log('Error:', error)
```

### 期待される結果

- `error` が `null`
- `data` に組織情報が含まれる

### エラーが発生する場合

エラーメッセージを確認：
- `new row violates row-level security policy` → RLSポリシーが正しく設定されていない
- `JWT expired` → セッションが期限切れ、再度ログインが必要
- `Invalid API key` → 環境変数の設定を確認

## ステップ5: 環境変数の確認

`.env.local` ファイルを確認：

```bash
NEXT_PUBLIC_SUPABASE_URL=https://fnrthlbgogvxtsfnqodh.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

環境変数が正しく設定されているか確認してください。

## トラブルシューティング

### 問題1: アプリケーション側で認証されていない

**症状**: ブラウザコンソールで `session` が `null`

**解決方法**:
1. 再度ログインしてください
2. ログイン後、セッションが正しく設定されているか確認

### 問題2: RLSポリシーが存在しない

**症状**: SQL Editorでポリシーが見つからない

**解決方法**: `014_force_rls_fix.sql` を実行

### 問題3: RLSポリシーは存在するが、エラーが発生する

**症状**: ポリシーは存在するが、組織作成時にエラーが発生

**解決方法**:
1. ブラウザを完全にリフレッシュ（Ctrl+Shift+R または Cmd+Shift+R）
2. 再度ログイン
3. 組織作成を試す

### 問題4: セッションが期限切れ

**症状**: `JWT expired` エラー

**解決方法**: 再度ログインしてください

## 確認チェックリスト

- [ ] ブラウザコンソールで `session` が `null` でない
- [ ] `user.id` が存在する（UUID形式）
- [ ] SQL Editorで `Users can create organizations` ポリシーが存在する
- [ ] そのポリシーの `with_check` が `auth.uid() IS NOT NULL` である
- [ ] 環境変数が正しく設定されている
- [ ] ブラウザを完全にリフレッシュした
- [ ] 再度ログインした

すべてのチェック項目が完了したら、組織作成を試してください。

