-- 無限再帰を完全に解決する最終版RLSポリシー
-- このファイルを実行してください
-- 
-- 実行順序:
-- 1. 003_drop_all_policies.sql (すべてのポリシーを削除)
-- 2. このファイル (011_ultimate_no_recursion_fix.sql) を実行

-- ============================================
-- 1. Organizations テーブルのポリシー
-- ============================================

-- 既存のポリシーを削除
DROP POLICY IF EXISTS "Users can view their organization data" ON organizations;
DROP POLICY IF EXISTS "Users can create organizations" ON organizations;
DROP POLICY IF EXISTS "Users can update their organizations" ON organizations;

-- 組織の閲覧: 自分がメンバーである組織のみ
-- 重要: organization_membersを参照するが、organization_membersのSELECTポリシーは
-- organizationsを参照しないため、再帰は発生しない
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

-- 組織メンバーの閲覧: 
-- 重要: 無限再帰を完全に回避するため、organization_membersを一切参照しない
-- 自分自身のレコードは常に閲覧可能
-- 同じ組織のメンバーを見る場合は、organizationsテーブルのSELECTポリシーを利用
-- ただし、organizationsテーブルのSELECTポリシーがorganization_membersを参照するため、
-- 直接的な参照を避ける必要がある
-- 
-- 解決策: 自分自身のレコードのみ許可し、他のメンバーを見る場合は
-- アプリケーション側で別の方法を使用する
CREATE POLICY "Users can view organization members" ON organization_members
    FOR SELECT USING (
        -- 自分自身のレコードのみ閲覧可能
        -- これにより、無限再帰を完全に回避
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
-- 3. Users テーブルのポリシー
-- ============================================

-- 既存のポリシーを削除
DROP POLICY IF EXISTS "Users can view their organization members" ON users;
DROP POLICY IF EXISTS "Users can update themselves" ON users;
DROP POLICY IF EXISTS "Users can create themselves" ON users;

-- ユーザーの閲覧: 自分自身は常に閲覧可能
-- 注意: organization_membersを参照すると再帰が発生する可能性があるため、
-- 自分自身のみ閲覧可能とする
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

