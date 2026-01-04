import { supabase } from './supabase'

export interface Organization {
  id: string
  name: string
  slug: string
  plan: string
  created_at: string
  updated_at: string
}

export interface Team {
  id: string
  organization_id: string
  name: string
  description?: string
  created_at: string
  updated_at: string
}

export interface Member {
  id: string
  name: string
  email: string
  role: string
  team?: string
}

// すべてのユーザーが「wevnal」組織にアクセスできるようにする
export async function ensureWevnalOrganizationAccess(userId: string): Promise<Organization | null> {
  const WEVNAL_SLUG = 'wevnal'
  const WEVNAL_NAME = 'wevnal'

  console.log('[ensureWevnalOrganizationAccess] Starting for user:', userId)

  try {
    // 認証状態を確認
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      console.error('[ensureWevnalOrganizationAccess] Auth error:', authError)
      return null
    }

    if (user.id !== userId) {
      console.error('[ensureWevnalOrganizationAccess] User ID mismatch')
      return null
    }

    // まず、wevnal組織が存在するか確認（organization_membersから検索）
    // 注意: RLSポリシーのため、自分がメンバーでない組織は見えない
    console.log('[ensureWevnalOrganizationAccess] Checking if user is already a member...')
    const { data: existingMembers, error: memberSearchError } = await supabase
      .from('organization_members')
      .select(`
        organization_id,
        organizations (
          id,
          name,
          slug,
          plan,
          created_at,
          updated_at
        )
      `)
      .eq('user_id', userId)
      .eq('organizations.slug', WEVNAL_SLUG)
      .limit(1)

    if (memberSearchError) {
      console.error('[ensureWevnalOrganizationAccess] Error searching for membership:', memberSearchError)
    }

    let wevnalOrg: Organization | null = null

    if (existingMembers && existingMembers.length > 0 && existingMembers[0].organizations) {
      // 既にwevnal組織のメンバーである
      wevnalOrg = existingMembers[0].organizations as Organization
      console.log('[ensureWevnalOrganizationAccess] User is already a member of wevnal organization:', wevnalOrg.id)
      return wevnalOrg
    }

    // wevnal組織が存在しない、またはメンバーでない場合は作成を試みる
    console.log('[ensureWevnalOrganizationAccess] Creating wevnal organization...')
    
    // createOrganization関数を使用して組織を作成（これにより、メンバーも自動的に追加される）
    try {
      wevnalOrg = await createOrganization(WEVNAL_NAME, WEVNAL_SLUG, userId)
      console.log('[ensureWevnalOrganizationAccess] Successfully created wevnal organization:', wevnalOrg.id)
      return wevnalOrg
    } catch (createError: any) {
      // 組織作成に失敗した場合（既に存在する可能性がある）
      console.warn('[ensureWevnalOrganizationAccess] Failed to create organization, checking if it exists:', createError)
      
      // 再度、organization_membersから検索を試みる
      // 別のユーザーが既に作成している可能性がある
      const { data: retryMembers, error: retryError } = await supabase
        .from('organization_members')
        .select(`
          organization_id,
          organizations (
            id,
            name,
            slug,
            plan,
            created_at,
            updated_at
          )
        `)
        .eq('user_id', userId)
        .eq('organizations.slug', WEVNAL_SLUG)
        .limit(1)

      if (retryError) {
        console.error('[ensureWevnalOrganizationAccess] Error retrying search:', retryError)
      }

      if (retryMembers && retryMembers.length > 0 && retryMembers[0].organizations) {
        wevnalOrg = retryMembers[0].organizations as Organization
        console.log('[ensureWevnalOrganizationAccess] Found organization on retry:', wevnalOrg.id)
        return wevnalOrg
      }

      // それでも見つからない場合は、エラーを返す
      console.error('[ensureWevnalOrganizationAccess] Could not find or create organization')
      return null
    }
  } catch (error: any) {
    console.error('[ensureWevnalOrganizationAccess] Failed to ensure wevnal organization access:', error)
    console.error('[ensureWevnalOrganizationAccess] Error details:', {
      message: error?.message,
      details: error?.details,
      hint: error?.hint,
      code: error?.code,
    })
    return null
  }
}

// 組織一覧を取得
// 注意: organization_membersのSELECTポリシーが自分自身のみ許可するため、
// 直接organization_membersから取得する方法では他のメンバーが見えない
// そのため、organizationsテーブルから直接取得する
export async function getOrganizations(userId: string): Promise<Organization[]> {
  // まず、自分がメンバーである組織のIDを取得
  const { data: memberData, error: memberError } = await supabase
    .from('organization_members')
    .select('organization_id')
    .eq('user_id', userId)

  if (memberError) {
    console.warn('Failed to get organization members:', memberError)
    return []
  }

  if (!memberData || memberData.length === 0) {
    return []
  }

  const orgIds = memberData.map(m => m.organization_id)

  // 組織情報を取得
  const { data: orgData, error: orgError } = await supabase
    .from('organizations')
    .select('*')
    .in('id', orgIds)
    .is('deleted_at', null)

  if (orgError) {
    console.warn('Failed to get organizations:', orgError)
    return []
  }

  return (orgData || []) as Organization[]
}

