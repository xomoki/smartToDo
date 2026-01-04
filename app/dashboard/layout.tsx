import type { Metadata } from 'next'
import AuthGuard from '@/components/AuthGuard'
import dynamic from 'next/dynamic'

// SupabaseDebugを動的インポートして、SSRを無効化
const SupabaseDebug = dynamic(() => import('@/components/SupabaseDebug'), {
  ssr: false,
})

export const metadata: Metadata = {
  title: 'Dashboard - SmartToDo',
  description: 'チーム全体の状況を俯瞰するメインコックピット',
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <AuthGuard>
      <SupabaseDebug />
      {children}
    </AuthGuard>
  )
}
