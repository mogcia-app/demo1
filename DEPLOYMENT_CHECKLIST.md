# ✅ デプロイ前チェックリスト

## 🔍 **実施済み確認事項**

### **1. ビルドテスト**
- [x] `npm run build` が成功
- [x] ビルドエラーなし
- [x] 全ページが正常に生成

### **2. 機能実装状況**
- [x] ユーザー認証（Firebase Auth）
- [x] 現場登録・編集・削除
- [x] 機材管理（在庫連動）
- [x] トランザクション処理（在庫減算・復元）
- [x] 管理者ページ（CRUD機能）
- [x] Googleカレンダー連携
- [x] スケジュール表示（Googleカレンダー風）
- [x] PDF出力・印刷機能

### **3. UI/UX**
- [x] レスポンシブデザイン実装
- [x] モバイル対応
- [x] 印刷用CSS実装

---

## 🚀 **デプロイ手順**

### **オプションA: Vercel Dashboard（推奨）**

#### **1. 環境変数の準備**
以下の環境変数をメモしておく：
```
NEXT_PUBLIC_FIREBASE_API_KEY
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN
NEXT_PUBLIC_FIREBASE_PROJECT_ID
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID
NEXT_PUBLIC_FIREBASE_APP_ID
NEXT_PUBLIC_GOOGLE_CALENDAR_API_KEY
```

#### **2. Vercelにアクセス**
- URL: https://vercel.com
- GitHubアカウントでログイン

#### **3. プロジェクトをインポート**
- 「Add New...」→「Project」
- プロジェクトフォルダをドラッグ&ドロップ
  または
- GitHubリポジトリを連携

#### **4. 設定**
- Framework Preset: Next.js（自動検出）
- Root Directory: `./`（デフォルト）
- Build Command: `npm run build`（デフォルト）
- Output Directory: `.next`（デフォルト）

#### **5. 環境変数を追加**
- Environment Variables セクションで上記の変数を追加

#### **6. デプロイ**
- 「Deploy」ボタンをクリック
- 約2〜5分で完了

---

### **オプションB: Vercel CLI**

#### **1. Vercel CLIをインストール**
```bash
npm install -g vercel
```

#### **2. ログイン**
```bash
vercel login
```

#### **3. デプロイ**
```bash
# プロジェクトディレクトリで実行
vercel

# 本番環境にデプロイ
vercel --prod
```

---

## 🔐 **セキュリティチェック**

### **必須確認事項**
- [ ] `.env.local` がGitにコミットされていないか確認
- [ ] Firebaseセキュリティルールが設定されているか
- [ ] 管理者メールアドレスが環境変数化されているか
- [ ] APIキーが公開されていないか

### **Firebase設定**
- [ ] Firestoreルール: `firestore.rules` が適用済み
- [ ] 認証ドメイン: Vercelのドメインを追加
- [ ] APIキー制限: 本番ドメインのみ許可

---

## 📊 **デプロイ後の確認事項**

### **動作確認**
- [ ] ログイン機能が動作するか
- [ ] 現場登録が正常に動作するか
- [ ] 在庫処理が正常に動作するか
- [ ] 管理者ページにアクセスできるか
- [ ] Googleカレンダー連携が動作するか
- [ ] 印刷/PDF機能が動作するか

### **パフォーマンス確認**
- [ ] Lighthouse スコア確認
- [ ] ページ読み込み速度確認
- [ ] モバイル表示確認

---

## 🆘 **トラブルシューティング**

### **よくある問題**

#### **1. 環境変数が読み込まれない**
→ Vercelダッシュボードで環境変数を再確認
→ 変数名が `NEXT_PUBLIC_` で始まっているか確認

#### **2. Firebase接続エラー**
→ FirebaseコンソールでVercelドメインを認証済みドメインに追加

#### **3. ビルドエラー**
→ ローカルで `npm run build` が成功するか確認
→ `package.json` の依存関係を確認

---

## 📝 **次のステップ**

1. [ ] カスタムドメイン設定（オプション）
2. [ ] アナリティクス設定（Google Analytics等）
3. [ ] エラー監視設定（Sentry等）
4. [ ] バックアップ戦略の確立
5. [ ] ユーザーマニュアルの作成

---

**作成日:** 2024-10-20  
**最終更新:** 2024-10-20

