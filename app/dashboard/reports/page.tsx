'use client'

import { useState } from 'react'
import '../globals.css'
import Sidebar from '@/components/Sidebar'
import Header from '@/components/Header'
import { Download, FileText, Calendar } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line } from 'recharts'

export default function ReportsPage() {
  const [selectedOrganization, setSelectedOrganization] = useState('wevnal')
  const [selectedTeam, setSelectedTeam] = useState('Engineering Team A')
  const [dateRange, setDateRange] = useState({
    start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30日前
    end: new Date()
  })
  const [selectedReport, setSelectedReport] = useState<'weekly' | 'monthly'>('weekly')

  const weeklyData = [
    { week: 'Week 1', planned: 40, actual: 38, completed: 35 },
    { week: 'Week 2', planned: 40, actual: 42, completed: 40 },
    { week: 'Week 3', planned: 40, actual: 35, completed: 33 },
    { week: 'Week 4', planned: 40, actual: 39, completed: 37 },
  ]

  const monthlyData = [
    { month: 'Jan', tasks: 120, completed: 110, velocity: 92 },
    { month: 'Feb', tasks: 135, completed: 128, velocity: 95 },
    { month: 'Mar', tasks: 140, completed: 132, velocity: 94 },
    { month: 'Apr', tasks: 125, completed: 118, velocity: 94 },
  ]

  const categoryBreakdown = [
    { category: '開発', hours: 120, percentage: 45 },
    { category: '会議', hours: 60, percentage: 22 },
    { category: 'ドキュメント', hours: 50, percentage: 19 },
    { category: 'レビュー', hours: 35, percentage: 13 },
    { category: 'その他', hours: 5, percentage: 2 },
  ]

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
              <p className="page-subtitle">チームの生産性と進捗を分析</p>
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
                    {selectedReport === 'weekly' ? '160' : '520'}
                  </div>
                </div>
                <div className="summary-stat-item">
                  <div className="summary-stat-label">完了タスク数</div>
                  <div className="summary-stat-value">
                    {selectedReport === 'weekly' ? '145' : '488'}
                  </div>
                </div>
                <div className="summary-stat-item">
                  <div className="summary-stat-label">完了率</div>
                  <div className="summary-stat-value">
                    {selectedReport === 'weekly' ? '90.6%' : '93.8%'}
                  </div>
                </div>
                <div className="summary-stat-item">
                  <div className="summary-stat-label">平均ベロシティ</div>
                  <div className="summary-stat-value">
                    {selectedReport === 'weekly' ? '36.3' : '122'}
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

