-- ============================================
-- SmartToDo 完全データベースセットアップ
-- ============================================
-- このファイルを実行すると、すべてのテーブル、RLSポリシー、初期データが設定されます
-- 
-- 実行方法:
-- 1. Supabase Dashboard → SQL Editor を開く
-- 2. このファイルの内容をすべてコピー
-- 3. SQL Editorに貼り付けて実行（Runボタンをクリック）
-- ============================================

-- ============================================
-- ステップ1: 拡張機能の有効化
-- ============================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- ステップ2: 既存のポリシーをすべて削除（クリーンアップ）
-- ============================================
DROP POLICY IF EXISTS "Users can view their organization data" ON organizations;
DROP POLICY IF EXISTS "Users can create organizations" ON organizations;
DROP POLICY IF EXISTS "Users can update their organizations" ON organizations;
DROP POLICY IF EXISTS "Users can view organization members" ON organization_members;
DROP POLICY IF EXISTS "Users can create organization members" ON organization_members;
DROP POLICY IF EXISTS "Users can update organization members" ON organization_members;
DROP POLICY IF EXISTS "Users can view their organization members" ON users;
DROP POLICY IF EXISTS "Users can update themselves" ON users;
DROP POLICY IF EXISTS "Users can create themselves" ON users;

-- ============================================
-- ステップ3: テーブルの作成（既に存在する場合はスキップ）
-- ============================================

-- 1. organizations (組織)
CREATE TABLE IF NOT EXISTS organizations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL UNIQUE,
    slug VARCHAR(100) NOT NULL UNIQUE,
    plan VARCHAR(50) NOT NULL DEFAULT 'free',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX IF NOT EXISTS idx_organizations_slug ON organizations(slug);
CREATE INDEX IF NOT EXISTS idx_organizations_deleted_at ON organizations(deleted_at);

-- 2. users (ユーザー)
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email VARCHAR(255) NOT NULL UNIQUE,
    name VARCHAR(255) NOT NULL,
    avatar_url VARCHAR(500),
    role VARCHAR(50) NOT NULL DEFAULT 'member',
    email_verified BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_deleted_at ON users(deleted_at);

-- 3. teams (チーム)
CREATE TABLE IF NOT EXISTS teams (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMP WITH TIME ZONE,
    UNIQUE(organization_id, name)
);

CREATE INDEX IF NOT EXISTS idx_teams_organization_id ON teams(organization_id);
CREATE INDEX IF NOT EXISTS idx_teams_deleted_at ON teams(deleted_at);

