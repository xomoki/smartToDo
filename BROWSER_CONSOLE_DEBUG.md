# ブラウザコンソールでのデバッグ方法

## Supabaseクライアントへのアクセス

開発環境では、ブラウザコンソールから`supabase`クライアントに直接アクセスできます。

## 認証状態の確認

ブラウザコンソール（F12 → Consoleタブ）で以下を実行：

```javascript
// セッションを取得
const { data: { session }, error } = await supabase.auth.getSession()
console.log('=== 認証状態 ===')
console.log('Session:', session)
console.log('User ID:', session?.user?.id)
console.log('Email:', session?.user?.email)
console.log('Error:', error)
```

## 現在のユーザーを取得

```javascript
// 現在のユーザーを取得
const { data: { user }, error } = await supabase.auth.getUser()
console.log('=== 現在のユーザー ===')
console.log('User:', user)
console.log('User ID:', user?.id)
console.log('Email:', user?.email)
console.log('Error:', error)
```

## 組織作成のテスト

```javascript
// 組織作成をテスト
const { data, error } = await supabase
  .from('organizations')
  .insert({
    name: 'Test Organization',
    slug: 'test-org-' + Date.now(),
    plan: 'free'
  })
  .select()
  .single()

console.log('=== 組織作成テスト ===')
console.log('Data:', data)
console.log('Error:', error)

if (error) {
  console.error('エラー詳細:', {
    message: error.message,
    details: error.details,
    hint: error.hint,
    code: error.code,
  })
}
```

## 組織一覧の取得

```javascript
// 組織一覧を取得
const { data, error } = await supabase
  .from('organization_members')
  .select(`
    organization_id,
    organizations (
      id,
      name,
      slug,
      plan
    )
  `)
  .eq('user_id', (await supabase.auth.getUser()).data.user?.id)

console.log('=== 組織一覧 ===')
console.log('Data:', data)
console.log('Error:', error)
```

## RLSポリシーのテスト

```javascript
// RLSポリシーが正しく機能しているかテスト
async function testRLS() {
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    console.error('認証されていません')
    return
  }
  
  console.log('=== RLSテスト ===')
  console.log('User ID:', user.id)
  
  // 組織作成を試みる
  const { data, error } = await supabase
    .from('organizations')
    .insert({
      name: 'RLS Test Organization',
      slug: 'rls-test-' + Date.now(),
      plan: 'free'
    })
    .select()
    .single()
  
  if (error) {
    console.error('RLSエラー:', error)
    console.error('エラーコード:', error.code)
    console.error('エラーメッセージ:', error.message)
  } else {
    console.log('組織作成成功:', data)
    
    // 作成した組織を削除（クリーンアップ）
    await supabase
      .from('organizations')
      .delete()
      .eq('id', data.id)
    console.log('テスト組織を削除しました')
  }
}

// 実行
testRLS()
```

## 環境変数の確認

```javascript
// 環境変数が正しく設定されているか確認
console.log('=== 環境変数 ===')
console.log('Supabase URL:', process.env.NEXT_PUBLIC_SUPABASE_URL)
console.log('Supabase Anon Key:', process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? '設定済み' : '未設定')
```

## よくあるエラーと対処法

### エラー1: `supabase is not defined`

**原因**: 開発サーバーが起動していない、またはページが読み込まれていない

**解決方法**:
1. 開発サーバーが起動しているか確認（`npm run dev`）
2. ページをリフレッシュ（F5）
3. ダッシュボードページ（`/dashboard`）にアクセスしてから、コンソールで実行

### エラー2: `JWT expired`

**原因**: セッションが期限切れ

**解決方法**: 再度ログインしてください

### エラー3: `new row violates row-level security policy`

**原因**: RLSポリシーが正しく設定されていない、または認証されていない

**解決方法**:
1. 認証状態を確認（上記の「認証状態の確認」を実行）
2. RLSポリシーを確認（`014_force_rls_fix.sql`を実行）

## 便利なデバッグ関数

ブラウザコンソールに以下をコピー&ペーストして使用できます：

```javascript
// すべての情報を一度に確認
async function debugSupabase() {
  console.log('=== Supabase デバッグ情報 ===')
  
  // 認証状態
  const { data: { session }, error: sessionError } = await supabase.auth.getSession()
  console.log('1. 認証状態:', session ? '認証済み' : '未認証')
  console.log('   User ID:', session?.user?.id)
  console.log('   Email:', session?.user?.email)
  console.log('   Error:', sessionError)
  
  // 環境変数
  console.log('2. 環境変数:')
  console.log('   URL:', process.env.NEXT_PUBLIC_SUPABASE_URL ? '設定済み' : '未設定')
  console.log('   Anon Key:', process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? '設定済み' : '未設定')
  
  // 組織一覧
  if (session?.user?.id) {
    const { data: orgs, error: orgError } = await supabase
      .from('organization_members')
      .select(`
        organization_id,
        organizations (
          id,
          name,
          slug
        )
      `)
      .eq('user_id', session.user.id)
    
    console.log('3. 組織一覧:', orgs || [])
    console.log('   Error:', orgError)
  }
}

// 実行
debugSupabase()
```

