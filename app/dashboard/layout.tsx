import type { Metadata } from 'next'
import AuthGuard from '@/components/AuthGuard'
import SupabaseDebug from '@/components/SupabaseDebug'

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
