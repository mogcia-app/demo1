import { 
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut, 
  onAuthStateChanged,
  User
} from 'firebase/auth'
import { auth } from './firebase'

// メールアドレスとパスワードでサインアップ
export const signUpWithEmail = async (email: string, password: string) => {
  try {
    console.log('メールアドレスでサインアップを開始します...')
    const result = await createUserWithEmailAndPassword(auth, email, password)
    console.log('サインアップ成功:', result.user)
    return result.user
  } catch (error: any) {
    console.error('サインアップエラー:', error)
    
    // エラーの詳細を表示
    if (error.code === 'auth/email-already-in-use') {
      throw new Error('このメールアドレスは既に使用されています')
    } else if (error.code === 'auth/invalid-email') {
      throw new Error('メールアドレスの形式が正しくありません')
    } else if (error.code === 'auth/weak-password') {
      throw new Error('パスワードが弱すぎます（6文字以上）')
    } else {
      throw new Error(`サインアップエラー: ${error.message}`)
    }
  }
}

// メールアドレスとパスワードでサインイン
export const signInWithEmail = async (email: string, password: string) => {
  try {
    console.log('メールアドレスでサインインを開始します...')
    const result = await signInWithEmailAndPassword(auth, email, password)
    console.log('サインイン成功:', result.user)
    return result.user
  } catch (error: any) {
    console.error('サインインエラー:', error)
    
    // エラーの詳細を表示
    if (error.code === 'auth/user-not-found') {
      throw new Error('このメールアドレスは登録されていません')
    } else if (error.code === 'auth/wrong-password') {
      throw new Error('パスワードが間違っています')
    } else if (error.code === 'auth/invalid-email') {
      throw new Error('メールアドレスの形式が正しくありません')
    } else if (error.code === 'auth/too-many-requests') {
      throw new Error('ログイン試行回数が多すぎます。しばらく待ってから再試行してください')
    } else {
      throw new Error(`サインインエラー: ${error.message}`)
    }
  }
}

export const signOutUser = async () => {
  try {
    await signOut(auth)
  } catch (error) {
    console.error('ログアウトエラー:', error)
    throw error
  }
}

export const onAuthStateChange = (callback: (user: User | null) => void) => {
  return onAuthStateChanged(auth, callback)
}

// ユーザーのドメインをチェック（本番環境用）
export const isCompanyUser = (user: User | null): boolean => {
  if (!user?.email) return false
  
  // 全てのユーザーを許可（ドメイン制限なし）
  return true
}
