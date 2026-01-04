'use client'

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'

interface DailyData {
  date: string
  planned: number
  actual: number
}

export default function DailyTrend() {
  // サンプルデータ（実際の実装ではAPIから取得）
  const data: DailyData[] = [
    { date: 'Mon', planned: 8, actual: 7.5 },
    { date: 'Tue', planned: 8, actual: 8.2 },
    { date: 'Wed', planned: 8, actual: 6.8 },
    { date: 'Thu', planned: 8, actual: 5.5 },
    { date: 'Fri', planned: 8, actual: 7.0 },
  ]

  return (
    <div className="daily-trend-container">
      <h2 className="section-title">Daily Trend</h2>
      <div className="chart-wrapper">
        <ResponsiveContainer width="100%" height={250}>
          <BarChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis label={{ value: '工数 (時間)', angle: -90, position: 'insideLeft' }} />
            <Tooltip />
            <Legend />
            <Bar dataKey="planned" fill="#3b82f6" name="予定工数" />
            <Bar dataKey="actual" fill="#10b981" name="実績工数" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}

