'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

// 開発環境でのみ、Supabaseクライアントをグローバルに公開
export default function SupabaseDebug() {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    // クライアントサイドでのみ実行
    setMounted(true)
    if (typeof window !== 'undefined') {
      ;(window as any).supabase = supabase
      console.log('[Supabase Debug] Client available in browser console as window.supabase')
    }
  }, [])

  // サーバーサイドとクライアントサイドで一致させるため、何もレンダリングしない
  return null
}

