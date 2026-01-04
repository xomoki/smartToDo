-- 組織作成時のRLSエラーを修正
-- このファイルを実行してください

-- 既存のINSERTポリシーを削除
DROP POLICY IF EXISTS "Users can create organizations" ON organizations;

-- 組織の作成: 認証済みユーザーは誰でも作成可能
-- 重要: 組織作成時にはまだメンバーではないため、organization_membersを参照しない
-- WITH CHECK句で認証状態のみをチェック
CREATE POLICY "Users can create organizations" ON organizations
    FOR INSERT 
    WITH CHECK (
        auth.uid() IS NOT NULL
    );

-- ポリシーが正しく設定されているか確認
-- SELECT 
--     tablename, 
--     policyname, 
--     cmd,
--     qual,
--     with_check
-- FROM pg_policies 
-- WHERE tablename = 'organizations' AND cmd = 'INSERT';

