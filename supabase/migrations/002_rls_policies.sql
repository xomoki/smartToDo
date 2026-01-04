-- Row Level Security (RLS) ポリシーの設定
-- このファイルをSupabase SQL Editorで実行してください
-- 
-- 注意: 既存のポリシーを削除する場合は、先に 003_drop_all_policies.sql を実行してください

-- 既存のポリシーを削除（再実行可能にするため）
-- すべてのポリシーを削除する場合は、003_drop_all_policies.sql を使用してください
DROP POLICY IF EXISTS "Users can view their organization data" ON organizations;
DROP POLICY IF EXISTS "Users can create organizations" ON organizations;
DROP POLICY IF EXISTS "Users can update their organizations" ON organizations;
DROP POLICY IF EXISTS "Users can view their teams" ON teams;
DROP POLICY IF EXISTS "Users can create teams" ON teams;
DROP POLICY IF EXISTS "Users can update their teams" ON teams;
DROP POLICY IF EXISTS "Users can view their organization members" ON users;
DROP POLICY IF EXISTS "Users can update themselves" ON users;
DROP POLICY IF EXISTS "Users can view organization members" ON organization_members;
DROP POLICY IF EXISTS "Users can create organization members" ON organization_members;
DROP POLICY IF EXISTS "Users can update organization members" ON organization_members;
DROP POLICY IF EXISTS "Users can view team members" ON team_members;
DROP POLICY IF EXISTS "Users can create team members" ON team_members;
DROP POLICY IF EXISTS "Users can view tasks" ON tasks;
DROP POLICY IF EXISTS "Users can create tasks" ON tasks;
DROP POLICY IF EXISTS "Users can update tasks" ON tasks;
DROP POLICY IF EXISTS "Users can delete tasks" ON tasks;
DROP POLICY IF EXISTS "Users can view their time logs" ON task_time_logs;
DROP POLICY IF EXISTS "Users can create time logs" ON task_time_logs;
DROP POLICY IF EXISTS "Users can view integrations" ON integrations;
DROP POLICY IF EXISTS "Users can create integrations" ON integrations;
DROP POLICY IF EXISTS "Users can update integrations" ON integrations;
DROP POLICY IF EXISTS "Users can view invitations" ON invitations;
DROP POLICY IF EXISTS "Users can create invitations" ON invitations;
DROP POLICY IF EXISTS "Users can view AI learning data" ON ai_learning_data;
DROP POLICY IF EXISTS "Users can create AI learning data" ON ai_learning_data;
DROP POLICY IF EXISTS "Users can view notifications" ON notifications;
DROP POLICY IF EXISTS "Users can manage notifications" ON notifications;
DROP POLICY IF EXISTS "Users can view AI insights" ON ai_insights;
DROP POLICY IF EXISTS "Users can create AI insights" ON ai_insights;

-- ============================================
-- Organizations (組織)
-- ============================================

-- 組織の閲覧: 自分がメンバーである組織のみ
CREATE POLICY "Users can view their organization data" ON organizations
    FOR SELECT USING (
        id IN (
            SELECT organization_id 
            FROM organization_members 
            WHERE user_id = auth.uid()
        )
    );

-- 組織の作成: 認証済みユーザーは誰でも作成可能
CREATE POLICY "Users can create organizations" ON organizations
    FOR INSERT 
    WITH CHECK (auth.uid() IS NOT NULL);

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
-- Teams (チーム)
-- ============================================

-- チームの閲覧: 自分が所属する組織のチームのみ
CREATE POLICY "Users can view their teams" ON teams
    FOR SELECT USING (
        EXISTS (
            SELECT 1 
            FROM organization_members 
            WHERE organization_id = teams.organization_id
            AND user_id = auth.uid()
        )
    );

-- チームの作成: 自分が所属する組織のチームのみ作成可能
CREATE POLICY "Users can create teams" ON teams
    FOR INSERT 
    WITH CHECK (
        EXISTS (
            SELECT 1 
            FROM organization_members 
            WHERE organization_id = teams.organization_id
            AND user_id = auth.uid()
        )
    );

-- チームの更新: 自分がadminまたはmanagerである組織のチームのみ
CREATE POLICY "Users can update their teams" ON teams
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 
            FROM organization_members 
            WHERE organization_id = teams.organization_id
            AND user_id = auth.uid() 
            AND role IN ('admin', 'manager')
        )
    );

-- ============================================
-- Users (ユーザー)
-- ============================================

-- ユーザーの閲覧: 自分自身または同じ組織のメンバー
CREATE POLICY "Users can view their organization members" ON users
    FOR SELECT USING (
        id = auth.uid() OR
        id IN (
            SELECT user_id 
            FROM organization_members 
            WHERE organization_id IN (
                SELECT organization_id 
                FROM organization_members 
                WHERE user_id = auth.uid()
            )
        )
    );

