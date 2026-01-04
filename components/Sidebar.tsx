'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, ListTodo, FileText, Settings, Plus, ChevronDown, ChevronUp } from 'lucide-react'

interface SidebarProps {
  selectedOrganization: string
  selectedTeam: string
  onOrganizationChange: (org: string) => void
  onTeamChange: (team: string) => void
}

export default function Sidebar({ 
  selectedOrganization, 
  selectedTeam, 
  onOrganizationChange, 
  onTeamChange 
}: SidebarProps) {
  const pathname = usePathname()
  const [isOrgDropdownOpen, setIsOrgDropdownOpen] = useState(false)
  const [isCreateOrgOpen, setIsCreateOrgOpen] = useState(false)
  const [newOrgName, setNewOrgName] = useState('')

  const organizations = [
    'wevnal',
    'Acme Corp',
    'Tech Solutions Inc',
  ]

  const teamsByOrg: Record<string, string[]> = {
    'wevnal': [
      'Engineering Team A',
      'Engineering Team B',
      'Sales Team',
      'Customer Success',
    ],
    'Acme Corp': [
      'Development Team',
      'Marketing Team',
    ],
    'Tech Solutions Inc': [
      'Product Team',
      'Support Team',
    ],
  }

  const currentTeams = teamsByOrg[selectedOrganization] || []

  const menuItems = [
    { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/dashboard/tasks', label: 'All Tasks', icon: ListTodo },
    { href: '/dashboard/reports', label: 'Reports', icon: FileText },
    { href: '/dashboard/settings', label: 'Settings', icon: Settings },
  ]

  const handleCreateOrganization = () => {
    if (newOrgName.trim()) {
      // 実際の実装では、APIを呼び出してOrganizationを作成
      console.log('Creating organization:', newOrgName)
      // ここで組織リストを更新する処理を追加
      setNewOrgName('')
      setIsCreateOrgOpen(false)
      alert(`組織 "${newOrgName}" を作成しました（デモモード）`)
    }
  }

  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <h2 className="sidebar-logo">SmartToDo</h2>
      </div>
      
      <div className="sidebar-org-selector">
        <label className="sidebar-label">Organization</label>
        <div className="sidebar-select-wrapper">
          <select
            value={selectedOrganization}
            onChange={(e) => {
              onOrganizationChange(e.target.value)
              // 組織が変わったら、最初のチームを選択
              const newTeams = teamsByOrg[e.target.value] || []
              if (newTeams.length > 0) {
                onTeamChange(newTeams[0])
              }
            }}
            className="sidebar-select"
          >
            {organizations.map((org) => (
              <option key={org} value={org}>
                {org}
              </option>
            ))}
          </select>
          <button
            className="sidebar-add-button"
            onClick={() => setIsCreateOrgOpen(!isCreateOrgOpen)}
            title="新規Organizationを作成"
          >
            <Plus size={16} />
          </button>
        </div>
        
        {isCreateOrgOpen && (
          <div className="sidebar-create-org">
            <input
              type="text"
              value={newOrgName}
              onChange={(e) => setNewOrgName(e.target.value)}
              placeholder="Organization名を入力"
              className="sidebar-create-input"
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  handleCreateOrganization()
                }
              }}
            />
            <div className="sidebar-create-actions">
              <button
                onClick={handleCreateOrganization}
                className="sidebar-create-button"
              >
                作成
              </button>
              <button
                onClick={() => {
                  setIsCreateOrgOpen(false)
                  setNewOrgName('')
                }}
                className="sidebar-cancel-button"
              >
                キャンセル
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="sidebar-team-selector">
        <label className="sidebar-label">Team</label>
        <select
          value={selectedTeam}
          onChange={(e) => onTeamChange(e.target.value)}
          className="sidebar-select"
          disabled={currentTeams.length === 0}
        >
          <option value="ALL">ALL</option>
          {currentTeams.length > 0 ? (
            currentTeams.map((team) => (
              <option key={team} value={team}>
                {team}
              </option>
            ))
          ) : (
            <option value="">チームがありません</option>
          )}
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
