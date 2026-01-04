'use client'

import Link from 'next/link'
import { ArrowRight, Check, Zap, BarChart3, Users, Brain, Shield } from 'lucide-react'
import './landing.css'

export default function Home() {
  return (
    <div className="landing-page">
      {/* Header */}
      <header className="landing-header">
        <div className="landing-header-content">
          <div className="landing-logo">
            <Zap className="logo-icon" size={32} />
            <span className="logo-text">SmartToDo</span>
          </div>
          <nav className="landing-nav">
            <Link href="/login" className="nav-link">
              ログイン
            </Link>
            <Link href="/login" className="nav-button">
              無料で始める
            </Link>
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <section className="hero-section">
        <div className="hero-content">
          <h1 className="hero-title">
            AI搭載型チーム生産性統合プラットフォーム
          </h1>
          <p className="hero-subtitle">
            Jira、Salesforce、Notionなど、既存ツールからタスクデータを統合し、
            AIによる分析と予測で、チームの生産性を最大化します。
          </p>
          <div className="hero-actions">
            <Link href="/login" className="cta-button primary">
              無料で始める
              <ArrowRight size={20} />
            </Link>
            <Link href="/login" className="cta-button secondary">
              ログイン
            </Link>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="features-section">
        <div className="features-content">
          <h2 className="section-title">主な機能</h2>
          <div className="features-grid">
            <div className="feature-card">
              <div className="feature-icon">
                <Brain size={32} />
              </div>
              <h3 className="feature-title">AIによる自動分析</h3>
              <p className="feature-description">
                タスクの自動分類、工数見積もり、週次インサイト生成など、
                AIがチームの生産性を自動で分析・改善提案します。
              </p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">
                <BarChart3 size={32} />
              </div>
              <h3 className="feature-title">統合ダッシュボード</h3>
              <p className="feature-description">
                複数のツールから集約したデータを一つのダッシュボードで可視化。
                チーム全体の状況をリアルタイムで把握できます。
              </p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">
                <Users size={32} />
              </div>
              <h3 className="feature-title">チーム管理</h3>
              <p className="feature-description">
                組織・チーム単位での管理、メンバー招待、権限管理など、
                柔軟なチーム構成に対応します。
              </p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">
                <Shield size={32} />
              </div>
              <h3 className="feature-title">セキュアなデータ管理</h3>
              <p className="feature-description">
                Row Level Securityによる多層セキュリティで、
                組織ごとのデータを安全に管理します。
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="benefits-section">
        <div className="benefits-content">
          <h2 className="section-title">SmartToDoで実現できること</h2>
          <div className="benefits-list">
            <div className="benefit-item">
              <Check className="benefit-icon" size={24} />
              <div className="benefit-text">
                <h3>ツール間のデータ統合</h3>
                <p>Jira、Salesforce、Notionなど、複数のツールのタスクを一元管理</p>
              </div>
            </div>
            <div className="benefit-item">
              <Check className="benefit-icon" size={24} />
              <div className="benefit-text">
                <h3>AIによる自動化</h3>
                <p>タスク分類、工数見積もり、改善提案を自動化し、作業効率を向上</p>
              </div>
            </div>
            <div className="benefit-item">
              <Check className="benefit-icon" size={24} />
              <div className="benefit-text">
                <h3>データドリブンな意思決定</h3>
                <p>リアルタイムのKPIとAIインサイトで、根拠に基づいた意思決定を実現</p>
              </div>
            </div>
            <div className="benefit-item">
              <Check className="benefit-icon" size={24} />
              <div className="benefit-text">
                <h3>チーム生産性の可視化</h3>
                <p>ワークロードヒートマップ、日次トレンドなどで、チームの稼働状況を可視化</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="cta-section">
        <div className="cta-content">
          <h2 className="cta-title">今すぐ始めましょう</h2>
          <p className="cta-subtitle">
            SmartToDoで、チームの生産性を次のレベルへ
          </p>
          <Link href="/login" className="cta-button large">
            無料で始める
            <ArrowRight size={24} />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="landing-footer">
        <div className="footer-content">
          <div className="footer-logo">
            <Zap className="logo-icon" size={24} />
            <span className="logo-text">SmartToDo</span>
          </div>
          <div className="footer-links">
            <Link href="/elevator-pitch" className="footer-link">
              エレベーターピッチ
            </Link>
            <Link href="/business-requirements" className="footer-link">
              ビジネス要件
            </Link>
            <Link href="/product-requirements" className="footer-link">
              プロダクト要件
            </Link>
          </div>
          <p className="footer-copyright">
            © 2024 SmartToDo. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  )
}
