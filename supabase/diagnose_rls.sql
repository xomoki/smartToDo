-- ============================================
-- RLSポリシー診断スクリプト
-- ============================================
-- このスクリプトを実行して、RLSポリシーの状態を確認してください
-- ============================================

-- 1. RLSが有効になっているか確認
SELECT 
    schemaname,
    tablename,
    rowsecurity as rls_enabled
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('organizations', 'organization_members', 'users')
ORDER BY tablename;

-- 2. すべてのポリシーを確認
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
WHERE tablename IN ('organizations', 'organization_members', 'users')
ORDER BY tablename, policyname;

-- 3. organizations テーブルのINSERTポリシーを詳細確認
SELECT 
    policyname,
    cmd,
    qual,
    with_check,
    permissive,
    roles
FROM pg_policies 
WHERE tablename = 'organizations' 
AND cmd = 'INSERT';

-- 4. 認証状態の確認（現在のユーザーIDを表示）
-- 注意: このクエリは認証されたユーザーのみが実行できます
SELECT 
    auth.uid() as current_user_id,
    CASE 
        WHEN auth.uid() IS NOT NULL THEN '認証済み'
        ELSE '未認証'
    END as auth_status;

-- 5. 現在のセッション情報（可能な場合）
-- 注意: このクエリはSupabaseの内部テーブルにアクセスするため、
-- 実行できない場合があります
-- SELECT * FROM auth.sessions LIMIT 1;

