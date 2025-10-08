# 🚀 本番環境へのデプロイ手順

## 📋 目次
1. [基本的なデプロイ手順](#基本的なデプロイ手順)
2. [よくあるエラーと解決方法](#よくあるエラーと解決方法)
3. [デプロイ前のチェックリスト](#デプロイ前のチェックリスト)
4. [ロールバック方法](#ロールバック方法)

---

## 基本的なデプロイ手順

### 1. 変更内容の確認
```bash
# 現在の変更を確認
git status

# 変更内容の詳細を確認
git diff
```

### 2. ビルドテスト（必須！）
```bash
# プロダクションビルドをテスト
npm run build

# エラーがないことを確認してから次へ進む
```

### 3. 変更をステージング
```bash
# すべての変更をステージング
git add .

# または特定のファイルのみ
git add app/page.tsx lib/auth.ts
```

### 4. コミット
```bash
# わかりやすいコミットメッセージで保存
git commit -m "✨ 機能追加: 新しい機能の説明"

# コミットメッセージの例:
# git commit -m "🐛 修正: ログインエラーの修正"
# git commit -m "💄 UI: デザイン改善"
# git commit -m "⚡️ パフォーマンス: 読み込み速度改善"
```

### 5. GitHubにプッシュ
```bash
# mainブランチにプッシュ
git push origin main

# これでVercelが自動的にデプロイを開始します！
```

### 6. デプロイの確認
- Vercelダッシュボード: https://vercel.com/dashboard
- プロジェクト名: demo1
- 本番URL: https://demo1-pi-sandy.vercel.app

**デプロイ完了まで: 約2〜5分**

---

## よくあるエラーと解決方法

### ❌ エラー 1: "error: failed to push some refs"

**原因:** ローカルとリモートの履歴が異なる

**解決方法:**
```bash
# リモートの最新を取得してマージ
git pull origin main

# コンフリクトがある場合は解決してから
git add .
git commit -m "🔀 マージ: コンフリクト解決"
git push origin main
```

### ❌ エラー 2: "Your branch is behind 'origin/main'"

**原因:** リモートが先に進んでいる

**解決方法:**
```bash
# 最新を取得
git pull origin main

# 再度プッシュ
git push origin main
```

### ❌ エラー 3: "merge conflict"（コンフリクト発生）

**原因:** 同じファイルの同じ場所を別々に編集

**解決方法:**
```bash
# 1. コンフリクトしているファイルを開く
# 2. <<<<<<<, =======, >>>>>>> の部分を手動で修正
# 3. 保存後:

git add .
git commit -m "🔀 コンフリクト解決"
git push origin main
```

### ❌ エラー 4: "Permission denied (publickey)"

**原因:** GitHub認証エラー

**解決方法:**
```bash
# HTTPSを使う方法に変更
git remote set-url origin https://github.com/mogcia-app/demo1.git

# 再度プッシュ
git push origin main
```

### ❌ エラー 5: "Build failed" (Vercelでビルドエラー)

**原因:** 本番環境でビルドが失敗

**解決方法:**
```bash
# ローカルでビルドテスト
npm run build

# エラーを修正してから再度プッシュ
git add .
git commit -m "🐛 修正: ビルドエラー解決"
git push origin main
```

### ❌ エラー 6: "Changes not staged for commit"

**原因:** 変更がステージングされていない

**解決方法:**
```bash
# すべての変更をステージング
git add .

# または特定ファイルのみ
git add app/page.tsx
```

---

## デプロイ前のチェックリスト

### ✅ コード品質
- [ ] `npm run build` が成功する
- [ ] TypeScriptエラーがない
- [ ] ESLintエラーがない（警告は許容）
- [ ] コンソールエラーがない

### ✅ 機能テスト
- [ ] ローカル環境で動作確認
- [ ] ログイン/ログアウトが正常
- [ ] 主要機能が動作する
- [ ] モバイル表示が正常

### ✅ セキュリティ
- [ ] 環境変数が正しく設定されている
- [ ] Firebase設定が本番環境用
- [ ] APIキーが漏洩していない

### ✅ Git
- [ ] コミットメッセージが明確
- [ ] 不要なファイルがコミットされていない
- [ ] `.gitignore` が正しく設定されている

---

## ロールバック方法

### 直前のコミットに戻す

```bash
# 最新のコミットを取り消し（変更は保持）
git reset --soft HEAD~1

# または、変更も取り消す場合
git reset --hard HEAD~1

# リモートに強制プッシュ（注意！）
git push -f origin main
```

### 特定のコミットに戻す

```bash
# コミット履歴を確認
git log --oneline

# 特定のコミットに戻る
git reset --hard <コミットID>

# 例: git reset --hard 5ec5a73

# リモートに強制プッシュ
git push -f origin main
```

### Vercelで直接ロールバック

1. Vercelダッシュボード → Deployments
2. 戻したいデプロイを選択
3. 右上の「...」→「Promote to Production」

---

## 🔄 定期的なメンテナンス

### 毎回デプロイ前に実行

```bash
# 最新を取得
git pull origin main

# 依存関係を更新
npm install

# ビルドテスト
npm run build

# デプロイ
git add .
git commit -m "メッセージ"
git push origin main
```

### 月次メンテナンス

```bash
# 依存関係の更新
npm update

# セキュリティ監査
npm audit

# 修正可能な脆弱性を自動修正
npm audit fix
```

---

## 📝 コミットメッセージの書き方

### 推奨フォーマット

```
<絵文字> <種類>: <簡潔な説明>

詳細な説明（オプション）
```

### よく使う絵文字

| 絵文字 | 意味 | 例 |
|--------|------|-----|
| ✨ | 新機能 | `✨ 機能追加: 管理者ページ実装` |
| 🐛 | バグ修正 | `🐛 修正: ログインエラー解消` |
| 💄 | UI/スタイル | `💄 UI: デザイン刷新` |
| ⚡️ | パフォーマンス | `⚡️ 高速化: 読み込み最適化` |
| 🔒 | セキュリティ | `🔒 セキュリティ: 認証強化` |
| 📝 | ドキュメント | `📝 ドキュメント: README更新` |
| 🔧 | 設定変更 | `🔧 設定: Firebase設定更新` |
| ♻️ | リファクタリング | `♻️ リファクタリング: コード整理` |
| 🚀 | デプロイ | `🚀 デプロイ: v1.0.0リリース` |

---

## 🆘 緊急時の対応

### サイトがダウンした場合

1. **Vercelで前のバージョンに戻す**
   ```
   Vercel Dashboard → Deployments → 
   前の成功したデプロイ → Promote to Production
   ```

2. **原因を調査**
   ```bash
   # ローカルで再現
   npm run build
   npm run dev
   ```

3. **修正してデプロイ**
   ```bash
   git add .
   git commit -m "🐛 緊急修正: サイトダウンの原因解消"
   git push origin main
   ```

---

## 📞 サポート情報

### 便利なコマンド一覧

```bash
# 現在のブランチ確認
git branch

# コミット履歴を見る
git log --oneline

# 変更を一時退避
git stash

# 退避した変更を戻す
git stash pop

# 特定ファイルの変更を取り消す
git checkout -- <ファイル名>

# Gitの状態をクリーンにする
git clean -fd
```

### トラブル時の連絡先

- Vercel サポート: https://vercel.com/support
- GitHub ドキュメント: https://docs.github.com
- Next.js ドキュメント: https://nextjs.org/docs

---

## ✅ デプロイ完了後の確認項目

- [ ] 本番URLが正常に表示される
- [ ] ログイン/ログアウトが動作する
- [ ] すべてのページが表示される
- [ ] モバイル表示が正常
- [ ] Firebase接続が正常
- [ ] APIが動作する
- [ ] パフォーマンスが良好

---

**最終更新日: 2025年10月8日**
**バージョン: 1.0.0**