-- 4. organization_members (組織メンバー)
CREATE TABLE IF NOT EXISTS organization_members (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    role VARCHAR(50) NOT NULL DEFAULT 'member',
    invited_by UUID REFERENCES auth.users(id),
    invited_at TIMESTAMP WITH TIME ZONE,
    joined_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    UNIQUE(organization_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_org_members_org_id ON organization_members(organization_id);
CREATE INDEX IF NOT EXISTS idx_org_members_user_id ON organization_members(user_id);

-- 5. team_members (チームメンバー)
CREATE TABLE IF NOT EXISTS team_members (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    role VARCHAR(50) NOT NULL DEFAULT 'member',
    joined_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    UNIQUE(team_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_team_members_team_id ON team_members(team_id);
CREATE INDEX IF NOT EXISTS idx_team_members_user_id ON team_members(user_id);

-- 6. integrations (外部ツール連携)
CREATE TABLE IF NOT EXISTS integrations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL,
    name VARCHAR(255) NOT NULL,
    enabled BOOLEAN NOT NULL DEFAULT TRUE,
    status VARCHAR(50) NOT NULL DEFAULT 'disconnected',
    config JSONB NOT NULL DEFAULT '{}',
    last_sync_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_integrations_org_id ON integrations(organization_id);
CREATE INDEX IF NOT EXISTS idx_integrations_type ON integrations(type);

-- 7. tasks (タスク)
CREATE TABLE IF NOT EXISTS tasks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    team_id UUID REFERENCES teams(id) ON DELETE SET NULL,
    source_system VARCHAR(50) NOT NULL,
    external_id VARCHAR(255) NOT NULL,
    integration_id UUID REFERENCES integrations(id) ON DELETE SET NULL,
    title VARCHAR(500) NOT NULL,
    description TEXT,
    status VARCHAR(50) NOT NULL DEFAULT 'todo',
    priority VARCHAR(50) NOT NULL DEFAULT 'medium',
    assignee_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    ai_category VARCHAR(100),
    manual_category VARCHAR(100),
    estimated_time INTEGER,
    due_date DATE,
    parent_task_id UUID REFERENCES tasks(id) ON DELETE SET NULL,
    context_tags TEXT[],
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMP WITH TIME ZONE,
    UNIQUE(integration_id, source_system, external_id)
);

CREATE INDEX IF NOT EXISTS idx_tasks_org_id ON tasks(organization_id);
CREATE INDEX IF NOT EXISTS idx_tasks_team_id ON tasks(team_id);
CREATE INDEX IF NOT EXISTS idx_tasks_source_external ON tasks(source_system, external_id);
CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);
CREATE INDEX IF NOT EXISTS idx_tasks_assignee ON tasks(assignee_id);
CREATE INDEX IF NOT EXISTS idx_tasks_due_date ON tasks(due_date);
CREATE INDEX IF NOT EXISTS idx_tasks_deleted_at ON tasks(deleted_at);

-- 8. task_time_logs (工数ログ)
CREATE TABLE IF NOT EXISTS task_time_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    start_time TIME,
    end_time TIME,
    duration_minutes INTEGER NOT NULL,
    category VARCHAR(100),
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_time_logs_task_id ON task_time_logs(task_id);
CREATE INDEX IF NOT EXISTS idx_time_logs_user_id ON task_time_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_time_logs_date ON task_time_logs(date);

-- 9. ai_learning_data (AI学習データ)
CREATE TABLE IF NOT EXISTS ai_learning_data (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    estimated_time INTEGER NOT NULL,
    actual_time INTEGER NOT NULL,
    gap_percentage DECIMAL(5,2) NOT NULL,
    category VARCHAR(100),
    context_tags TEXT[],
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ai_learning_org_id ON ai_learning_data(organization_id);
CREATE INDEX IF NOT EXISTS idx_ai_learning_user_id ON ai_learning_data(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_learning_created_at ON ai_learning_data(created_at);

-- 10. notifications (通知設定)
CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL,
    enabled BOOLEAN NOT NULL DEFAULT TRUE,
    config JSONB NOT NULL DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    UNIQUE(organization_id, type)
);

CREATE INDEX IF NOT EXISTS idx_notifications_org_id ON notifications(organization_id);

-- 11. invitations (招待)
CREATE TABLE IF NOT EXISTS invitations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    team_id UUID REFERENCES teams(id) ON DELETE CASCADE,
    email VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL DEFAULT 'member',
    token VARCHAR(255) NOT NULL UNIQUE,
    invited_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    accepted_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_invitations_token ON invitations(token);
CREATE INDEX IF NOT EXISTS idx_invitations_email ON invitations(email);
CREATE INDEX IF NOT EXISTS idx_invitations_org_id ON invitations(organization_id);

-- 12. ai_insights (AIインサイト)
CREATE TABLE IF NOT EXISTS ai_insights (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    team_id UUID REFERENCES teams(id) ON DELETE SET NULL,
    period_start DATE NOT NULL,
    period_end DATE NOT NULL,
    insights JSONB NOT NULL DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ai_insights_org_id ON ai_insights(organization_id);
CREATE INDEX IF NOT EXISTS idx_ai_insights_period ON ai_insights(period_start, period_end);

-- ============================================
-- ステップ4: Row Level Security (RLS) の有効化
-- ============================================
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE organization_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE integrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_time_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_learning_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_insights ENABLE ROW LEVEL SECURITY;

-- ============================================
-- ステップ5: RLSポリシーの設定
-- ============================================

-- ============================================
-- 5.1 Organizations テーブルのポリシー
-- ============================================

-- 組織の閲覧: 自分がメンバーである組織のみ
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
-- WITH CHECK句でauth.uid()のみをチェックすることで、確実に作成可能にする
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
-- 5.2 Organization Members テーブルのポリシー
-- ============================================

-- 組織メンバーの閲覧: 自分自身のレコードのみ
-- これにより、無限再帰を完全に回避
CREATE POLICY "Users can view organization members" ON organization_members
    FOR SELECT USING (
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
-- 5.3 Users テーブルのポリシー
-- ============================================

-- ユーザーの閲覧: 自分自身のみ
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
-- ステップ6: 更新日時を自動更新する関数とトリガー
-- ============================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_organizations_updated_at ON organizations;
CREATE TRIGGER update_organizations_updated_at BEFORE UPDATE ON organizations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_users_updated_at ON users;
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_teams_updated_at ON teams;
CREATE TRIGGER update_teams_updated_at BEFORE UPDATE ON teams
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_integrations_updated_at ON integrations;
CREATE TRIGGER update_integrations_updated_at BEFORE UPDATE ON integrations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_tasks_updated_at ON tasks;
CREATE TRIGGER update_tasks_updated_at BEFORE UPDATE ON tasks
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_notifications_updated_at ON notifications;
CREATE TRIGGER update_notifications_updated_at BEFORE UPDATE ON notifications
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- ステップ7: ポリシーの確認（オプション）
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

-- ============================================
-- 完了
-- ============================================
-- このマイグレーションが正常に完了したら、アプリケーションで組織作成が可能になります。

