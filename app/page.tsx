'use client'

import { useState, useEffect } from 'react'
import { Plus, Calendar, Settings, LogOut, User, ChevronDown, ChevronUp, MapPin, Clock, Grid3X3, GripVertical, Eye, EyeOff } from 'lucide-react'
import EquipmentSchedule from '../components/EquipmentSchedule'
import styles from './page.module.css'
import { signInWithEmail, signOutUser, onAuthStateChange, isCompanyUser } from '../lib/auth'
import { useEvents, useEquipment, useEquipmentCategories } from '../lib/hooks/useFirestore'
import { Event } from '../lib/types'
import { initializeAllData, removeAllGroups } from '../lib/initData'
import { useFirestoreOperations } from '../lib/hooks/useCloudFunction'

export default function Home() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [user, setUser] = useState<any>(null)
  const [isLoginMode] = useState(true)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [authError, setAuthError] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set())
  const [expandedEvents, setExpandedEvents] = useState<Set<string>>(new Set())
  const [searchTerm, setSearchTerm] = useState('')
  const [showAddEquipment, setShowAddEquipment] = useState<string | null>(null)
  const [newEquipmentName, setNewEquipmentName] = useState('')
  const [newEquipmentStock, setNewEquipmentStock] = useState(0)
  const [showAddGroup, setShowAddGroup] = useState(false)
  const [newGroupName, setNewGroupName] = useState('')
  const [selectedGroupId, setSelectedGroupId] = useState<string>('')
  const [nextEquipmentNumber, setNextEquipmentNumber] = useState<number>(1)
  const [eventDates, setEventDates] = useState<{[key: string]: {startDate: string, endDate: string, isMultiDay: boolean}}>({})
  const [viewMode, setViewMode] = useState<'list' | 'calendar'>('list')
  const [draggedEquipment, setDraggedEquipment] = useState<any>(null)
  const [eventEquipment, setEventEquipment] = useState<{[key: string]: string[]}>({})
  const { events, loading, error } = useEvents()
  const { equipment, loading: equipmentLoading, error: equipmentError } = useEquipment()
  const { categories, loading: categoriesLoading, error: categoriesError } = useEquipmentCategories()
  const { addDocument: addCategory, loading: addCategoryLoading } = useFirestoreOperations('equipmentCategories')
  const { addDocument: addEquipment, loading: addEquipmentLoading } = useFirestoreOperations('equipment')

  // 認証状態の確認
  useEffect(() => {
    const unsubscribe = onAuthStateChange((user) => {
      if (user && isCompanyUser(user)) {
        setUser(user)
        setIsAuthenticated(true)
      } else {
        setUser(null)
        setIsAuthenticated(false)
      }
    })

    return () => unsubscribe()
  }, [])

  // デバッグ用: 一時的に認証をスキップ（400エラーを回避）
  // useEffect(() => {
  //   // 開発環境では認証をスキップしてテスト
  //   if (process.env.NODE_ENV === 'development') {
  //     console.log('デバッグモード: 認証をスキップします')
  //     console.log('Firebase設定:', {
  //       apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  //       authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  //       projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID
  //     })
  //     setIsAuthenticated(true)
  //     setUser({ uid: 'demo-user', email: 'demo@example.com', displayName: 'Demo User' })
  //   }
  // }, [])

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
    } catch (error: any) {
      console.error('認証エラー:', error)
      setAuthError(error.message)
    } finally {
      setIsLoading(false)
    }
  }

  const handleLogout = async () => {
    try {
      await signOutUser()
    } catch (error) {
      console.error('ログアウトエラー:', error)
    }
  }

  const handleInitializeData = async () => {
    if (!user) return
    
    try {
      await initializeAllData(user.uid)
      alert('データの初期化が完了しました！')
    } catch (error) {
      console.error('初期化エラー:', error)
      alert('初期化に失敗しました。もう一度お試しください。')
    }
  }

  const handleRemoveAllGroups = async () => {
    if (!user) return
    
    if (confirm('全ての機材グループを削除しますか？この操作は元に戻せません。')) {
      try {
        await removeAllGroups()
        alert('全ての機材グループを削除しました！')
        window.location.reload()
      } catch (error) {
        console.error('機材グループ削除エラー:', error)
        alert('機材グループの削除に失敗しました。')
      }
    }
  }


  // 機材グループをFirestoreから取得したデータで構築
  const equipmentGroups = categories.map(category => ({
    id: category.id,
    name: category.name,
    equipment: equipment.filter(eq => eq.category === category.id)
  }))

  const toggleGroup = (groupId: string) => {
    const newExpanded = new Set(expandedGroups)
    if (newExpanded.has(groupId)) {
      newExpanded.delete(groupId)
    } else {
      newExpanded.add(groupId)
    }
    setExpandedGroups(newExpanded)
  }

  const toggleEvent = (eventId: string) => {
    const newExpanded = new Set(expandedEvents)
    if (newExpanded.has(eventId)) {
      newExpanded.delete(eventId)
    } else {
      newExpanded.add(eventId)
    }
    setExpandedEvents(newExpanded)
  }

  // 機材検索機能
  const filteredEquipmentGroups = equipmentGroups.map(group => ({
    ...group,
    equipment: group.equipment.filter(equipment => 
      equipment.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      equipment.id.toString().includes(searchTerm)
    )
  }))

  // グループ追加機能
  const handleAddGroup = async () => {
    if (newGroupName.trim()) {
      try {
        await addCategory({
          name: newGroupName.trim(),
          color: '#3b82f6', // デフォルトの青色
          order: categories.length + 1
        })
        setNewGroupName('')
        setShowAddGroup(false)
        alert('グループが追加されました！')
      } catch (error) {
        console.error('グループ追加エラー:', error)
        alert('グループの追加に失敗しました。')
      }
    }
  }

  const cancelAddGroup = () => {
    setNewGroupName('')
    setShowAddGroup(false)
  }

  // 次の機材番号を取得
  const getNextEquipmentNumber = () => {
    const allEquipment = equipmentGroups.flatMap(group => group.equipment)
    if (allEquipment.length === 0) return 1
    
    const numbers = allEquipment.map(eq => {
      const id = Number(eq.id)
      return isNaN(id) ? 0 : id
    })
    const maxNumber = Math.max(...numbers)
    return maxNumber + 1
  }

  // 選択されたグループの機材数を取得
  const getSelectedGroupEquipmentCount = () => {
    if (!selectedGroupId) return 0
    const selectedGroup = equipmentGroups.find(group => group.id === selectedGroupId)
    return selectedGroup ? selectedGroup.equipment.length : 0
  }

  // 機材追加機能（シンプル版）
  const handleAddEquipmentSimple = async () => {
    if (newEquipmentName.trim() && newEquipmentStock >= 0 && selectedGroupId) {
      // グループの機材数チェック（最大20件）
      if (getSelectedGroupEquipmentCount() >= 20) {
        alert('1つのグループには最大20件までしか登録できません。')
        return
      }

      try {
        const equipmentNumber = getNextEquipmentNumber()
        await addEquipment({
          id: equipmentNumber,
          name: newEquipmentName.trim(),
          category: selectedGroupId,
          stock: newEquipmentStock,
          quantity: newEquipmentStock,
          status: 'available',
          tags: [],
          description: ''
        })
        setNewEquipmentName('')
        setNewEquipmentStock(0)
        setSelectedGroupId('')
        setNextEquipmentNumber(equipmentNumber + 1)
        alert(`機材が追加されました！（#${equipmentNumber}）`)
      } catch (error) {
        console.error('機材追加エラー:', error)
        alert('機材の追加に失敗しました。')
      }
    }
  }

  // 機材追加機能（従来版）
  const handleAddEquipment = (groupId: string) => {
    if (newEquipmentName.trim() && newEquipmentStock >= 0) {
      // 実際の実装では、Firestoreに保存
      console.log('機材追加:', { groupId, name: newEquipmentName, stock: newEquipmentStock })
      setNewEquipmentName('')
      setNewEquipmentStock(0)
      setShowAddEquipment(null)
      alert('機材が追加されました！')
    }
  }

  const cancelAddEquipment = () => {
    setNewEquipmentName('')
    setNewEquipmentStock(0)
    setShowAddEquipment(null)
  }

  // 連日使用の日付管理
  const handleDateChange = (eventId: string, field: 'startDate' | 'endDate', value: string) => {
    setEventDates(prev => ({
      ...prev,
      [eventId]: {
        ...prev[eventId],
        [field]: value,
        isMultiDay: field === 'startDate' ? 
          (prev[eventId]?.endDate ? value !== prev[eventId].endDate : false) :
          (prev[eventId]?.startDate ? prev[eventId].startDate !== value : false)
      }
    }))
  }

  const toggleMultiDay = (eventId: string) => {
    setEventDates(prev => ({
      ...prev,
      [eventId]: {
        ...prev[eventId],
        isMultiDay: !prev[eventId]?.isMultiDay,
        endDate: !prev[eventId]?.isMultiDay ? prev[eventId]?.startDate || '' : prev[eventId]?.endDate || ''
      }
    }))
  }

  const getEventDates = (eventId: string) => {
    return eventDates[eventId] || { startDate: '', endDate: '', isMultiDay: false }
  }

  // カレンダー表示用の機材データを準備
  const calendarEquipment = equipmentGroups.flatMap(group => 
    group.equipment.map((item, index) => ({
      id: `${group.id}-${index}`,
      name: item.name,
      category: group.name,
      stock: item.stock
    }))
  )

  // スケジュール追加ハンドラー
  const handleAddSchedule = (equipmentId: string, eventName: string, startDate: string, endDate: string) => {
    console.log('スケジュール追加:', { equipmentId, eventName, startDate, endDate })
    // ここでFirestoreにスケジュールを保存する処理を実装
  }

  // ドラッグ開始
  const handleDragStart = (equipment: any) => {
    setDraggedEquipment(equipment)
  }

  // ドラッグ終了
  const handleDragEnd = () => {
    setDraggedEquipment(null)
  }

  // ドロップ処理
  const handleDrop = (eventId: string, e: React.DragEvent) => {
    e.preventDefault()
    
    if (!draggedEquipment) return

    // 既存の機材リストを取得
    const currentEquipment = eventEquipment[eventId] || []
    
    // 重複チェック
    if (!currentEquipment.includes(draggedEquipment.name)) {
      setEventEquipment(prev => ({
        ...prev,
        [eventId]: [...currentEquipment, draggedEquipment.name]
      }))
    }
    
    setDraggedEquipment(null)
  }

  // 機材削除
  const removeEquipment = (eventId: string, equipmentName: string) => {
    setEventEquipment(prev => ({
      ...prev,
      [eventId]: (prev[eventId] || []).filter(name => name !== equipmentName)
    }))
  }

  if (!isAuthenticated) {
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

  if (loading) {
    return (
      <main className={styles.main}>
        <div className={styles.authContainer}>
          <h1 className={styles.title}>機材管理システム</h1>
          <p className={styles.subtitle}>読み込み中...</p>
        </div>
      </main>
    )
  }

  if (error) {
    return (
      <main className={styles.main}>
        <div className={styles.authContainer}>
          <h1 className={styles.title}>機材管理システム</h1>
          <p className={styles.subtitle}>エラーが発生しました: {error}</p>
          <button className={styles.loginButton} onClick={() => window.location.reload()}>
            再読み込み
          </button>
        </div>
      </main>
    )
  }

  return (
    <main className={styles.main}>
      {/* ヘッダー */}
      <header className={styles.header}>
        <div className={styles.headerContent}>
          <h1 className={styles.title}>機材管理システム</h1>
          <div className={styles.headerActions}>
            <div className={styles.viewToggle}>
              <button 
                className={`${styles.viewButton} ${viewMode === 'list' ? styles.active : ''}`}
                onClick={() => setViewMode('list')}
                title="リスト表示"
              >
                <Calendar className={styles.icon} />
              </button>
              <button 
                className={`${styles.viewButton} ${viewMode === 'calendar' ? styles.active : ''}`}
                onClick={() => setViewMode('calendar')}
                title="カレンダー表示"
              >
                <Grid3X3 className={styles.icon} />
              </button>
            </div>
            <button className={styles.iconButton}>
              <Settings className={styles.icon} />
            </button>
            <button className={styles.iconButton} onClick={handleLogout}>
              <LogOut className={styles.icon} />
            </button>
          </div>
        </div>
      </header>

      {/* メインコンテンツ */}
      <div className={styles.content}>
        {viewMode === 'calendar' ? (
          <EquipmentSchedule 
            equipment={calendarEquipment}
            onAddSchedule={handleAddSchedule}
          />
        ) : (
          <div className={styles.layout}>
          {/* 左側: 機材管理 */}
          <div className={styles.equipmentSection}>
            <div className={styles.equipmentHeader}>
              <h2 className={styles.sectionTitle}>機材管理</h2>
              <button 
                className={styles.addGroupButton}
                onClick={() => setShowAddGroup(true)}
              >
                <Plus className={styles.icon} />
                グループ追加
              </button>
            </div>

            {/* グループ追加フォーム */}
            {showAddGroup && (
              <div className={styles.addGroupForm}>
                <input
                  type="text"
                  placeholder="グループ名を入力"
                  value={newGroupName}
                  onChange={(e) => setNewGroupName(e.target.value)}
                  className={styles.formInput}
                  autoFocus
                />
                <div className={styles.formActions}>
                  <button 
                    className={styles.saveButton}
                    onClick={handleAddGroup}
                    disabled={addCategoryLoading || !newGroupName.trim()}
                  >
                    {addCategoryLoading ? '追加中...' : '追加'}
                  </button>
                  <button 
                    className={styles.cancelButton}
                    onClick={cancelAddGroup}
                  >
                    キャンセル
                  </button>
                </div>
              </div>
            )}

            {/* 機材追加フォーム */}
            {equipmentGroups.length > 0 && (
              <div className={styles.addEquipmentForm}>
                <h3>機材を追加</h3>
                <select
                  value={selectedGroupId}
                  onChange={(e) => setSelectedGroupId(e.target.value)}
                  className={styles.groupSelect}
                >
                  <option value="">グループを選択</option>
                  {equipmentGroups.map(group => (
                    <option key={group.id} value={group.id}>
                      {group.name} ({group.equipment.length}/20)
                    </option>
                  ))}
                </select>
                <div className={styles.equipmentInputRow}>
                  <span className={styles.equipmentNumber}>#{getNextEquipmentNumber()}</span>
                  <input
                    type="text"
                    placeholder="機材名"
                    value={newEquipmentName}
                    onChange={(e) => setNewEquipmentName(e.target.value)}
                    className={styles.formInput}
                  />
                  <input
                    type="text"
                    placeholder="在庫数"
                    value={newEquipmentStock === 0 ? '' : newEquipmentStock}
                    onChange={(e) => {
                      const value = e.target.value
                      if (value === '' || /^\d+$/.test(value)) {
                        setNewEquipmentStock(value === '' ? 0 : Number(value))
                      }
                    }}
                    className={styles.formInput}
                  />
                  <button 
                    className={styles.addButton}
                    onClick={handleAddEquipmentSimple}
                    disabled={!selectedGroupId || !newEquipmentName.trim() || addEquipmentLoading || getSelectedGroupEquipmentCount() >= 20}
                  >
                    <Plus className={styles.icon} />
                    追加
                  </button>
                </div>
              </div>
            )}

            {/* 機材グループ一覧 */}
            <div className={styles.equipmentGroups}>
              {filteredEquipmentGroups.length === 0 ? (
                <div className={styles.emptyState}>
                  <p>機材グループがありません</p>
                  <p>「グループ追加」ボタンから新しいグループを作成してください</p>
                </div>
              ) : (
                filteredEquipmentGroups.map((group) => (
                  <div key={group.id} className={styles.equipmentGroup}>
                    <div 
                      className={styles.groupHeader}
                      onClick={() => toggleGroup(group.id)}
                    >
                      <span className={styles.groupTitle}>{group.name}</span>
                      <span className={styles.groupSubtitle}>(+で開いて、-で閉じる) 在庫</span>
                      <span className={styles.toggleButton}>
                        {expandedGroups.has(group.id) ? '-' : '+'}
                      </span>
                    </div>
                    {expandedGroups.has(group.id) && (
                      <div className={styles.equipmentTable}>
                        <div className={styles.tableHeader}>
                          <div className={styles.tableCell}>機材名</div>
                          <div className={styles.tableCell}>在庫</div>
                        </div>
                        {group.equipment.length === 0 ? (
                          <div className={styles.emptyEquipment}>
                            <p>このグループに機材がありません</p>
                          </div>
                        ) : (
                          group.equipment.map((equipment) => (
                            <div key={equipment.id} className={styles.tableRow}>
                              <div className={styles.tableCell}>
                                <span className={styles.equipmentNumber}>#{equipment.id}</span>
                                <span className={styles.equipmentName}>{equipment.name}</span>
                              </div>
                              <div className={styles.tableCell}>
                                <span className={styles.equipmentStock}>{equipment.stock}</span>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>

          {/* 右側: 現場管理 */}
          <div className={styles.eventsSection}>
            <div className={styles.eventsHeader}>
              <h2 className={styles.sectionTitle}>現場管理</h2>
              <button className={styles.createEventButton}>
                <Plus className={styles.icon} />
                新しい現場を登録
              </button>
            </div>
            
            {events.length === 0 && (
              <div className={styles.emptyState}>
                <p>登録された現場がありません</p>
                <button 
                  className={styles.initButton}
                  onClick={handleInitializeData}
                >
                  サンプルデータを初期化
                </button>
              </div>
            )}


            <div className={styles.eventsList}>
              {events.map((event) => (
                <div key={event.id} className={styles.eventCard}>
                  <div 
                    className={styles.eventHeader}
                    onClick={() => toggleEvent(event.id)}
                  >
                    <div className={styles.eventTitle}>
                      <h3>{event.siteName}</h3>
                      <div className={styles.eventMeta}>
                        <div className={styles.eventDate}>
                          <Calendar className={styles.icon} />
                          {event.startDate === event.endDate 
                            ? event.startDate 
                            : `${event.startDate} - ${event.endDate}`
                          }
                        </div>
                        <div className={styles.eventLocation}>
                          <MapPin className={styles.icon} />
                          場所情報
                        </div>
                      </div>
                    </div>
                    <div className={styles.eventToggle}>
                      {expandedEvents.has(event.id) ? (
                        <ChevronUp className={styles.icon} />
                      ) : (
                        <ChevronDown className={styles.icon} />
                      )}
                    </div>
                  </div>
                  
                  {expandedEvents.has(event.id) && (
                    <div className={styles.eventDetails}>
                      <div className={styles.inputSection}>
                        <h4>機材選択</h4>
                        <div 
                          className={styles.equipmentInput}
                          onDragOver={(e) => e.preventDefault()}
                          onDrop={(e) => handleDrop(event.id, e)}
                        >
                          <input 
                            type="text" 
                            placeholder="機材Noを入力またはドラッグ&ドロップ"
                            className={styles.equipmentInputField}
                          />
                          <div className={styles.equipmentList}>
                            {(eventEquipment[event.id] || []).map((equipmentName, index) => (
                              <div key={index} className={styles.equipmentTag}>
                                <span className={styles.equipmentTagName}>{equipmentName}</span>
                                <button 
                                  className={styles.equipmentTagRemove}
                                  onClick={() => removeEquipment(event.id, equipmentName)}
                                >
                                  ×
                                </button>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                      
                      <div className={styles.inputSection}>
                        <h4>機材の他に記載したいもの</h4>
                        <textarea 
                          placeholder="備考やメモを入力してください"
                          className={styles.textarea}
                        />
                      </div>
                      
                      <div className={styles.inputSection}>
                        <h4>日付、現場名（タイトル）</h4>
                        <div className={styles.dateSection}>
                          <div className={styles.dateToggle}>
                            <label className={styles.checkboxLabel}>
                              <input 
                                type="checkbox" 
                                checked={getEventDates(event.id).isMultiDay}
                                onChange={() => toggleMultiDay(event.id)}
                                className={styles.checkbox}
                              />
                              <span className={styles.checkboxText}>連日使用</span>
                            </label>
                          </div>
                          <div className={styles.dateInputs}>
                            <div className={styles.dateInputGroup}>
                              <label className={styles.dateLabel}>
                                {getEventDates(event.id).isMultiDay ? '開始日' : '日付'}
                              </label>
                              <input 
                                type="date" 
                                value={getEventDates(event.id).startDate}
                                onChange={(e) => handleDateChange(event.id, 'startDate', e.target.value)}
                                className={styles.dateInput}
                              />
                            </div>
                            {getEventDates(event.id).isMultiDay && (
                              <div className={styles.dateInputGroup}>
                                <label className={styles.dateLabel}>終了日</label>
                                <input 
                                  type="date" 
                                  value={getEventDates(event.id).endDate}
                                  onChange={(e) => handleDateChange(event.id, 'endDate', e.target.value)}
                                  className={styles.dateInput}
                                  min={getEventDates(event.id).startDate}
                                />
                              </div>
                            )}
                          </div>
                          <div className={styles.datePreview}>
                            {getEventDates(event.id).startDate && (
                              <span className={styles.datePreviewText}>
                                {getEventDates(event.id).isMultiDay && getEventDates(event.id).endDate ? 
                                  `${getEventDates(event.id).startDate} 〜 ${getEventDates(event.id).endDate}` :
                                  getEventDates(event.id).startDate
                                }
                              </span>
                            )}
                          </div>
                        </div>
                        <input 
                          type="text" 
                          placeholder="現場名を入力"
                          className={styles.siteNameInput}
                        />
                      </div>
                      
                      <div className={styles.inputSection}>
                        <h4>使用者、場所（Googleマップ紐付け）</h4>
                        <input 
                          type="text" 
                          placeholder="使用者名を入力"
                          className={styles.userInput}
                        />
                        <input 
                          type="text" 
                          placeholder="場所を入力（Googleマップ連携）"
                          className={styles.locationInput}
                        />
                      </div>
                      
                      <div className={styles.eventActions}>
                        <button className={styles.actionButton}>保存</button>
                        <button className={styles.actionButton}>削除</button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
        )}
      </div>
    </main>
  )
}
