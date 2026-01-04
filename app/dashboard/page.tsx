'use client'

import { useState } from 'react'
import './globals.css'
import Sidebar from '@/components/Sidebar'
import Header from '@/components/Header'
import KPICards from '@/components/KPICards'
import WorkloadHeatmap from '@/components/WorkloadHeatmap'
import DailyTrend from '@/components/DailyTrend'
import AIInsight from '@/components/AIInsight'
import FocusTaskList from '@/components/FocusTaskList'

export default function DashboardPage() {
  const [selectedOrganization, setSelectedOrganization] = useState('wevnal')
  const [selectedTeam, setSelectedTeam] = useState('Engineering Team A')
  const [dateRange, setDateRange] = useState({
    start: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 7日前
    end: new Date()
  })

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
          <KPICards />
          
          <div className="dashboard-grid">
            <div className="dashboard-grid-left">
              <WorkloadHeatmap />
            </div>
            <div className="dashboard-grid-right">
              <DailyTrend />
              <AIInsight />
            </div>
          </div>
          
          <FocusTaskList />
        </div>
      </div>
    </div>
  )
}

