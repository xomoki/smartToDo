'use client'

import { useState } from 'react'
import '../globals.css'
import Sidebar from '@/components/Sidebar'
import Header from '@/components/Header'
import { Download, FileText, Calendar } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line } from 'recharts'

export default function ReportsPage() {
  const [selectedOrganization, setSelectedOrganization] = useState('wevnal')
  const [selectedTeam, setSelectedTeam] = useState('ALL')
  const [dateRange, setDateRange] = useState({
    start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30日前
    end: new Date()
  })
  const [selectedReport, setSelectedReport] = useState<'weekly' | 'monthly'>('weekly')

  // 個別チームデータ
  const weeklyDataByTeam = {
    'Engineering Team A': [
      { week: 'Week 1', planned: 40, actual: 38, completed: 35 },
      { week: 'Week 2', planned: 40, actual: 42, completed: 40 },
      { week: 'Week 3', planned: 40, actual: 35, completed: 33 },
      { week: 'Week 4', planned: 40, actual: 39, completed: 37 },
    ],
    'Engineering Team B': [
      { week: 'Week 1', planned: 35, actual: 33, completed: 30 },
      { week: 'Week 2', planned: 35, actual: 36, completed: 34 },
      { week: 'Week 3', planned: 35, actual: 32, completed: 30 },
      { week: 'Week 4', planned: 35, actual: 34, completed: 33 },
    ],
    'Sales Team': [
      { week: 'Week 1', planned: 30, actual: 28, completed: 25 },
      { week: 'Week 2', planned: 30, actual: 31, completed: 29 },
      { week: 'Week 3', planned: 30, actual: 29, completed: 27 },
      { week: 'Week 4', planned: 30, actual: 30, completed: 28 },
    ],
  }

  const monthlyDataByTeam = {
    'Engineering Team A': [
      { month: 'Jan', tasks: 120, completed: 110, velocity: 92 },
      { month: 'Feb', tasks: 135, completed: 128, velocity: 95 },
      { month: 'Mar', tasks: 140, completed: 132, velocity: 94 },
      { month: 'Apr', tasks: 125, completed: 118, velocity: 94 },
    ],
    'Engineering Team B': [
      { month: 'Jan', tasks: 105, completed: 98, velocity: 93 },
      { month: 'Feb', tasks: 115, completed: 108, velocity: 94 },
      { month: 'Mar', tasks: 120, completed: 114, velocity: 95 },
      { month: 'Apr', tasks: 110, completed: 105, velocity: 95 },
    ],
    'Sales Team': [
      { month: 'Jan', tasks: 90, completed: 82, velocity: 91 },
      { month: 'Feb', tasks: 95, completed: 88, velocity: 93 },
      { month: 'Mar', tasks: 100, completed: 94, velocity: 94 },
      { month: 'Apr', tasks: 92, completed: 87, velocity: 95 },
    ],
  }

  // ALL選択時は全チーム合計を計算
  const calculateAllTeamsData = (dataByTeam: Record<string, any[]>, key: string) => {
    if (selectedTeam === 'ALL') {
      const allTeams = Object.keys(dataByTeam)
      const result: any[] = []
      
      // 各週/月のデータを合計
      const periods = dataByTeam[allTeams[0]]?.map((item: any) => item[key]) || []
      
      periods.forEach((period: string) => {
        const aggregated = allTeams.reduce((acc, team) => {
          const teamData = dataByTeam[team]?.find((item: any) => item[key] === period)
          if (teamData) {
            acc.planned += teamData.planned || 0
            acc.actual += teamData.actual || 0
            acc.completed += teamData.completed || 0
            acc.tasks += teamData.tasks || 0
            acc.velocity = acc.completed > 0 ? Math.round((acc.completed / acc.tasks) * 100) : 0
          }
          return acc
        }, { [key]: period, planned: 0, actual: 0, completed: 0, tasks: 0, velocity: 0 })
        result.push(aggregated)
      })
      
      return result
    }
    
    return dataByTeam[selectedTeam as keyof typeof dataByTeam] || []
  }

  const weeklyData = calculateAllTeamsData(weeklyDataByTeam, 'week')
  const monthlyData = calculateAllTeamsData(monthlyDataByTeam, 'month')

  // カテゴリー別工数もALL選択時は合計
  const categoryBreakdownByTeam = {
    'Engineering Team A': [
      { category: '開発', hours: 120, percentage: 45 },
      { category: '会議', hours: 60, percentage: 22 },
      { category: 'ドキュメント', hours: 50, percentage: 19 },
      { category: 'レビュー', hours: 35, percentage: 13 },
      { category: 'その他', hours: 5, percentage: 2 },
    ],
    'Engineering Team B': [
      { category: '開発', hours: 100, percentage: 48 },
      { category: '会議', hours: 50, percentage: 24 },
      { category: 'ドキュメント', hours: 40, percentage: 19 },
      { category: 'レビュー', hours: 18, percentage: 9 },
    ],
    'Sales Team': [
      { category: '営業', hours: 80, percentage: 50 },
      { category: '会議', hours: 50, percentage: 31 },
      { category: 'ドキュメント', hours: 30, percentage: 19 },
    ],
  }

  const calculateCategoryBreakdown = () => {
    if (selectedTeam === 'ALL') {
      const allCategories = new Map<string, { hours: number; percentage: number }>()
      const totalHours = Object.values(categoryBreakdownByTeam).reduce((sum, teamData) => {
        return sum + teamData.reduce((teamSum, item) => teamSum + item.hours, 0)
      }, 0)

      Object.values(categoryBreakdownByTeam).forEach((teamData) => {
        teamData.forEach((item) => {
          const existing = allCategories.get(item.category) || { hours: 0, percentage: 0 }
          existing.hours += item.hours
          allCategories.set(item.category, existing)
        })
      })

      return Array.from(allCategories.entries()).map(([category, data]) => ({
        category,
        hours: data.hours,
        percentage: Math.round((data.hours / totalHours) * 100),
      }))
    }

    return categoryBreakdownByTeam[selectedTeam as keyof typeof categoryBreakdownByTeam] || []
  }

  const categoryBreakdown = calculateCategoryBreakdown()

  // サマリー統計もALL選択時は合計
  const calculateSummaryStats = () => {
    if (selectedTeam === 'ALL') {
      const allTeams = ['Engineering Team A', 'Engineering Team B', 'Sales Team']
      const stats = {
        totalTasks: 0,
        completedTasks: 0,
        totalVelocity: 0,
      }

      allTeams.forEach((team) => {
        const teamData = selectedReport === 'weekly' 
          ? weeklyDataByTeam[team as keyof typeof weeklyDataByTeam]
          : monthlyDataByTeam[team as keyof typeof monthlyDataByTeam]
        
        if (teamData) {
          teamData.forEach((item: any) => {
            stats.totalTasks += item.tasks || item.completed || 0
            stats.completedTasks += item.completed || 0
          })
        }
      })

      return {
        totalTasks: stats.totalTasks,
        completedTasks: stats.completedTasks,
        completionRate: stats.totalTasks > 0 
          ? `${Math.round((stats.completedTasks / stats.totalTasks) * 100)}%`
          : '0%',
        avgVelocity: Math.round(stats.totalVelocity / allTeams.length) || 0,
      }
    }

    // 個別チームの場合
    const data = selectedReport === 'weekly' ? weeklyData : monthlyData
    const totalTasks = data.reduce((sum, item) => sum + (item.tasks || 0), 0)
    const completedTasks = data.reduce((sum, item) => sum + (item.completed || 0), 0)

    return {
      totalTasks: selectedReport === 'weekly' ? 160 : 520,
      completedTasks: selectedReport === 'weekly' ? 145 : 488,
      completionRate: selectedReport === 'weekly' ? '90.6%' : '93.8%',
      avgVelocity: selectedReport === 'weekly' ? 36 : 122,
    }
  }

  const summaryStats = calculateSummaryStats()

  const handleDownloadReport = () => {
    alert('レポートのダウンロード機能（実装予定）')
  }

  return (
    <div className="dashboard-container">
      <Sidebar 
        selectedOrganization={selectedOrganization}
        selectedTeam={selectedTeam}
        onOrganizationChange={setSelectedOrganization}
        onTeamChange={setSelectedTeam}
      />
      <div className="dashboard-main">
        <Header 
          dateRange={dateRange} 
          onDateRangeChange={setDateRange}
          selectedTeam={selectedTeam}
          selectedOrganization={selectedOrganization}
        />
        <div className="dashboard-content">
          <div className="reports-header">
            <div>
              <h1 className="page-title">Reports</h1>
              <p className="page-subtitle">
                {selectedTeam === 'ALL' ? '全チームの生産性と進捗を分析' : 'チームの生産性と進捗を分析'}
              </p>
            </div>
            <div className="reports-controls">
              <div className="report-type-selector">
                <button
                  className={`report-type-button ${selectedReport === 'weekly' ? 'active' : ''}`}
                  onClick={() => setSelectedReport('weekly')}
                >
                  <Calendar size={18} />
                  週次レポート
                </button>
                <button
                  className={`report-type-button ${selectedReport === 'monthly' ? 'active' : ''}`}
                  onClick={() => setSelectedReport('monthly')}
                >
                  <Calendar size={18} />
                  月次レポート
                </button>
              </div>
              <button
                onClick={handleDownloadReport}
                className="download-button"
              >
                <Download size={18} />
                レポートをダウンロード
              </button>
            </div>
          </div>

          <div className="reports-grid">
            <div className="report-card">
              <h2 className="report-card-title">工数トレンド</h2>
              <div className="chart-wrapper">
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={selectedReport === 'weekly' ? weeklyData : monthlyData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey={selectedReport === 'weekly' ? 'week' : 'month'} />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="planned" fill="#3b82f6" name="予定工数" />
                    <Bar dataKey="actual" fill="#10b981" name="実績工数" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="report-card">
              <h2 className="report-card-title">完了率トレンド</h2>
              <div className="chart-wrapper">
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={selectedReport === 'weekly' ? weeklyData : monthlyData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey={selectedReport === 'weekly' ? 'week' : 'month'} />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="completed" stroke="#10b981" name="完了タスク数" />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="report-card">
              <h2 className="report-card-title">カテゴリー別工数</h2>
              <div className="category-breakdown">
                {categoryBreakdown.map((item, index) => (
                  <div key={index} className="category-item">
                    <div className="category-header">
                      <span className="category-name">{item.category}</span>
                      <span className="category-percentage">{item.percentage}%</span>
                    </div>
                    <div className="category-bar">
                      <div
                        className="category-bar-fill"
                        style={{ width: `${item.percentage}%` }}
                      ></div>
                    </div>
                    <div className="category-hours">{item.hours}時間</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="report-card">
              <h2 className="report-card-title">サマリー統計</h2>
              <div className="summary-stats">
                <div className="summary-stat-item">
                  <div className="summary-stat-label">総タスク数</div>
                  <div className="summary-stat-value">
                    {summaryStats.totalTasks}
                  </div>
                </div>
                <div className="summary-stat-item">
                  <div className="summary-stat-label">完了タスク数</div>
                  <div className="summary-stat-value">
                    {summaryStats.completedTasks}
                  </div>
                </div>
                <div className="summary-stat-item">
                  <div className="summary-stat-label">完了率</div>
                  <div className="summary-stat-value">
                    {summaryStats.completionRate}
                  </div>
                </div>
                <div className="summary-stat-item">
                  <div className="summary-stat-label">平均ベロシティ</div>
                  <div className="summary-stat-value">
                    {summaryStats.avgVelocity}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="report-card">
            <h2 className="report-card-title">AI分析レポート</h2>
            <div className="ai-report-content">
              <div className="ai-report-section">
                <h3>主要な改善点</h3>
                <ul>
                  <li>会議時間が全体の22%を占めており、開発時間が圧迫されています。週1回の「会議なしデー」の導入を推奨します。</li>
                  <li>レビュー時間の効率化により、開発速度を15%向上させる可能性があります。</li>
                  <li>大きなタスクの分解をより細かく行うことで、見積もり精度が向上しています。</li>
                </ul>
              </div>
              <div className="ai-report-section">
                <h3>今後の推奨事項</h3>
                <ul>
                  <li>木曜午後の開発速度が低下している傾向があります。会議スケジュールの見直しを検討してください。</li>
                  <li>高優先度タスクの完了率が95%を超えているため、優先度付けの精度が高いと評価できます。</li>
                  <li>チーム全体のベロシティが安定しているため、現在のワークフローを維持することを推奨します。</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

