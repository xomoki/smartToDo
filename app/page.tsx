import Link from 'next/link'
import { readFile } from 'fs/promises'
import { join } from 'path'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

async function getMarkdownContent(filename: string) {
  try {
    const filePath = join(process.cwd(), filename)
    const content = await readFile(filePath, 'utf-8')
    return content
  } catch (error) {
    return null
  }
}

export default async function Home() {
  const elevatorPitch = await getMarkdownContent('elevator-pitch.md')

  return (
    <div className="container">
      <header className="header">
        <h1>SmartToDo</h1>
        <p>AI搭載型チーム生産性統合プラットフォーム</p>
        <nav className="nav">
          <Link href="/">ホーム</Link>
          <Link href="/dashboard">ダッシュボード</Link>
          <Link href="/elevator-pitch">エレベーターピッチ</Link>
          <Link href="/business-requirements">ビジネス要件定義書</Link>
          <Link href="/product-requirements">プロダクト開発要求定義書</Link>
        </nav>
      </header>

      <main className="content">
        <h1>プロダクト概要</h1>
        
        {elevatorPitch ? (
          <div>
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
              {elevatorPitch}
            </ReactMarkdown>
          </div>
        ) : (
          <p>ドキュメントを読み込めませんでした。</p>
        )}

        <div style={{ marginTop: '2rem', padding: '1.5rem', background: '#f0f9ff', borderRadius: '8px', border: '2px solid #3b82f6' }}>
          <h2 style={{ marginTop: 0, color: '#1e40af' }}>🚀 ダッシュボード</h2>
          <p>SmartToDoのメインコックピットを体験してください。</p>
          <Link href="/dashboard" style={{ display: 'inline-block', marginTop: '1rem', padding: '0.75rem 1.5rem', background: '#3b82f6', color: '#fff', borderRadius: '6px', fontWeight: 600, textDecoration: 'none' }}>
            ダッシュボードを開く →
          </Link>
        </div>

        <h2>ドキュメント一覧</h2>
        <ul>
          <li>
            <Link href="/elevator-pitch">エレベーターピッチ</Link> - プロダクトの本質を30秒で伝えるための要約
          </li>
          <li>
            <Link href="/business-requirements">ビジネス要件定義書 (BRD)</Link> - ビジネス背景、課題、目的、KPIを定義
          </li>
          <li>
            <Link href="/product-requirements">プロダクト開発要求定義書 (PRD)</Link> - 機能要件、非機能要件、データモデルを定義
          </li>
          <li>
            <Link href="/wireframe-dashboard">ダッシュボード・ワイヤーフレーム</Link> - UI/UX設計ドキュメント
          </li>
        </ul>
      </main>

      <footer className="footer">
        <p>© 2024 SmartToDo. All rights reserved.</p>
      </footer>
    </div>
  )
}

