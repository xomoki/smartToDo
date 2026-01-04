import { supabase } from './supabase'

export interface Task {
  id: string
  organization_id: string
  team_id?: string
  source_system: string
  external_id: string
  integration_id?: string
  title: string
  description?: string
  status: 'todo' | 'in-progress' | 'done' | 'stalled'
  priority: 'low' | 'medium' | 'high'
  assignee_id?: string
  ai_category?: string
  manual_category?: string
  estimated_time?: number
  due_date?: string
  parent_task_id?: string
  context_tags?: string[]
  metadata?: any
  created_at: string
  updated_at: string
}

// タスク一覧を取得
export async function getTasks(
  organizationId: string,
  teamId?: string | null,
  filters?: {
    status?: string
    assigneeId?: string
    search?: string
  }
): Promise<Task[]> {
  let query = supabase
    .from('tasks')
    .select('*')
    .eq('organization_id', organizationId)
    .is('deleted_at', null)

  if (teamId && teamId !== 'ALL') {
    query = query.eq('team_id', teamId)
  }

  if (filters?.status && filters.status !== 'all') {
    query = query.eq('status', filters.status)
  }

  if (filters?.assigneeId) {
    query = query.eq('assignee_id', filters.assigneeId)
  }

  if (filters?.search) {
    query = query.or(`title.ilike.%${filters.search}%,description.ilike.%${filters.search}%`)
  }

  const { data, error } = await query.order('created_at', { ascending: false })

  if (error) throw error
  return data || []
}

// タスクを作成
export async function createTask(task: Omit<Task, 'id' | 'created_at' | 'updated_at'>): Promise<Task> {
  const { data, error } = await supabase
    .from('tasks')
    .insert({
      ...task,
      external_id: task.external_id || `manual-${Date.now()}`,
    })
    .select()
    .single()

  if (error) throw error
  return data
}

// 複数タスクを一括作成
export async function createTasks(tasks: Omit<Task, 'id' | 'created_at' | 'updated_at'>[]): Promise<Task[]> {
  const tasksWithExternalId = tasks.map(task => ({
    ...task,
    external_id: task.external_id || `manual-${Date.now()}-${Math.random()}`,
  }))

  const { data, error } = await supabase
    .from('tasks')
    .insert(tasksWithExternalId)
    .select()

  if (error) throw error
  return data || []
}

// タスクを更新
export async function updateTask(taskId: string, updates: Partial<Task>): Promise<Task> {
  const { data, error } = await supabase
    .from('tasks')
    .update(updates)
    .eq('id', taskId)
    .select()
    .single()

  if (error) throw error
  return data
}

// タスクを削除（論理削除）
export async function deleteTask(taskId: string): Promise<void> {
  const { error } = await supabase
    .from('tasks')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', taskId)

  if (error) throw error
}

// 工数ログを記録
export async function logTime(
  taskId: string,
  userId: string,
  date: string,
  durationMinutes: number,
  category?: string,
  description?: string
): Promise<void> {
  const { error } = await supabase
    .from('task_time_logs')
    .insert({
      task_id: taskId,
      user_id: userId,
      date,
      duration_minutes: durationMinutes,
      category,
      description,
    })

  if (error) throw error
}

// AI学習データを記録
export async function recordAILearning(
  organizationId: string,
  taskId: string,
  userId: string,
  estimatedTime: number,
  actualTime: number,
  category?: string,
  contextTags?: string[]
): Promise<void> {
  const gapPercentage = ((actualTime - estimatedTime) / estimatedTime) * 100

  const { error } = await supabase
    .from('ai_learning_data')
    .insert({
      organization_id: organizationId,
      task_id: taskId,
      user_id: userId,
      estimated_time: estimatedTime,
      actual_time: actualTime,
      gap_percentage: gapPercentage,
      category,
      context_tags: contextTags,
    })

  if (error) throw error
}

