-- 組織作成時のRLSエラーを完全に修正
-- このファイルを実行してください
-- 
-- 実行順序:
-- 1. 003_drop_all_policies.sql (すべてのポリシーを削除)
-- 2. このファイル (007_final_rls_fix.sql) を実行

-- ============================================
-- 1. Organizations テーブルのポリシー
-- ============================================

-- 既存のポリシーを削除
DROP POLICY IF EXISTS "Users can view their organization data" ON organizations;
DROP POLICY IF EXISTS "Users can create organizations" ON organizations;
DROP POLICY IF EXISTS "Users can update their organizations" ON organizations;

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
-- 重要: 組織作成時にはまだメンバーではないため、organization_membersを参照しない
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

-- 既存のポリシーを削除
DROP POLICY IF EXISTS "Users can view organization members" ON organization_members;
DROP POLICY IF EXISTS "Users can create organization members" ON organization_members;
DROP POLICY IF EXISTS "Users can update organization members" ON organization_members;

-- 組織メンバーの閲覧: 自分自身のレコード、または自分が所属する組織のメンバー
CREATE POLICY "Users can view organization members" ON organization_members
    FOR SELECT USING (
        -- 自分自身のレコード
        user_id = auth.uid() OR
        -- 自分が所属する組織のメンバー
        EXISTS (
            SELECT 1 
            FROM organization_members om
            WHERE om.organization_id = organization_members.organization_id
            AND om.user_id = auth.uid()
        )
    );

-- 組織メンバーの作成: 自分自身を追加する場合のみ許可
-- これが重要：新規組織作成時に自分自身をメンバーとして追加するため
CREATE POLICY "Users can create organization members" ON organization_members
    FOR INSERT 
    WITH CHECK (
        user_id = auth.uid()
    );

-- 組織メンバーの更新: 自分自身のレコードのみ更新可能
-- （他のユーザーを追加する場合は、サーバーサイド関数を使用）
CREATE POLICY "Users can update organization members" ON organization_members
    FOR UPDATE USING (
        user_id = auth.uid()
    );

-- ============================================
-- 3. Users テーブルのポリシー
-- ============================================

-- 既存のポリシーを削除
DROP POLICY IF EXISTS "Users can view their organization members" ON users;
DROP POLICY IF EXISTS "Users can update themselves" ON users;
DROP POLICY IF EXISTS "Users can create themselves" ON users;

-- ユーザーの閲覧: 自分自身は常に閲覧可能、同じ組織のメンバーも閲覧可能
CREATE POLICY "Users can view their organization members" ON users
    FOR SELECT USING (
        id = auth.uid() OR
        EXISTS (
            SELECT 1 
            FROM organization_members om1
            INNER JOIN organization_members om2 
                ON om1.organization_id = om2.organization_id
            WHERE om1.user_id = users.id
            AND om2.user_id = auth.uid()
        )
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
-- 4. ポリシーの確認
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

