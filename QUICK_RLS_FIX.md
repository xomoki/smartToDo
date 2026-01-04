# クイックRLS修正手順

## 現在のエラー
`new row violates row-level security policy for table "organizations"` (code: 42501)

## 解決方法（3ステップ）

### ステップ1: Supabase Dashboardを開く
1. https://supabase.com/dashboard にアクセス
2. プロジェクトを選択
3. 左メニューから「SQL Editor」をクリック

### ステップ2: SQLを実行
以下のSQLをコピーして、SQL Editorに貼り付けて「Run」ボタンをクリックしてください：

```sql
-- 既存のポリシーをすべて削除
DROP POLICY IF EXISTS "Users can view their organization data" ON organizations;
DROP POLICY IF EXISTS "Users can create organizations" ON organizations;
DROP POLICY IF EXISTS "Users can update their organizations" ON organizations;
DROP POLICY IF EXISTS "Users can view organization members" ON organization_members;
DROP POLICY IF EXISTS "Users can create organization members" ON organization_members;
DROP POLICY IF EXISTS "Users can update organization members" ON organization_members;
DROP POLICY IF EXISTS "Users can view their organization members" ON users;
DROP POLICY IF EXISTS "Users can update themselves" ON users;
DROP POLICY IF EXISTS "Users can create themselves" ON users;

-- Organizations テーブルのポリシー
CREATE POLICY "Users can view their organization data" ON organizations
    FOR SELECT USING (
        EXISTS (
            SELECT 1 
            FROM organization_members 
            WHERE organization_id = organizations.id
            AND user_id = auth.uid()
        )
    );

CREATE POLICY "Users can create organizations" ON organizations
    FOR INSERT 
    WITH CHECK (
        auth.uid() IS NOT NULL
    );

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

-- Organization Members テーブルのポリシー
CREATE POLICY "Users can view organization members" ON organization_members
    FOR SELECT USING (
        user_id = auth.uid()
    );

CREATE POLICY "Users can create organization members" ON organization_members
    FOR INSERT 
    WITH CHECK (
        user_id = auth.uid()
    );

CREATE POLICY "Users can update organization members" ON organization_members
    FOR UPDATE USING (
        user_id = auth.uid()
    );

-- Users テーブルのポリシー
CREATE POLICY "Users can view their organization members" ON users
    FOR SELECT USING (
        id = auth.uid()
    );

CREATE POLICY "Users can update themselves" ON users
    FOR UPDATE USING (id = auth.uid());

CREATE POLICY "Users can create themselves" ON users
    FOR INSERT 
    WITH CHECK (
        id = auth.uid()
    );
```

### ステップ3: 動作確認
1. ブラウザをリフレッシュ（F5）
2. 再度ログイン
3. 「wevnal」組織が作成され、アクセスできることを確認

## 注意事項
- SQL Editorで実行する際は、すべてのSQLを一度に実行してください
- エラーが表示された場合は、エラーメッセージを確認してください
- 実行後、ブラウザをリフレッシュしてから再度ログインしてください

