'use client'

import { format } from 'date-fns'
import { Calendar } from 'lucide-react'

interface HeaderProps {
  dateRange: { start: Date; end: Date }
  onDateRangeChange: (range: { start: Date; end: Date }) => void
  selectedTeam: string
}

export default function Header({ dateRange, onDateRangeChange, selectedTeam }: HeaderProps) {
  const handleDateChange = (type: 'start' | 'end', value: string) => {
    const newDate = new Date(value)
    if (type === 'start') {
      onDateRangeChange({ ...dateRange, start: newDate })
    } else {
      onDateRangeChange({ ...dateRange, end: newDate })
    }
  }

  return (
    <header className="dashboard-header">
      <div className="dashboard-header-left">
        <h1 className="dashboard-title">Dashboard</h1>
        <span className="dashboard-team-badge">{selectedTeam}</span>
      </div>
      <div className="dashboard-header-right">
        <div className="date-picker">
          <Calendar size={18} />
          <input
            type="date"
            value={format(dateRange.start, 'yyyy-MM-dd')}
            onChange={(e) => handleDateChange('start', e.target.value)}
            className="date-input"
          />
          <span className="date-separator">〜</span>
          <input
            type="date"
            value={format(dateRange.end, 'yyyy-MM-dd')}
            onChange={(e) => handleDateChange('end', e.target.value)}
            className="date-input"
          />
        </div>
      </div>
    </header>
  )
}

