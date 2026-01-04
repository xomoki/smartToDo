'use client'

import { useState, useEffect } from 'react'
import { Lightbulb, Loader2 } from 'lucide-react'
import { generateWeeklyInsight } from '@/lib/ai'

interface AIInsightProps {
  organizationId?: string
  teamId?: string | null
  periodStart?: Date
  periodEnd?: Date
}

export default function AIInsight({ 
  organizationId = 'demo-org',
  teamId = null,
  periodStart,
  periodEnd
}: AIInsightProps) {
  const [insights, setInsights] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [summary, setSummary] = useState<string>('')

  useEffect(() => {
    const loadInsights = async () => {
      if (!periodStart || !periodEnd) return

      setIsLoading(true)
      try {
        const data = await generateWeeklyInsight(
          organizationId,
          teamId,
          periodStart.toISOString().split('T')[0],
          periodEnd.toISOString().split('T')[0]
        )

        if (data) {
          setSummary(data.summary || '')
          setInsights(data.recommendations || [])
        } else {
          // フォールバック: デモデータ
          setInsights([
            {
              type: 'warning',
              title: '会議時間の最適化',
              message: '木曜午後の開発速度が低下しています。会議が多すぎるため、会議なしブロックの設定を推奨します。',
            },
            {
              type: 'info',
              title: 'タスク分解の改善',
              message: '今週の予実乖離率が15%と高めです。大きなタスクの分解をより細かく行うことで、見積もり精度が向上する可能性があります。',
            },
          ])
        }
      } catch (error) {
        console.error('Failed to load insights:', error)
        // エラー時もデモデータを表示
        setInsights([
          {
            type: 'warning',
            title: '会議時間の最適化',
            message: '木曜午後の開発速度が低下しています。会議が多すぎるため、会議なしブロックの設定を推奨します。',
          },
        ])
      } finally {
        setIsLoading(false)
      }
    }

    loadInsights()
  }, [organizationId, teamId, periodStart, periodEnd])

  return (
    <div className="ai-insight-container">
      <h2 className="section-title">
        <Lightbulb size={20} />
        AI Weekly Insight
      </h2>
      {isLoading ? (
        <div className="insight-loading">
          <Loader2 size={20} className="animate-spin" />
          <span>AI分析中...</span>
        </div>
      ) : (
        <>
          {summary && (
            <div className="insight-summary">
              <p>{summary}</p>
            </div>
          )}
          <div className="insight-list">
            {insights.length > 0 ? (
              insights.map((insight, index) => (
                <div key={index} className={`insight-item insight-${insight.type}`}>
                  <div className="insight-header">
                    <h3 className="insight-title">{insight.title}</h3>
                  </div>
                  <p className="insight-message">{insight.message}</p>
                </div>
              ))
            ) : (
              <p className="insight-empty">インサイトがありません</p>
            )}
          </div>
        </>
      )}
    </div>
  )
}

