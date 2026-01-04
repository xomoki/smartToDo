'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, ListTodo, FileText, Settings, Plus, LogOut } from 'lucide-react'
import { getOrganizations, getTeams, Organization, Team } from '@/lib/organizations'
import { getCurrentUser, signOut } from '@/lib/auth'
import { useRouter } from 'next/navigation'

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
  const router = useRouter()
  const [isOrgDropdownOpen, setIsOrgDropdownOpen] = useState(false)
  const [isCreateOrgOpen, setIsCreateOrgOpen] = useState(false)
  const [newOrgName, setNewOrgName] = useState('')
  const [organizations, setOrganizations] = useState<Organization[]>([])
  const [teams, setTeams] = useState<Team[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [userId, setUserId] = useState<string | null>(null)

  useEffect(() => {
    const loadData = async () => {
      try {
        const user = await getCurrentUser()
        if (!user) {
          router.push('/login')
          return
        }

        setUserId(user.id)

        // 組織一覧を取得
        const orgs = await getOrganizations(user.id)
        setOrganizations(orgs)

        if (orgs.length > 0) {
          const defaultOrg = orgs[0]
          onOrganizationChange(defaultOrg.id)

          // チーム一覧を取得
          const teamList = await getTeams(defaultOrg.id)
          setTeams(teamList)

          if (teamList.length > 0 && !selectedTeam || selectedTeam === 'ALL') {
            // デフォルトでALLを選択
          }
        }
      } catch (error) {
        console.error('Failed to load data:', error)
      } finally {
        setIsLoading(false)
      }
    }

    loadData()
  }, [])

  useEffect(() => {
    if (selectedOrganization && selectedOrganization !== 'ALL') {
      const loadTeams = async () => {
        try {
          const teamList = await getTeams(selectedOrganization)
          setTeams(teamList)
        } catch (error) {
          console.error('Failed to load teams:', error)
        }
      }
      loadTeams()
    }
  }, [selectedOrganization])

  const handleCreateOrganization = async () => {
    if (newOrgName.trim() && userId) {
      try {
        const { createOrganization } = await import('@/lib/organizations')
        const slug = newOrgName.toLowerCase().replace(/\s+/g, '-')
        const newOrg = await createOrganization(newOrgName, slug, userId)
        const orgs = await getOrganizations(userId)
        setOrganizations(orgs)
        onOrganizationChange(newOrg.id)
        setNewOrgName('')
        setIsCreateOrgOpen(false)
        alert(`組織 "${newOrgName}" を作成しました`)
      } catch (error: any) {
        alert(`エラー: ${error.message}`)
      }
    }
  }

  const handleSignOut = async () => {
    try {
      await signOut()
      router.push('/login')
    } catch (error) {
      console.error('Sign out error:', error)
    }
  }

  const menuItems = [
    { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/dashboard/tasks', label: 'All Tasks', icon: ListTodo },
    { href: '/dashboard/reports', label: 'Reports', icon: FileText },
    { href: '/dashboard/settings', label: 'Settings', icon: Settings },
  ]

  if (isLoading) {
    return (
      <aside className="sidebar">
        <div className="sidebar-header">
          <h2 className="sidebar-logo">SmartToDo</h2>
        </div>
        <div style={{ padding: '2rem', color: '#9ca3af', textAlign: 'center' }}>
          読み込み中...
        </div>
      </aside>
    )
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
              onTeamChange('ALL')
            }}
            className="sidebar-select"
            disabled={organizations.length === 0}
          >
            {organizations.length > 0 ? (
              organizations.map((org) => (
                <option key={org.id} value={org.id}>
                  {org.name}
                </option>
              ))
            ) : (
              <option value="">組織がありません</option>
            )}
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
          disabled={teams.length === 0}
        >
          <option value="ALL">ALL</option>
          {teams.map((team) => (
            <option key={team.id} value={team.id}>
              {team.name}
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

      <div className="sidebar-footer">
        <button
          onClick={handleSignOut}
          className="sidebar-signout-button"
        >
          <LogOut size={18} />
          ログアウト
        </button>
      </div>
    </aside>
  )
}
