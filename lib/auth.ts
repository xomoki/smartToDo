import { supabase } from './supabase'

export interface User {
  id: string
  email: string
  name: string
  avatar_url?: string
  role: string
}

export async function signUp(email: string, password: string, name: string) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        name,
      },
    },
  })

  if (error) throw error

  // ユーザーが作成されたら、usersテーブルにもレコードを作成
  if (data.user) {
    const { error: userError } = await supabase
      .from('users')
      .insert({
        id: data.user.id,
        email: data.user.email || email,
        name: name,
        role: 'member',
        email_verified: false,
      })

    if (userError) {
      console.error('Failed to create user record:', userError)
      // エラーを投げない（auth.usersには作成されているため）
    }
  }

  return data
}

export async function signIn(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (error) throw error
  return data
}

export async function signOut() {
  const { error } = await supabase.auth.signOut()
  if (error) throw error
}

export async function getCurrentUser(): Promise<User | null> {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  // usersテーブルからユーザー情報を取得
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('id', user.id)
    .single()

  if (error) {
    console.warn('User not found in users table, creating from auth:', error)
    // usersテーブルに存在しない場合は、auth.usersから情報を取得して作成を試みる
    try {
      const { data: newUser, error: createError } = await supabase
        .from('users')
        .insert({
          id: user.id,
          email: user.email || '',
          name: user.user_metadata?.name || user.email || '',
          avatar_url: user.user_metadata?.avatar_url,
          role: 'member',
          email_verified: user.email_confirmed_at ? true : false,
        })
        .select()
        .single()

      if (createError) {
        console.error('Failed to create user record:', createError)
        // 作成に失敗した場合でも、auth.usersから情報を返す
        return {
          id: user.id,
          email: user.email || '',
          name: user.user_metadata?.name || user.email || '',
          avatar_url: user.user_metadata?.avatar_url,
          role: 'member',
        }
      }

      return newUser
    } catch (err) {
      console.error('Error creating user:', err)
      // エラーが発生した場合でも、auth.usersから情報を返す
      return {
        id: user.id,
        email: user.email || '',
        name: user.user_metadata?.name || user.email || '',
        avatar_url: user.user_metadata?.avatar_url,
        role: 'member',
      }
    }
  }

  return data
}

export async function getSession() {
  const { data: { session } } = await supabase.auth.getSession()
  return session
}

