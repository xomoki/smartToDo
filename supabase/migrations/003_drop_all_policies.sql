-- すべてのRLSポリシーを削除するスクリプト
-- このファイルを実行してから、002_rls_policies.sqlを実行してください

-- ============================================
-- Organizations (組織)
-- ============================================
DROP POLICY IF EXISTS "Users can view their organization data" ON organizations;
DROP POLICY IF EXISTS "Users can create organizations" ON organizations;
DROP POLICY IF EXISTS "Users can update their organizations" ON organizations;

-- ============================================
-- Teams (チーム)
-- ============================================
DROP POLICY IF EXISTS "Users can view their teams" ON teams;
DROP POLICY IF EXISTS "Users can create teams" ON teams;
DROP POLICY IF EXISTS "Users can update their teams" ON teams;

-- ============================================
-- Users (ユーザー)
-- ============================================
DROP POLICY IF EXISTS "Users can view their organization members" ON users;
DROP POLICY IF EXISTS "Users can update themselves" ON users;

-- ============================================
-- Organization Members (組織メンバー)
-- ============================================
DROP POLICY IF EXISTS "Users can view organization members" ON organization_members;
DROP POLICY IF EXISTS "Users can create organization members" ON organization_members;
DROP POLICY IF EXISTS "Users can update organization members" ON organization_members;

-- ============================================
-- Team Members (チームメンバー)
-- ============================================
DROP POLICY IF EXISTS "Users can view team members" ON team_members;
DROP POLICY IF EXISTS "Users can create team members" ON team_members;

-- ============================================
-- Tasks (タスク)
-- ============================================
DROP POLICY IF EXISTS "Users can view tasks" ON tasks;
DROP POLICY IF EXISTS "Users can create tasks" ON tasks;
DROP POLICY IF EXISTS "Users can update tasks" ON tasks;
DROP POLICY IF EXISTS "Users can delete tasks" ON tasks;

-- ============================================
-- Task Time Logs (工数ログ)
-- ============================================
DROP POLICY IF EXISTS "Users can view their time logs" ON task_time_logs;
DROP POLICY IF EXISTS "Users can create time logs" ON task_time_logs;

-- ============================================
-- Integrations (外部ツール連携)
-- ============================================
DROP POLICY IF EXISTS "Users can view integrations" ON integrations;
DROP POLICY IF EXISTS "Users can create integrations" ON integrations;
DROP POLICY IF EXISTS "Users can update integrations" ON integrations;

-- ============================================
-- Invitations (招待)
-- ============================================
DROP POLICY IF EXISTS "Users can view invitations" ON invitations;
DROP POLICY IF EXISTS "Users can create invitations" ON invitations;

-- ============================================
-- AI Learning Data (AI学習データ)
-- ============================================
DROP POLICY IF EXISTS "Users can view AI learning data" ON ai_learning_data;
DROP POLICY IF EXISTS "Users can create AI learning data" ON ai_learning_data;

-- ============================================
-- Notifications (通知設定)
-- ============================================
DROP POLICY IF EXISTS "Users can view notifications" ON notifications;
DROP POLICY IF EXISTS "Users can manage notifications" ON notifications;

-- ============================================
-- AI Insights (AIインサイト)
-- ============================================
DROP POLICY IF EXISTS "Users can view AI insights" ON ai_insights;
DROP POLICY IF EXISTS "Users can create AI insights" ON ai_insights;

