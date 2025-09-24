# Firebase Functions

このディレクトリには、Next.jsアプリケーションと連携するFirebase Functionsが含まれています。

## 含まれる関数

### Callable Functions（Next.jsから呼び出し可能）

1. **helloWorld**
   - シンプルなHello World関数
   - パラメータ: `{ name?: string }`

2. **processData**
   - データを処理して結果をFirestoreに保存
   - パラメータ: `any`

3. **getUserInfo**
   - ユーザー情報を取得（モックデータ）
   - パラメータ: `{ userId: string }`

4. **createTask**
   - Firestoreにタスクを作成
   - パラメータ: `{ title: string, description?: string }`

5. **getTasks**
   - Firestoreからタスク一覧を取得
   - パラメータ: なし

6. **updateTask**
   - Firestoreのタスクを更新
   - パラメータ: `{ taskId: string, updates: any }`

7. **deleteTask**
   - Firestoreからタスクを削除
   - パラメータ: `{ taskId: string }`

### Firestore Triggers

1. **onTaskCreated**
   - タスク作成時に実行されるトリガー

2. **onTaskDeleted**
   - タスク削除時に実行されるトリガー

### HTTP Functions

1. **api**
   - 簡単なREST API（GET リクエスト対応）

## セットアップ手順

### 1. Firebase CLIのインストール

```bash
npm install -g firebase-tools
```

### 2. Firebase プロジェクトの初期化

```bash
# プロジェクトルートで実行
firebase login
firebase init

# 以下を選択:
# - Functions
# - Firestore
# - Emulators (開発用)
```

### 3. 依存関係のインストール

```bash
cd firebase-functions
npm install
```

### 4. 環境設定

Firebase Consoleで以下を設定:
- Firestore Database を有効化
- Functions を有効化
- 必要に応じてAuthentication を設定

### 5. ローカル開発（エミュレーター使用）

```bash
# プロジェクトルートで実行
firebase emulators:start

# または Functions のみ
firebase emulators:start --only functions,firestore
```

エミュレーターUI: http://localhost:4000

### 6. デプロイ

```bash
# 全てデプロイ
firebase deploy

# Functions のみ
firebase deploy --only functions

# 特定の関数のみ
firebase deploy --only functions:helloWorld
```

## Next.js での使用方法

Firebase設定が完了したら、Next.jsアプリの環境変数を設定:

```bash
# .env.local
NEXT_PUBLIC_FIREBASE_API_KEY=your-api-key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789
NEXT_PUBLIC_FIREBASE_APP_ID=1:123456789:web:abcdef
```

## 開発のヒント

### ローカル開発
- エミュレーターを使用することで、実際のFirebaseリソースを使わずに開発できます
- `firebase emulators:start` でエミュレーターを起動
- Next.jsアプリは自動的にエミュレーターに接続されます（`lib/firebase.ts`で設定）

### ログの確認
```bash
# ローカル
firebase emulators:start --inspect-functions

# 本番
firebase functions:log
```

### セキュリティ
- 本番環境では`firestore.rules`を適切に設定してください
- 現在のルールはデモ用で、全員がアクセス可能になっています

## トラブルシューティング

### よくある問題

1. **Functions のデプロイエラー**
   - Node.jsバージョンを確認（18推奨）
   - `firebase-functions`のバージョンを確認

2. **エミュレーター接続エラー**
   - ポートが使用されていないか確認
   - `firebase emulators:kill` で既存のプロセスを終了

3. **Firestore権限エラー**
   - `firestore.rules` を確認
   - エミュレーターでは権限チェックが緩い場合があります

