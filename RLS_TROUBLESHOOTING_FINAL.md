# RLSポリシー最終トラブルシューティングガイド

## 現在のエラー
```
エラー: 組織の作成が拒否されました。RLSポリシーが正しく設定されているか確認してください。
```

## 解決手順

### ステップ1: 診断スクリプトを実行

1. Supabase Dashboard → SQL Editor を開く
2. `supabase/diagnose_rls.sql` の内容をコピーして実行
3. 結果を確認：
   - RLSが有効になっているか（すべて `true` である必要がある）
   - `organizations` テーブルに `Users can create organizations` ポリシーが存在するか
   - そのポリシーの `with_check` が `auth.uid() IS NOT NULL` であるか

### ステップ2: 強制修正スクリプトを実行

診断結果で問題が見つかった場合、またはポリシーが正しく設定されていない場合：

1. Supabase Dashboard → SQL Editor を開く
2. `supabase/migrations/014_force_rls_fix.sql` の内容を**すべて**コピー
3. SQL Editorに貼り付けて「Run」ボタンをクリック
4. エラーが発生しないことを確認

### ステップ3: ポリシーの再確認

修正スクリプト実行後、再度診断スクリプトを実行して、以下を確認：

```sql
-- organizations テーブルのINSERTポリシーを確認
SELECT 
    policyname,
    cmd,
    with_check
FROM pg_policies 
WHERE tablename = 'organizations' 
AND cmd = 'INSERT';
```

期待される結果：
- `policyname`: `Users can create organizations`
- `cmd`: `INSERT`
- `with_check`: `(auth.uid() IS NOT NULL)`

### ステップ4: 認証状態の確認

ブラウザのコンソール（F12）で以下を実行：

```javascript
// Supabaseクライアントでセッションを確認
const { data: { session }, error } = await supabase.auth.getSession()
console.log('Session:', session)
console.log('User ID:', session?.user?.id)
console.log('Error:', error)
```

認証されていない場合、再度ログインしてください。

### ステップ5: アプリケーションの再起動

1. 開発サーバーを停止（Ctrl+C）
2. ブラウザを完全にリフレッシュ（Ctrl+Shift+R または Cmd+Shift+R）
3. 再度ログイン
4. 組織作成を試す

## よくある問題と解決方法

### 問題1: ポリシーが存在しない

**症状**: 診断スクリプトで `organizations` テーブルのINSERTポリシーが見つからない

**解決方法**: `014_force_rls_fix.sql` を実行

### 問題2: ポリシーの with_check が正しくない

**症状**: 診断スクリプトで `with_check` が `auth.uid() IS NOT NULL` ではない

**解決方法**: `014_force_rls_fix.sql` を実行してポリシーを再作成

### 問題3: RLSが無効になっている

**症状**: 診断スクリプトで `rls_enabled` が `false`

**解決方法**: `014_force_rls_fix.sql` を実行（RLSを再度有効化）

### 問題4: 認証されていない

**症状**: ブラウザコンソールで `session` が `null`

**解決方法**: 再度ログインしてください

### 問題5: 複数のポリシーが競合している

**症状**: 診断スクリプトで同じ名前のポリシーが複数存在する

**解決方法**: `014_force_rls_fix.sql` を実行（すべてのポリシーを削除して再作成）

## 手動でポリシーを確認・修正する場合

Supabase Dashboard → Authentication → Policies で、以下のポリシーが存在することを確認：

### organizations テーブル
- ✅ `Users can view their organization data` (SELECT)
- ✅ `Users can create organizations` (INSERT) ← **これが重要**
- ✅ `Users can update their organizations` (UPDATE)

### organization_members テーブル
- ✅ `Users can view organization members` (SELECT)
- ✅ `Users can create organization members` (INSERT)
- ✅ `Users can update organization members` (UPDATE)

## それでも解決しない場合

1. Supabase Dashboard → Logs でエラーログを確認
2. ブラウザのコンソール（F12）でエラーメッセージを確認
3. エラーメッセージの詳細を共有してください

## 確認クエリ

すべての手順を実行した後、以下を実行して最終確認：

```sql
-- 1. RLSが有効か確認
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename = 'organizations';

-- 2. INSERTポリシーを確認
SELECT policyname, cmd, with_check
FROM pg_policies 
WHERE tablename = 'organizations' 
AND cmd = 'INSERT';

-- 3. 認証状態を確認
SELECT 
    auth.uid() as user_id,
    CASE 
        WHEN auth.uid() IS NOT NULL THEN '認証済み'
        ELSE '未認証'
    END as status;
```

すべての結果が期待通りであれば、組織作成が可能になっているはずです。

