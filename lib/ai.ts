// AI機能のクライアント側ヘルパー関数

export async function autoTagTask(title: string, description?: string, sourceSystem?: string) {
  try {
    const response = await fetch('/api/ai/auto-tag', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        title,
        description,
        sourceSystem,
      }),
    })

    if (!response.ok) {
      throw new Error('Failed to generate category')
    }

    const data = await response.json()
    return data.category
  } catch (error) {
    console.error('Auto-tag error:', error)
    return 'その他'
  }
}

export async function decomposeTask(
  title: string,
  description?: string,
  teamContext?: string,
  memberSkills?: string
) {
  try {
    const response = await fetch('/api/ai/decompose-task', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        title,
        description,
        teamContext,
        memberSkills,
      }),
    })

    if (!response.ok) {
      throw new Error('Failed to decompose task')
    }

    const data = await response.json()
    return data.subtasks || []
  } catch (error) {
    console.error('Decompose task error:', error)
    return []
  }
}

export async function estimateTaskTime(
  title: string,
  description?: string,
  category?: string,
  userHistory?: any[],
  teamContext?: string
) {
  try {
    const response = await fetch('/api/ai/estimate-time', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        title,
        description,
        category,
        userHistory,
        teamContext,
      }),
    })

    if (!response.ok) {
      throw new Error('Failed to estimate time')
    }

    const data = await response.json()
    return data.estimatedHours || 0
  } catch (error) {
    console.error('Estimate time error:', error)
    return 0
  }
}

export async function generateWeeklyInsight(
  organizationId: string,
  teamId: string | null,
  periodStart: string,
  periodEnd: string,
  tasks?: any[],
  timeLogs?: any[],
  metrics?: any
) {
  try {
    const response = await fetch('/api/ai/weekly-insight', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        organizationId,
        teamId,
        periodStart,
        periodEnd,
        tasks,
        timeLogs,
        metrics,
      }),
    })

    if (!response.ok) {
      throw new Error('Failed to generate insights')
    }

    const data = await response.json()
    return data
  } catch (error) {
    console.error('Generate insight error:', error)
    return null
  }
}