-- ユーザーの更新: 自分自身のみ
CREATE POLICY "Users can update themselves" ON users
    FOR UPDATE USING (id = auth.uid());

-- ============================================
-- Organization Members (組織メンバー)
-- ============================================

-- 組織メンバーの閲覧: 自分自身のレコード、または自分が所属する組織のメンバー
-- 無限再帰を避けるため、直接user_idをチェック
CREATE POLICY "Users can view organization members" ON organization_members
    FOR SELECT USING (
        -- 自分自身のレコード
        user_id = auth.uid() OR
        -- 自分が所属する組織のメンバー（organizationsテーブルを経由してチェック）
        EXISTS (
            SELECT 1 
            FROM organizations o
            WHERE o.id = organization_members.organization_id
            AND EXISTS (
                SELECT 1 
                FROM organization_members om
                WHERE om.organization_id = o.id
                AND om.user_id = auth.uid()
            )
        )
    );

-- 組織メンバーの作成: 
-- 1. 自分自身を組織に追加する場合（新規組織作成時）は常に許可
-- 2. 他のユーザーを追加する場合は、サーバーサイド関数を使用することを推奨
--    ここでは、自分自身を追加する場合のみ許可（無限再帰を避けるため）
CREATE POLICY "Users can create organization members" ON organization_members
    FOR INSERT 
    WITH CHECK (
        -- 自分自身を追加する場合（新規組織作成時）は常に許可
        user_id = auth.uid()
    );

-- 組織メンバーの更新: 自分がadminである組織のみ
-- 無限再帰を避けるため、直接user_idをチェック
CREATE POLICY "Users can update organization members" ON organization_members
    FOR UPDATE USING (
        -- 自分自身のレコードを更新する場合（ロール変更など）
        user_id = auth.uid() OR
        -- 自分がadminである組織のメンバーを更新する場合
        EXISTS (
            SELECT 1 
            FROM organization_members om
            WHERE om.organization_id = organization_members.organization_id
            AND om.user_id = auth.uid()
            AND om.role = 'admin'
        )
    );

-- ============================================
-- Team Members (チームメンバー)
-- ============================================

-- チームメンバーの閲覧: 自分が所属する組織のチームメンバーのみ
CREATE POLICY "Users can view team members" ON team_members
    FOR SELECT USING (
        team_id IN (
            SELECT id 
            FROM teams 
            WHERE organization_id IN (
                SELECT organization_id 
                FROM organization_members 
                WHERE user_id = auth.uid()
            )
        )
    );

-- チームメンバーの作成: 自分がadminまたはmanagerである組織のチームのみ
CREATE POLICY "Users can create team members" ON team_members
    FOR INSERT 
    WITH CHECK (
        team_id IN (
            SELECT id 
            FROM teams 
            WHERE organization_id IN (
                SELECT organization_id 
                FROM organization_members 
                WHERE user_id = auth.uid() 
                AND role IN ('admin', 'manager')
            )
        )
    );

-- ============================================
-- Tasks (タスク)
-- ============================================

-- タスクの閲覧: 自分が所属する組織のタスクのみ
CREATE POLICY "Users can view tasks" ON tasks
    FOR SELECT USING (
        EXISTS (
            SELECT 1 
            FROM organization_members 
            WHERE organization_id = tasks.organization_id
            AND user_id = auth.uid()
        )
    );

-- タスクの作成: 自分が所属する組織のタスクのみ作成可能
CREATE POLICY "Users can create tasks" ON tasks
    FOR INSERT 
    WITH CHECK (
        EXISTS (
            SELECT 1 
            FROM organization_members 
            WHERE organization_id = tasks.organization_id
            AND user_id = auth.uid()
        )
    );

-- タスクの更新: 自分が所属する組織のタスクのみ更新可能
CREATE POLICY "Users can update tasks" ON tasks
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 
            FROM organization_members 
            WHERE organization_id = tasks.organization_id
            AND user_id = auth.uid()
        )
    );

-- タスクの削除: 自分がadminまたはmanagerである組織のタスクのみ
CREATE POLICY "Users can delete tasks" ON tasks
    FOR DELETE USING (
        EXISTS (
            SELECT 1 
            FROM organization_members 
            WHERE organization_id = tasks.organization_id
            AND user_id = auth.uid() 
            AND role IN ('admin', 'manager')
        )
    );

-- ============================================
-- Task Time Logs (工数ログ)
-- ============================================

-- 工数ログの閲覧: 自分が所属する組織のタスクのログのみ
CREATE POLICY "Users can view their time logs" ON task_time_logs
    FOR SELECT USING (
        task_id IN (
            SELECT id 
            FROM tasks 
            WHERE organization_id IN (
                SELECT organization_id 
                FROM organization_members 
                WHERE user_id = auth.uid()
            )
        )
    );

