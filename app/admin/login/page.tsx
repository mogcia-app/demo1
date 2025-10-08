'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Shield, Eye, EyeOff, ArrowLeft } from 'lucide-react'
import styles from './page.module.css'
import { signInWithEmail, onAuthStateChange, isAdminUser } from '../../../lib/auth'

export default function AdminLoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [authError, setAuthError] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  // 既にadminとしてログイン済みの場合はリダイレクト
  useEffect(() => {
    const unsubscribe = onAuthStateChange((user) => {
      if (user && isAdminUser(user)) {
        router.push('/admin')
      }
    })

    return () => unsubscribe()
  }, [router])

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email || !password) {
      setAuthError('メールアドレスとパスワードを入力してください')
      return
    }

    setIsLoading(true)
    setAuthError('')

    try {
      const user = await signInWithEmail(email, password)
      
      // 管理者権限をチェック
      if (!isAdminUser(user)) {
        setAuthError('管理者権限がありません')
        setIsLoading(false)
        return
      }
      
      // ログイン成功後は自動的にリダイレクトされる（useEffectで監視）
    } catch (error: any) {
      console.error('認証エラー:', error)
      setAuthError(error.message)
      setIsLoading(false)
    }
  }

  return (
    <main className={styles.main}>
      <div className={styles.authContainer}>
        <button 
          className={styles.backButton}
          onClick={() => router.push('/')}
        >
          <ArrowLeft className={styles.icon} />
          戻る
        </button>
        
        <div className={styles.adminBadge}>
          <Shield className={styles.shieldIcon} />
        </div>
        
        <h1 className={styles.title}>管理者ログイン</h1>
        <p className={styles.subtitle}>管理者専用ページへのアクセスにはログインが必要です</p>
        
        <form onSubmit={handleAuth} className={styles.authForm}>
          <div className={styles.inputGroup}>
            <label htmlFor="email" className={styles.label}>メールアドレス</label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={styles.input}
              placeholder="admin@example.com"
              disabled={isLoading}
              autoFocus
            />
          </div>
          
          <div className={styles.inputGroup}>
            <label htmlFor="password" className={styles.label}>パスワード</label>
            <div className={styles.passwordContainer}>
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={styles.input}
                placeholder="パスワード"
                disabled={isLoading}
              />
              <button
                type="button"
                className={styles.passwordToggle}
                onClick={() => setShowPassword(!showPassword)}
                disabled={isLoading}
              >
                {showPassword ? <EyeOff className={styles.eyeIcon} /> : <Eye className={styles.eyeIcon} />}
              </button>
            </div>
          </div>

          {authError && (
            <div className={styles.errorMessage}>
              {authError}
            </div>
          )}

          <button 
            type="submit" 
            className={styles.authButton}
            disabled={isLoading}
          >
            <Shield className={styles.icon} />
            {isLoading ? '認証中...' : '管理者としてログイン'}
          </button>
        </form>
      </div>
    </main>
  )
}
