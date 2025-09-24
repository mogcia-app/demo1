import { httpsCallable, HttpsCallableResult } from 'firebase/functions'
import { functions } from './firebase'

// Firebase Functions クライアント
class FirebaseFunctionsClient {
  // 汎用的なFirebase Function呼び出しメソッド
  async callFunction<T = any, P = any>(
    functionName: string,
    data?: P
  ): Promise<T> {
    try {
      const callable = httpsCallable<P, T>(functions, functionName)
      const result: HttpsCallableResult<T> = await callable(data)
      return result.data
    } catch (error: any) {
      throw new FirebaseError(
        error.message || 'Firebase Function呼び出しエラー',
        error.code,
        functionName
      )
    }
  }

  // サンプル関数: Hello World
  async helloWorld(name?: string): Promise<{ message: string }> {
    return this.callFunction('helloWorld', { name })
  }

  // サンプル関数: データ処理
  async processData(data: any): Promise<any> {
    return this.callFunction('processData', data)
  }

  // サンプル関数: ユーザー情報取得
  async getUserInfo(userId: string): Promise<any> {
    return this.callFunction('getUserInfo', { userId })
  }

  // サンプル関数: タスク作成
  async createTask(task: { title: string; description?: string }): Promise<any> {
    return this.callFunction('createTask', task)
  }

  // サンプル関数: タスク一覧取得
  async getTasks(): Promise<any> {
    return this.callFunction('getTasks')
  }

  // サンプル関数: タスク更新
  async updateTask(taskId: string, updates: any): Promise<any> {
    return this.callFunction('updateTask', { taskId, updates })
  }

  // サンプル関数: タスク削除
  async deleteTask(taskId: string): Promise<any> {
    return this.callFunction('deleteTask', { taskId })
  }
}

// シングルトンインスタンス
export const firebaseFunctionsClient = new FirebaseFunctionsClient()

// 型定義
export interface FirebaseResponse<T = any> {
  success: boolean
  data: T
  message?: string
  error?: string
}

// エラーハンドリング用のカスタムエラー
export class FirebaseError extends Error {
  constructor(
    message: string,
    public code?: string,
    public functionName?: string
  ) {
    super(message)
    this.name = 'FirebaseError'
  }
}
