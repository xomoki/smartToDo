-- 完全なRLSポリシーセットアップ
-- このファイルを実行してください
-- 
-- 実行方法:
-- 1. Supabase Dashboard → SQL Editor を開く
-- 2. このファイルの内容をすべてコピー
-- 3. SQL Editorに貼り付けて実行

-- ============================================
-- ステップ1: 既存のポリシーをすべて削除
-- ============================================

DROP POLICY IF EXISTS "Users can view their organization data" ON organizations;
DROP POLICY IF EXISTS "Users can create organizations" ON organizations;
DROP POLICY IF EXISTS "Users can update their organizations" ON organizations;
DROP POLICY IF EXISTS "Users can view organization members" ON organization_members;
DROP POLICY IF EXISTS "Users can create organization members" ON organization_members;
DROP POLICY IF EXISTS "Users can update organization members" ON organization_members;
DROP POLICY IF EXISTS "Users can view their organization members" ON users;
DROP POLICY IF EXISTS "Users can update themselves" ON users;
DROP POLICY IF EXISTS "Users can create themselves" ON users;

-- ============================================
-- ステップ2: Organizations テーブルのポリシー
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
-- これにより、組織作成時（まだメンバーではない）でも作成可能
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
-- ステップ3: Organization Members テーブルのポリシー
-- ============================================

-- 組織メンバーの閲覧: 自分自身のレコードのみ
-- これにより、無限再帰を完全に回避
CREATE POLICY "Users can view organization members" ON organization_members
    FOR SELECT USING (
        user_id = auth.uid()
    );

-- 組織メンバーの作成: 自分自身を追加する場合のみ許可
-- これが重要：新規組織作成時に自分自身をメンバーとして追加するため
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
-- ステップ4: Users テーブルのポリシー
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

-- ============================================
-- ステップ5: ポリシーの確認（オプション）
-- ============================================

-- 以下のクエリでポリシーが正しく設定されているか確認できます
-- SELECT 
--     tablename, 
--     policyname, 
--     cmd,
--     with_check
-- FROM pg_policies 
-- WHERE tablename IN ('organizations', 'organization_members', 'users')
-- ORDER BY tablename, policyname;

