-- UsersテーブルとOrganizationsテーブルのRLSポリシーを完全に修正
-- このファイルを実行してください

-- ============================================
-- 1. Users テーブルのポリシー
-- ============================================

-- 既存のポリシーを削除
DROP POLICY IF EXISTS "Users can view their organization members" ON users;
DROP POLICY IF EXISTS "Users can update themselves" ON users;
DROP POLICY IF EXISTS "Users can create themselves" ON users;

-- ユーザーの閲覧: 自分自身は常に閲覧可能、同じ組織のメンバーも閲覧可能
CREATE POLICY "Users can view their organization members" ON users
    FOR SELECT USING (
        -- 自分自身は常に閲覧可能
        id = auth.uid() OR
        -- 同じ組織のメンバーも閲覧可能（無限再帰を避けるため、直接JOINを使用）
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
-- （サインアップ時にusersテーブルにレコードを作成するため）
CREATE POLICY "Users can create themselves" ON users
    FOR INSERT 
    WITH CHECK (
        id = auth.uid()
    );

-- ============================================
-- 2. Organizations テーブルのポリシー
-- ============================================

-- 既存のポリシーを削除
DROP POLICY IF EXISTS "Users can view their organization data" ON organizations;
DROP POLICY IF EXISTS "Users can create organizations" ON organizations;
DROP POLICY IF EXISTS "Users can update their organizations" ON organizations;

-- 組織の閲覧: 自分がメンバーである組織のみ
-- EXISTSを使用して無限再帰を回避
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
-- これが最も重要：組織作成時にはまだメンバーではないため、
-- organization_membersを参照できない
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
-- 3. Organization Members テーブルのポリシー確認
-- ============================================

-- 組織メンバーの作成ポリシーが正しく設定されているか確認
DROP POLICY IF EXISTS "Users can create organization members" ON organization_members;
CREATE POLICY "Users can create organization members" ON organization_members
    FOR INSERT 
    WITH CHECK (
        -- 自分自身を追加する場合（新規組織作成時）は常に許可
        user_id = auth.uid()
    );

-- ============================================
-- 4. ポリシーの確認クエリ（オプション）
-- ============================================

-- 以下のクエリでポリシーが正しく設定されているか確認できます
-- SELECT 
--     schemaname, 
--     tablename, 
--     policyname, 
--     cmd,
--     with_check
-- FROM pg_policies 
-- WHERE tablename IN ('organizations', 'organization_members', 'users')
-- ORDER BY tablename, policyname;

