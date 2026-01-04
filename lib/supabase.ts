import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables')
}

// Supabaseクライアントを作成
// authオプションを明示的に設定して、認証状態を確実に管理
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
})

// 開発環境でのみ、ブラウザコンソールからアクセスできるようにする
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
  ;(window as any).supabase = supabase
}

