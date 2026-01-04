'use client'

import { useEffect } from 'react'
import { supabase } from '@/lib/supabase'

// 開発環境でのみ、Supabaseクライアントをグローバルに公開
export default function SupabaseDebug() {
  useEffect(() => {
    // クライアントサイドでのみ実行
    if (typeof window !== 'undefined') {
      ;(window as any).supabase = supabase
      console.log('[Supabase Debug] Client available in browser console as window.supabase')
    }
  }, [])

  return null // このコンポーネントは何もレンダリングしない
}

