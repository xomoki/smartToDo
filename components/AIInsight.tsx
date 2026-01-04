'use client'

import { Lightbulb } from 'lucide-react'

export default function AIInsight() {
  const insights = [
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
  ]

  return (
    <div className="ai-insight-container">
      <h2 className="section-title">
        <Lightbulb size={20} />
        AI Weekly Insight
      </h2>
      <div className="insight-list">
        {insights.map((insight, index) => (
          <div key={index} className={`insight-item insight-${insight.type}`}>
            <div className="insight-header">
              <h3 className="insight-title">{insight.title}</h3>
            </div>
            <p className="insight-message">{insight.message}</p>
          </div>
        ))}
      </div>
    </div>
  )
}

