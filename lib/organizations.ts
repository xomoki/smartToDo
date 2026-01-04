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

  try {
    // まず、wevnal組織が存在するか確認（slugで検索）
    const { data: existingOrgs, error: searchError } = await supabase
      .from('organizations')
      .select('*')
      .eq('slug', WEVNAL_SLUG)
      .is('deleted_at', null)
      .limit(1)

    let wevnalOrg: Organization | null = null

    if (existingOrgs && existingOrgs.length > 0) {
      // wevnal組織が既に存在する
      wevnalOrg = existingOrgs[0] as Organization
    } else {
      // wevnal組織が存在しない場合は作成
      // 最初のユーザーが作成者となる（adminロール）
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        throw new Error('認証されていません')
      }

      const { data: newOrg, error: createError } = await supabase
        .from('organizations')
        .insert({
          name: WEVNAL_NAME,
          slug: WEVNAL_SLUG,
          plan: 'free',
        })
        .select()
        .single()

      if (createError) {
        // 組織作成に失敗した場合（既に存在する可能性がある）
        console.warn('Failed to create wevnal organization:', createError)
        // 再度検索を試みる
        const { data: retryOrgs } = await supabase
          .from('organizations')
          .select('*')
          .eq('slug', WEVNAL_SLUG)
          .is('deleted_at', null)
          .limit(1)
        
        if (retryOrgs && retryOrgs.length > 0) {
          wevnalOrg = retryOrgs[0] as Organization
        } else {
          throw createError
        }
      } else {
        wevnalOrg = newOrg as Organization
      }
    }

    if (!wevnalOrg) {
      return null
    }

    // ユーザーがwevnal組織のメンバーかどうか確認
    const { data: memberCheck, error: memberCheckError } = await supabase
      .from('organization_members')
      .select('*')
      .eq('organization_id', wevnalOrg.id)
      .eq('user_id', userId)
      .limit(1)

    if (memberCheckError) {
      console.error('Failed to check organization membership:', memberCheckError)
      return null
    }

    // メンバーでない場合は追加
    if (!memberCheck || memberCheck.length === 0) {
      const { error: addMemberError } = await supabase
        .from('organization_members')
        .insert({
          organization_id: wevnalOrg.id,
          user_id: userId,
          role: 'member', // デフォルトはmember、最初のユーザーはadminになる可能性がある
          joined_at: new Date().toISOString(),
        })

      if (addMemberError) {
        console.error('Failed to add user to wevnal organization:', addMemberError)
        return null
      }

      console.log('User added to wevnal organization:', userId)
    }

    return wevnalOrg
  } catch (error) {
    console.error('Failed to ensure wevnal organization access:', error)
    return null
  }
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

  if (error) {
    // エラーが発生した場合、空配列を返す（組織が存在しない場合も含む）
    console.warn('Failed to get organizations:', error)
    return []
  }

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
