'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { User, Eye, EyeOff } from 'lucide-react'
import styles from './page.module.css'
import { signInWithEmail, onAuthStateChange, isCompanyUser } from '../../lib/auth'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [authError, setAuthError] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  // 既にログイン済みの場合はリダイレクト
  useEffect(() => {
    const unsubscribe = onAuthStateChange((user) => {
      if (user && isCompanyUser(user)) {
        router.push('/')
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
      await signInWithEmail(email, password)
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
        <h1 className={styles.title}>機材管理システム</h1>
        <p className={styles.subtitle}>ログインしてください</p>
        
        <form onSubmit={handleAuth} className={styles.authForm}>
          <div className={styles.inputGroup}>
            <label htmlFor="email" className={styles.label}>メールアドレス</label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={styles.input}
              placeholder="test@example.com"
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
                placeholder="6文字以上"
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
            <User className={styles.icon} />
            {isLoading ? '処理中...' : 'ログイン'}
          </button>
        </form>
      </div>
    </main>
  )
}
