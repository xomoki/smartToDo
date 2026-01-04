'use client'

import { useState, useEffect } from 'react'
import '../globals.css'
import Sidebar from '@/components/Sidebar'
import Header from '@/components/Header'
import { Save, Trash2, Plus, X, Mail, UserPlus, Link as LinkIcon, Loader2 } from 'lucide-react'
import { 
  getOrganizationMembersWithTeams, 
  getTeams, 
  inviteMember, 
  createTeam,
  removeOrganizationMember,
  Team,
  Member
} from '@/lib/organizations'
import { getCurrentUser } from '@/lib/auth'

export default function SettingsPage() {
  const [selectedOrganization, setSelectedOrganization] = useState<string>('')
  const [selectedTeam, setSelectedTeam] = useState<string>('ALL')
  const [dateRange, setDateRange] = useState({
    start: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
    end: new Date()
  })

  const [settings, setSettings] = useState({
    notifications: {
      email: true,
      slack: false,
      weeklyReport: true,
      slackWorkspace: '',
      slackChannel: '',
      slackWebhookUrl: '',
    },
    integrations: [
      { id: '1', name: 'Jira', enabled: true, status: 'connected' },
      { id: '2', name: 'Salesforce', enabled: true, status: 'connected' },
      { id: '3', name: 'Notion', enabled: false, status: 'disconnected' },
    ],
    aiSettings: {
      autoTagging: true,
      autoDecomposition: true,
      weeklyInsight: true,
      learningEnabled: true,
    },
  })

  const [newTeamName, setNewTeamName] = useState('')
  const [showAddTeam, setShowAddTeam] = useState(false)
  
  // メンバー招待関連
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteRole, setInviteRole] = useState<'member' | 'manager' | 'admin'>('member')
  const [inviteTeamId, setInviteTeamId] = useState<string>('')
  const [showInviteForm, setShowInviteForm] = useState(false)
  const [members, setMembers] = useState<Member[]>([])
  const [teams, setTeams] = useState<Team[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isInviting, setIsInviting] = useState(false)
  const [isRemoving, setIsRemoving] = useState<string | null>(null)
  const [isCreatingTeam, setIsCreatingTeam] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)

  // データ読み込み
  useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoading(true)
        setError(null)

        const user = await getCurrentUser()
        if (!user) {
          setError('認証されていません。ログインしてください。')
          return
        }

        setCurrentUserId(user.id)

        // 組織IDが設定されている場合のみデータを読み込む
        if (selectedOrganization && selectedOrganization !== 'ALL') {
          // メンバー一覧を取得
          const membersData = await getOrganizationMembersWithTeams(selectedOrganization)
          setMembers(membersData)

          // チーム一覧を取得
          const teamsData = await getTeams(selectedOrganization)
          setTeams(teamsData)
        }
      } catch (err: any) {
        console.error('Failed to load data:', err)
        setError(err.message || 'データの読み込みに失敗しました')
      } finally {
        setIsLoading(false)
      }
    }

    loadData()
  }, [selectedOrganization])

  const handleSave = () => {
    alert('設定を保存しました（デモモード）')
  }

  const handleToggleIntegration = (id: string) => {
    setSettings({
      ...settings,
      integrations: settings.integrations.map((int) =>
        int.id === id ? { ...int, enabled: !int.enabled } : int
      ),
    })
  }

  const handleAddTeam = async () => {
    if (!newTeamName.trim() || !selectedOrganization || selectedOrganization === 'ALL') {
      alert('チーム名と組織を選択してください')
      return
    }

    try {
      setIsCreatingTeam(true)
      setError(null)

      const newTeam = await createTeam(selectedOrganization, newTeamName.trim())
      setTeams([...teams, newTeam])
      setNewTeamName('')
      setShowAddTeam(false)
      alert(`チーム "${newTeamName}" を追加しました`)
    } catch (err: any) {
      console.error('Failed to create team:', err)
      setError(err.message || 'チームの作成に失敗しました')
      alert(`エラー: ${err.message || 'チームの作成に失敗しました'}`)
    } finally {
      setIsCreatingTeam(false)
    }
  }

  const handleInviteMember = async () => {
    if (!inviteEmail.trim()) {
      alert('メールアドレスを入力してください')
      return
    }

    if (!selectedOrganization || selectedOrganization === 'ALL') {
      alert('組織を選択してください')
      return
    }

    if (!currentUserId) {
      alert('認証されていません')
      return
    }

    try {
      setIsInviting(true)
      setError(null)

      const teamId = inviteTeamId && inviteTeamId !== '' ? inviteTeamId : null
      await inviteMember(
        selectedOrganization,
        teamId,
        inviteEmail.trim(),
        inviteRole,
        currentUserId
      )

      // メンバー一覧を再読み込み
      const membersData = await getOrganizationMembersWithTeams(selectedOrganization)
      setMembers(membersData)

      const roleLabels = { member: 'メンバー', manager: 'マネージャー', admin: '管理者' }
      alert(`${inviteEmail} に ${roleLabels[inviteRole]} として招待を送信しました`)
      
      setInviteEmail('')
      setInviteRole('member')
      setInviteTeamId('')
      setShowInviteForm(false)
    } catch (err: any) {
      console.error('Failed to invite member:', err)
      setError(err.message || 'メンバーの招待に失敗しました')
      alert(`エラー: ${err.message || 'メンバーの招待に失敗しました'}`)
    } finally {
      setIsInviting(false)
    }
  }

  const handleRemoveMember = async (userId: string) => {
    if (!confirm('このメンバーを削除してもよろしいですか？')) {
      return
    }

    if (!selectedOrganization || selectedOrganization === 'ALL') {
      alert('組織を選択してください')
      return
    }

    try {
      setIsRemoving(userId)
      setError(null)

      await removeOrganizationMember(selectedOrganization, userId)

      // メンバー一覧を再読み込み
      const membersData = await getOrganizationMembersWithTeams(selectedOrganization)
      setMembers(membersData)

      alert('メンバーを削除しました')
    } catch (err: any) {
      console.error('Failed to remove member:', err)
      setError(err.message || 'メンバーの削除に失敗しました')
      alert(`エラー: ${err.message || 'メンバーの削除に失敗しました'}`)
    } finally {
      setIsRemoving(null)
    }
  }

  const handleTestSlackConnection = () => {
    if (settings.notifications.slackWebhookUrl) {
      alert('Slack接続をテストしました（デモモード）')
    } else {
      alert('Webhook URLを入力してください')
    }
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
          <div className="settings-header">
            <h1 className="page-title">Settings</h1>
            <button onClick={handleSave} className="save-button">
              <Save size={18} />
              保存
            </button>
          </div>

          {error && (
            <div className="error-banner">
              <span className="error-icon">⚠</span>
              {error}
            </div>
          )}

          {isLoading ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: '2rem' }}>
              <Loader2 size={24} className="spinner" />
            </div>
          ) : (
            <div className="settings-sections">
              {/* 通知設定 */}
              <div className="settings-section">
                <h2 className="settings-section-title">通知設定</h2>
                <div className="settings-options">
                  <label className="settings-option">
                    <input
                      type="checkbox"
                      checked={settings.notifications.email}
                      onChange={(e) =>
                        setSettings({
                          ...settings,
                          notifications: {
                            ...settings.notifications,
                            email: e.target.checked,
                          },
                        })
                      }
                    />
                    <span>Email通知を有効にする</span>
                  </label>
                  <label className="settings-option">
                    <input
                      type="checkbox"
                      checked={settings.notifications.slack}
                      onChange={(e) =>
                        setSettings({
                          ...settings,
                          notifications: {
                            ...settings.notifications,
                            slack: e.target.checked,
                          },
                        })
                      }
                    />
                    <span>Slack通知を有効にする</span>
                  </label>
                  {settings.notifications.slack && (
                    <div className="slack-settings">
                      <div className="slack-setting-item">
                        <label className="slack-label">ワークスペース名</label>
                        <input
                          type="text"
                          value={settings.notifications.slackWorkspace}
                          onChange={(e) =>
                            setSettings({
                              ...settings,
                              notifications: {
                                ...settings.notifications,
                                slackWorkspace: e.target.value,
                              },
                            })
                          }
                          placeholder="例: wevnal-workspace"
                          className="slack-input"
                        />
                      </div>
                      <div className="slack-setting-item">
                        <label className="slack-label">チャンネル名</label>
                        <input
                          type="text"
                          value={settings.notifications.slackChannel}
                          onChange={(e) =>
                            setSettings({
                              ...settings,
                              notifications: {
                                ...settings.notifications,
                                slackChannel: e.target.value,
                              },
                            })
                          }
                          placeholder="例: #smarttodo-notifications"
                          className="slack-input"
                        />
                      </div>
                      <div className="slack-setting-item">
                        <label className="slack-label">Webhook URL</label>
                        <input
                          type="text"
                          value={settings.notifications.slackWebhookUrl}
                          onChange={(e) =>
                            setSettings({
                              ...settings,
                              notifications: {
                                ...settings.notifications,
                                slackWebhookUrl: e.target.value,
                              },
                            })
                          }
                          placeholder="https://hooks.slack.com/services/..."
                          className="slack-input"
                        />
                        <p className="slack-hint">
                          SlackのIncoming Webhook URLを入力してください
                        </p>
                      </div>
                      <button
                        onClick={handleTestSlackConnection}
                        className="test-slack-button"
                      >
                        <LinkIcon size={16} />
                        接続をテスト
                      </button>
                    </div>
                  )}
                  <label className="settings-option">
                    <input
                      type="checkbox"
                      checked={settings.notifications.weeklyReport}
                      onChange={(e) =>
                        setSettings({
                          ...settings,
                          notifications: {
                            ...settings.notifications,
                            weeklyReport: e.target.checked,
                          },
                        })
                      }
                    />
                    <span>週次レポートを自動送信</span>
                  </label>
                </div>
              </div>

              {/* 連携設定 */}
              <div className="settings-section">
                <h2 className="settings-section-title">ツール連携</h2>
                <div className="integrations-list">
                  {settings.integrations.map((integration) => (
                    <div key={integration.id} className="integration-item">
                      <div className="integration-info">
                        <div className="integration-name">{integration.name}</div>
                        <div
                          className={`integration-status ${
                            integration.status === 'connected' ? 'connected' : 'disconnected'
                          }`}
                        >
                          {integration.status === 'connected' ? '接続中' : '未接続'}
                        </div>
                      </div>
                      <label className="integration-toggle">
                        <input
                          type="checkbox"
                          checked={integration.enabled}
                          onChange={() => handleToggleIntegration(integration.id)}
                          disabled={integration.status === 'disconnected'}
                        />
                        <span>有効</span>
                      </label>
                    </div>
                  ))}
                </div>
              </div>

              {/* AI設定 */}
              <div className="settings-section">
                <h2 className="settings-section-title">AI設定</h2>
                <div className="settings-options">
                  <label className="settings-option">
                    <input
                      type="checkbox"
                      checked={settings.aiSettings.autoTagging}
                      onChange={(e) =>
                        setSettings({
                          ...settings,
                          aiSettings: {
                            ...settings.aiSettings,
                            autoTagging: e.target.checked,
                          },
                        })
                      }
                    />
                    <span>自動タグ付けを有効にする</span>
                  </label>
                  <label className="settings-option">
                    <input
                      type="checkbox"
                      checked={settings.aiSettings.autoDecomposition}
                      onChange={(e) =>
                        setSettings({
                          ...settings,
                          aiSettings: {
                            ...settings.aiSettings,
                            autoDecomposition: e.target.checked,
                          },
                        })
                      }
                    />
                    <span>自動タスク分解を有効にする</span>
                  </label>
                  <label className="settings-option">
                    <input
                      type="checkbox"
                      checked={settings.aiSettings.weeklyInsight}
                      onChange={(e) =>
                        setSettings({
                          ...settings,
                          aiSettings: {
                            ...settings.aiSettings,
                            weeklyInsight: e.target.checked,
                          },
                        })
                      }
                    />
                    <span>週次インサイトを有効にする</span>
                  </label>
                  <label className="settings-option">
                    <input
                      type="checkbox"
                      checked={settings.aiSettings.learningEnabled}
                      onChange={(e) =>
                        setSettings({
                          ...settings,
                          aiSettings: {
                            ...settings.aiSettings,
                            learningEnabled: e.target.checked,
                          },
                        })
                      }
                    />
                    <span>学習機能を有効にする</span>
                  </label>
                </div>
              </div>

              {/* メンバー管理 */}
              <div className="settings-section">
                <h2 className="settings-section-title">メンバー管理</h2>
                {!selectedOrganization || selectedOrganization === 'ALL' ? (
                  <p style={{ color: '#6b7280', padding: '1rem' }}>
                    組織を選択してください
                  </p>
                ) : (
                  <div className="members-list">
                    <div className="members-header">
                      <h3 className="members-subtitle">現在のメンバー ({members.length}人)</h3>
                      {!showInviteForm ? (
                        <button
                          onClick={() => setShowInviteForm(true)}
                          className="invite-member-button"
                        >
                          <UserPlus size={18} />
                          メンバーを招待
                        </button>
                      ) : (
                        <button
                          onClick={() => {
                            setShowInviteForm(false)
                            setInviteEmail('')
                            setInviteRole('member')
                            setInviteTeamId('')
                          }}
                          className="cancel-button"
                        >
                          <X size={18} />
                        </button>
                      )}
                    </div>
                    
                    {showInviteForm && (
                      <div className="invite-member-form">
                        <div className="invite-form-row">
                          <label className="invite-label">メールアドレス</label>
                          <input
                            type="email"
                            value={inviteEmail}
                            onChange={(e) => setInviteEmail(e.target.value)}
                            placeholder="member@example.com"
                            className="invite-input"
                            disabled={isInviting}
                          />
                        </div>
                        <div className="invite-form-row">
                          <label className="invite-label">ロール</label>
                          <select
                            value={inviteRole}
                            onChange={(e) => setInviteRole(e.target.value as 'member' | 'manager' | 'admin')}
                            className="invite-select"
                            disabled={isInviting}
                          >
                            <option value="member">メンバー</option>
                            <option value="manager">マネージャー</option>
                            <option value="admin">管理者</option>
                          </select>
                        </div>
                        <div className="invite-form-row">
                          <label className="invite-label">チーム（任意）</label>
                          <select
                            value={inviteTeamId}
                            onChange={(e) => setInviteTeamId(e.target.value)}
                            className="invite-select"
                            disabled={isInviting}
                          >
                            <option value="">チームを選択しない</option>
                            {teams.map((team) => (
                              <option key={team.id} value={team.id}>
                                {team.name}
                              </option>
                            ))}
                          </select>
                        </div>
                        <button
                          onClick={handleInviteMember}
                          className="send-invite-button"
                          disabled={!inviteEmail.trim() || isInviting}
                        >
                          {isInviting ? (
                            <>
                              <Loader2 size={18} className="spinner" />
                              送信中...
                            </>
                          ) : (
                            <>
                              <Mail size={18} />
                              招待を送信
                            </>
                          )}
                        </button>
                      </div>
                    )}

                    {members.length === 0 ? (
                      <p style={{ color: '#6b7280', padding: '1rem', textAlign: 'center' }}>
                        メンバーが登録されていません
                      </p>
                    ) : (
                      <div className="members-table">
                        <table className="members-table-content">
                          <thead>
                            <tr>
                              <th>名前</th>
                              <th>メールアドレス</th>
                              <th>ロール</th>
                              <th>チーム</th>
                              <th>操作</th>
                            </tr>
                          </thead>
                          <tbody>
                            {members.map((member) => (
                              <tr key={member.id}>
                                <td>{member.name}</td>
                                <td>{member.email}</td>
                                <td>
                                  <span className={`role-badge role-${member.role}`}>
                                    {member.role === 'member' ? 'メンバー' : 
                                     member.role === 'manager' ? 'マネージャー' : '管理者'}
                                  </span>
                                </td>
                                <td>{member.team || '-'}</td>
                                <td>
                                  {member.id !== currentUserId ? (
                                    <button 
                                      className="remove-member-button"
                                      onClick={() => handleRemoveMember(member.id)}
                                      disabled={isRemoving === member.id}
                                    >
                                      {isRemoving === member.id ? (
                                        <Loader2 size={16} className="spinner" />
                                      ) : (
                                        <X size={16} />
                                      )}
                                    </button>
                                  ) : (
                                    <span style={{ color: '#9ca3af', fontSize: '0.875rem' }}>
                                      自分
                                    </span>
                                  )}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* チーム管理 */}
              <div className="settings-section">
                <h2 className="settings-section-title">チーム管理</h2>
                {!selectedOrganization || selectedOrganization === 'ALL' ? (
                  <p style={{ color: '#6b7280', padding: '1rem' }}>
                    組織を選択してください
                  </p>
                ) : (
                  <div className="team-management">
                    {!showAddTeam ? (
                      <button
                        onClick={() => setShowAddTeam(true)}
                        className="add-team-button"
                      >
                        <Plus size={18} />
                        新しいチームを追加
                      </button>
                    ) : (
                      <div className="add-team-form">
                        <input
                          type="text"
                          value={newTeamName}
                          onChange={(e) => setNewTeamName(e.target.value)}
                          placeholder="チーム名を入力"
                          className="team-input"
                          disabled={isCreatingTeam}
                          onKeyPress={(e) => {
                            if (e.key === 'Enter') {
                              handleAddTeam()
                            }
                          }}
                        />
                        <div className="add-team-actions">
                          <button 
                            onClick={handleAddTeam} 
                            className="confirm-button"
                            disabled={isCreatingTeam}
                          >
                            {isCreatingTeam ? (
                              <>
                                <Loader2 size={16} className="spinner" />
                                追加中...
                              </>
                            ) : (
                              '追加'
                            )}
                          </button>
                          <button
                            onClick={() => {
                              setShowAddTeam(false)
                              setNewTeamName('')
                            }}
                            className="cancel-button"
                            disabled={isCreatingTeam}
                          >
                            <X size={18} />
                          </button>
                        </div>
                      </div>
                    )}
                    {teams.length > 0 && (
                      <div style={{ marginTop: '1rem' }}>
                        <h4 style={{ fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.5rem' }}>
                          現在のチーム ({teams.length})
                        </h4>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                          {teams.map((team) => (
                            <span 
                              key={team.id}
                              style={{
                                padding: '0.5rem 1rem',
                                background: '#f3f4f6',
                                borderRadius: '6px',
                                fontSize: '0.875rem',
                                color: '#1a1a1a'
                              }}
                            >
                              {team.name}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* 危険な操作 */}
              <div className="settings-section danger-zone">
                <h2 className="settings-section-title">危険な操作</h2>
                <div className="danger-actions">
                  <button className="danger-button">
                    <Trash2 size={18} />
                    組織を削除
                  </button>
                  <p className="danger-warning">
                    この操作は取り消せません。組織とすべてのデータが永久に削除されます。
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
