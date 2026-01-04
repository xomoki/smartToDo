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

// 組織一覧を取得
export async function getOrganizations(userId: string): Promise<Organization[]> {
  const { data, error } = await supabase
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

  if (error) throw error

  return data.map((item: any) => item.organizations).filter(Boolean)
}

// 組織を作成
export async function createOrganization(name: string, slug: string, userId: string): Promise<Organization> {
  console.log('Creating organization:', { name, slug, userId })
  
  // まず認証状態を確認
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    throw new Error('認証されていません。ログインしてください。')
  }
  
  console.log('Authenticated user:', user.id)

  // 組織を作成
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
    console.error('Failed to create organization:', orgError)
    console.error('Error details:', {
      message: orgError.message,
      details: orgError.details,
      hint: orgError.hint,
      code: orgError.code,
    })
    throw orgError
  }

  console.log('Organization created:', org.id)

  // 作成者を組織メンバーに追加（adminロール）
  const { error: memberError } = await supabase
    .from('organization_members')
    .insert({
      organization_id: org.id,
      user_id: userId,
      role: 'admin',
      joined_at: new Date().toISOString(),
    })

  if (memberError) {
    console.error('Failed to add organization member:', memberError)
    // 組織は作成されたがメンバー追加に失敗した場合、組織を削除
    await supabase
      .from('organizations')
      .delete()
      .eq('id', org.id)
    throw memberError
  }

  console.log('Organization member added successfully')
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
