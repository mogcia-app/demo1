# Demo1 - Next.js + Firebase アプリケーション

Next.js 14 と Firebase を使用したモダンなWebアプリケーションです。

## 機能

- ✅ **Next.js 14** (App Router)
- ✅ **TypeScript** (完全な型安全性)
- ✅ **Firebase Functions** (サーバーレス関数)
- ✅ **Firestore** (リアルタイムデータベース)
- ✅ **Firebase Auth** (認証システム)
- ✅ **Firebase Storage** (ファイルストレージ)
- ✅ **ESLint** (コード品質管理)
- ✅ **CSS Modules** (スコープ化されたスタイリング)
- ✅ **レスポンシブデザイン** (モバイル対応)
- ✅ **ダークモード対応**

## 始め方

### 1. 依存関係のインストール

```bash
npm install
```

### 2. Firebase 設定

Firebase Console でプロジェクトを作成し、設定値を取得してください。

```bash
# .env.local ファイルを作成
NEXT_PUBLIC_FIREBASE_API_KEY=your-api-key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789
NEXT_PUBLIC_FIREBASE_APP_ID=1:123456789:web:abcdef
```

### 3. Firebase Functions のデプロイ

```bash
# Firebase CLI をインストール
npm install -g firebase-tools

# Firebase にログイン
firebase login

# プロジェクトを初期化
firebase init

# Functions をデプロイ
firebase deploy --only functions
```

### 4. 開発サーバーの起動

```bash
npm run dev
```

ブラウザで [http://localhost:3000](http://localhost:3000) を開いて結果を確認してください。

## プロジェクト構造

```
demo1/
├── app/                    # Next.js App Router
│   ├── layout.tsx         # ルートレイアウト
│   ├── page.tsx           # ホームページ
│   ├── globals.css        # グローバルスタイル
│   └── page.module.css    # ページ固有のスタイル
├── components/            # 再利用可能なコンポーネント
├── lib/                   # ユーティリティ関数
│   ├── firebase.ts        # Firebase 設定
│   ├── config.ts          # 環境設定
│   ├── gcf-client.ts      # Firebase Functions クライアント
│   └── hooks/             # カスタムフック
│       └── useCloudFunction.ts
├── firebase-functions/    # Firebase Functions
│   ├── index.js           # 関数の実装
│   └── package.json       # Functions 依存関係
├── public/                # 静的ファイル
├── firebase.json          # Firebase 設定
├── firestore.rules        # Firestore セキュリティルール
└── firestore.indexes.json # Firestore インデックス
```

## Firebase 機能

### Functions
- `helloWorld` - Hello World 関数
- `processData` - データ処理関数
- `getUserInfo` - ユーザー情報取得
- `createTask` - タスク作成
- `getTasks` - タスク一覧取得
- `updateTask` - タスク更新
- `deleteTask` - タスク削除
- `api` - HTTP API

### Firestore
- リアルタイムデータベース
- セキュリティルール設定済み
- インデックス最適化済み

## デプロイ

### Vercel でのデプロイ

```bash
# Vercel CLI をインストール
npm install -g vercel

# デプロイ
vercel
```

### Firebase Hosting でのデプロイ

```bash
# Firebase Hosting を有効化
firebase init hosting

# デプロイ
firebase deploy
```

## 開発のヒント

- Firebase エミュレーターを使用する場合は、`.env.local` に `NEXT_PUBLIC_USE_EMULATOR=true` を追加
- TypeScript の型安全性を活用
- Firebase Functions のログは `firebase functions:log` で確認
- Firestore のセキュリティルールは本番環境に合わせて調整

## ライセンス

MIT License
