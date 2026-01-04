-- 組織作成時のRLSポリシーエラーを修正
-- このファイルを実行してから、組織作成を試してください

-- 既存のポリシーを削除
DROP POLICY IF EXISTS "Users can create organizations" ON organizations;

-- 組織作成ポリシーを再作成（より明示的に）
-- 認証済みユーザーは誰でも組織を作成可能
CREATE POLICY "Users can create organizations" ON organizations
    FOR INSERT 
    WITH CHECK (
        -- 認証済みユーザーであることを確認
        auth.uid() IS NOT NULL
    );

-- ポリシーが正しく適用されているか確認するためのクエリ（オプション）
-- SELECT 
--     schemaname, 
--     tablename, 
--     policyname, 
--     permissive,
--     roles,
--     cmd,
--     qual,
--     with_check
-- FROM pg_policies 
-- WHERE tablename = 'organizations';

