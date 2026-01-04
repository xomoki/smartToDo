'use client'

import { useState } from 'react'
import '../globals.css'
import Sidebar from '@/components/Sidebar'
import Header from '@/components/Header'
import { Save, Trash2, Plus, X } from 'lucide-react'

export default function SettingsPage() {
  const [selectedOrganization, setSelectedOrganization] = useState('wevnal')
  const [selectedTeam, setSelectedTeam] = useState('Engineering Team A')
  const [dateRange, setDateRange] = useState({
    start: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
    end: new Date()
  })

  const [settings, setSettings] = useState({
    notifications: {
      email: true,
      slack: false,
      weeklyReport: true,
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

  const handleAddTeam = () => {
    if (newTeamName.trim()) {
      alert(`チーム "${newTeamName}" を追加しました（デモモード）`)
      setNewTeamName('')
      setShowAddTeam(false)
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

            {/* チーム管理 */}
            <div className="settings-section">
              <h2 className="settings-section-title">チーム管理</h2>
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
                      onKeyPress={(e) => {
                        if (e.key === 'Enter') {
                          handleAddTeam()
                        }
                      }}
                    />
                    <div className="add-team-actions">
                      <button onClick={handleAddTeam} className="confirm-button">
                        追加
                      </button>
                      <button
                        onClick={() => {
                          setShowAddTeam(false)
                          setNewTeamName('')
                        }}
                        className="cancel-button"
                      >
                        <X size={18} />
                      </button>
                    </div>
                  </div>
                )}
              </div>
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
        </div>
      </div>
    </div>
  )
}

