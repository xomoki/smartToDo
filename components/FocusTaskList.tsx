'use client'

import { AlertCircle, Clock, TrendingUp } from 'lucide-react'

interface Task {
  id: string
  title: string
  source: 'jira' | 'salesforce' | 'notion'
  status: 'overdue' | 'stalled' | 'high-gap'
  assignee: string
  dueDate: string
  gap: number
}

export default function FocusTaskList() {
  // サンプルデータ（実際の実装ではAPIから取得）
  const tasks: Task[] = [
    {
      id: '1',
      title: 'ユーザー認証機能の実装',
      source: 'jira',
      status: 'overdue',
      assignee: '田中太郎',
      dueDate: '2024-01-15',
      gap: 0,
    },
    {
      id: '2',
      title: '新規顧客オンボーディング資料作成',
      source: 'notion',
      status: 'stalled',
      assignee: '佐藤花子',
      dueDate: '2024-01-20',
      gap: 0,
    },
    {
      id: '3',
      title: 'Q4営業レポート作成',
      source: 'salesforce',
      status: 'high-gap',
      assignee: '鈴木一郎',
      dueDate: '2024-01-25',
      gap: 25,
    },
  ]

  const getSourceIcon = (source: string) => {
    switch (source) {
      case 'jira':
        return '🔵'
      case 'salesforce':
        return '🟢'
      case 'notion':
        return '⚪'
      default:
        return '📋'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'overdue':
        return <AlertCircle className="status-icon overdue" size={18} />
      case 'stalled':
        return <Clock className="status-icon stalled" size={18} />
      case 'high-gap':
        return <TrendingUp className="status-icon high-gap" size={18} />
      default:
        return null
    }
  }

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'overdue':
        return '期限切れ'
      case 'stalled':
        return '停滞中'
      case 'high-gap':
        return '乖離大'
      default:
        return ''
    }
  }

  return (
    <div className="focus-task-container">
      <h2 className="section-title">Focus Task List</h2>
      <p className="section-subtitle">今、注意すべきタスク（AI自動選別）</p>
      <div className="task-list">
        {tasks.map((task) => (
          <div key={task.id} className="task-item">
            <div className="task-item-left">
              <span className="task-source-icon">{getSourceIcon(task.source)}</span>
              <div className="task-content">
                <h3 className="task-title">{task.title}</h3>
                <div className="task-meta">
                  <span className="task-assignee">{task.assignee}</span>
                  <span className="task-separator">•</span>
                  <span className="task-due-date">期限: {task.dueDate}</span>
                  {task.gap > 0 && (
                    <>
                      <span className="task-separator">•</span>
                      <span className="task-gap">乖離: +{task.gap}%</span>
                    </>
                  )}
                </div>
              </div>
            </div>
            <div className="task-item-right">
              <div className={`task-status task-status-${task.status}`}>
                {getStatusIcon(task.status)}
                <span>{getStatusLabel(task.status)}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

