import { NextRequest, NextResponse } from 'next/server'
import openai from '@/lib/openai'

export async function POST(request: NextRequest) {
  try {
    const { title, description, category, userHistory, teamContext } = await request.json()

    if (!title) {
      return NextResponse.json(
        { error: 'Title is required' },
        { status: 400 }
      )
    }

    // ユーザーの過去の見積もり傾向を分析
    const historyContext = userHistory && userHistory.length > 0
      ? `過去の実績:
${userHistory.slice(0, 5).map((h: any) => 
  `- ${h.title}: 見積もり${h.estimated_time}時間、実績${h.actual_time}時間（乖離: ${h.gap_percentage}%）`
).join('\n')}`
      : '過去の実績データなし'

    const prompt = `以下のタスクの工数見積もりを行ってください。

タスク情報:
タイトル: ${title}
${description ? `説明: ${description}` : ''}
カテゴリー: ${category || '未分類'}

${historyContext}

${teamContext ? `チーム情報:\n${teamContext}` : ''}

過去の実績を考慮して、現実的な工数見積もり（時間単位）を数値のみで返してください。
説明は不要です。数値のみ（例: 8）を返してください。`

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: 'あなたはプロジェクト管理の専門家です。タスクの工数見積もりを正確に行います。',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature: 0.3,
      max_tokens: 50,
    })

    const responseText = completion.choices[0]?.message?.content?.trim()
    const estimatedHours = parseFloat(responseText || '0') || 0

    return NextResponse.json({ estimatedHours: Math.max(0, estimatedHours) })
  } catch (error: any) {
    console.error('OpenAI API error:', error)
    return NextResponse.json(
      { error: 'Failed to estimate time', details: error.message },
      { status: 500 }
    )
  }
}

