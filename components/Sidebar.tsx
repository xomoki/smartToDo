'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, ListTodo, FileText, Settings } from 'lucide-react'

interface SidebarProps {
  selectedTeam: string
  onTeamChange: (team: string) => void
}

export default function Sidebar({ selectedTeam, onTeamChange }: SidebarProps) {
  const pathname = usePathname()

  const teams = [
    'Engineering Team A',
    'Engineering Team B',
    'Sales Team',
    'Customer Success',
  ]

  const menuItems = [
    { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/dashboard/tasks', label: 'All Tasks', icon: ListTodo },
    { href: '/dashboard/reports', label: 'Reports', icon: FileText },
    { href: '/dashboard/settings', label: 'Settings', icon: Settings },
  ]

  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <h2 className="sidebar-logo">SmartToDo</h2>
      </div>
      
      <div className="sidebar-team-selector">
        <label className="sidebar-label">Team</label>
        <select
          value={selectedTeam}
          onChange={(e) => onTeamChange(e.target.value)}
          className="sidebar-select"
        >
          {teams.map((team) => (
            <option key={team} value={team}>
              {team}
            </option>
          ))}
        </select>
      </div>

      <nav className="sidebar-nav">
        {menuItems.map((item) => {
          const Icon = item.icon
          const isActive = pathname === item.href
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`sidebar-nav-item ${isActive ? 'active' : ''}`}
            >
              <Icon size={20} />
              <span>{item.label}</span>
            </Link>
          )
        })}
      </nav>
    </aside>
  )
}

