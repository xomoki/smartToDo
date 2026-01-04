import { NextRequest, NextResponse } from 'next/server'
import openai from '@/lib/openai'

export async function POST(request: NextRequest) {
  try {
    const { title, description, sourceSystem } = await request.json()

    if (!title) {
      return NextResponse.json(
        { error: 'Title is required' },
        { status: 400 }
      )
    }

    const prompt = `以下のタスク情報から、適切なカテゴリーを1つ選んでください。
タスクタイトル: ${title}
${description ? `説明: ${description}` : ''}
元ツール: ${sourceSystem}

カテゴリーは以下のいずれかから選択してください：
- 開発
- 会議
- ドキュメント
- レビュー
- 営業
- レポート
- その他

カテゴリーのみを回答してください（説明は不要です）。`

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: 'あなたはタスク管理システムのAIアシスタントです。タスクのタイトルと説明から適切なカテゴリーを判定します。',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature: 0.3,
      max_tokens: 50,
    })

    const category = completion.choices[0]?.message?.content?.trim() || 'その他'

    return NextResponse.json({ category })
  } catch (error: any) {
    console.error('OpenAI API error:', error)
    return NextResponse.json(
      { error: 'Failed to generate category', details: error.message },
      { status: 500 }
    )
  }
}

