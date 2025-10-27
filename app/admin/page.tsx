'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Shield, Users, Package, Calendar, Settings, LogOut, ArrowLeft, Database, TrendingUp, Plus, Edit, Trash2, X } from 'lucide-react'
import styles from './page.module.css'
import { signOutUser, onAuthStateChange, isAdminUser } from '../../lib/auth'
import { useEvents, useEquipment, useEquipmentCategories, useAssignees } from '../../lib/hooks/useFirestore'
import { useFirestoreOperations } from '../../lib/hooks/useCloudFunction'

type TabType = 'overview' | 'equipment' | 'categories' | 'assignees'

export default function AdminPage() {
  const router = useRouter()
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [user, setUser] = useState<any>(null)
  const [authChecking, setAuthChecking] = useState(true)
  const [activeTab, setActiveTab] = useState<TabType>('overview')

  // 機材管理用のstate
  const [showEquipmentModal, setShowEquipmentModal] = useState(false)
  const [editingEquipment, setEditingEquipment] = useState<any>(null)
  const [equipmentForm, setEquipmentForm] = useState({
    name: '',
    categories: [] as string[],
    stock: 0,
    description: ''
  })

  // グループ管理用のstate
  const [showCategoryModal, setShowCategoryModal] = useState(false)
  const [editingCategory, setEditingCategory] = useState<any>(null)
  const [categoryForm, setCategoryForm] = useState({
    name: ''
  })

  // 担当者管理用のstate
  const [showAssigneeModal, setShowAssigneeModal] = useState(false)
  const [editingAssignee, setEditingAssignee] = useState<any>(null)
  const [assigneeForm, setAssigneeForm] = useState({
    name: '',
    isActive: true
  })

  const { events } = useEvents()
  const { equipment, createEquipment, updateEquipment, deleteEquipment } = useEquipment()
  const { categories } = useEquipmentCategories()
  const { assignees, createAssignee, updateAssignee, deleteAssignee } = useAssignees()
  const { addDocument: addCategory, updateDocument: updateCategory, deleteDocument: deleteCategory } = useFirestoreOperations('equipmentCategories')

  // 認証状態の確認
  useEffect(() => {
    const unsubscribe = onAuthStateChange((user) => {
      if (user && isAdminUser(user)) {
        setUser(user)
        setIsAuthenticated(true)
        setAuthChecking(false)
      } else {
        setUser(null)
        setIsAuthenticated(false)
        setAuthChecking(false)
        router.push('/admin/login')
      }
    })

    return () => unsubscribe()
  }, [router])

  const handleLogout = async () => {
    try {
      await signOutUser()
      router.push('/admin/login')
    } catch (error) {
      console.error('ログアウトエラー:', error)
    }
  }

  // 機材管理関連の関数
  const handleAddEquipment = () => {
    setEditingEquipment(null)
    setEquipmentForm({
      name: '',
      categories: [],
      stock: 0,
      description: ''
    })
    setShowEquipmentModal(true)
  }

  const handleEditEquipment = (eq: any) => {
    console.log('handleEditEquipment called with:', {
      id: eq.id,
      docId: eq.docId,
      name: eq.name
    })
    setEditingEquipment(eq)
    setEquipmentForm({
      name: eq.name,
      categories: eq.categories || (eq.category ? [eq.category] : []),
      stock: eq.stock,
      description: eq.description || ''
    })
    setShowEquipmentModal(true)
  }

  // カテゴリのトグル
  const toggleCategory = (categoryId: string) => {
    setEquipmentForm(prev => ({
      ...prev,
      categories: prev.categories.includes(categoryId)
        ? prev.categories.filter(id => id !== categoryId)
        : [...prev.categories, categoryId]
    }))
  }

  const handleSaveEquipment = async () => {
    try {
      // 次の機材番号を取得（削除された番号を再利用）
      const getNextId = () => {
        if (equipment.length === 0) return '1'
        
        // 使用中の機材番号を取得
        const usedNumbers = new Set(equipment.map(eq => parseInt(eq.id)).filter(n => !isNaN(n)))
        const maxNumber = Math.max(...equipment.map(eq => parseInt(eq.id)).filter(n => !isNaN(n)), 0)
        
        // 削除された番号（1から最大値までの間で使用されていない番号）を探す
        for (let i = 1; i <= maxNumber; i++) {
          if (!usedNumbers.has(i)) {
            console.log(`機材番号 #${i} は削除されているので再利用します`)
            return String(i)
          }
        }
        
        // 削除された番号がなければ、最大値+1を使用
        return String(maxNumber + 1)
      }

      if (editingEquipment) {
        // 機材番号で機材を検索してFirestoreドキュメントIDを取得
        const targetEquipment = equipment.find(eq => eq.id === editingEquipment.id)
        const docId = targetEquipment?.docId || editingEquipment.docId || editingEquipment.id
        
        console.log('handleSaveEquipment - editingEquipment:', {
          id: editingEquipment.id,
          docId: editingEquipment.docId,
          name: editingEquipment.name
        })
        console.log('handleSaveEquipment - targetEquipment:', {
          docId: targetEquipment?.docId,
          id: targetEquipment?.id
        })
        console.log('handleSaveEquipment - docId to use:', docId)
        console.log('Updating equipment with docId:', docId)
        console.log('Update data:', {
          name: equipmentForm.name,
          categories: equipmentForm.categories,
          stock: equipmentForm.stock,
          quantity: equipmentForm.stock,
          description: equipmentForm.description
        })
        
        await updateEquipment(docId, {
          name: equipmentForm.name,
          categories: equipmentForm.categories,
          stock: equipmentForm.stock,
          quantity: equipmentForm.stock,
          description: equipmentForm.description
        })
        alert('機材を更新しました')
      } else {
        const nextId = getNextId()
        await createEquipment({
          id: nextId, // 数字のIDを指定
          name: equipmentForm.name,
          categories: equipmentForm.categories,
          stock: equipmentForm.stock,
          quantity: equipmentForm.stock,
          status: 'available',
          tags: [],
          description: equipmentForm.description
        })
        alert('機材を追加しました')
      }
      setShowEquipmentModal(false)
    } catch (error) {
      console.error('機材保存エラー:', error)
      alert('機材の保存に失敗しました: ' + (error instanceof Error ? error.message : '不明なエラー'))
    }
  }

  const handleDeleteEquipment = async (equipmentId: string) => {
    if (!confirm('この機材を削除しますか？')) return
    
    try {
      // docIdを使用して削除（なければequipmentIdを使用）
      const targetEquipment = equipment.find(eq => eq.id === equipmentId)
      const docId = targetEquipment?.docId || equipmentId
      
      await deleteEquipment(docId)
      alert('機材を削除しました')
    } catch (error) {
      console.error('機材削除エラー:', error)
      alert('機材の削除に失敗しました')
    }
  }

  // グループ管理関連の関数
  const handleAddCategory = () => {
    setEditingCategory(null)
    setCategoryForm({
      name: ''
    })
    setShowCategoryModal(true)
  }

  const handleEditCategory = (category: any) => {
    setEditingCategory(category)
    setCategoryForm({
      name: category.name
    })
    setShowCategoryModal(true)
  }

  const handleSaveCategory = async () => {
    try {
      if (editingCategory) {
        await updateCategory(editingCategory.id, categoryForm)
        alert('グループを更新しました')
      } else {
        await addCategory({
          ...categoryForm,
          color: '#3b82f6', // デフォルトカラー
          order: categories.length + 1
        })
        alert('グループを追加しました')
      }
      setShowCategoryModal(false)
    } catch (error) {
      console.error('グループ保存エラー:', error)
      alert('グループの保存に失敗しました')
    }
  }

  const handleDeleteCategory = async (categoryId: string) => {
    const category = categories.find(c => c.id === categoryId)
    if (!category) return

    // このカテゴリに属する機材の数を確認
    const equipmentCount = equipment.filter(eq => eq.category === categoryId).length

    if (equipmentCount > 0) {
      if (!confirm(`グループ「${category.name}」には${equipmentCount}個の機材が登録されています。\n削除すると機材のカテゴリが未設定になります。\n本当に削除しますか？`)) {
        return
      }
    } else {
      if (!confirm(`グループ「${category.name}」を削除しますか？`)) {
        return
      }
    }
    
    try {
      await deleteCategory(categoryId)
      alert('グループを削除しました')
    } catch (error) {
      console.error('グループ削除エラー:', error)
      alert('グループの削除に失敗しました')
    }
  }

  // 担当者管理関連の関数
  const handleAddAssignee = () => {
    setEditingAssignee(null)
    setAssigneeForm({
      name: '',
      isActive: true
    })
    setShowAssigneeModal(true)
  }

  const handleEditAssignee = (assignee: any) => {
    setEditingAssignee(assignee)
    setAssigneeForm({
      name: assignee.name,
      isActive: assignee.isActive
    })
    setShowAssigneeModal(true)
  }

  const handleSaveAssignee = async () => {
    try {
      if (editingAssignee) {
        await updateAssignee(editingAssignee.id, assigneeForm)
        alert('担当者を更新しました')
      } else {
        await createAssignee(assigneeForm)
        alert('担当者を追加しました')
      }
      setShowAssigneeModal(false)
    } catch (error) {
      console.error('担当者保存エラー:', error)
      alert('担当者の保存に失敗しました')
    }
  }

  const handleDeleteAssignee = async (assigneeId: string) => {
    if (!confirm('この担当者を削除しますか？')) return
    
    try {
      await deleteAssignee(assigneeId)
      alert('担当者を削除しました')
    } catch (error) {
      console.error('担当者削除エラー:', error)
      alert('担当者の削除に失敗しました')
    }
  }

  // 認証チェック中
  if (authChecking) {
    return (
      <main className={styles.main}>
        <div className={styles.authContainer}>
          <h1 className={styles.title}>管理者ページ</h1>
          <p className={styles.subtitle}>認証確認中...</p>
        </div>
      </main>
    )
  }

  // 未認証の場合はuseEffectでリダイレクトされるので、ここには到達しない
  if (!isAuthenticated) {
    return null
  }

  return (
    <main className={styles.main}>
      {/* ヘッダー */}
      <header className={styles.header}>
        <div className={styles.headerContent}>
          <div className={styles.headerLeft}>
            <button 
              className={styles.backButton}
              onClick={() => router.push('/')}
            >
              <ArrowLeft className={styles.icon} />
            </button>
            <div className={styles.headerTitle}>
              <Shield className={styles.shieldIcon} />
              <h1 className={styles.title}>管理者ダッシュボード</h1>
            </div>
          </div>
          <div className={styles.headerRight}>
            <div className={styles.userInfo}>
              <span className={styles.userEmail}>{user?.email}</span>
              <span className={styles.userRole}>管理者</span>
            </div>
            <button className={styles.logoutButton} onClick={handleLogout}>
              <LogOut className={styles.icon} />
              ログアウト
            </button>
          </div>
        </div>
      </header>

      {/* タブナビゲーション */}
      <div className={styles.tabNavigation}>
        <button 
          className={`${styles.tab} ${activeTab === 'overview' ? styles.activeTab : ''}`}
          onClick={() => setActiveTab('overview')}
        >
          <Database className={styles.icon} />
          概要
        </button>
        <button 
          className={`${styles.tab} ${activeTab === 'equipment' ? styles.activeTab : ''}`}
          onClick={() => setActiveTab('equipment')}
        >
          <Package className={styles.icon} />
          機材管理
        </button>
        <button 
          className={`${styles.tab} ${activeTab === 'categories' ? styles.activeTab : ''}`}
          onClick={() => setActiveTab('categories')}
        >
          <Database className={styles.icon} />
          グループ管理
        </button>
        <button 
          className={`${styles.tab} ${activeTab === 'assignees' ? styles.activeTab : ''}`}
          onClick={() => setActiveTab('assignees')}
        >
          <Users className={styles.icon} />
          担当者管理
        </button>
      </div>

      {/* メインコンテンツ */}
      <div className={styles.content}>
        {activeTab === 'overview' && (
          <>
            {/* 統計カード */}
            <div className={styles.statsGrid}>
              <div className={styles.statCard}>
                <div className={styles.statIcon} style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
                  <Calendar className={styles.icon} />
                </div>
                <div className={styles.statContent}>
                  <p className={styles.statLabel}>登録現場数</p>
                  <p className={styles.statValue}>{events.length}</p>
                </div>
              </div>

              <div className={styles.statCard}>
                <div className={styles.statIcon} style={{ background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)' }}>
                  <Package className={styles.icon} />
                </div>
                <div className={styles.statContent}>
                  <p className={styles.statLabel}>機材数</p>
                  <p className={styles.statValue}>{equipment.length}</p>
                </div>
              </div>

              <div className={styles.statCard}>
                <div className={styles.statIcon} style={{ background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)' }}>
                  <Database className={styles.icon} />
                </div>
                <div className={styles.statContent}>
                  <p className={styles.statLabel}>機材グループ数</p>
                  <p className={styles.statValue}>{categories.length}</p>
                </div>
              </div>

              <div className={styles.statCard}>
                <div className={styles.statIcon} style={{ background: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)' }}>
                  <Users className={styles.icon} />
                </div>
                <div className={styles.statContent}>
                  <p className={styles.statLabel}>担当者数</p>
                  <p className={styles.statValue}>{assignees.length}</p>
                </div>
              </div>
            </div>
          </>
        )}

        {activeTab === 'equipment' && (
          <div className={styles.managementSection}>
            <div className={styles.sectionHeader}>
              <h2 className={styles.sectionTitle}>機材管理</h2>
              <button className={styles.addButton} onClick={handleAddEquipment}>
                <Plus className={styles.icon} />
                機材を追加
              </button>
            </div>

            <div className={styles.table}>
              <div className={styles.tableHeader}>
                <div className={styles.tableCell}>ID</div>
                <div className={styles.tableCell}>機材名</div>
                <div className={styles.tableCell}>カテゴリ</div>
                <div className={styles.tableCell}>在庫数</div>
                <div className={styles.tableCell}>説明</div>
                <div className={styles.tableCell}>操作</div>
              </div>
              {equipment.map((eq) => (
                <div key={eq.id} className={styles.tableRow}>
                  <div className={styles.tableCell} data-label="ID">#{eq.id}</div>
                  <div className={styles.tableCell} data-label="機材名">{eq.name}</div>
                  <div className={styles.tableCell} data-label="カテゴリ">
                    {(eq.categories || (eq.category ? [eq.category] : []))
                      .map(catId => categories.find(c => c.id === catId)?.name)
                      .filter(Boolean)
                      .join(', ') || '-'}
                  </div>
                  <div className={styles.tableCell} data-label="在庫数">{eq.stock}</div>
                  <div className={styles.tableCell} data-label="説明">{eq.description || '-'}</div>
                  <div className={styles.tableCell}>
                    <button 
                      className={styles.editButton}
                      onClick={() => handleEditEquipment(eq)}
                      aria-label="編集"
                    >
                      <Edit className={styles.smallIcon} />
                    </button>
                    <button 
                      className={styles.deleteButton}
                      onClick={() => handleDeleteEquipment(eq.id)}
                      aria-label="削除"
                    >
                      <Trash2 className={styles.smallIcon} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'categories' && (
          <div className={styles.managementSection}>
            <div className={styles.sectionHeader}>
              <h2 className={styles.sectionTitle}>グループ管理</h2>
              <button className={styles.addButton} onClick={handleAddCategory}>
                <Plus className={styles.icon} />
                グループを追加
              </button>
            </div>

            <div className={styles.table}>
              <div className={styles.categoryTableHeader}>
                <div className={styles.tableCell}>グループ名</div>
                <div className={styles.tableCell}>機材数</div>
                <div className={styles.tableCell}>操作</div>
              </div>
              {categories.map((category) => {
                const equipmentCategories = equipment.filter(eq => {
                  const cats = eq.categories || (eq.category ? [eq.category] : [])
                  return cats.includes(category.id)
                })
                return (
                  <div key={category.id} className={styles.categoryTableRow}>
                    <div className={styles.tableCell} data-label="グループ名">{category.name}</div>
                    <div className={styles.tableCell} data-label="機材数">
                      {equipmentCategories.length}件
                    </div>
                    <div className={styles.tableCell}>
                      <button 
                        className={styles.editButton}
                        onClick={() => handleEditCategory(category)}
                        aria-label="編集"
                      >
                        <Edit className={styles.smallIcon} />
                      </button>
                      <button 
                        className={styles.deleteButton}
                        onClick={() => handleDeleteCategory(category.id)}
                        aria-label="削除"
                      >
                        <Trash2 className={styles.smallIcon} />
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {activeTab === 'assignees' && (
          <div className={styles.managementSection}>
            <div className={styles.sectionHeader}>
              <h2 className={styles.sectionTitle}>担当者管理</h2>
              <button className={styles.addButton} onClick={handleAddAssignee}>
                <Plus className={styles.icon} />
                担当者を追加
              </button>
            </div>

            <div className={styles.table}>
            <div className={styles.tableHeader} style={{gridTemplateColumns: '3fr 1fr 1fr'}}>
              <div className={styles.tableCell}>名前</div>
              <div className={styles.tableCell}>状態</div>
              <div className={styles.tableCell}>操作</div>
            </div>
            {assignees.map((assignee) => (
              <div key={assignee.id} className={styles.tableRow} style={{gridTemplateColumns: '3fr 1fr 1fr'}}>
                <div className={styles.tableCell} data-label="名前">{assignee.name}</div>
                <div className={styles.tableCell} data-label="状態">
                  <span className={assignee.isActive ? styles.activeBadge : styles.inactiveBadge}>
                    {assignee.isActive ? '有効' : '無効'}
                  </span>
                </div>
                <div className={styles.tableCell}>
                  <button 
                    className={styles.editButton}
                    onClick={() => handleEditAssignee(assignee)}
                    aria-label="編集"
                  >
                    <Edit className={styles.smallIcon} />
                  </button>
                  <button 
                    className={styles.deleteButton}
                    onClick={() => handleDeleteAssignee(assignee.id)}
                    aria-label="削除"
                  >
                    <Trash2 className={styles.smallIcon} />
                  </button>
                </div>
              </div>
            ))}
            </div>
          </div>
        )}
      </div>

      {/* 機材編集モーダル */}
      {showEquipmentModal && (
        <div className={styles.modal} onClick={() => setShowEquipmentModal(false)}>
          <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h2>{editingEquipment ? '機材を編集' : '機材を追加'}</h2>
              <button 
                className={styles.closeButton}
                onClick={() => setShowEquipmentModal(false)}
              >
                <X className={styles.icon} />
              </button>
            </div>
            <div className={styles.modalBody}>
              <div className={styles.formGroup}>
                <label>機材名</label>
                <input 
                  type="text"
                  value={equipmentForm.name}
                  onChange={(e) => setEquipmentForm({...equipmentForm, name: e.target.value})}
                  placeholder="機材名を入力"
                />
              </div>
              <div className={styles.formGroup}>
                <label>カテゴリ（複数選択可）</label>
                <div className={styles.categoryCheckboxes}>
                  {categories.length === 0 ? (
                    <p className={styles.noCategories}>カテゴリがありません。先にグループ管理タブでカテゴリを作成してください。</p>
                  ) : (
                    categories.map(cat => (
                      <label key={cat.id} className={styles.categoryCheckbox}>
                        <input 
                          type="checkbox"
                          checked={equipmentForm.categories.includes(cat.id)}
                          onChange={() => toggleCategory(cat.id)}
                        />
                        <span className={styles.categoryName}>{cat.name}</span>
                      </label>
                    ))
                  )}
                </div>
              </div>
              <div className={styles.formGroup}>
                <label>在庫数</label>
                <input 
                  type="number"
                  value={equipmentForm.stock}
                  onChange={(e) => setEquipmentForm({...equipmentForm, stock: parseInt(e.target.value) || 0})}
                  placeholder="在庫数を入力"
                  min="0"
                />
              </div>
              <div className={styles.formGroup}>
                <label>説明</label>
                <textarea 
                  value={equipmentForm.description}
                  onChange={(e) => setEquipmentForm({...equipmentForm, description: e.target.value})}
                  placeholder="説明を入力"
                  rows={3}
                />
              </div>
            </div>
            <div className={styles.modalFooter}>
              <button className={styles.cancelButton} onClick={() => setShowEquipmentModal(false)}>
                キャンセル
              </button>
              <button className={styles.saveButton} onClick={handleSaveEquipment}>
                保存
              </button>
            </div>
          </div>
        </div>
      )}

      {/* グループ編集モーダル */}
      {showCategoryModal && (
        <div className={styles.modal} onClick={() => setShowCategoryModal(false)}>
          <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h2>{editingCategory ? 'グループを編集' : 'グループを追加'}</h2>
              <button 
                className={styles.closeButton}
                onClick={() => setShowCategoryModal(false)}
              >
                <X className={styles.icon} />
              </button>
            </div>
            <div className={styles.modalBody}>
              <div className={styles.formGroup}>
                <label>グループ名</label>
                <input 
                  type="text"
                  value={categoryForm.name}
                  onChange={(e) => setCategoryForm({...categoryForm, name: e.target.value})}
                  placeholder="グループ名を入力"
                />
              </div>
            </div>
            <div className={styles.modalFooter}>
              <button className={styles.cancelButton} onClick={() => setShowCategoryModal(false)}>
                キャンセル
              </button>
              <button className={styles.saveButton} onClick={handleSaveCategory}>
                保存
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 担当者編集モーダル */}
      {showAssigneeModal && (
        <div className={styles.modal} onClick={() => setShowAssigneeModal(false)}>
          <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h2>{editingAssignee ? '担当者を編集' : '担当者を追加'}</h2>
              <button 
                className={styles.closeButton}
                onClick={() => setShowAssigneeModal(false)}
              >
                <X className={styles.icon} />
              </button>
            </div>
            <div className={styles.modalBody}>
              <div className={styles.formGroup}>
                <label>名前</label>
                <input 
                  type="text"
                  value={assigneeForm.name}
                  onChange={(e) => setAssigneeForm({...assigneeForm, name: e.target.value})}
                  placeholder="担当者名を入力"
                  required
                />
              </div>
              <div className={styles.formGroup}>
                <label className={styles.checkboxLabel}>
                  <input 
                    type="checkbox"
                    checked={assigneeForm.isActive}
                    onChange={(e) => setAssigneeForm({...assigneeForm, isActive: e.target.checked})}
                  />
                  <span>有効</span>
                </label>
              </div>
            </div>
            <div className={styles.modalFooter}>
              <button className={styles.cancelButton} onClick={() => setShowAssigneeModal(false)}>
                キャンセル
              </button>
              <button className={styles.saveButton} onClick={handleSaveAssignee}>
                保存
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  )
}