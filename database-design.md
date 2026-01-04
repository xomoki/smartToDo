# SmartToDo データベース設計書

## 概要

SmartToDoは、複数の外部ツール（Jira, Salesforce, Notion）からタスクデータを統合し、AIによる分析と可視化を行うSaaSプラットフォームです。本ドキュメントでは、このアプリケーションに必要なデータベース設計を提案します。

## データベース選定

**推奨DBMS:** PostgreSQL 14以上

**選定理由:**
- リレーショナルデータの複雑なクエリに対応
- JSON型サポート（柔軟なメタデータ保存）
- トランザクション処理の信頼性
- スケーラビリティ
- オープンソースでコスト効率が良い

## ER図の主要エンティティ

```
Organizations (組織)
    ↓ 1:N
Teams (チーム)
    ↓ N:M
Users (ユーザー)
    ↓ 1:N
Tasks (タスク)
    ↓ 1:N
TaskTimeLogs (工数ログ)
    ↓ 1:N
AILearningData (AI学習データ)
```

## テーブル設計

### 1. organizations (組織)

組織（企業・会社）を管理するテーブル。

| カラム名 | 型 | 制約 | 説明 |
|---------|-----|------|------|
| id | UUID | PRIMARY KEY | 組織ID |
| name | VARCHAR(255) | NOT NULL, UNIQUE | 組織名 |
| slug | VARCHAR(100) | NOT NULL, UNIQUE | URL用スラッグ（例: wevnal） |
| plan | VARCHAR(50) | NOT NULL, DEFAULT 'free' | プラン（free, pro, enterprise） |
| created_at | TIMESTAMP | NOT NULL, DEFAULT NOW() | 作成日時 |
| updated_at | TIMESTAMP | NOT NULL, DEFAULT NOW() | 更新日時 |
| deleted_at | TIMESTAMP | NULL | 論理削除日時 |

**インデックス:**
- `idx_organizations_slug` ON (slug)
- `idx_organizations_deleted_at` ON (deleted_at)

---

### 2. teams (チーム)

組織内のチームを管理するテーブル。

| カラム名 | 型 | 制約 | 説明 |
|---------|-----|------|------|
| id | UUID | PRIMARY KEY | チームID |
| organization_id | UUID | NOT NULL, FK → organizations.id | 所属組織ID |
| name | VARCHAR(255) | NOT NULL | チーム名 |
| description | TEXT | NULL | チーム説明 |
| created_at | TIMESTAMP | NOT NULL, DEFAULT NOW() | 作成日時 |
| updated_at | TIMESTAMP | NOT NULL, DEFAULT NOW() | 更新日時 |
| deleted_at | TIMESTAMP | NULL | 論理削除日時 |

**インデックス:**
- `idx_teams_organization_id` ON (organization_id)
- `idx_teams_deleted_at` ON (deleted_at)

**制約:**
- 同一組織内でチーム名は一意（UNIQUE(organization_id, name)）

---

### 3. users (ユーザー)

システムユーザーを管理するテーブル。

| カラム名 | 型 | 制約 | 説明 |
|---------|-----|------|------|
| id | UUID | PRIMARY KEY | ユーザーID |
| email | VARCHAR(255) | NOT NULL, UNIQUE | メールアドレス |
| password_hash | VARCHAR(255) | NULL | パスワードハッシュ（OAuth使用時はNULL） |
| name | VARCHAR(255) | NOT NULL | 表示名 |
| avatar_url | VARCHAR(500) | NULL | アバター画像URL |
| role | VARCHAR(50) | NOT NULL, DEFAULT 'member' | ロール（member, manager, admin） |
| email_verified | BOOLEAN | NOT NULL, DEFAULT FALSE | メール認証済み |
| created_at | TIMESTAMP | NOT NULL, DEFAULT NOW() | 作成日時 |
| updated_at | TIMESTAMP | NOT NULL, DEFAULT NOW() | 更新日時 |
| deleted_at | TIMESTAMP | NULL | 論理削除日時 |

**インデックス:**
- `idx_users_email` ON (email)
- `idx_users_deleted_at` ON (deleted_at)

---

### 4. organization_members (組織メンバー)

組織とユーザーの多対多関係を管理するテーブル。

| カラム名 | 型 | 制約 | 説明 |
|---------|-----|------|------|
| id | UUID | PRIMARY KEY | レコードID |
| organization_id | UUID | NOT NULL, FK → organizations.id | 組織ID |
| user_id | UUID | NOT NULL, FK → users.id | ユーザーID |
| role | VARCHAR(50) | NOT NULL, DEFAULT 'member' | 組織内でのロール |
| invited_by | UUID | NULL, FK → users.id | 招待者ID |
| invited_at | TIMESTAMP | NULL | 招待日時 |
| joined_at | TIMESTAMP | NULL | 参加日時 |
| created_at | TIMESTAMP | NOT NULL, DEFAULT NOW() | 作成日時 |