-- 工数ログの作成: 自分が所属する組織のタスクのログのみ作成可能
CREATE POLICY "Users can create time logs" ON task_time_logs
    FOR INSERT 
    WITH CHECK (
        user_id = auth.uid() AND
        task_id IN (
            SELECT id 
            FROM tasks 
            WHERE organization_id IN (
                SELECT organization_id 
                FROM organization_members 
                WHERE user_id = auth.uid()
            )
        )
    );

-- ============================================
-- Integrations (外部ツール連携)
-- ============================================

-- 連携の閲覧: 自分が所属する組織の連携のみ
CREATE POLICY "Users can view integrations" ON integrations
    FOR SELECT USING (
        EXISTS (
            SELECT 1 
            FROM organization_members 
            WHERE organization_id = integrations.organization_id
            AND user_id = auth.uid()
        )
    );

-- 連携の作成: 自分がadminまたはmanagerである組織のみ
CREATE POLICY "Users can create integrations" ON integrations
    FOR INSERT 
    WITH CHECK (
        EXISTS (
            SELECT 1 
            FROM organization_members 
            WHERE organization_id = integrations.organization_id
            AND user_id = auth.uid() 
            AND role IN ('admin', 'manager')
        )
    );

-- 連携の更新: 自分がadminまたはmanagerである組織のみ
CREATE POLICY "Users can update integrations" ON integrations
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 
            FROM organization_members 
            WHERE organization_id = integrations.organization_id
            AND user_id = auth.uid() 
            AND role IN ('admin', 'manager')
        )
    );

-- ============================================
-- Invitations (招待)
-- ============================================

-- 招待の閲覧: 自分がadminまたはmanagerである組織の招待のみ
CREATE POLICY "Users can view invitations" ON invitations
    FOR SELECT USING (
        organization_id IN (
            SELECT organization_id 
            FROM organization_members 
            WHERE user_id = auth.uid() 
            AND role IN ('admin', 'manager')
        )
    );

-- 招待の作成: 自分がadminまたはmanagerである組織のみ
CREATE POLICY "Users can create invitations" ON invitations
    FOR INSERT 
    WITH CHECK (
        organization_id IN (
            SELECT organization_id 
            FROM organization_members 
            WHERE user_id = auth.uid() 
            AND role IN ('admin', 'manager')
        ) AND
        invited_by = auth.uid()
    );

-- ============================================
-- AI Learning Data (AI学習データ)
-- ============================================

-- AI学習データの閲覧: 自分が所属する組織のデータのみ
CREATE POLICY "Users can view AI learning data" ON ai_learning_data
    FOR SELECT USING (
        EXISTS (
            SELECT 1 
            FROM organization_members 
            WHERE organization_id = ai_learning_data.organization_id
            AND user_id = auth.uid()
        )
    );

-- AI学習データの作成: 自分が所属する組織のデータのみ作成可能
CREATE POLICY "Users can create AI learning data" ON ai_learning_data
    FOR INSERT 
    WITH CHECK (
        user_id = auth.uid() AND
        EXISTS (
            SELECT 1 
            FROM organization_members 
            WHERE organization_id = ai_learning_data.organization_id
            AND user_id = auth.uid()
        )
    );

-- ============================================
-- Notifications (通知設定)
-- ============================================

-- 通知設定の閲覧: 自分が所属する組織の設定のみ
CREATE POLICY "Users can view notifications" ON notifications
    FOR SELECT USING (
        organization_id IN (
            SELECT organization_id 
            FROM organization_members 
            WHERE user_id = auth.uid()
        )
    );

-- 通知設定の作成・更新: 自分がadminまたはmanagerである組織のみ
CREATE POLICY "Users can manage notifications" ON notifications
    FOR ALL 
    USING (
        organization_id IN (
            SELECT organization_id 
            FROM organization_members 
            WHERE user_id = auth.uid() 
            AND role IN ('admin', 'manager')
        )
    );

-- ============================================
-- AI Insights (AIインサイト)
-- ============================================

-- AIインサイトの閲覧: 自分が所属する組織のインサイトのみ
CREATE POLICY "Users can view AI insights" ON ai_insights
    FOR SELECT USING (
        EXISTS (
            SELECT 1 
            FROM organization_members 
            WHERE organization_id = ai_insights.organization_id
            AND user_id = auth.uid()
        )
    );

-- AIインサイトの作成: システムのみ（通常はAPI経由）
CREATE POLICY "Users can create AI insights" ON ai_insights
    FOR INSERT 
    WITH CHECK (
        EXISTS (
            SELECT 1 
            FROM organization_members 
            WHERE organization_id = ai_insights.organization_id
            AND user_id = auth.uid()
        )
    );

