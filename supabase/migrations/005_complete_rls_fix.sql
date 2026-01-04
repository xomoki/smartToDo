-- 組織作成時のRLSエラーを完全に修正
-- このファイルを実行してください

-- ============================================
-- 1. 既存のポリシーをすべて削除
-- ============================================

-- Organizations
DROP POLICY IF EXISTS "Users can view their organization data" ON organizations;
DROP POLICY IF EXISTS "Users can create organizations" ON organizations;
DROP POLICY IF EXISTS "Users can update their organizations" ON organizations;

-- ============================================
-- 2. Organizations テーブルのポリシーを再作成
-- ============================================

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
-- 自分自身を追加する場合のみ許可（無限再帰を避けるため）
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
-- WHERE tablename IN ('organizations', 'organization_members')
-- ORDER BY tablename, policyname;