**インデックス:**
- `idx_org_members_org_id` ON (organization_id)
- `idx_org_members_user_id` ON (user_id)
- UNIQUE(organization_id, user_id)

---

### 5. team_members (チームメンバー)

チームとユーザーの多対多関係を管理するテーブル。

| カラム名 | 型 | 制約 | 説明 |
|---------|-----|------|------|
| id | UUID | PRIMARY KEY | レコードID |
| team_id | UUID | NOT NULL, FK → teams.id | チームID |
| user_id | UUID | NOT NULL, FK → users.id | ユーザーID |
| role | VARCHAR(50) | NOT NULL, DEFAULT 'member' | チーム内でのロール |
| joined_at | TIMESTAMP | NOT NULL, DEFAULT NOW() | 参加日時 |
| created_at | TIMESTAMP | NOT NULL, DEFAULT NOW() | 作成日時 |

**インデックス:**
- `idx_team_members_team_id` ON (team_id)
- `idx_team_members_user_id` ON (user_id)
- UNIQUE(team_id, user_id)

---

### 6. integrations (外部ツール連携)

外部ツール（Jira, Salesforce, Notion）との連携情報を管理するテーブル。

| カラム名 | 型 | 制約 | 説明 |
|---------|-----|------|------|
| id | UUID | PRIMARY KEY | 連携ID |
| organization_id | UUID | NOT NULL, FK → organizations.id | 組織ID |
| type | VARCHAR(50) | NOT NULL | 連携タイプ（jira, salesforce, notion） |
| name | VARCHAR(255) | NOT NULL | 連携名（表示用） |
| enabled | BOOLEAN | NOT NULL, DEFAULT TRUE | 有効/無効 |
| status | VARCHAR(50) | NOT NULL, DEFAULT 'disconnected' | ステータス（connected, disconnected, error） |
| config | JSONB | NOT NULL | 連携設定（APIキー、エンドポイント等） |
| last_sync_at | TIMESTAMP | NULL | 最終同期日時 |
| created_at | TIMESTAMP | NOT NULL, DEFAULT NOW() | 作成日時 |
| updated_at | TIMESTAMP | NOT NULL, DEFAULT NOW() | 更新日時 |

**インデックス:**
- `idx_integrations_org_id` ON (organization_id)
- `idx_integrations_type` ON (type)

**config JSONB の例:**
```json
{
  "api_url": "https://example.atlassian.net",
  "api_key": "encrypted_value",
  "project_key": "PROJ",
  "webhook_url": "https://..."
}
```

---

### 7. tasks (タスク)

統合されたタスクデータを管理するテーブル（Unified Task Model）。

| カラム名 | 型 | 制約 | 説明 |
|---------|-----|------|------|
| id | UUID | PRIMARY KEY | タスクID |
| organization_id | UUID | NOT NULL, FK → organizations.id | 組織ID |
| team_id | UUID | NULL, FK → teams.id | チームID（任意） |
| source_system | VARCHAR(50) | NOT NULL | 元ツール（jira, salesforce, notion） |
| external_id | VARCHAR(255) | NOT NULL | 元ツールでのID |
| integration_id | UUID | NOT NULL, FK → integrations.id | 連携ID |
| title | VARCHAR(500) | NOT NULL | タスクタイトル |
| description | TEXT | NULL | タスク説明 |
| status | VARCHAR(50) | NOT NULL, DEFAULT 'todo' | ステータス（todo, in-progress, done, stalled） |
| priority | VARCHAR(50) | NOT NULL, DEFAULT 'medium' | 優先度（low, medium, high） |
| assignee_id | UUID | NULL, FK → users.id | 担当者ID |
| ai_category | VARCHAR(100) | NULL | AIが判定したカテゴリー |
| manual_category | VARCHAR(100) | NULL | 手動で設定したカテゴリー |
| estimated_time | INTEGER | NULL | AI見積もり時間（分） |
| due_date | DATE | NULL | 期限 |
| parent_task_id | UUID | NULL, FK → tasks.id | 親タスクID（階層構造用） |
| context_tags | TEXT[] | NULL | コンテキストタグ配列 |
| metadata | JSONB | NULL | 追加メタデータ |
| created_at | TIMESTAMP | NOT NULL, DEFAULT NOW() | 作成日時 |
| updated_at | TIMESTAMP | NOT NULL, DEFAULT NOW() | 更新日時 |
| deleted_at | TIMESTAMP | NULL | 論理削除日時 |

