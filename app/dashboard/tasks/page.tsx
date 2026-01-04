'use client'

import { useState, useEffect } from 'react'
import '../globals.css'
import Sidebar from '@/components/Sidebar'
import Header from '@/components/Header'
import { Search, Filter, SortAsc, SortDesc, Plus, Upload, Edit2, Save, X, FileText, Sparkles, Loader2 } from 'lucide-react'
import { autoTagTask, estimateTaskTime } from '@/lib/ai'
import { getTasks, createTask, createTasks, updateTask, Task as TaskType } from '@/lib/tasks'
import { getOrganizationMembers, getTeamMembers, Member } from '@/lib/organizations'
import { getCurrentUser } from '@/lib/auth'

interface Task {
  id: string
  title: string
  source: 'jira' | 'salesforce' | 'notion' | 'manual'
  status: 'todo' | 'in-progress' | 'done' | 'stalled'
  assignee: string
  assigneeId?: string
  dueDate: string
  estimatedTime: number
  actualTime: number | null
  category: string
  priority: 'low' | 'medium' | 'high'
  description?: string
}

export default function AllTasksPage() {
  const [selectedOrganization, setSelectedOrganization] = useState<string>('')
  const [selectedTeam, setSelectedTeam] = useState('ALL')
  const [dateRange, setDateRange] = useState({
    start: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
    end: new Date()
  })
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [sortBy, setSortBy] = useState<'date' | 'priority' | 'title'>('date')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')
  
  // データ状態
  const [tasks, setTasks] = useState<Task[]>([])
  const [members, setMembers] = useState<Member[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  // 新規タスク登録関連
  const [showAddTaskForm, setShowAddTaskForm] = useState(false)
  const [showBulkAddForm, setShowBulkAddForm] = useState(false)
  const [newTask, setNewTask] = useState({
    title: '',
    description: '',
    assignee: '',
    assigneeId: '',
    dueDate: '',
    estimatedTime: '',
    category: '',
    priority: 'medium' as 'low' | 'medium' | 'high',
  })
  const [isGeneratingCategory, setIsGeneratingCategory] = useState(false)
  const [isEstimatingTime, setIsEstimatingTime] = useState(false)
  const [bulkTasksText, setBulkTasksText] = useState('')
  
  // 一括登録用のタスクリスト
  const [bulkTasks, setBulkTasks] = useState<Array<{
    title: string
    description: string
    assignee: string
    assigneeId: string
    dueDate: string
    estimatedTime: string
    category: string
    priority: 'low' | 'medium' | 'high'
  }>>([])
  
  // 進捗更新関連
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null)
  const [editingTask, setEditingTask] = useState<Partial<Task>>({})

  // データ読み込み
  useEffect(() => {
    if (selectedOrganization) {
      loadData()
    }
  }, [selectedOrganization, selectedTeam, statusFilter, searchQuery])

  const loadData = async () => {
    if (!selectedOrganization) return

    setIsLoading(true)
    setError(null)

    try {
      const user = await getCurrentUser()
      if (!user) return

      // タスクを取得
      const taskData = await getTasks(selectedOrganization, selectedTeam === 'ALL' ? null : selectedTeam, {
        status: statusFilter,
        search: searchQuery || undefined,
      })

      // メンバーを取得
      let memberList: Member[] = []
      if (selectedTeam && selectedTeam !== 'ALL') {
        memberList = await getTeamMembers(selectedTeam)
      } else {
        memberList = await getOrganizationMembers(selectedOrganization)
      }
      setMembers(memberList)

      // タスクデータを変換
      const convertedTasks: Task[] = await Promise.all(
        taskData.map(async (task) => {
          // 担当者情報を取得
          let assigneeName = '未割り当て'
          if (task.assignee_id) {
            const assignee = memberList.find(m => m.id === task.assignee_id)
            assigneeName = assignee?.name || '未割り当て'
          }

          return {
            id: task.id,
            title: task.title,
            source: (task.source_system as any) || 'manual',
            status: task.status,
            assignee: assigneeName,
            assigneeId: task.assignee_id || undefined,
            dueDate: task.due_date || '',
            estimatedTime: task.estimated_time || 0,
            actualTime: null, // 実際の実装ではtask_time_logsから集計
            category: task.ai_category || task.manual_category || 'その他',
            priority: (task.priority as any) || 'medium',
            description: task.description,
          }
        })
      )

      setTasks(convertedTasks)
    } catch (err: any) {
      console.error('Failed to load data:', err)
      setError(err.message || 'データの読み込みに失敗しました')
    } finally {
      setIsLoading(false)
    }
  }

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

  const handleGenerateCategory = async () => {
    if (!newTask.title.trim()) {
      alert('タイトルを入力してください')
      return
    }

    setIsGeneratingCategory(true)
    try {
      const category = await autoTagTask(newTask.title, newTask.description, 'manual')
      setNewTask({ ...newTask, category })
    } catch (error) {
      console.error('Failed to generate category:', error)
    } finally {
      setIsGeneratingCategory(false)
    }
  }

  const handleEstimateTime = async () => {
    if (!newTask.title.trim()) {
      alert('タイトルを入力してください')
      return
    }

    setIsEstimatingTime(true)
    try {
      const estimatedHours = await estimateTaskTime(
        newTask.title,
        newTask.description,
        newTask.category
      )
      setNewTask({ ...newTask, estimatedTime: estimatedHours.toString() })
    } catch (error) {
      console.error('Failed to estimate time:', error)
    } finally {
      setIsEstimatingTime(false)
    }
  }

  const handleAddTask = async () => {
    if (!newTask.title.trim() || !selectedOrganization) {
      alert('タイトルと組織を入力してください')
      return
    }

    setIsSaving(true)
    try {
      const selectedMember = members.find(m => m.name === newTask.assignee)
      
      await createTask({
        organization_id: selectedOrganization,
        team_id: selectedTeam === 'ALL' ? undefined : selectedTeam,
        source_system: 'manual',
        external_id: `manual-${Date.now()}`,
        title: newTask.title,
        description: newTask.description || undefined,
        status: 'todo',
        priority: newTask.priority,
        assignee_id: selectedMember?.id || undefined,
        manual_category: newTask.category || undefined,
        estimated_time: parseFloat(newTask.estimatedTime) || undefined,
        due_date: newTask.dueDate || undefined,
      })

      setNewTask({
        title: '',
        description: '',
        assignee: '',
        assigneeId: '',
        dueDate: '',
        estimatedTime: '',
        category: '',
        priority: 'medium',
      })
      setShowAddTaskForm(false)
      await loadData()
      alert('タスクを追加しました')
    } catch (err: any) {
      console.error('Failed to create task:', err)
      alert(`エラー: ${err.message || 'タスクの作成に失敗しました'}`)
    } finally {
      setIsSaving(false)
    }
  }

  const handleBulkAddFromText = () => {
    if (bulkTasksText.trim()) {
      const lines = bulkTasksText.split('\n').filter(line => line.trim())
      const newBulkTasks = lines.map((line) => ({
        title: line.trim(),
        description: '',
        assignee: '',
        assigneeId: '',
        dueDate: '',
        estimatedTime: '',
        category: '',
        priority: 'medium' as 'low' | 'medium' | 'high',
      }))
      setBulkTasks(newBulkTasks)
      setBulkTasksText('')
    }
  }

  const handleBulkTaskChange = (index: number, field: string, value: any) => {
    const updated = [...bulkTasks]
    updated[index] = { ...updated[index], [field]: value }
    
    // 担当者名が変更された場合、IDも更新
    if (field === 'assignee') {
      const selectedMember = members.find(m => m.name === value)
      updated[index].assigneeId = selectedMember?.id || ''
    }
    
    setBulkTasks(updated)
  }

  const handleAddBulkTask = () => {
    setBulkTasks([...bulkTasks, {
      title: '',
      description: '',
      assignee: '',
      assigneeId: '',
      dueDate: '',
      estimatedTime: '',
      category: '',
      priority: 'medium',
    }])
  }

  const handleRemoveBulkTask = (index: number) => {
    setBulkTasks(bulkTasks.filter((_, i) => i !== index))
  }

  const handleBulkAddTasks = async () => {
    if (bulkTasks.length === 0 || !selectedOrganization) {
      alert('タスクを追加してください')
      return
    }

    const validTasks = bulkTasks.filter(task => task.title.trim())
    if (validTasks.length === 0) {
      alert('タイトルが入力されているタスクがありません')
      return
    }

    setIsSaving(true)
    try {
      const tasksToCreate = validTasks.map((task) => ({
        organization_id: selectedOrganization,
        team_id: selectedTeam === 'ALL' ? undefined : selectedTeam,
        source_system: 'manual' as const,
        external_id: `manual-${Date.now()}-${Math.random()}`,
        title: task.title.trim(),
        description: task.description || undefined,
        status: 'todo' as const,
        priority: task.priority,
        assignee_id: task.assigneeId || undefined,
        manual_category: task.category || undefined,
        estimated_time: parseFloat(task.estimatedTime) || undefined,
        due_date: task.dueDate || undefined,
      }))

      await createTasks(tasksToCreate)
      
      setBulkTasks([])
      setBulkTasksText('')
      setShowBulkAddForm(false)
      await loadData()
      alert(`${validTasks.length}件のタスクを追加しました`)
    } catch (err: any) {
      console.error('Failed to create tasks:', err)
      alert(`エラー: ${err.message || 'タスクの作成に失敗しました'}`)
    } finally {
      setIsSaving(false)
    }
  }

  const handleStartEdit = (task: Task) => {
    setEditingTaskId(task.id)
    setEditingTask({
      status: task.status,
      assignee: task.assignee,
      assigneeId: task.assigneeId,
      dueDate: task.dueDate,
      actualTime: task.actualTime,
      priority: task.priority,
    })
  }

  const handleSaveEdit = async (taskId: string) => {
    setIsSaving(true)
    try {
      const selectedMember = members.find(m => m.name === editingTask.assignee)
      
      await updateTask(taskId, {
        status: editingTask.status as any,
        priority: editingTask.priority as any,
        assignee_id: selectedMember?.id || editingTask.assigneeId || undefined,
        due_date: editingTask.dueDate || undefined,
      })

      setEditingTaskId(null)
      setEditingTask({})
      await loadData()
      alert('タスクを更新しました')
    } catch (err: any) {
      console.error('Failed to update task:', err)
      alert(`エラー: ${err.message || 'タスクの更新に失敗しました'}`)
    } finally {
      setIsSaving(false)
    }
  }

  const handleCancelEdit = () => {
    setEditingTaskId(null)
    setEditingTask({})
  }

  const filteredTasks = tasks.filter((task) => {
    const matchesSearch = task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      task.assignee.toLowerCase().includes(searchQuery.toLowerCase())
    return matchesSearch
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

  if (isLoading && tasks.length === 0) {
    return (
      <div className="dashboard-container">
        <div className="dashboard-main" style={{ marginLeft: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
          <div style={{ textAlign: 'center' }}>
            <Loader2 className="animate-spin" size={32} style={{ margin: '0 auto 1rem' }} />
            <p>読み込み中...</p>
          </div>
        </div>
      </div>
    )
  }

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
          {error && (
            <div className="error-banner">
              <p>{error}</p>
            </div>
          )}

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
                      disabled={!selectedOrganization}
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
                      disabled={!selectedOrganization}
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
                      assigneeId: '',
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
                    <select
                      value={newTask.assignee}
                      onChange={(e) => {
                        const selectedMember = members.find(m => m.name === e.target.value)
                        setNewTask({ 
                          ...newTask, 
                          assignee: e.target.value,
                          assigneeId: selectedMember?.id || ''
                        })
                      }}
                      className="form-input"
                    >
                      <option value="">未割り当て</option>
                      {members.map((member) => (
                        <option key={member.id} value={member.name}>
                          {member.name} {member.team ? `(${member.team})` : ''}
                        </option>
                      ))}
                    </select>
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
                    <div className="form-input-with-button">
                      <input
                        type="number"
                        value={newTask.estimatedTime}
                        onChange={(e) => setNewTask({ ...newTask, estimatedTime: e.target.value })}
                        placeholder="0"
                        className="form-input"
                        min="0"
                        step="0.5"
                      />
                      <button
                        type="button"
                        onClick={handleEstimateTime}
                        disabled={isEstimatingTime || !newTask.title.trim()}
                        className="ai-button"
                        title="AIで見積もり"
                      >
                        <Sparkles size={16} />
                        {isEstimatingTime ? '見積中...' : 'AI見積'}
                      </button>
                    </div>
                  </div>
                <div className="form-row">
                  <label>カテゴリー</label>
                  <div className="form-input-with-button">
                    <input
                      type="text"
                      value={newTask.category}
                      onChange={(e) => setNewTask({ ...newTask, category: e.target.value })}
                      placeholder="開発、会議、ドキュメント等"
                      className="form-input"
                    />
                    <button
                      type="button"
                      onClick={handleGenerateCategory}
                      disabled={isGeneratingCategory || !newTask.title.trim()}
                      className="ai-button"
                      title="AIで自動判定"
                    >
                      <Sparkles size={16} />
                      {isGeneratingCategory ? '生成中...' : 'AI判定'}
                    </button>
                  </div>
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
                  <button 
                    onClick={handleAddTask} 
                    className="save-task-button"
                    disabled={isSaving}
                  >
                    <Save size={18} />
                    {isSaving ? '保存中...' : '保存'}
                  </button>
                  <button
                    onClick={() => {
                      setShowAddTaskForm(false)
                      setNewTask({
                        title: '',
                        description: '',
                        assignee: '',
                        assigneeId: '',
                        dueDate: '',
                        estimatedTime: '',
                        category: '',
                        priority: 'medium',
                      })
                    }}
                    className="cancel-task-button"
                    disabled={isSaving}
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
                    setBulkTasks([])
                  }}
                  className="close-form-button"
                >
                  <X size={18} />
                </button>
              </div>
              <div className="add-task-form">
                {bulkTasks.length === 0 ? (
                  <>
                    <div className="form-row">
                      <label>タスク一覧（1行に1タスク）</label>
                      <textarea
                        value={bulkTasksText}
                        onChange={(e) => setBulkTasksText(e.target.value)}
                        placeholder="タスク1&#10;タスク2&#10;タスク3"
                        className="form-textarea"
                        rows={10}
                      />
                      <p className="form-hint">1行に1つのタスクタイトルを入力してください。詳細情報は次のステップで入力できます。</p>
                    </div>
                    <div className="form-actions">
                      <button 
                        onClick={handleBulkAddFromText} 
                        className="save-task-button"
                        disabled={!bulkTasksText.trim()}
                      >
                        <FileText size={18} />
                        タスクを展開
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
                  </>
                ) : (
                  <>
                    <div className="bulk-tasks-header">
                      <h4>タスク詳細入力 ({bulkTasks.length}件)</h4>
                      <button
                        onClick={handleAddBulkTask}
                        className="add-bulk-task-button"
                      >
                        <Plus size={16} />
                        タスクを追加
                      </button>
                    </div>
                    <div className="bulk-tasks-list">
                      {bulkTasks.map((task, index) => (
                        <div key={index} className="bulk-task-item">
                          <div className="bulk-task-item-header">
                            <span className="bulk-task-number">タスク {index + 1}</span>
                            {bulkTasks.length > 1 && (
                              <button
                                onClick={() => handleRemoveBulkTask(index)}
                                className="remove-bulk-task-button"
                                title="このタスクを削除"
                              >
                                <X size={16} />
                              </button>
                            )}
                          </div>
                          <div className="bulk-task-form">
                            <div className="form-row">
                              <label>タイトル *</label>
                              <input
                                type="text"
                                value={task.title}
                                onChange={(e) => handleBulkTaskChange(index, 'title', e.target.value)}
                                placeholder="タスクタイトルを入力"
                                className="form-input"
                              />
                            </div>
                            <div className="form-row">
                              <label>説明</label>
                              <textarea
                                value={task.description}
                                onChange={(e) => handleBulkTaskChange(index, 'description', e.target.value)}
                                placeholder="タスクの説明を入力"
                                className="form-textarea"
                                rows={2}
                              />
                            </div>
                            <div className="form-row-grid">
                              <div className="form-row">
                                <label>担当者</label>
                                <select
                                  value={task.assignee}
                                  onChange={(e) => handleBulkTaskChange(index, 'assignee', e.target.value)}
                                  className="form-input"
                                >
                                  <option value="">未割り当て</option>
                                  {members.map((member) => (
                                    <option key={member.id} value={member.name}>
                                      {member.name} {member.team ? `(${member.team})` : ''}
                                    </option>
                                  ))}
                                </select>
                              </div>
                              <div className="form-row">
                                <label>期限</label>
                                <input
                                  type="date"
                                  value={task.dueDate}
                                  onChange={(e) => handleBulkTaskChange(index, 'dueDate', e.target.value)}
                                  className="form-input"
                                />
                              </div>
                              <div className="form-row">
                                <label>見積もり時間（時間）</label>
                                <input
                                  type="number"
                                  value={task.estimatedTime}
                                  onChange={(e) => handleBulkTaskChange(index, 'estimatedTime', e.target.value)}
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
                                  value={task.category}
                                  onChange={(e) => handleBulkTaskChange(index, 'category', e.target.value)}
                                  placeholder="開発、会議、ドキュメント等"
                                  className="form-input"
                                />
                              </div>
                              <div className="form-row">
                                <label>優先度</label>
                                <select
                                  value={task.priority}
                                  onChange={(e) => handleBulkTaskChange(index, 'priority', e.target.value as 'low' | 'medium' | 'high')}
                                  className="form-input"
                                >
                                  <option value="low">Low</option>
                                  <option value="medium">Medium</option>
                                  <option value="high">High</option>
                                </select>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="form-actions">
                      <button 
                        onClick={handleBulkAddTasks} 
                        className="save-task-button"
                        disabled={isSaving}
                      >
                        <Upload size={18} />
                        {isSaving ? '登録中...' : `一括登録 (${bulkTasks.filter(t => t.title.trim()).length}件)`}
                      </button>
                      <button
                        onClick={() => {
                          setShowBulkAddForm(false)
                          setBulkTasksText('')
                          setBulkTasks([])
                        }}
                        className="cancel-task-button"
                        disabled={isSaving}
                      >
                        キャンセル
                      </button>
                    </div>
                  </>
                )}
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
                        <select
                          value={editingTask.assignee || ''}
                          onChange={(e) => {
                            const selectedMember = members.find(m => m.name === e.target.value)
                            setEditingTask({ 
                              ...editingTask, 
                              assignee: e.target.value,
                              assigneeId: selectedMember?.id || ''
                            })
                          }}
                          className="edit-select"
                        >
                          <option value="">未割り当て</option>
                          {members.map((member) => (
                            <option key={member.id} value={member.name}>
                              {member.name}
                            </option>
                          ))}
                        </select>
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
                            disabled={isSaving}
                          >
                            <Save size={16} />
                          </button>
                          <button
                            onClick={handleCancelEdit}
                            className="cancel-edit-button"
                            title="キャンセル"
                            disabled={isSaving}
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

          {sortedTasks.length === 0 && !isLoading && (
            <div className="empty-state">
              <p>タスクが見つかりませんでした</p>
              {!selectedOrganization && (
                <p style={{ marginTop: '0.5rem', fontSize: '0.875rem', color: '#6b7280' }}>
                  組織を選択してください
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
