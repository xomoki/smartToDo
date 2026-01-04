-- Row Level Security (RLS) ポリシーの設定
-- このファイルをSupabase SQL Editorで実行してください

-- 既存のポリシーを削除（再実行可能にするため）
DROP POLICY IF EXISTS "Users can view their organization data" ON organizations;
DROP POLICY IF EXISTS "Users can create organizations" ON organizations;
DROP POLICY IF EXISTS "Users can update their organizations" ON organizations;
DROP POLICY IF EXISTS "Users can view their teams" ON teams;
DROP POLICY IF EXISTS "Users can create teams" ON teams;
DROP POLICY IF EXISTS "Users can update their teams" ON teams;
DROP POLICY IF EXISTS "Users can view organization members" ON organization_members;
DROP POLICY IF EXISTS "Users can create organization members" ON organization_members;
DROP POLICY IF EXISTS "Users can view team members" ON team_members;
DROP POLICY IF EXISTS "Users can create team members" ON team_members;
DROP POLICY IF EXISTS "Users can view tasks" ON tasks;
DROP POLICY IF EXISTS "Users can create tasks" ON tasks;
DROP POLICY IF EXISTS "Users can update tasks" ON tasks;
DROP POLICY IF EXISTS "Users can view their time logs" ON task_time_logs;
DROP POLICY IF EXISTS "Users can create time logs" ON task_time_logs;

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
        id IN (
            SELECT organization_id 
            FROM organization_members 
            WHERE user_id = auth.uid() 
            AND role IN ('admin', 'manager')
        )
    );

-- ============================================
-- Teams (チーム)
-- ============================================

-- チームの閲覧: 自分が所属する組織のチームのみ
CREATE POLICY "Users can view their teams" ON teams
    FOR SELECT USING (
        organization_id IN (
            SELECT organization_id 
            FROM organization_members 
            WHERE user_id = auth.uid()
        )
    );

-- チームの作成: 自分が所属する組織のチームのみ作成可能
CREATE POLICY "Users can create teams" ON teams
    FOR INSERT 
    WITH CHECK (
        organization_id IN (
            SELECT organization_id 
            FROM organization_members 
            WHERE user_id = auth.uid()
        )
    );

-- チームの更新: 自分がadminまたはmanagerである組織のチームのみ
CREATE POLICY "Users can update their teams" ON teams
    FOR UPDATE USING (
        organization_id IN (
            SELECT organization_id 
            FROM organization_members 
            WHERE user_id = auth.uid() 
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

-- 組織メンバーの閲覧: 自分が所属する組織のメンバーのみ
CREATE POLICY "Users can view organization members" ON organization_members
    FOR SELECT USING (
        organization_id IN (
            SELECT organization_id 
            FROM organization_members 
            WHERE user_id = auth.uid()
        )
    );

-- 組織メンバーの作成: 自分がadminまたはmanagerである組織のみ
CREATE POLICY "Users can create organization members" ON organization_members
    FOR INSERT 
    WITH CHECK (
        organization_id IN (
            SELECT organization_id 
            FROM organization_members 
            WHERE user_id = auth.uid() 
            AND role IN ('admin', 'manager')
        )
    );

-- 組織メンバーの更新: 自分がadminである組織のみ
CREATE POLICY "Users can update organization members" ON organization_members
    FOR UPDATE USING (
        organization_id IN (
            SELECT organization_id 
            FROM organization_members 
            WHERE user_id = auth.uid() 
            AND role = 'admin'
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
        organization_id IN (
            SELECT organization_id 
            FROM organization_members 
            WHERE user_id = auth.uid()
        )
    );

-- タスクの作成: 自分が所属する組織のタスクのみ作成可能
CREATE POLICY "Users can create tasks" ON tasks
    FOR INSERT 
    WITH CHECK (
        organization_id IN (
            SELECT organization_id 
            FROM organization_members 
            WHERE user_id = auth.uid()
        )
    );

-- タスクの更新: 自分が所属する組織のタスクのみ更新可能
CREATE POLICY "Users can update tasks" ON tasks
    FOR UPDATE USING (
        organization_id IN (
            SELECT organization_id 
            FROM organization_members 
            WHERE user_id = auth.uid()
        )
    );

-- タスクの削除: 自分がadminまたはmanagerである組織のタスクのみ
CREATE POLICY "Users can delete tasks" ON tasks
    FOR DELETE USING (
        organization_id IN (
            SELECT organization_id 
            FROM organization_members 
            WHERE user_id = auth.uid() 
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
        organization_id IN (
            SELECT organization_id 
            FROM organization_members 
            WHERE user_id = auth.uid()
        )
    );

-- 連携の作成: 自分がadminまたはmanagerである組織のみ
CREATE POLICY "Users can create integrations" ON integrations
    FOR INSERT 
    WITH CHECK (
        organization_id IN (
            SELECT organization_id 
            FROM organization_members 
            WHERE user_id = auth.uid() 
            AND role IN ('admin', 'manager')
        )
    );

-- 連携の更新: 自分がadminまたはmanagerである組織のみ
CREATE POLICY "Users can update integrations" ON integrations
    FOR UPDATE USING (
        organization_id IN (
            SELECT organization_id 
            FROM organization_members 
            WHERE user_id = auth.uid() 
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
        organization_id IN (
            SELECT organization_id 
            FROM organization_members 
            WHERE user_id = auth.uid()
        )
    );

-- AI学習データの作成: 自分が所属する組織のデータのみ作成可能
CREATE POLICY "Users can create AI learning data" ON ai_learning_data
    FOR INSERT 
    WITH CHECK (
        organization_id IN (
            SELECT organization_id 
            FROM organization_members 
            WHERE user_id = auth.uid()
        ) AND
        user_id = auth.uid()
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
        organization_id IN (
            SELECT organization_id 
            FROM organization_members 
            WHERE user_id = auth.uid()
        )
    );

-- AIインサイトの作成: システムのみ（通常はAPI経由）
CREATE POLICY "Users can create AI insights" ON ai_insights
    FOR INSERT 
    WITH CHECK (
        organization_id IN (
            SELECT organization_id 
            FROM organization_members 
            WHERE user_id = auth.uid()
        )
    );

