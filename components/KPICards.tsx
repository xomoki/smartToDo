'use client'

import { TrendingDown, TrendingUp, AlertCircle } from 'lucide-react'

export default function KPICards() {
  const kpis = [
    {
      title: 'Completion Rate',
      value: '78%',
      change: -2,
      changeType: 'negative',
      label: '消化率',
    },
    {
      title: 'AI Estim. Gap',
      value: '+15%',
      change: 15,
      changeType: 'negative',
      label: '予実乖離率',
      subtitle: '(Slower)',
    },
    {
      title: 'Stalled Tasks',
      value: '12',
      change: 3,
      changeType: 'negative',
      label: '停滞タスク',
    },
  ]

  return (
    <div className="kpi-cards">
      {kpis.map((kpi, index) => (
        <div key={index} className="kpi-card">
          <div className="kpi-card-header">
            <h3 className="kpi-card-title">{kpi.title}</h3>
            {kpi.changeType === 'negative' ? (
              <TrendingDown className="kpi-icon negative" size={20} />
            ) : (
              <TrendingUp className="kpi-icon positive" size={20} />
            )}
          </div>
          <div className="kpi-card-body">
            <div className="kpi-card-value">{kpi.value}</div>
            {kpi.subtitle && (
              <div className="kpi-card-subtitle">{kpi.subtitle}</div>
            )}
            <div className="kpi-card-label">{kpi.label}</div>
          </div>
          <div className="kpi-card-footer">
            <span className={`kpi-change ${kpi.changeType}`}>
              {kpi.changeType === 'negative' ? '↓' : '↑'}
              {Math.abs(kpi.change)}%
            </span>
            <span className="kpi-change-label">前期間比</span>
          </div>
        </div>
      ))}
    </div>
  )
}

