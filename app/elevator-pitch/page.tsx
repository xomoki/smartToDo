import Link from 'next/link'
import { readFile } from 'fs/promises'
import { join } from 'path'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

async function getMarkdownContent() {
  try {
    const filePath = join(process.cwd(), 'elevator-pitch.md')
    const content = await readFile(filePath, 'utf-8')
    return content
  } catch (error) {
    return '# エラーファイルが見つかりませんでした。'
  }
}

export default async function ElevatorPitchPage() {
  const content = await getMarkdownContent()

  return (
    <div className="container">
      <header className="header">
        <h1>SmartToDo</h1>
        <p>AI搭載型チーム生産性統合プラットフォーム</p>
        <nav className="nav">
          <Link href="/">ホーム</Link>
          <Link href="/elevator-pitch">エレベーターピッチ</Link>
          <Link href="/business-requirements">ビジネス要件定義書</Link>
          <Link href="/product-requirements">プロダクト開発要求定義書</Link>
        </nav>
      </header>

      <main className="content">
        <ReactMarkdown remarkPlugins={[remarkGfm]}>
          {content}
        </ReactMarkdown>
      </main>

      <footer className="footer">
        <p>© 2024 SmartToDo. All rights reserved.</p>
      </footer>
    </div>
  )
}