// 組織を作成
export async function createOrganization(name: string, slug: string, userId: string): Promise<Organization> {
  console.log('[createOrganization] Starting:', { name, slug, userId })
  
  // 認証状態を確認
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    console.error('[createOrganization] Auth error:', authError)
    throw new Error('認証されていません。ログインしてください。')
  }
  
  if (user.id !== userId) {
    console.error('[createOrganization] User ID mismatch:', { sessionUserId: user.id, providedUserId: userId })
    throw new Error('認証ユーザーIDが一致しません')
  }

  console.log('[createOrganization] Authenticated user:', user.id)

  // 組織を作成
  console.log('[createOrganization] Inserting organization...')
  const { data: org, error: orgError } = await supabase
    .from('organizations')
    .insert({
      name,
      slug,
      plan: 'free',
    })
    .select()
    .single()

  if (orgError) {
    console.error('[createOrganization] Failed to create organization:', orgError)
    console.error('[createOrganization] Error details:', {
      message: orgError.message,
      details: orgError.details,
      hint: orgError.hint,
      code: orgError.code,
    })
    
    // RLSエラーの場合、より詳細な情報を提供
    if (orgError.code === '42501') {
      throw new Error('組織の作成が拒否されました。RLSポリシーが正しく設定されているか確認してください。')
    }
    
    throw orgError
  }

  if (!org) {
    throw new Error('組織の作成に失敗しました（データが返されませんでした）')
  }

  console.log('[createOrganization] Organization created:', org.id)

  // 作成者を組織メンバーに追加（adminロール）
  console.log('[createOrganization] Adding user as organization member...')
  const { error: memberError } = await supabase
    .from('organization_members')
    .insert({
      organization_id: org.id,
      user_id: userId,
      role: 'admin',
      joined_at: new Date().toISOString(),
    })

  if (memberError) {
    console.error('[createOrganization] Failed to add organization member:', memberError)
    console.error('[createOrganization] Member error details:', {
      message: memberError.message,
      details: memberError.details,
      hint: memberError.hint,
      code: memberError.code,
    })
    
    // 組織は作成されたがメンバー追加に失敗した場合、組織を削除
    console.log('[createOrganization] Rolling back organization creation...')
    const { error: deleteError } = await supabase
      .from('organizations')
      .delete()
      .eq('id', org.id)
    
    if (deleteError) {
      console.error('[createOrganization] Failed to rollback organization:', deleteError)
    }
    
    if (memberError.code === '42501') {
      throw new Error('組織メンバーの追加が拒否されました。RLSポリシーが正しく設定されているか確認してください。')
    }
    
    throw memberError
  }

  console.log('[createOrganization] Organization member added successfully')
  return org
}

// チーム一覧を取得
export async function getTeams(organizationId: string): Promise<Team[]> {
  const { data, error } = await supabase
    .from('teams')
    .select('*')
    .eq('organization_id', organizationId)
    .is('deleted_at', null)
    .order('name')

  if (error) throw error
  return data || []
}

// チームを作成
export async function createTeam(organizationId: string, name: string, description?: string): Promise<Team> {
  const { data, error } = await supabase
    .from('teams')
    .insert({
      organization_id: organizationId,
      name,
      description,
    })
    .select()
    .single()

  if (error) throw error
  return data
}

// 組織のメンバー一覧を取得
export async function getOrganizationMembers(organizationId: string): Promise<Member[]> {
  const { data, error } = await supabase
    .from('organization_members')
    .select(`
      user_id,
      role,
      users (
        id,
        name,
        email
      )
    `)
    .eq('organization_id', organizationId)

  if (error) throw error

  return data.map((item: any) => ({
    id: item.user_id,
    name: item.users.name,
    email: item.users.email,
    role: item.role,
  }))
}

// チームのメンバー一覧を取得
export async function getTeamMembers(teamId: string): Promise<Member[]> {
  const { data, error } = await supabase
    .from('team_members')
    .select(`
      user_id,
      role,
      users (
        id,
        name,
        email
      )
    `)
    .eq('team_id', teamId)

  if (error) throw error

  return data.map((item: any) => ({
    id: item.user_id,
    name: item.users.name,
    email: item.users.email,
    role: item.role,
  }))
}

// 組織メンバーを取得（チーム情報付き）
export async function getOrganizationMembersWithTeams(organizationId: string): Promise<Member[]> {
  const { data, error } = await supabase
    .from('organization_members')
    .select(`
      user_id,
      role,
      users (
        id,
        name,
        email
      ),
      team_members (
        team_id,
        teams (
          id,
          name
        )
      )
    `)
    .eq('organization_id', organizationId)

  if (error) throw error

  return data.map((item: any) => ({
    id: item.user_id,
    name: item.users.name,
    email: item.users.email,
    role: item.role,
    team: item.team_members?.[0]?.teams?.name,
  }))
}

// メンバーを招待
export async function inviteMember(
  organizationId: string,
  teamId: string | null,
  email: string,
  role: string,
  invitedBy: string
): Promise<void> {
  const token = crypto.randomUUID()
  const expiresAt = new Date()
  expiresAt.setDate(expiresAt.getDate() + 7) // 7日間有効

  const { error } = await supabase
    .from('invitations')
    .insert({
      organization_id: organizationId,
      team_id: teamId,
      email,
      role,
      token,
      invited_by: invitedBy,
      expires_at: expiresAt.toISOString(),
    })

  if (error) throw error

  // 実際の実装では、ここでメール送信を行う
  console.log(`Invitation sent to ${email} with token: ${token}`)
}

// 組織メンバーを削除
export async function removeOrganizationMember(
  organizationId: string,
  userId: string
): Promise<void> {
  // まず、チームメンバーからも削除
  const { data: teams } = await supabase
    .from('teams')
    .select('id')
    .eq('organization_id', organizationId)

  if (teams && teams.length > 0) {
    const teamIds = teams.map(t => t.id)
    await supabase
      .from('team_members')
      .delete()
      .eq('user_id', userId)
      .in('team_id', teamIds)
  }

  // 組織メンバーから削除
  const { error } = await supabase
    .from('organization_members')
    .delete()
    .eq('organization_id', organizationId)
    .eq('user_id', userId)

  if (error) throw error
}
