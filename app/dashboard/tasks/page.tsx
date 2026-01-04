'use client'

import { useState } from 'react'
import '../globals.css'
import Sidebar from '@/components/Sidebar'
import Header from '@/components/Header'
import { Search, Filter, SortAsc, SortDesc } from 'lucide-react'

interface Task {
  id: string
  title: string
  source: 'jira' | 'salesforce' | 'notion'
  status: 'todo' | 'in-progress' | 'done' | 'stalled'
  assignee: string
  dueDate: string
  estimatedTime: number
  actualTime: number | null
  category: string
  priority: 'low' | 'medium' | 'high'
}

export default function AllTasksPage() {
  const [selectedOrganization, setSelectedOrganization] = useState('wevnal')
  const [selectedTeam, setSelectedTeam] = useState('Engineering Team A')
  const [dateRange, setDateRange] = useState({
    start: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
    end: new Date()
  })
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [sortBy, setSortBy] = useState<'date' | 'priority' | 'title'>('date')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')

  // サンプルデータ
  const tasks: Task[] = [
    {
      id: '1',
      title: 'ユーザー認証機能の実装',
      source: 'jira',
      status: 'in-progress',
      assignee: '田中太郎',
      dueDate: '2024-01-20',
      estimatedTime: 8,
      actualTime: 6,
      category: '開発',
      priority: 'high',
    },
    {
      id: '2',
      title: '新規顧客オンボーディング資料作成',
      source: 'notion',
      status: 'todo',
      assignee: '佐藤花子',
      dueDate: '2024-01-25',
      estimatedTime: 4,
      actualTime: null,
      category: 'ドキュメント',
      priority: 'medium',
    },
    {
      id: '3',
      title: 'Q4営業レポート作成',
      source: 'salesforce',
      status: 'done',
      assignee: '鈴木一郎',
      dueDate: '2024-01-15',
      estimatedTime: 6,
      actualTime: 5.5,
      category: 'レポート',
      priority: 'high',
    },
    {
      id: '4',
      title: 'APIエンドポイントの設計',
      source: 'jira',
      status: 'stalled',
      assignee: '山田次郎',
      dueDate: '2024-01-18',
      estimatedTime: 12,
      actualTime: 8,
      category: '開発',
      priority: 'medium',
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

  const getStatusBadge = (status: string) => {
    const statusMap = {
      'todo': { label: 'To Do', color: '#6b7280' },
      'in-progress': { label: 'In Progress', color: '#3b82f6' },
      'done': { label: 'Done', color: '#10b981' },
      'stalled': { label: 'Stalled', color: '#ef4444' },
    }
    const statusInfo = statusMap[status as keyof typeof statusMap] || statusMap.todo
    return (
      <span
        className="task-status-badge"
        style={{ backgroundColor: `${statusInfo.color}20`, color: statusInfo.color }}
      >
        {statusInfo.label}
      </span>
    )
  }

  const getPriorityBadge = (priority: string) => {
    const priorityMap = {
      'low': { label: 'Low', color: '#10b981' },
      'medium': { label: 'Medium', color: '#f59e0b' },
      'high': { label: 'High', color: '#ef4444' },
    }
    const priorityInfo = priorityMap[priority as keyof typeof priorityMap] || priorityMap.low
    return (
      <span
        className="task-priority-badge"
        style={{ backgroundColor: `${priorityInfo.color}20`, color: priorityInfo.color }}
      >
        {priorityInfo.label}
      </span>
    )
  }

  const filteredTasks = tasks.filter((task) => {
    const matchesSearch = task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      task.assignee.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesStatus = statusFilter === 'all' || task.status === statusFilter
    return matchesSearch && matchesStatus
  })

  const sortedTasks = [...filteredTasks].sort((a, b) => {
    if (sortBy === 'date') {
      return sortOrder === 'asc'
        ? new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()
        : new Date(b.dueDate).getTime() - new Date(a.dueDate).getTime()
    } else if (sortBy === 'priority') {
      const priorityOrder = { high: 3, medium: 2, low: 1 }
      return sortOrder === 'asc'
        ? priorityOrder[a.priority] - priorityOrder[b.priority]
        : priorityOrder[b.priority] - priorityOrder[a.priority]
    } else {
      return sortOrder === 'asc'
        ? a.title.localeCompare(b.title)
        : b.title.localeCompare(a.title)
    }
  })

  return (
    <div className="dashboard-container">
      <Sidebar 
        selectedOrganization={selectedOrganization}
        selectedTeam={selectedTeam}
        onOrganizationChange={setSelectedOrganization}
        onTeamChange={setSelectedTeam}
      />
      <div className="dashboard-main">
        <Header 
          dateRange={dateRange} 
          onDateRangeChange={setDateRange}
          selectedTeam={selectedTeam}
          selectedOrganization={selectedOrganization}
        />
        <div className="dashboard-content">
          <div className="tasks-header">
            <h1 className="page-title">All Tasks</h1>
            <div className="tasks-controls">
              <div className="search-box">
                <Search size={18} />
                <input
                  type="text"
                  placeholder="タスクまたは担当者で検索..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="search-input"
                />
              </div>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="filter-select"
              >
                <option value="all">すべてのステータス</option>
                <option value="todo">To Do</option>
                <option value="in-progress">In Progress</option>
                <option value="done">Done</option>
                <option value="stalled">Stalled</option>
              </select>
              <div className="sort-controls">
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as 'date' | 'priority' | 'title')}
                  className="sort-select"
                >
                  <option value="date">日付</option>
                  <option value="priority">優先度</option>
                  <option value="title">タイトル</option>
                </select>
                <button
                  onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                  className="sort-button"
                >
                  {sortOrder === 'asc' ? <SortAsc size={18} /> : <SortDesc size={18} />}
                </button>
              </div>
            </div>
          </div>

          <div className="tasks-table-container">
            <table className="tasks-table">
              <thead>
                <tr>
                  <th>Source</th>
                  <th>タイトル</th>
                  <th>担当者</th>
                  <th>ステータス</th>
                  <th>優先度</th>
                  <th>カテゴリー</th>
                  <th>期限</th>
                  <th>工数</th>
                </tr>
              </thead>
              <tbody>
                {sortedTasks.map((task) => (
                  <tr key={task.id}>
                    <td>
                      <span className="task-source-icon">{getSourceIcon(task.source)}</span>
                    </td>
                    <td>
                      <div className="task-title-cell">
                        <strong>{task.title}</strong>
                      </div>
                    </td>
                    <td>{task.assignee}</td>
                    <td>{getStatusBadge(task.status)}</td>
                    <td>{getPriorityBadge(task.priority)}</td>
                    <td>{task.category}</td>
                    <td>{task.dueDate}</td>
                    <td>
                      <div className="task-time">
                        <span>見積: {task.estimatedTime}h</span>
                        {task.actualTime !== null && (
                          <span className="actual-time">実績: {task.actualTime}h</span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {sortedTasks.length === 0 && (
            <div className="empty-state">
              <p>タスクが見つかりませんでした</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

