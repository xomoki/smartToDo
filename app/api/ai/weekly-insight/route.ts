import { NextRequest, NextResponse } from 'next/server'
import openai from '@/lib/openai'

export async function POST(request: NextRequest) {
  try {
    const { 
      organizationId, 
      teamId, 
      periodStart, 
      periodEnd,
      tasks,
      timeLogs,
      metrics 
    } = await request.json()

    if (!organizationId || !periodStart || !periodEnd) {
      return NextResponse.json(
        { error: 'Missing required parameters' },
        { status: 400 }
      )
    }

    // データを要約
    const summary = {
      totalTasks: tasks?.length || 0,
      completedTasks: tasks?.filter((t: any) => t.status === 'done').length || 0,
      inProgressTasks: tasks?.filter((t: any) => t.status === 'in-progress').length || 0,
      stalledTasks: tasks?.filter((t: any) => t.status === 'stalled').length || 0,
      totalEstimatedHours: tasks?.reduce((sum: number, t: any) => sum + (t.estimated_time || 0), 0) || 0,
      totalActualHours: timeLogs?.reduce((sum: number, log: any) => sum + (log.duration_minutes || 0), 0) / 60 || 0,
      categoryBreakdown: tasks?.reduce((acc: any, t: any) => {
        const cat = t.ai_category || t.manual_category || 'その他'
        acc[cat] = (acc[cat] || 0) + 1
        return acc
      }, {}) || {},
      ...metrics,
    }

    const prompt = `以下の週次データを分析し、改善提案を含むインサイトレポートを作成してください。

期間: ${periodStart} 〜 ${periodEnd}

データサマリー:
- 総タスク数: ${summary.totalTasks}
- 完了タスク数: ${summary.completedTasks}
- 進行中タスク数: ${summary.inProgressTasks}
- 停滞タスク数: ${summary.stalledTasks}
- 予定工数: ${summary.totalEstimatedHours.toFixed(1)}時間
- 実績工数: ${summary.totalActualHours.toFixed(1)}時間
- 完了率: ${summary.totalTasks > 0 ? ((summary.completedTasks / summary.totalTasks) * 100).toFixed(1) : 0}%

カテゴリー別内訳:
${Object.entries(summary.categoryBreakdown).map(([cat, count]) => `- ${cat}: ${count}件`).join('\n')}

以下のJSON形式で返してください：
{
  "summary": "週次の要約（1-2文）",
  "recommendations": [
    {
      "type": "warning" | "info" | "success",
      "title": "推奨事項のタイトル",
      "message": "具体的な改善提案メッセージ"
    }
  ],
  "metrics": {
    "completionRate": 数値（%）,
    "aiEstimGap": 数値（%）,
    "stalledTasks": 数値
  }
}

JSONのみを返してください。`

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: 'あなたはプロジェクト管理の専門家です。データを分析し、具体的で実践的な改善提案を提供します。',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature: 0.7,
      max_tokens: 1500,
      response_format: { type: 'json_object' },
    })

    const responseText = completion.choices[0]?.message?.content?.trim()
    
    if (!responseText) {
      return NextResponse.json(
        { error: 'No response from AI' },
        { status: 500 }
      )
    }

    try {
      const insights = JSON.parse(responseText)
      return NextResponse.json(insights)
    } catch (e) {
      return NextResponse.json(
        { error: 'Failed to parse AI response', response: responseText },
        { status: 500 }
      )
    }
  } catch (error: any) {
    console.error('OpenAI API error:', error)
    return NextResponse.json(
      { error: 'Failed to generate insights', details: error.message },
      { status: 500 }
    )
  }
}

