import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'SmartToDo - AI搭載型チーム生産性統合プラットフォーム',
  description: '既存ツールを変えることなく、その上に「インテリジェンス層」を重ねることで、タスクの自動分解、工数精度の向上、ボトルネックの可視化を自動的に行います。',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ja">
      <body>{children}</body>
    </html>
  )
}

