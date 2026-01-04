import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Dashboard - SmartToDo',
  description: 'チーム全体の状況を俯瞰するメインコックピット',
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}

