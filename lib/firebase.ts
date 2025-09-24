import { initializeApp, getApps, getApp } from 'firebase/app'
import { getFirestore, connectFirestoreEmulator } from 'firebase/firestore'
import { getAuth, connectAuthEmulator } from 'firebase/auth'
import { getFunctions, connectFunctionsEmulator } from 'firebase/functions'
import { getStorage, connectStorageEmulator } from 'firebase/storage'
import { firebaseConfig } from './config'

// Firebase アプリを初期化（複数回初期化を防ぐ）
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp()

// Firebase サービスを取得
export const db = getFirestore(app)
export const auth = getAuth(app)
export const functions = getFunctions(app, 'asia-northeast1') // 東京リージョン
export const storage = getStorage(app)

// 開発環境でエミュレーターに接続（一度だけ実行）
// 本番環境ではエミュレーター接続を無効化
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development' && process.env.NEXT_PUBLIC_USE_EMULATOR === 'true') {
  // Firestore エミュレーター
  try {
    connectFirestoreEmulator(db, 'localhost', 8080)
  } catch (error) {
    // 既に接続済みの場合はエラーを無視
  }

  // Auth エミュレーター
  try {
    connectAuthEmulator(auth, 'http://localhost:9099')
  } catch (error) {
    // 既に接続済みの場合はエラーを無視
  }

  // Functions エミュレーター
  try {
    connectFunctionsEmulator(functions, 'localhost', 5001)
  } catch (error) {
    // 既に接続済みの場合はエラーを無視
  }

  // Storage エミュレーター
  try {
    connectStorageEmulator(storage, 'localhost', 9199)
  } catch (error) {
    // 既に接続済みの場合はエラーを無視
  }
}

export default app

