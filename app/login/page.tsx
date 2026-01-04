'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { signIn, signUp } from '@/lib/auth'
import Link from 'next/link'
import { Zap, ArrowRight, Mail, Lock, User, Eye, EyeOff } from 'lucide-react'
import './globals.css'

export default function LoginPage() {
  const router = useRouter()
  const [isSignUp, setIsSignUp] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setIsLoading(true)

    try {
      if (isSignUp) {
        await signUp(email, password, name)
        // サインアップ後、自動的にログインしてダッシュボードに遷移
        try {
          await signIn(email, password)
          router.push('/dashboard')
        } catch (loginError: any) {
          // メール確認が必要な場合
          alert('アカウントを作成しました。メールを確認してログインしてください。')
          router.push('/login')
        }
      } else {
        await signIn(email, password)
        router.push('/dashboard')
      }
    } catch (err: any) {
      setError(err.message || 'エラーが発生しました')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="login-page">
      {/* Header */}
      <header className="login-header">
        <Link href="/" className="login-logo">
          <Zap className="logo-icon" size={28} />
          <span className="logo-text">SmartToDo</span>
        </Link>
        <Link href="/" className="back-home-link">
          ホームに戻る
        </Link>
      </header>

      {/* Main Content */}
      <div className="login-main">
        <div className="login-container">
          {/* Left Side - Branding */}
          <div className="login-branding">
            <div className="branding-content">
              <div className="branding-logo">
                <Zap className="branding-icon" size={64} />
                <h1 className="branding-title">SmartToDo</h1>
              </div>
              <p className="branding-subtitle">
                AI搭載型チーム生産性統合プラットフォーム
              </p>
              <div className="branding-features">
                <div className="branding-feature">
                  <div className="feature-check">✓</div>
                  <span>AIによる自動分析</span>
                </div>
                <div className="branding-feature">
                  <div className="feature-check">✓</div>
                  <span>統合ダッシュボード</span>
                </div>
                <div className="branding-feature">
                  <div className="feature-check">✓</div>
                  <span>チーム管理機能</span>
                </div>
              </div>
            </div>
          </div>

          {/* Right Side - Form */}
          <div className="login-form-container">
            <div className="login-card">
              <div className="login-card-header">
                <h2 className="login-card-title">
                  {isSignUp ? 'アカウントを作成' : 'ログイン'}
                </h2>
                <p className="login-card-subtitle">
                  {isSignUp 
                    ? 'SmartToDoを始めるには、アカウントを作成してください' 
                    : 'アカウントにログインして続ける'}
                </p>
              </div>

              <div className="login-tabs">
                <button
                  type="button"
                  className={`login-tab ${!isSignUp ? 'active' : ''}`}
                  onClick={() => {
                    setIsSignUp(false)
                    setError(null)
                  }}
                >
                  ログイン
                </button>
                <button
                  type="button"
                  className={`login-tab ${isSignUp ? 'active' : ''}`}
                  onClick={() => {
                    setIsSignUp(true)
                    setError(null)
                  }}
                >
                  新規登録
                </button>
              </div>

              <form onSubmit={handleSubmit} className="login-form">
                {isSignUp && (
                  <div className="form-group">
                    <label className="form-label">
                      <User size={18} />
                      名前
                    </label>
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      required
                      placeholder="山田太郎"
                      className="form-input"
                      disabled={isLoading}
                    />
                  </div>
                )}

                <div className="form-group">
                  <label className="form-label">
                    <Mail size={18} />
                    メールアドレス
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    placeholder="user@example.com"
                    className="form-input"
                    disabled={isLoading}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">
                    <Lock size={18} />
                    パスワード
                  </label>
                  <div className="password-input-wrapper">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      placeholder="••••••••"
                      minLength={6}
                      className="form-input"
                      disabled={isLoading}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="password-toggle"
                      disabled={isLoading}
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                  {isSignUp && (
                    <p className="form-hint">
                      パスワードは6文字以上で入力してください
                    </p>
                  )}
                </div>

                {error && (
                  <div className="error-message">
                    <span className="error-icon">⚠</span>
                    {error}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isLoading}
                  className="login-submit-button"
                >
                  {isLoading ? (
                    <>
                      <span className="spinner"></span>
                      処理中...
                    </>
                  ) : (
                    <>
                      {isSignUp ? 'アカウントを作成' : 'ログイン'}
                      <ArrowRight size={20} />
                    </>
                  )}
                </button>
              </form>

              <div className="login-footer">
                <p className="login-footer-text">
                  {isSignUp ? (
                    <>
                      アカウントをお持ちですか？{' '}
                      <button
                        type="button"
                        onClick={() => {
                          setIsSignUp(false)
                          setError(null)
                        }}
                        className="footer-link-button"
                      >
                        ログイン
                      </button>
                    </>
                  ) : (
                    <>
                      アカウントをお持ちでないですか？{' '}
                      <button
                        type="button"
                        onClick={() => {
                          setIsSignUp(true)
                          setError(null)
                        }}
                        className="footer-link-button"
                      >
                        新規登録
                      </button>
                    </>
                  )}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
