-- ============================================
-- RLSポリシー強制修正スクリプト
-- ============================================
-- このスクリプトは、既存のポリシーを完全に削除し、
-- 正しいポリシーを再作成します。
-- 
-- 実行方法:
-- 1. Supabase Dashboard → SQL Editor を開く
-- 2. このファイルの内容をすべてコピー
-- 3. SQL Editorに貼り付けて実行（Runボタンをクリック）
-- ============================================

-- ============================================
-- ステップ1: すべての既存ポリシーを削除
-- ============================================

-- Organizations テーブルのポリシーをすべて削除
DROP POLICY IF EXISTS "Users can view their organization data" ON organizations;
DROP POLICY IF EXISTS "Users can create organizations" ON organizations;
DROP POLICY IF EXISTS "Users can update their organizations" ON organizations;
DROP POLICY IF EXISTS "Users can delete their organizations" ON organizations;

-- Organization Members テーブルのポリシーをすべて削除
DROP POLICY IF EXISTS "Users can view organization members" ON organization_members;
DROP POLICY IF EXISTS "Users can create organization members" ON organization_members;
DROP POLICY IF EXISTS "Users can update organization members" ON organization_members;
DROP POLICY IF EXISTS "Users can delete organization members" ON organization_members;

-- Users テーブルのポリシーをすべて削除
DROP POLICY IF EXISTS "Users can view their organization members" ON users;
DROP POLICY IF EXISTS "Users can update themselves" ON users;
DROP POLICY IF EXISTS "Users can create themselves" ON users;

-- ============================================
-- ステップ2: RLSを一度無効にしてから再度有効化
-- ============================================

-- RLSを無効化（一時的）
ALTER TABLE organizations DISABLE ROW LEVEL SECURITY;
ALTER TABLE organization_members DISABLE ROW LEVEL SECURITY;
ALTER TABLE users DISABLE ROW LEVEL SECURITY;

-- RLSを再度有効化
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE organization_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- ============================================
-- ステップ3: Organizations テーブルのポリシーを再作成
-- ============================================

-- 組織の閲覧: 自分がメンバーである組織のみ
CREATE POLICY "Users can view their organization data" ON organizations
    FOR SELECT 
    USING (
        EXISTS (
            SELECT 1 
            FROM organization_members 
            WHERE organization_id = organizations.id
            AND user_id = auth.uid()
        )
    );

-- 組織の作成: 認証済みユーザーは誰でも作成可能
-- 重要: WITH CHECK句のみを使用（USING句は使用しない）
-- これにより、組織作成時（まだメンバーではない）でも作成可能
CREATE POLICY "Users can create organizations" ON organizations
    FOR INSERT 
    WITH CHECK (
        auth.uid() IS NOT NULL
    );

-- 組織の更新: 自分がadminまたはmanagerである組織のみ
CREATE POLICY "Users can update their organizations" ON organizations
    FOR UPDATE 
    USING (
        EXISTS (
            SELECT 1 
            FROM organization_members 
            WHERE organization_id = organizations.id
            AND user_id = auth.uid() 
            AND role IN ('admin', 'manager')
        )
    );

-- ============================================
-- ステップ4: Organization Members テーブルのポリシーを再作成
-- ============================================

-- 組織メンバーの閲覧: 自分自身のレコードのみ
-- これにより、無限再帰を完全に回避
CREATE POLICY "Users can view organization members" ON organization_members
    FOR SELECT 
    USING (
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
    FOR UPDATE 
    USING (
        user_id = auth.uid()
    );

-- ============================================
-- ステップ5: Users テーブルのポリシーを再作成
-- ============================================

-- ユーザーの閲覧: 自分自身のみ
CREATE POLICY "Users can view their organization members" ON users
    FOR SELECT 
    USING (
        id = auth.uid()
    );

-- ユーザーの更新: 自分自身のみ
CREATE POLICY "Users can update themselves" ON users
    FOR UPDATE 
    USING (
        id = auth.uid()
    );

-- ユーザーの作成: 認証済みユーザーが自分自身のレコードを作成可能
CREATE POLICY "Users can create themselves" ON users
    FOR INSERT 
    WITH CHECK (
        id = auth.uid()
    );

-- ============================================
-- ステップ6: ポリシーの確認
-- ============================================

-- 以下のクエリでポリシーが正しく設定されているか確認
SELECT 
    tablename, 
    policyname, 
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename IN ('organizations', 'organization_members', 'users')
ORDER BY tablename, policyname;

-- ============================================
-- 完了
-- ============================================
-- このスクリプトが正常に完了したら、以下を確認してください：
-- 1. organizations テーブルに "Users can create organizations" ポリシーが存在する
-- 2. そのポリシーの with_check が "auth.uid() IS NOT NULL" である
-- 3. ブラウザをリフレッシュして、再度ログイン
-- 4. 組織作成を試す

