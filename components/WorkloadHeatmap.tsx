'use client'

import { useMemo } from 'react'

interface HeatmapData {
  day: string
  hour: number
  category: string
  intensity: number
}

export default function WorkloadHeatmap() {
  // サンプルデータ（実際の実装ではAPIから取得）
  const heatmapData: HeatmapData[] = useMemo(() => {
    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri']
    const hours = Array.from({ length: 12 }, (_, i) => i + 9) // 9時〜20時
    const categories = ['開発', '会議', 'ドキュメント', 'レビュー', 'その他']
    
    const data: HeatmapData[] = []
    days.forEach((day) => {
      hours.forEach((hour) => {
        // ランダムなデータ生成（実際はAPIから取得）
        const category = categories[Math.floor(Math.random() * categories.length)]
        const intensity = Math.floor(Math.random() * 100)
        data.push({ day, hour, category, intensity })
      })
    })
    return data
  }, [])

  const getColor = (category: string, intensity: number) => {
    const colorMap: Record<string, string> = {
      開発: '#3b82f6', // 青
      会議: '#ef4444', // 赤
      ドキュメント: '#10b981', // 緑
      レビュー: '#f59e0b', // オレンジ
      その他: '#6b7280', // グレー
    }
    
    const baseColor = colorMap[category] || '#6b7280'
    const opacity = Math.max(0.3, intensity / 100)
    
    // RGB値を取得してopacityを適用
    if (baseColor.startsWith('#')) {
      const r = parseInt(baseColor.slice(1, 3), 16)
      const g = parseInt(baseColor.slice(3, 5), 16)
      const b = parseInt(baseColor.slice(5, 7), 16)
      return `rgba(${r}, ${g}, ${b}, ${opacity})`
    }
    return baseColor
  }

  const hours = Array.from({ length: 12 }, (_, i) => i + 9)
  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri']

  return (
    <div className="heatmap-container">
      <h2 className="section-title">Workload Heatmap</h2>
      <div className="heatmap-wrapper">
        <div className="heatmap-grid">
          <div className="heatmap-header">
            <div className="heatmap-header-cell"></div>
            {hours.map((hour) => (
              <div key={hour} className="heatmap-header-cell">
                {hour}:00
              </div>
            ))}
          </div>
          {days.map((day) => (
            <div key={day} className="heatmap-row">
              <div className="heatmap-day-label">{day}</div>
              {hours.map((hour) => {
                const cellData = heatmapData.find(
                  (d) => d.day === day && d.hour === hour
                )
                const category = cellData?.category || ''
                const intensity = cellData?.intensity || 0
                return (
                  <div
                    key={`${day}-${hour}`}
                    className="heatmap-cell"
                    style={{
                      backgroundColor: getColor(category, intensity),
                    }}
                    title={`${day} ${hour}:00 - ${category} (${intensity}%)`}
                  />
                )
              })}
            </div>
          ))}
        </div>
        <div className="heatmap-legend">
          <div className="legend-title">カテゴリー</div>
          <div className="legend-items">
            <div className="legend-item">
              <div className="legend-color" style={{ backgroundColor: '#3b82f6' }}></div>
              <span>開発</span>
            </div>
            <div className="legend-item">
              <div className="legend-color" style={{ backgroundColor: '#ef4444' }}></div>
              <span>会議</span>
            </div>
            <div className="legend-item">
              <div className="legend-color" style={{ backgroundColor: '#10b981' }}></div>
              <span>ドキュメント</span>
            </div>
            <div className="legend-item">
              <div className="legend-color" style={{ backgroundColor: '#f59e0b' }}></div>
              <span>レビュー</span>
            </div>
            <div className="legend-item">
              <div className="legend-color" style={{ backgroundColor: '#6b7280' }}></div>
              <span>その他</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

