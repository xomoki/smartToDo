import { NextRequest, NextResponse } from 'next/server'
import openai from '@/lib/openai'

export async function POST(request: NextRequest) {
  try {
    const { title, description, teamContext, memberSkills } = await request.json()

    if (!title) {
      return NextResponse.json(
        { error: 'Title is required' },
        { status: 400 }
      )
    }

    const prompt = `以下の親タスクを、チームのコンテキストを考慮してサブタスクに分解してください。

親タスク:
タイトル: ${title}
${description ? `説明: ${description}` : ''}

チーム情報:
${teamContext || '情報なし'}

メンバースキル:
${memberSkills || '情報なし'}

以下のJSON形式で、サブタスクの配列を返してください：
[
  {
    "title": "サブタスクタイトル",
    "description": "サブタスクの説明",
    "estimatedHours": 数値（時間単位）,
    "assignee": "担当者名（推奨）",
    "dependencies": ["依存するサブタスクのタイトル（配列）"]
  }
]

JSONのみを返してください。説明文は不要です。`

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: 'あなたはプロジェクト管理の専門家です。大きなタスクを実装可能なサブタスクに分解し、適切な工数見積もりを提供します。',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature: 0.5,
      max_tokens: 2000,
      response_format: { type: 'json_object' },
    })

    const responseText = completion.choices[0]?.message?.content?.trim()
    
    if (!responseText) {
      return NextResponse.json(
        { error: 'No response from AI' },
        { status: 500 }
      )
    }

    // JSONをパース
    let subtasks
    try {
      const parsed = JSON.parse(responseText)
      // レスポンスがオブジェクトの場合、subtasksキーを探す
      subtasks = parsed.subtasks || parsed.tasks || (Array.isArray(parsed) ? parsed : [])
    } catch (e) {
      // JSON形式でない場合、テキストから抽出を試みる
      return NextResponse.json(
        { error: 'Failed to parse AI response', response: responseText },
        { status: 500 }
      )
    }

    return NextResponse.json({ subtasks })
  } catch (error: any) {
    console.error('OpenAI API error:', error)
    return NextResponse.json(
      { error: 'Failed to decompose task', details: error.message },
      { status: 500 }
    )
  }
}

