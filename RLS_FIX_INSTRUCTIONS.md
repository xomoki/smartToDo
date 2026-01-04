# RLSポリシー修正手順

## 現在のエラー
`new row violates row-level security policy for table "organizations"` (code: 42501)

## 解決手順

### ステップ1: すべてのポリシーを削除

Supabase Dashboard → SQL Editor で以下を実行：

```sql
-- すべてのポリシーを削除
DROP POLICY IF EXISTS "Users can view their organization data" ON organizations;
DROP POLICY IF EXISTS "Users can create organizations" ON organizations;
DROP POLICY IF EXISTS "Users can update their organizations" ON organizations;
DROP POLICY IF EXISTS "Users can view organization members" ON organization_members;
DROP POLICY IF EXISTS "Users can create organization members" ON organization_members;
DROP POLICY IF EXISTS "Users can update organization members" ON organization_members;
DROP POLICY IF EXISTS "Users can view their organization members" ON users;
DROP POLICY IF EXISTS "Users can update themselves" ON users;
DROP POLICY IF EXISTS "Users can create themselves" ON users;
```

### ステップ2: 正しいポリシーを適用

以下をコピーしてSQL Editorで実行してください：

```sql
-- ============================================
-- 1. Organizations テーブルのポリシー
-- ============================================

-- 組織の閲覧: 自分がメンバーである組織のみ
CREATE POLICY "Users can view their organization data" ON organizations
    FOR SELECT USING (
        EXISTS (
            SELECT 1 
            FROM organization_members 
            WHERE organization_id = organizations.id
            AND user_id = auth.uid()
        )
    );

-- 組織の作成: 認証済みユーザーは誰でも作成可能
-- 重要: WITH CHECK句でauth.uid()のみをチェック
CREATE POLICY "Users can create organizations" ON organizations
    FOR INSERT 
    WITH CHECK (
        auth.uid() IS NOT NULL
    );

-- 組織の更新: 自分がadminまたはmanagerである組織のみ
CREATE POLICY "Users can update their organizations" ON organizations
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 
            FROM organization_members 
            WHERE organization_id = organizations.id
            AND user_id = auth.uid() 
            AND role IN ('admin', 'manager')
        )
    );

-- ============================================
-- 2. Organization Members テーブルのポリシー
-- ============================================

-- 組織メンバーの閲覧: 自分自身のレコードのみ
CREATE POLICY "Users can view organization members" ON organization_members
    FOR SELECT USING (
        user_id = auth.uid()
    );

-- 組織メンバーの作成: 自分自身を追加する場合のみ許可
CREATE POLICY "Users can create organization members" ON organization_members
    FOR INSERT 
    WITH CHECK (
        user_id = auth.uid()
    );

-- 組織メンバーの更新: 自分自身のレコードのみ更新可能
CREATE POLICY "Users can update organization members" ON organization_members
    FOR UPDATE USING (
        user_id = auth.uid()
    );

-- ============================================
-- 3. Users テーブルのポリシー
-- ============================================

-- ユーザーの閲覧: 自分自身のみ
CREATE POLICY "Users can view their organization members" ON users
    FOR SELECT USING (
        id = auth.uid()
    );

-- ユーザーの更新: 自分自身のみ
CREATE POLICY "Users can update themselves" ON users
    FOR UPDATE USING (id = auth.uid());

-- ユーザーの作成: 認証済みユーザーが自分自身のレコードを作成可能
CREATE POLICY "Users can create themselves" ON users
    FOR INSERT 
    WITH CHECK (
        id = auth.uid()
    );
```

### ステップ3: ポリシーの確認

以下を実行してポリシーが正しく設定されているか確認：

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

`organizations`テーブルに以下のポリシーが存在することを確認：
- `Users can view their organization data` (SELECT)
- `Users can create organizations` (INSERT) ← これが重要
- `Users can update their organizations` (UPDATE)

### ステップ4: テスト

ブラウザをリフレッシュして、再度ログインしてください。

## トラブルシューティング

### ポリシーが適用されない場合

1. Supabase Dashboard → Authentication → Policies で確認
2. テーブルにRLSが有効になっているか確認：
   ```sql
   SELECT tablename, rowsecurity 
   FROM pg_tables 
   WHERE schemaname = 'public' 
   AND tablename IN ('organizations', 'users', 'organization_members');
   ```
   すべて`true`である必要があります。

### まだエラーが発生する場合

1. ブラウザのコンソールでエラーメッセージを確認
2. Supabase Dashboard → Logs でエラーを確認
3. 認証状態を確認：
   ```javascript
   const { data: { session } } = await supabase.auth.getSession()
   console.log('Session:', session)
   ```

