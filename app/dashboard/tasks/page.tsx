'use client'

import { useState } from 'react'
import '../globals.css'
import Sidebar from '@/components/Sidebar'
import Header from '@/components/Header'
import { Search, Filter, SortAsc, SortDesc, Plus, Upload, Edit2, Save, X, FileText } from 'lucide-react'

interface Task {
  id: string
  title: string
  source: 'jira' | 'salesforce' | 'notion' | 'manual'
  status: 'todo' | 'in-progress' | 'done' | 'stalled'
  assignee: string
  dueDate: string
  estimatedTime: number
  actualTime: number | null
  category: string
  priority: 'low' | 'medium' | 'high'
  description?: string
}

export default function AllTasksPage() {
  const [selectedOrganization, setSelectedOrganization] = useState('wevnal')
  const [selectedTeam, setSelectedTeam] = useState('ALL')
  const [dateRange, setDateRange] = useState({
    start: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
    end: new Date()
  })
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [sortBy, setSortBy] = useState<'date' | 'priority' | 'title'>('date')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')
  
  // 新規タスク登録関連
  const [showAddTaskForm, setShowAddTaskForm] = useState(false)
  const [showBulkAddForm, setShowBulkAddForm] = useState(false)
  const [newTask, setNewTask] = useState({
    title: '',
    description: '',
    assignee: '',
    dueDate: '',
    estimatedTime: '',
    category: '',
    priority: 'medium' as 'low' | 'medium' | 'high',
  })
  const [bulkTasksText, setBulkTasksText] = useState('')
  
  // 進捗更新関連
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null)
  const [editingTask, setEditingTask] = useState<Partial<Task>>({})

  // サンプルデータ
  const [tasks, setTasks] = useState<Task[]>([
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
  ])

  const getSourceIcon = (source: string) => {
    switch (source) {
      case 'jira':
        return '🔵'
      case 'salesforce':
        return '🟢'
      case 'notion':
        return '⚪'
      case 'manual':
        return '📝'
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

  const handleAddTask = () => {
    if (newTask.title.trim()) {
      const task: Task = {
        id: Date.now().toString(),
        title: newTask.title,
        description: newTask.description,
        source: 'manual',
        status: 'todo',
        assignee: newTask.assignee || '未割り当て',
        dueDate: newTask.dueDate || new Date().toISOString().split('T')[0],
        estimatedTime: parseFloat(newTask.estimatedTime) || 0,
        actualTime: null,
        category: newTask.category || 'その他',
        priority: newTask.priority,
      }
      setTasks([...tasks, task])
      setNewTask({
        title: '',
        description: '',
        assignee: '',
        dueDate: '',
        estimatedTime: '',
        category: '',
        priority: 'medium',
      })
      setShowAddTaskForm(false)
      alert('タスクを追加しました')
    }
  }

  const handleBulkAddTasks = () => {
    if (bulkTasksText.trim()) {
      // 改行で分割してタスクを作成
      const lines = bulkTasksText.split('\n').filter(line => line.trim())
      const newTasks: Task[] = lines.map((line, index) => ({
        id: `${Date.now()}-${index}`,
        title: line.trim(),
        source: 'manual',
        status: 'todo',
        assignee: '未割り当て',
        dueDate: new Date().toISOString().split('T')[0],
        estimatedTime: 0,
        actualTime: null,
        category: 'その他',
        priority: 'medium' as 'low' | 'medium' | 'high',
      }))
      setTasks([...tasks, ...newTasks])
      setBulkTasksText('')
      setShowBulkAddForm(false)
      alert(`${newTasks.length}件のタスクを追加しました`)
    }
  }

  const handleStartEdit = (task: Task) => {
    setEditingTaskId(task.id)
    setEditingTask({
      status: task.status,
      assignee: task.assignee,
      dueDate: task.dueDate,
      actualTime: task.actualTime,
      priority: task.priority,
    })
  }

  const handleSaveEdit = (taskId: string) => {
    setTasks(tasks.map(task => 
      task.id === taskId 
        ? { ...task, ...editingTask }
        : task
    ))
    setEditingTaskId(null)
    setEditingTask({})
    alert('タスクを更新しました')
  }

  const handleCancelEdit = () => {
    setEditingTaskId(null)
    setEditingTask({})
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
              <div className="task-actions">
                {!showAddTaskForm && !showBulkAddForm && (
                  <>
                    <button
                      onClick={() => {
                        setShowAddTaskForm(true)
                        setShowBulkAddForm(false)
                      }}
                      className="add-task-button"
                    >
                      <Plus size={18} />
                      新規タスク
                    </button>
                    <button
                      onClick={() => {
                        setShowBulkAddForm(true)
                        setShowAddTaskForm(false)
                      }}
                      className="bulk-add-button"
                    >
                      <Upload size={18} />
                      一括登録
                    </button>
                  </>
                )}
              </div>
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

          {/* 新規タスク登録フォーム */}
          {showAddTaskForm && (
            <div className="add-task-form-container">
              <div className="add-task-form-header">
                <h3>新規タスク登録</h3>
                <button
                  onClick={() => {
                    setShowAddTaskForm(false)
                    setNewTask({
                      title: '',
                      description: '',
                      assignee: '',
                      dueDate: '',
                      estimatedTime: '',
                      category: '',
                      priority: 'medium',
                    })
                  }}
                  className="close-form-button"
                >
                  <X size={18} />
                </button>
              </div>
              <div className="add-task-form">
                <div className="form-row">
                  <label>タイトル *</label>
                  <input
                    type="text"
                    value={newTask.title}
                    onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
                    placeholder="タスクタイトルを入力"
                    className="form-input"
                  />
                </div>
                <div className="form-row">
                  <label>説明</label>
                  <textarea
                    value={newTask.description}
                    onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
                    placeholder="タスクの説明を入力"
                    className="form-textarea"
                    rows={3}
                  />
                </div>
                <div className="form-row-grid">
                  <div className="form-row">
                    <label>担当者</label>
                    <input
                      type="text"
                      value={newTask.assignee}
                      onChange={(e) => setNewTask({ ...newTask, assignee: e.target.value })}
                      placeholder="担当者名"
                      className="form-input"
                    />
                  </div>
                  <div className="form-row">
                    <label>期限</label>
                    <input
                      type="date"
                      value={newTask.dueDate}
                      onChange={(e) => setNewTask({ ...newTask, dueDate: e.target.value })}
                      className="form-input"
                    />
                  </div>
                  <div className="form-row">
                    <label>見積もり時間（時間）</label>
                    <input
                      type="number"
                      value={newTask.estimatedTime}
                      onChange={(e) => setNewTask({ ...newTask, estimatedTime: e.target.value })}
                      placeholder="0"
                      className="form-input"
                      min="0"
                      step="0.5"
                    />
                  </div>
                  <div className="form-row">
                    <label>カテゴリー</label>
                    <input
                      type="text"
                      value={newTask.category}
                      onChange={(e) => setNewTask({ ...newTask, category: e.target.value })}
                      placeholder="開発、会議、ドキュメント等"
                      className="form-input"
                    />
                  </div>
                  <div className="form-row">
                    <label>優先度</label>
                    <select
                      value={newTask.priority}
                      onChange={(e) => setNewTask({ ...newTask, priority: e.target.value as 'low' | 'medium' | 'high' })}
                      className="form-input"
                    >
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                    </select>
                  </div>
                </div>
                <div className="form-actions">
                  <button onClick={handleAddTask} className="save-task-button">
                    <Save size={18} />
                    保存
                  </button>
                  <button
                    onClick={() => {
                      setShowAddTaskForm(false)
                      setNewTask({
                        title: '',
                        description: '',
                        assignee: '',
                        dueDate: '',
                        estimatedTime: '',
                        category: '',
                        priority: 'medium',
                      })
                    }}
                    className="cancel-task-button"
                  >
                    キャンセル
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* 一括登録フォーム */}
          {showBulkAddForm && (
            <div className="add-task-form-container">
              <div className="add-task-form-header">
                <h3>タスク一括登録</h3>
                <button
                  onClick={() => {
                    setShowBulkAddForm(false)
                    setBulkTasksText('')
                  }}
                  className="close-form-button"
                >
                  <X size={18} />
                </button>
              </div>
              <div className="add-task-form">
                <div className="form-row">
                  <label>タスク一覧（1行に1タスク）</label>
                  <textarea
                    value={bulkTasksText}
                    onChange={(e) => setBulkTasksText(e.target.value)}
                    placeholder="タスク1&#10;タスク2&#10;タスク3"
                    className="form-textarea"
                    rows={10}
                  />
                  <p className="form-hint">1行に1つのタスクを入力してください</p>
                </div>
                <div className="form-actions">
                  <button onClick={handleBulkAddTasks} className="save-task-button">
                    <Upload size={18} />
                    一括登録
                  </button>
                  <button
                    onClick={() => {
                      setShowBulkAddForm(false)
                      setBulkTasksText('')
                    }}
                    className="cancel-task-button"
                  >
                    キャンセル
                  </button>
                </div>
              </div>
            </div>
          )}

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
                  <th>操作</th>
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
                    <td>
                      {editingTaskId === task.id ? (
                        <input
                          type="text"
                          value={editingTask.assignee || ''}
                          onChange={(e) => setEditingTask({ ...editingTask, assignee: e.target.value })}
                          className="edit-input"
                        />
                      ) : (
                        task.assignee
                      )}
                    </td>
                    <td>
                      {editingTaskId === task.id ? (
                        <select
                          value={editingTask.status || task.status}
                          onChange={(e) => setEditingTask({ ...editingTask, status: e.target.value as Task['status'] })}
                          className="edit-select"
                        >
                          <option value="todo">To Do</option>
                          <option value="in-progress">In Progress</option>
                          <option value="done">Done</option>
                          <option value="stalled">Stalled</option>
                        </select>
                      ) : (
                        getStatusBadge(task.status)
                      )}
                    </td>
                    <td>
                      {editingTaskId === task.id ? (
                        <select
                          value={editingTask.priority || task.priority}
                          onChange={(e) => setEditingTask({ ...editingTask, priority: e.target.value as Task['priority'] })}
                          className="edit-select"
                        >
                          <option value="low">Low</option>
                          <option value="medium">Medium</option>
                          <option value="high">High</option>
                        </select>
                      ) : (
                        getPriorityBadge(task.priority)
                      )}
                    </td>
                    <td>{task.category}</td>
                    <td>
                      {editingTaskId === task.id ? (
                        <input
                          type="date"
                          value={editingTask.dueDate || task.dueDate}
                          onChange={(e) => setEditingTask({ ...editingTask, dueDate: e.target.value })}
                          className="edit-input"
                        />
                      ) : (
                        task.dueDate
                      )}
                    </td>
                    <td>
                      {editingTaskId === task.id ? (
                        <div className="edit-time-inputs">
                          <input
                            type="number"
                            placeholder="実績時間"
                            value={editingTask.actualTime || ''}
                            onChange={(e) => setEditingTask({ ...editingTask, actualTime: parseFloat(e.target.value) || null })}
                            className="edit-input-small"
                            min="0"
                            step="0.5"
                          />
                          <span>h</span>
                        </div>
                      ) : (
                        <div className="task-time">
                          <span>見積: {task.estimatedTime}h</span>
                          {task.actualTime !== null && (
                            <span className="actual-time">実績: {task.actualTime}h</span>
                          )}
                        </div>
                      )}
                    </td>
                    <td>
                      {editingTaskId === task.id ? (
                        <div className="edit-actions">
                          <button
                            onClick={() => handleSaveEdit(task.id)}
                            className="save-edit-button"
                            title="保存"
                          >
                            <Save size={16} />
                          </button>
                          <button
                            onClick={handleCancelEdit}
                            className="cancel-edit-button"
                            title="キャンセル"
                          >
                            <X size={16} />
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => handleStartEdit(task)}
                          className="edit-task-button"
                          title="編集"
                        >
                          <Edit2 size={16} />
                        </button>
                      )}
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