**インデックス:**
- `idx_tasks_org_id` ON (organization_id)
- `idx_tasks_team_id` ON (team_id)
- `idx_tasks_source_external` ON (source_system, external_id)
- `idx_tasks_status` ON (status)
- `idx_tasks_assignee` ON (assignee_id)
- `idx_tasks_due_date` ON (due_date)
- `idx_tasks_deleted_at` ON (deleted_at)

**制約:**
- UNIQUE(integration_id, source_system, external_id)

---

### 8. task_time_logs (工数ログ)

タスクの実績工数を記録するテーブル。

| カラム名 | 型 | 制約 | 説明 |
|---------|-----|------|------|
| id | UUID | PRIMARY KEY | ログID |
| task_id | UUID | NOT NULL, FK → tasks.id | タスクID |
| user_id | UUID | NOT NULL, FK → users.id | ユーザーID |
| date | DATE | NOT NULL | 作業日 |
| start_time | TIME | NULL | 開始時刻 |
| end_time | TIME | NULL | 終了時刻 |
| duration_minutes | INTEGER | NOT NULL | 作業時間（分） |
| category | VARCHAR(100) | NULL | カテゴリー（開発、会議等） |
| description | TEXT | NULL | 作業内容のメモ |
| created_at | TIMESTAMP | NOT NULL, DEFAULT NOW() | 作成日時 |

**インデックス:**
- `idx_time_logs_task_id` ON (task_id)
- `idx_time_logs_user_id` ON (user_id)
- `idx_time_logs_date` ON (date)

---

### 9. ai_learning_data (AI学習データ)

AIの学習に使用する予実差異データを保存するテーブル。

| カラム名 | 型 | 制約 | 説明 |
|---------|-----|------|------|
| id | UUID | PRIMARY KEY | レコードID |
| organization_id | UUID | NOT NULL, FK → organizations.id | 組織ID |
| task_id | UUID | NOT NULL, FK → tasks.id | タスクID |
| user_id | UUID | NOT NULL, FK → users.id | ユーザーID |
| estimated_time | INTEGER | NOT NULL | AI見積もり時間（分） |
| actual_time | INTEGER | NOT NULL | 実績時間（分） |
| gap_percentage | DECIMAL(5,2) | NOT NULL | 乖離率（%） |
| category | VARCHAR(100) | NULL | カテゴリー |
| context_tags | TEXT[] | NULL | コンテキストタグ |
| created_at | TIMESTAMP | NOT NULL, DEFAULT NOW() | 作成日時 |

**インデックス:**
- `idx_ai_learning_org_id` ON (organization_id)
- `idx_ai_learning_user_id` ON (user_id)
- `idx_ai_learning_created_at` ON (created_at)

---

### 10. notifications (通知設定)

通知設定（Email, Slack等）を管理するテーブル。

| カラム名 | 型 | 制約 | 説明 |
|---------|-----|------|------|
| id | UUID | PRIMARY KEY | 通知設定ID |
| organization_id | UUID | NOT NULL, FK → organizations.id | 組織ID |
| type | VARCHAR(50) | NOT NULL | 通知タイプ（email, slack） |
| enabled | BOOLEAN | NOT NULL, DEFAULT TRUE | 有効/無効 |
| config | JSONB | NOT NULL | 通知設定 |
| created_at | TIMESTAMP | NOT NULL, DEFAULT NOW() | 作成日時 |
| updated_at | TIMESTAMP | NOT NULL, DEFAULT NOW() | 更新日時 |

**インデックス:**
- `idx_notifications_org_id` ON (organization_id)
- UNIQUE(organization_id, type)

**config JSONB の例（Slack）:**
```json
{
  "workspace": "wevnal-workspace",
  "channel": "#smarttodo-notifications",
  "webhook_url": "https://hooks.slack.com/services/...",
  "weekly_report_enabled": true
}
```

---

### 11. invitations (招待)

メンバー招待を管理するテーブル。

| カラム名 | 型 | 制約 | 説明 |
|---------|-----|------|------|
| id | UUID | PRIMARY KEY | 招待ID |
| organization_id | UUID | NOT NULL, FK → organizations.id | 組織ID |
| team_id | UUID | NULL, FK → teams.id | チームID（任意） |
| email | VARCHAR(255) | NOT NULL | 招待先メールアドレス |
| role | VARCHAR(50) | NOT NULL, DEFAULT 'member' | ロール |
| token | VARCHAR(255) | NOT NULL, UNIQUE | 招待トークン |
| invited_by | UUID | NOT NULL, FK → users.id | 招待者ID |
| expires_at | TIMESTAMP | NOT NULL | 有効期限 |
| accepted_at | TIMESTAMP | NULL | 承認日時 |
| created_at | TIMESTAMP | NOT NULL, DEFAULT NOW() | 作成日時 |

