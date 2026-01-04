# RLSポリシー トラブルシューティングガイド

## エラー解決手順

### エラー1: `new row violates row-level security policy for table "organizations"`

### エラー2: `infinite recursion detected in policy for relation "organization_members"`

これらのエラーが発生する場合、以下の手順で解決してください。

### ステップ1: すべてのポリシーを削除

1. Supabase DashboardでSQL Editorを開く
2. `supabase/migrations/003_drop_all_policies.sql`の内容をコピー
3. SQL Editorに貼り付けて実行

### ステップ2: 修正されたポリシーを適用

1. `supabase/migrations/010_final_no_recursion_fix.sql`の内容をコピー
2. SQL Editorに貼り付けて実行

**重要**: `010_final_no_recursion_fix.sql`は無限再帰を完全に解決した最新バージョンです。
- `organization_members`のSELECTポリシーは、`organizations`テーブルを経由してチェックしますが、`organization_members`を一切参照しません
- `organizations`テーブルが閲覧可能 = 自分がその組織のメンバーであるため、その組織のメンバーも閲覧可能とみなします
- これにより、無限再帰が完全に回避されます

### ステップ3: ポリシーの確認

以下のSQLを実行して、ポリシーが正しく設定されているか確認：

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

以下のポリシーが存在することを確認：

**organizations:**
- `Users can view their organization data` (SELECT)
- `Users can create organizations` (INSERT) ← これが重要
- `Users can update their organizations` (UPDATE)

**organization_members:**
- `Users can view organization members` (SELECT) ← 無限再帰を避けるため、organizationsテーブルを経由
- `Users can create organization members` (INSERT) ← これが重要
- `Users can update organization members` (UPDATE)

**users:**
- `Users can view their organization members` (SELECT)
- `Users can update themselves` (UPDATE)
- `Users can create themselves` (INSERT)

### ステップ4: 認証状態の確認

ブラウザのコンソール（F12）で以下を実行：

```javascript
const { data: { session } } = await supabase.auth.getSession()
console.log('Session:', session)
console.log('User ID:', session?.user?.id)
```

`session`と`user.id`が存在することを確認してください。

### ステップ5: RLSが有効になっているか確認

```sql
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('organizations', 'users', 'organization_members');
```

すべてのテーブルで`rowsecurity`が`true`であることを確認してください。

## よくある問題と解決方法

### 問題1: ポリシーが存在しない

**解決方法**: `007_final_rls_fix.sql`を実行

### 問題2: 認証されていない

**解決方法**: 
- ログアウトして再度ログイン
- ブラウザのコンソールでセッションを確認

### 問題3: usersテーブルにレコードが存在しない

**解決方法**: 以下のSQLを実行して、現在のユーザーをusersテーブルに追加

```sql
-- 現在の認証済みユーザーをusersテーブルに追加
INSERT INTO users (id, email, name, role, email_verified)
SELECT 
    id,
    email,
    COALESCE(raw_user_meta_data->>'name', email),
    'member',
    email_confirmed_at IS NOT NULL
FROM auth.users
WHERE id NOT IN (SELECT id FROM users)
ON CONFLICT (id) DO NOTHING;
```

### 問題4: ポリシーが正しく動作しない

**解決方法**: 
1. すべてのポリシーを削除（`003_drop_all_policies.sql`）
2. `007_final_rls_fix.sql`を実行
3. ブラウザをリフレッシュ
4. 再度ログイン

## デバッグ方法

### 1. ポリシーの詳細を確認

```sql
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'organizations';
```

### 2. 現在のユーザーIDを確認

```sql
-- これはSQL Editorでは直接実行できませんが、
-- アプリケーション側で確認できます
SELECT auth.uid();
```

### 3. テスト用のINSERTを試行

```sql
-- これは失敗するはずです（RLSによりブロックされる）
-- ただし、認証済みユーザーとして実行すれば成功するはず
INSERT INTO organizations (name, slug, plan)
VALUES ('Test Org', 'test-org', 'free');
```

## 重要なポイント

1. **組織作成時**: まだメンバーではないため、`organization_members`を参照しないポリシーが必要
2. **メンバー追加時**: 自分自身を追加する場合のみ許可（無限再帰を避けるため）
3. **認証状態**: `auth.uid()`が正しく取得できる必要がある
4. **無限再帰の回避**: `organization_members`のSELECTポリシーで、`organization_members`テーブルを直接参照せず、`organizations`テーブルのポリシーを利用してチェックする。`organizations`テーブルのSELECTポリシーにより、自分がメンバーである組織のみが返されるため、その組織のメンバーも閲覧可能になる

## サポート

問題が解決しない場合：
1. ブラウザのコンソールでエラーメッセージを確認
2. Supabase DashboardのLogsでエラーを確認
3. ポリシーの設定を再確認