**インデックス:**
- `idx_invitations_token` ON (token)
- `idx_invitations_email` ON (email)
- `idx_invitations_org_id` ON (organization_id)

---

### 12. ai_insights (AIインサイト)

AIが生成した週次インサイトを保存するテーブル。

| カラム名 | 型 | 制約 | 説明 |
|---------|-----|------|------|
| id | UUID | PRIMARY KEY | インサイトID |
| organization_id | UUID | NOT NULL, FK → organizations.id | 組織ID |
| team_id | UUID | NULL, FK → teams.id | チームID（任意） |
| period_start | DATE | NOT NULL | 期間開始日 |
| period_end | DATE | NOT NULL | 期間終了日 |
| insights | JSONB | NOT NULL | インサイト内容 |
| created_at | TIMESTAMP | NOT NULL, DEFAULT NOW() | 作成日時 |

**インデックス:**
- `idx_ai_insights_org_id` ON (organization_id)
- `idx_ai_insights_period` ON (period_start, period_end)

**insights JSONB の例:**
```json
{
  "summary": "今週の生産性は前週比+5%向上",
  "recommendations": [
    {
      "type": "warning",
      "title": "会議時間の最適化",
      "message": "木曜午後の開発速度が低下しています..."
    }
  ],
  "metrics": {
    "completion_rate": 78,
    "ai_estim_gap": 15,
    "stalled_tasks": 12
  }
}
```

---

## データベース設計の考慮事項

### 1. スケーラビリティ

- **パーティショニング:** `tasks`テーブルは`organization_id`でパーティショニング可能
- **アーカイブ:** 古いデータは別テーブルにアーカイブ
- **読み取りレプリカ:** レポートクエリ用に読み取り専用レプリカを用意

### 2. パフォーマンス

- **インデックス戦略:** 頻繁にクエリされるカラムにインデックスを設定
- **マテリアライズドビュー:** ダッシュボード用の集計データを事前計算
- **キャッシュ:** Redisで頻繁にアクセスされるデータをキャッシュ

### 3. セキュリティ

- **暗号化:** `integrations.config`内のAPIキーは暗号化して保存
- **行レベルセキュリティ（RLS）:** PostgreSQLのRLSで組織間のデータ分離
- **監査ログ:** 重要な操作（削除、設定変更等）を別テーブルに記録

### 4. データ整合性

- **外部キー制約:** 参照整合性を保証
- **トランザクション:** 複数テーブル更新時はトランザクションで一貫性を保証
- **論理削除:** 物理削除ではなく論理削除（`deleted_at`）を採用

---

## マイグレーション戦略

### Phase 1: 基本テーブル
1. organizations
2. users
3. teams
4. organization_members
5. team_members

### Phase 2: 連携・タスク
6. integrations
7. tasks
8. task_time_logs

### Phase 3: AI・通知
9. ai_learning_data
10. ai_insights
11. notifications
12. invitations

---

## サンプルクエリ

### 組織のメンバー一覧取得
```sql
SELECT u.id, u.name, u.email, om.role
FROM organization_members om
JOIN users u ON om.user_id = u.id
WHERE om.organization_id = $1
  AND u.deleted_at IS NULL;
```

### チームのタスク一覧（ステータス別）
```sql
SELECT t.*, u.name as assignee_name
FROM tasks t
LEFT JOIN users u ON t.assignee_id = u.id
WHERE t.team_id = $1
  AND t.status = $2
  AND t.deleted_at IS NULL
ORDER BY t.due_date ASC;
```

### AI学習データの集計（ユーザー別見積もり傾向）
```sql
SELECT 
  user_id,
  AVG(gap_percentage) as avg_gap,
  COUNT(*) as sample_count
FROM ai_learning_data
WHERE organization_id = $1
  AND created_at >= NOW() - INTERVAL '30 days'
GROUP BY user_id;
```

---

## まとめ

本データベース設計は、SmartToDoの要件を満たすために以下の特徴を持ちます：

1. **マルチテナント対応:** 組織単位でのデータ分離
2. **柔軟な拡張性:** JSONB型によるメタデータの柔軟な保存
3. **AI学習対応:** 予実差異データの蓄積と分析
4. **スケーラビリティ:** インデックスとパーティショニング戦略
5. **セキュリティ:** 暗号化と行レベルセキュリティ

この設計により、SmartToDoの機能要件を効率的に実現できます。

