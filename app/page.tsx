'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, Calendar, Settings, LogOut, ChevronDown, ChevronUp, MapPin, Clock, Grid3X3, GripVertical, Users } from 'lucide-react'
import EquipmentSchedule from '../components/EquipmentSchedule'
import styles from './page.module.css'
import { signOutUser, onAuthStateChange, isCompanyUser } from '../lib/auth'
import { useEvents, useEquipment, useEquipmentCategories, useAssignees } from '../lib/hooks/useFirestore'
import { Event } from '../lib/types'
import { initializeAllData, removeAllGroups, removeSampleEvents } from '../lib/initData'
import { useFirestoreOperations } from '../lib/hooks/useCloudFunction'
import { createCalendarEvent, updateCalendarEvent, deleteCalendarEvent, getCalendarInfo } from '../lib/google/calendar-client'
import { decreaseInventory, increaseInventory, adjustInventory } from '../lib/inventory'

export default function Home() {
  const router = useRouter()
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [user, setUser] = useState<any>(null)
  const [authChecking, setAuthChecking] = useState(true)
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set())
  const [expandedEvents, setExpandedEvents] = useState<Set<string>>(new Set())
  const [searchTerm, setSearchTerm] = useState('')
  const [viewMode, setViewMode] = useState<'list' | 'calendar'>('list')
  const [equipmentViewMode, setEquipmentViewMode] = useState<'all' | 'grouped'>('all')
  const [showAddGroup, setShowAddGroup] = useState(false)
  const [newGroupName, setNewGroupName] = useState('')
  const [draggedEquipment, setDraggedEquipment] = useState<any>(null)
  
  // 現場データを統合管理
  const [eventData, setEventData] = useState<{[key: string]: {
    title: string
    startDate: string
    endDate: string
    assigneeId: string
    location: string
    memo: string
    equipment: {
      equipmentId: string
      name: string
      quantity: number
      maxStock: number
    }[]
  }}>({})
  
  const [calendarEventIds, setCalendarEventIds] = useState<{[key: string]: string}>({})
  const [savedEventEquipment, setSavedEventEquipment] = useState<{[key: string]: {equipmentId: string, quantity: number}[]}>({})
  const [savedEvents, setSavedEvents] = useState<Set<string>>(new Set())
  const [showCreateEvent, setShowCreateEvent] = useState(false)
  const [equipmentInputValue, setEquipmentInputValue] = useState<{[key: string]: string}>({})
  const [showSettingsMenu, setShowSettingsMenu] = useState(false)
  const [editingEventId, setEditingEventId] = useState<string | null>(null)
  const [showEquipmentEditModal, setShowEquipmentEditModal] = useState(false)
  const [editingEquipmentEventId, setEditingEquipmentEventId] = useState<string | null>(null)
  
  // 認証状態の確認
  useEffect(() => {
    const unsubscribe = onAuthStateChange((user) => {
      if (user && isCompanyUser(user)) {
        setUser(user)
        setIsAuthenticated(true)
        setAuthChecking(false)
      } else {
        setUser(null)
        setIsAuthenticated(false)
        setAuthChecking(false)
        // 未認証の場合はログインページへリダイレクト
        window.location.href = '/login'
      }
    })

    return () => unsubscribe()
  }, [])

  // 認証完了後のみFirestoreデータを取得
  const { events, loading, error, createEvent, updateEvent, deleteEvent } = useEvents()
  const { equipment } = useEquipment()
  const { categories } = useEquipmentCategories()
  const { assignees } = useAssignees()
  const { addDocument: addEvent, loading: addEventLoading } = useFirestoreOperations('events')
  const { addDocument: addCategory, loading: addCategoryLoading } = useFirestoreOperations('equipmentCategories')

  // イベントが読み込まれた時に初期データを設定
  useEffect(() => {
    events.forEach(event => {
      if (!eventData[event.id]) {
        setEventData(prev => ({
          ...prev,
          [event.id]: {
            title: event.siteName || '',
            startDate: event.startDate || '',
            endDate: event.endDate || '',
            assigneeId: '',
            location: '',
            memo: '',
            equipment: []
          }
        }))
      }
    })
  }, [events])

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


  const handleLogout = async () => {
    try {
      await signOutUser()
      // ログアウト後はログインページへリダイレクト
      window.location.href = '/login'
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

  // サンプルイベントを削除
  const handleRemoveSampleEvents = async () => {
    if (!user) return
    
    if (confirm('サンプルイベント（東京ドーム、横浜アリーナ）を削除しますか？')) {
      try {
        await removeSampleEvents()
        alert('サンプルイベントを削除しました！')
        window.location.reload()
      } catch (error) {
        console.error('サンプルイベント削除エラー:', error)
        alert('サンプルイベントの削除に失敗しました。')
      }
    }
  }


  // 機材編集モーダルを開く
  const handleOpenEquipmentEdit = (eventId: string) => {
    setEditingEquipmentEventId(eventId)
    setShowEquipmentEditModal(true)
  }

  // 機材編集モーダルを閉じる
  const handleCloseEquipmentEdit = () => {
    setShowEquipmentEditModal(false)
    setEditingEquipmentEventId(null)
  }

  // 機材編集の保存
  const handleSaveEquipmentEdit = async (eventId: string, newEquipment: any[]) => {
    try {
      // 既存の機材情報を取得
      const previousEquipment = savedEventEquipment[eventId] || []
      const newEquipmentItems = newEquipment.map(eq => ({
        equipmentId: eq.equipmentId,
        quantity: eq.quantity
      }))

      // 在庫調整処理
      console.log('機材編集 - 在庫調整開始...')
      const inventoryResult = await adjustInventory(previousEquipment, newEquipmentItems)

      if (!inventoryResult.success) {
        alert(inventoryResult.error || '在庫調整に失敗しました')
        return
      }

      // eventDataを更新
      setEventData(prev => ({
        ...prev,
        [eventId]: {
          ...prev[eventId],
          equipment: newEquipment.map(eq => ({
            ...eq,
            name: equipment.find(e => e.id === eq.equipmentId)?.name || eq.name
          }))
        }
      }))

      // 保存した機材情報を更新
      setSavedEventEquipment(prev => ({
        ...prev,
        [eventId]: newEquipmentItems
      }))

      // モーダルを閉じる
      handleCloseEquipmentEdit()

      alert('✅ 機材を更新しました！\n\n在庫が調整されました。')
    } catch (error) {
      console.error('機材編集エラー:', error)
      alert('機材の更新に失敗しました')
    }
  }

  // 機材グループをFirestoreから取得したデータで構築（複数カテゴリ対応）
  const equipmentGroups = categories.map(category => ({
    id: category.id,
    name: category.name,
    equipment: equipment.filter(eq => {
      // 後方互換性: categoriesまたはcategoryをチェック
      const equipmentCategories = eq.categories || (eq.category ? [eq.category] : [])
      return equipmentCategories.includes(category.id)
    })
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

  // グループ追加機能
  const handleAddGroup = async () => {
    if (newGroupName.trim()) {
      try {
        await addCategory({
          name: newGroupName.trim(),
          color: '#3b82f6',
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

  // 機材検索機能
  const filteredEquipmentGroups = equipmentGroups.map(group => ({
    ...group,
    equipment: group.equipment.filter(equipment => 
      equipment.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      equipment.id.toString().includes(searchTerm)
    )
  }))


  // 現場データ更新ヘルパー
  const updateEventData = (eventId: string, field: string, value: any) => {
    setEventData(prev => ({
      ...prev,
      [eventId]: {
        ...prev[eventId],
        [field]: value
      }
    }))
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
    const currentEquipment = eventData[eventId]?.equipment || []
    
    // 重複チェック
    const isDuplicate = currentEquipment.some(eq => eq.equipmentId === draggedEquipment.id)
    
    if (!isDuplicate) {
      setEventData(prev => ({
        ...prev,
        [eventId]: {
          ...prev[eventId],
          equipment: [...currentEquipment, {
            equipmentId: draggedEquipment.id,
            name: draggedEquipment.name,
            quantity: 1,
            maxStock: draggedEquipment.stock
          }]
        }
      }))
    }
    
    setDraggedEquipment(null)
  }

  // 機材削除
  const removeEquipment = (eventId: string, equipmentId: string) => {
    setEventData(prev => ({
      ...prev,
      [eventId]: {
        ...prev[eventId],
        equipment: (prev[eventId]?.equipment || []).filter(eq => eq.equipmentId !== equipmentId)
      }
    }))
  }

  // 機材数量変更
  const updateEquipmentQuantity = (eventId: string, equipmentId: string, quantity: number) => {
    const currentEquipment = eventData[eventId]?.equipment || []
    const targetEquipment = currentEquipment.find(eq => eq.equipmentId === equipmentId)
    
    if (!targetEquipment) return

    // 在庫超過チェック
    if (quantity > targetEquipment.maxStock) {
      alert(`⚠️ 在庫不足\n\n機材: ${targetEquipment.name}\n要求数量: ${quantity}台\n在庫数: ${targetEquipment.maxStock}台\n\n在庫数を超えて割り当てることはできません。`)
      return
    }

    // 最小値は1
    const validQuantity = Math.max(1, quantity)

    setEventData(prev => ({
      ...prev,
      [eventId]: {
        ...prev[eventId],
        equipment: (prev[eventId]?.equipment || []).map(eq => 
          eq.equipmentId === equipmentId 
            ? { ...eq, quantity: validQuantity }
            : eq
        )
      }
    }))
  }

  // 機材No入力処理
  const handleEquipmentInput = (eventId: string, value: string) => {
    setEquipmentInputValue(prev => ({
      ...prev,
      [eventId]: value
    }))
  }

  // 機材No入力で機材を追加（一括入力対応）
  const handleAddEquipmentByNumber = (eventId: string) => {
    const inputValue = equipmentInputValue[eventId] || ''
    if (!inputValue.trim()) return

    const currentEquipment = eventData[eventId]?.equipment || []
    const newEquipment = [...currentEquipment]
    const errors: string[] = []
    const added: string[] = []

    // カンマで分割して複数入力に対応
    const inputs = inputValue.split(',').map(s => s.trim()).filter(s => s)

    for (const input of inputs) {
      // #1*2 形式をパース
      const match = input.match(/^#?(\d+)(?:\*(\d+))?$/)
      
      if (!match) {
        errors.push(`"${input}" の形式が正しくありません`)
        continue
      }

      const equipmentId = match[1]
      const quantity = match[2] ? parseInt(match[2]) : 1

      // 機材を検索
      const foundEquipment = equipment.find(eq => eq.id === equipmentId)
      
      if (!foundEquipment) {
        errors.push(`機材 #${equipmentId} が見つかりません`)
        continue
      }

      // 在庫チェック
      if (quantity > foundEquipment.stock) {
        errors.push(`機材 #${equipmentId} ${foundEquipment.name}: 在庫不足（要求:${quantity}台, 在庫:${foundEquipment.stock}台）`)
        continue
      }

      // 重複チェック
      const isDuplicate = newEquipment.some(eq => eq.equipmentId === foundEquipment.id)
      
      if (isDuplicate) {
        errors.push(`機材 #${equipmentId} ${foundEquipment.name} は既に追加されています`)
        continue
      }

      // 追加
      newEquipment.push({
        equipmentId: foundEquipment.id,
        name: foundEquipment.name,
        quantity: quantity,
        maxStock: foundEquipment.stock
      })
      
      added.push(`#${equipmentId} ${foundEquipment.name} × ${quantity}台`)
    }

    // 結果を反映
    if (newEquipment.length > currentEquipment.length) {
      setEventData(prev => ({
        ...prev,
        [eventId]: {
          ...prev[eventId],
          equipment: newEquipment
        }
      }))
      setEquipmentInputValue(prev => ({
        ...prev,
        [eventId]: ''
      }))
    }

    // 結果をユーザーに通知
    if (added.length > 0) {
      const message = `✅ ${added.length}件の機材を追加しました\n\n${added.join('\n')}`
      if (errors.length > 0) {
        alert(`${message}\n\n⚠️ エラー:\n${errors.join('\n')}`)
      } else {
        console.log(message)
      }
    } else if (errors.length > 0) {
      alert(`❌ エラー:\n\n${errors.join('\n')}`)
    }
  }

  // 現場保存（Google Calendar連携 + 在庫減算）
  const handleSaveEvent = async (eventId: string) => {
    const event = events.find(e => e.id === eventId)
    if (!event) return

    const data = eventData[eventId]
    if (!data) {
      alert('現場データがありません')
      return
    }

    // 機材が選択されているか確認
    if (data.equipment.length === 0) {
      alert('機材を選択してください')
      return
    }

    // タイトルと日付の確認
    if (!data.title.trim() || !data.startDate) {
      alert('タイトルと日付を入力してください')
      return
    }

    // 詳細ページのURLを生成
    const eventUrl = `${window.location.origin}/events/${eventId}`

    try {
      // 在庫処理
      const previousEquipment = savedEventEquipment[eventId] || []
      const newEquipmentItems = data.equipment.map(eq => ({
        equipmentId: eq.equipmentId,
        quantity: eq.quantity
      }))

      let inventoryResult
      if (previousEquipment.length > 0) {
        // 既存現場の更新：差分調整
        console.log('在庫調整開始...')
        inventoryResult = await adjustInventory(previousEquipment, newEquipmentItems)
      } else {
        // 新規現場：在庫減算
        console.log('在庫減算開始...')
        inventoryResult = await decreaseInventory(newEquipmentItems)
      }

      if (!inventoryResult.success) {
        alert(inventoryResult.error || '在庫処理に失敗しました')
        return
      }

      // 在庫処理成功後、保存した機材情報を記録
      setSavedEventEquipment(prev => ({
        ...prev,
        [eventId]: newEquipmentItems
      }))

      // Firestoreに現場データを保存
      const eventToSave = {
        siteName: data.title,
        startDate: data.startDate,
        endDate: data.endDate || data.startDate,
        equipment: data.equipment.map(eq => ({
          equipmentId: eq.equipmentId,
          equipmentName: eq.name,
          quantity: eq.quantity,
          notes: ''
        })),
        description: data.memo,
        notes: data.memo,
        status: 'confirmed' as const,
        priority: 'medium' as const,
        createdBy: user?.uid || '',
        userName: user?.displayName || user?.email || '',
        location: data.location,
        assigneeId: data.assigneeId
      }

      if (savedEvents.has(eventId)) {
        // 既存の現場を更新
        await updateEvent(eventId, eventToSave)
      } else {
        // 新しい現場を作成
        await createEvent(eventToSave)
      }

      // このイベントを保存済みとしてマーク
      setSavedEvents(prev => new Set(prev).add(eventId))

      // 編集中状態を解除
      setEditingEventId(null)

      // eventDataを更新（機材名などの表示を確実にするため）
      setEventData(prev => ({
        ...prev,
        [eventId]: {
          ...data,
          // 機材情報を確実に更新
          equipment: data.equipment.map(eq => ({
            ...eq,
            name: equipment.find(e => e.id === eq.equipmentId)?.name || eq.name
          }))
        }
      }))

      // Googleカレンダー連携
      const calendarData = {
        siteName: data.title,
        startDate: data.startDate,
        endDate: data.endDate || data.startDate,
        description: data.memo,
        location: data.location,
        eventUrl: eventUrl
      }

      let result: { success: boolean; eventId?: string | null; eventUrl?: string | null; calendarUrl?: string; calendarId?: string; error?: string }
      if (calendarEventIds[eventId]) {
        // 既存のイベントを更新
        result = await updateCalendarEvent(calendarEventIds[eventId], calendarData)
      } else {
        // 新しいイベントを作成
        result = await createCalendarEvent(calendarData)
        if (result.success && result.eventId) {
          setCalendarEventIds(prev => ({
            ...prev,
            [eventId]: result.eventId!
          }))
        }
      }

      if (result.success) {
        console.log('✅ 現場保存成功！')
        console.log('使用したカレンダーID:', result.calendarId || 'primary')
        console.log('GoogleカレンダーURL:', result.eventUrl || result.calendarUrl)
        console.log('詳細ページURL:', eventUrl)
        console.log('イベントID:', result.eventId)
        alert('✅ 現場が保存されました！\n\n在庫が減算されました。\n\nGoogleカレンダーに登録されました。')
      } else {
        console.error('現場保存失敗:', result.error)
        alert(`保存に失敗しました: ${result.error}`)
      }
    } catch (error) {
      console.error('現場保存エラー:', error)
      alert('現場の保存に失敗しました')
    }
  }

  // 現場削除（Google Calendar連携 + 在庫復元）
  const handleDeleteEvent = async (eventId: string) => {
    if (!confirm('この現場を削除しますか？\n\n使用していた機材の在庫が復元されます。')) return

    try {
      // 保存されていた機材情報を取得
      const previousEquipment = savedEventEquipment[eventId] || []
      
      // 在庫を復元
      if (previousEquipment.length > 0) {
        console.log('在庫復元開始...')
        const result = await increaseInventory(previousEquipment)
        
        if (!result.success) {
          alert(`在庫復元に失敗しました: ${result.error}`)
          return
        }
        
        // 保存していた機材情報をクリア
        setSavedEventEquipment(prev => {
          const newSaved = { ...prev }
          delete newSaved[eventId]
          return newSaved
        })
      }

      // Googleカレンダーから削除
      if (calendarEventIds[eventId]) {
        const result = await deleteCalendarEvent(calendarEventIds[eventId])
        if (result.success) {
          setCalendarEventIds(prev => {
            const newIds = { ...prev }
            delete newIds[eventId]
            return newIds
          })
        }
      }

      // Firestoreからイベントを削除
      await deleteEvent(eventId)

      // イベントのデータをクリア
      setEventData(prev => {
        const newData = { ...prev }
        delete newData[eventId]
        return newData
      })

      // 保存済みフラグをクリア
      setSavedEvents(prev => {
        const newSaved = new Set(prev)
        newSaved.delete(eventId)
        return newSaved
      })

      alert('✅ 現場を削除しました\n\n在庫が復元されました。')
    } catch (error) {
      console.error('現場削除エラー:', error)
      alert('現場の削除に失敗しました')
    }
  }

  // 新しい現場作成
  const handleCreateEvent = async () => {
    // 仮の現場を作成してFirestoreに保存
    try {
      const newEventId = await addEvent({
        siteName: '新しい現場',
        startDate: new Date().toISOString().split('T')[0],
        endDate: new Date().toISOString().split('T')[0],
        equipment: [],
        description: '',
        location: '',
        status: 'draft',
        priority: 'medium',
        createdBy: user?.uid || ''
      })

      // 新しい現場の初期データを設定
      if (newEventId) {
        const today = new Date().toISOString().split('T')[0]
        setEventData(prev => ({
          ...prev,
          [newEventId]: {
            title: '新しい現場',
            startDate: today,
            endDate: today,
            assigneeId: '',
            location: '',
            memo: '',
            equipment: []
          }
        }))
        
        // 自動的に開く
        setExpandedEvents(prev => new Set(prev).add(newEventId))
        
        // 編集中状態に設定
        setEditingEventId(newEventId)
        
        console.log('新しい現場データを設定:', {
          eventId: newEventId,
          eventData: {
            title: '新しい現場',
            startDate: today,
            endDate: today,
            assigneeId: '',
            location: '',
            memo: '',
            equipment: []
          }
        })
      }
      
      setShowCreateEvent(false)
      alert('新しい現場を作成しました！内容を編集してください。')
    } catch (error) {
      console.error('現場作成エラー:', error)
      alert('現場の作成に失敗しました')
    }
  }

  // 認証チェック中
  if (authChecking) {
    return (
      <main className={styles.main}>
        <div className={styles.authContainer}>
          <h1 className={styles.title}>機材管理システム</h1>
          <p className={styles.subtitle}>認証確認中...</p>
        </div>
      </main>
    )
  }

  // 未認証の場合はuseEffectでリダイレクトされるので、ここには到達しない
  if (!isAuthenticated) {
    return null
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
                onClick={() => router.push('/schedule')}
                title="機材スケジュール"
              >
                <Grid3X3 className={styles.icon} />
              </button>
            </div>
            <button 
              className={styles.iconButton}
              onClick={() => setShowSettingsMenu(!showSettingsMenu)}
              title="設定"
            >
              <Settings className={styles.icon} />
            </button>
            <button 
              className={styles.iconButton} 
              onClick={handleLogout}
              title="ログアウト"
            >
              <LogOut className={styles.icon} />
            </button>
          </div>
        </div>
      </header>

      {/* 設定メニュー */}
      {showSettingsMenu && (
        <div className={styles.settingsMenu}>
          <div className={styles.settingsMenuContent}>
            <button 
              className={styles.settingsMenuItem}
              onClick={() => {
                setShowSettingsMenu(false)
                router.push('/admin/login')
              }}
            >
              管理者設定
            </button>
            <button 
              className={styles.settingsMenuItem}
              onClick={() => {
                setShowSettingsMenu(false)
                handleRemoveSampleEvents()
              }}
            >
              サンプルイベントを削除
            </button>
            <button 
              className={styles.settingsMenuItem}
              onClick={() => {
                setShowSettingsMenu(false)
                handleRemoveAllGroups()
              }}
            >
              機材グループを全削除
            </button>
          </div>
        </div>
      )}

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
              <p className={styles.equipmentNote}>※機材の追加・編集は管理者ページで行えます</p>
            </div>

            {/* タブ切り替え */}
            <div className={styles.equipmentTabs}>
              <button
                className={`${styles.equipmentTab} ${equipmentViewMode === 'all' ? styles.activeEquipmentTab : ''}`}
                onClick={() => setEquipmentViewMode('all')}
              >
                全機材
              </button>
              <button
                className={`${styles.equipmentTab} ${equipmentViewMode === 'grouped' ? styles.activeEquipmentTab : ''}`}
                onClick={() => setEquipmentViewMode('grouped')}
              >
                グループ別
              </button>
            </div>

            {/* 全機材表示 */}
            {equipmentViewMode === 'all' && (
              <div className={styles.allEquipmentList}>
                {equipment.length === 0 ? (
                  <div className={styles.emptyState}>
                    <p>機材がありません</p>
                    <p>管理者ページから機材を追加してください</p>
                  </div>
                ) : (
                  <div className={styles.equipmentTable}>
                    <div className={styles.tableHeader}>
                      <div className={styles.tableCell}>機材名</div>
                      <div className={styles.tableCell}>在庫</div>
                    </div>
                    {equipment.map((eq) => (
                      <div 
                        key={eq.id} 
                        className={styles.tableRow}
                        draggable
                        onDragStart={() => handleDragStart(eq)}
                        onDragEnd={handleDragEnd}
                      >
                        <div className={styles.tableCell}>
                          <span className={styles.equipmentNumber}>#{eq.id}</span>
                          <span className={styles.equipmentName}>{eq.name}</span>
                        </div>
                        <div className={styles.tableCell}>
                          <span className={styles.equipmentStock}>{eq.stock}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* グループ別表示 */}
            {equipmentViewMode === 'grouped' && (
              <div className={styles.groupedEquipmentList}>
                {/* グループ追加ボタン */}
                <div className={styles.groupAddSection}>
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

                <div className={styles.equipmentGroups}>
                  {filteredEquipmentGroups.length === 0 ? (
                    <div className={styles.emptyState}>
                      <p>機材グループがありません</p>
                      <p>「グループ追加」ボタンから新しいグループを作成してください</p>
                    </div>
                  ) : (
                    filteredEquipmentGroups.map((group) => (
                      <div key={group.id} className={styles.equipmentGroup}>
                        <div className={styles.groupHeader}>
                          <div 
                            className={styles.groupHeaderContent}
                            onClick={() => toggleGroup(group.id)}
                          >
                            <span className={styles.groupTitle}>{group.name}</span>
                            <span className={styles.groupSubtitle}>(+で開いて、-で閉じる) 在庫</span>
                            <span className={styles.toggleButton}>
                              {expandedGroups.has(group.id) ? '-' : '+'}
                            </span>
                          </div>
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
                            <div 
                              key={equipment.id} 
                              className={styles.tableRow}
                              draggable
                              onDragStart={() => handleDragStart(equipment)}
                              onDragEnd={handleDragEnd}
                            >
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
            )}
          </div>

          {/* 右側: 現場管理 */}
          <div className={styles.eventsSection}>
            <div className={styles.eventsHeader}>
              <h2 className={styles.sectionTitle}>現場管理</h2>
              <button 
                className={styles.createEventButton}
                onClick={handleCreateEvent}
                disabled={addEventLoading}
              >
                <Plus className={styles.icon} />
                {addEventLoading ? '作成中...' : '新しい現場を登録'}
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
              {events.map((event) => {
                const data = eventData[event.id] || {
                  title: event.siteName,
                  startDate: event.startDate,
                  endDate: event.endDate,
                  assigneeId: '',
                  location: '',
                  memo: '',
                  equipment: []
                }
                const assignee = assignees.find(a => a.id === data.assigneeId)
                const isSaved = savedEvents.has(event.id)
                
                return (
                  <div key={event.id} className={styles.eventCard}>
                    {/* 編集中タブの表示 */}
                    {editingEventId === event.id && (
                      <div className={styles.editingTab}>
                        <div className={styles.editingTabHeader}>
                          <span className={styles.editingTabTitle}>編集中</span>
                          <button 
                            className={styles.cancelButton}
                            onClick={() => {
                              setEditingEventId(null)
                              setExpandedEvents(prev => {
                                const newSet = new Set(prev)
                                newSet.delete(event.id)
                                return newSet
                              })
                            }}
                          >
                            ×
                          </button>
                        </div>
                      </div>
                    )}
                    
                    <div 
                      className={styles.eventHeader}
                      onClick={() => toggleEvent(event.id)}
                    >
                      <div className={styles.eventTitle}>
                        <h3>{data.title || event.siteName}</h3>
                        <div className={styles.eventMeta}>
                          <div className={styles.eventMetaItem}>
                            <Calendar className={styles.icon} />
                            {data.startDate === data.endDate 
                              ? data.startDate 
                              : `${data.startDate} - ${data.endDate}`
                            }
                          </div>
                          {assignee && (
                            <div className={styles.eventMetaItem}>
                              <Users className={styles.icon} />
                              {assignee.name}
                            </div>
                          )}
                          {/* 保存状態の表示 */}
                          {isSaved && (
                            <div className={styles.eventMetaItem}>
                              <span className={styles.savedStatus}>✅ 保存済み</span>
                            </div>
                          )}
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
                        {/* タイトル */}
                        <div className={styles.inputSection}>
                          <h4>現場名（タイトル）</h4>
                          <input 
                            type="text" 
                            placeholder="現場名を入力"
                            className={styles.titleInput}
                            value={data.title}
                            onChange={(e) => updateEventData(event.id, 'title', e.target.value)}
                          />
                        </div>

                        {/* 日付 */}
                        <div className={styles.inputSection}>
                          <h4>日付</h4>
                          <div className={styles.readOnlyValue}>
                            {data.startDate === data.endDate 
                              ? data.startDate 
                              : `${data.startDate} 〜 ${data.endDate}`}
                          </div>
                        </div>

                        {/* 担当者 */}
                        <div className={styles.inputSection}>
                          <h4>担当者</h4>
                          <div className={styles.readOnlyValue}>
                            {assignee ? assignee.name : '未設定'}
                          </div>
                        </div>

                        {/* 場所 */}
                        <div className={styles.inputSection}>
                          <h4>場所（Googleマップ紐付け）</h4>
                          <div className={styles.readOnlyValue}>{data.location || '未設定'}</div>
                        </div>

                        {/* メモ */}
                        <div className={styles.inputSection}>
                          <h4>メモ</h4>
                          <div className={styles.readOnlyValue}>{data.memo || '未設定'}</div>
                        </div>

                        {/* 機材選択 */}
                        <div className={styles.inputSection}>
                          <h4>機材選択</h4>
                          {isSaved ? (
                            <div className={styles.savedEquipmentSection}>
                              <div className={styles.equipmentList}>
                                {(data.equipment || []).length === 0 ? (
                                  <div className={styles.emptyEquipmentMessage}>
                                    機材が登録されていません
                                  </div>
                                ) : (
                                  (data.equipment || []).map((eq) => (
                                    <div key={eq.equipmentId} className={styles.equipmentCard}>
                                      <div className={styles.equipmentCardHeader}>
                                        <span className={styles.equipmentCardName}>
                                          #{eq.equipmentId} {eq.name}
                                        </span>
                                        <span className={styles.equipmentQuantity}>
                                          {eq.quantity}台
                                        </span>
                                      </div>
                                    </div>
                                  ))
                                )}
                              </div>
                              <button 
                                className={styles.editEquipmentButton}
                                onClick={() => handleOpenEquipmentEdit(event.id)}
                              >
                                ✏️ 機材編集
                              </button>
                            </div>
                          ) : (
                            <>
                              <div 
                                className={styles.equipmentInputContainer}
                                onDragOver={(e) => e.preventDefault()}
                                onDrop={(e) => handleDrop(event.id, e)}
                              >
                                <input 
                                  type="text" 
                                  placeholder="例: #1*2 または #1*2,#2*5 （左の機材をドラッグ&ドロップも可）"
                                  className={styles.equipmentInputField}
                                  value={equipmentInputValue[event.id] || ''}
                                  onChange={(e) => handleEquipmentInput(event.id, e.target.value)}
                                  onKeyPress={(e) => {
                                    if (e.key === 'Enter') {
                                      handleAddEquipmentByNumber(event.id)
                                    }
                                  }}
                                />
                                <button 
                                  className={styles.addEquipmentButton}
                                  onClick={() => handleAddEquipmentByNumber(event.id)}
                                  disabled={!equipmentInputValue[event.id]?.trim()}
                                >
                                  追加
                                </button>
                              </div>
                              <div className={styles.equipmentList}>
                                {(data.equipment || []).length === 0 ? (
                                  <div className={styles.emptyEquipmentMessage}>
                                    機材Noを入力して機材を追加してください
                                  </div>
                                ) : (
                                  (data.equipment || []).map((eq) => (
                                    <div key={eq.equipmentId} className={styles.equipmentCard}>
                                      <div className={styles.equipmentCardHeader}>
                                        <span className={styles.equipmentCardName}>
                                          #{eq.equipmentId} {eq.name}
                                        </span>
                                        <button 
                                          className={styles.equipmentCardRemove}
                                          onClick={() => removeEquipment(event.id, eq.equipmentId)}
                                        >
                                          ×
                                        </button>
                                      </div>
                                      <div className={styles.equipmentCardBody}>
                                        <div className={styles.quantityControl}>
                                          <label className={styles.quantityLabel}>数量:</label>
                                          <button
                                            className={styles.quantityButton}
                                            onClick={() => updateEquipmentQuantity(event.id, eq.equipmentId, eq.quantity - 1)}
                                            disabled={eq.quantity <= 1}
                                          >
                                            -
                                          </button>
                                          <input
                                            type="number"
                                            className={styles.quantityInput}
                                            value={eq.quantity}
                                            onChange={(e) => updateEquipmentQuantity(event.id, eq.equipmentId, parseInt(e.target.value) || 1)}
                                            min="1"
                                            max={eq.maxStock}
                                          />
                                          <button
                                            className={styles.quantityButton}
                                            onClick={() => updateEquipmentQuantity(event.id, eq.equipmentId, eq.quantity + 1)}
                                            disabled={eq.quantity >= eq.maxStock}
                                          >
                                            +
                                          </button>
                                        </div>
                                        <div className={styles.stockInfo}>
                                          <span className={eq.quantity > eq.maxStock ? styles.stockWarning : styles.stockNormal}>
                                            在庫: {eq.maxStock}台
                                          </span>
                                        </div>
                                      </div>
                                    </div>
                                  ))
                                )}
                              </div>
                            </>
                          )}
                        </div>

                        {/* 保存・削除ボタン */}
                        <div className={styles.eventActions}>
                          {isSaved ? (
                            <button 
                              className={styles.deleteEventButton}
                              onClick={() => handleDeleteEvent(event.id)}
                            >
                              削除
                            </button>
                          ) : (
                            <>
                              <button 
                                className={styles.saveEventButton}
                                onClick={() => handleSaveEvent(event.id)}
                              >
                                保存
                              </button>
                              <button 
                                className={styles.deleteEventButton}
                                onClick={() => handleDeleteEvent(event.id)}
                              >
                                削除
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        </div>
        )}
      </div>

      {/* 機材編集モーダル */}
      {showEquipmentEditModal && editingEquipmentEventId && (
        <div className={styles.modalOverlay} onClick={handleCloseEquipmentEdit}>
          <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h2 className={styles.modalTitle}>機材編集</h2>
              <button className={styles.closeButton} onClick={handleCloseEquipmentEdit}>
                ×
              </button>
            </div>
            
            <div className={styles.modalBody}>
              <div className={styles.equipmentEditSection}>
                <h3>現在の機材</h3>
                <div className={styles.equipmentList}>
                  {(eventData[editingEquipmentEventId]?.equipment || []).map((eq) => (
                    <div key={eq.equipmentId} className={styles.equipmentCard}>
                      <div className={styles.equipmentCardHeader}>
                        <span className={styles.equipmentCardName}>
                          #{eq.equipmentId} {eq.name}
                        </span>
                        <button 
                          className={styles.equipmentCardRemove}
                          onClick={() => removeEquipment(editingEquipmentEventId, eq.equipmentId)}
                        >
                          ×
                        </button>
                      </div>
                      <div className={styles.equipmentCardBody}>
                        <div className={styles.quantityControl}>
                          <label className={styles.quantityLabel}>数量:</label>
                          <button
                            className={styles.quantityButton}
                            onClick={() => updateEquipmentQuantity(editingEquipmentEventId, eq.equipmentId, eq.quantity - 1)}
                            disabled={eq.quantity <= 1}
                          >
                            -
                          </button>
                          <input
                            type="number"
                            className={styles.quantityInput}
                            value={eq.quantity}
                            onChange={(e) => updateEquipmentQuantity(editingEquipmentEventId, eq.equipmentId, parseInt(e.target.value) || 1)}
                            min="1"
                            max={eq.maxStock}
                          />
                          <button
                            className={styles.quantityButton}
                            onClick={() => updateEquipmentQuantity(editingEquipmentEventId, eq.equipmentId, eq.quantity + 1)}
                            disabled={eq.quantity >= eq.maxStock}
                          >
                            +
                          </button>
                        </div>
                        <div className={styles.stockInfo}>
                          <span className={eq.quantity > eq.maxStock ? styles.stockWarning : styles.stockNormal}>
                            在庫: {eq.maxStock}台
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                
                <div className={styles.equipmentInputContainer}>
                  <input 
                    type="text" 
                    placeholder="例: #1*2 または #1*2,#2*5"
                    className={styles.equipmentInputField}
                    value={equipmentInputValue[editingEquipmentEventId] || ''}
                    onChange={(e) => handleEquipmentInput(editingEquipmentEventId, e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        handleAddEquipmentByNumber(editingEquipmentEventId)
                      }
                    }}
                  />
                  <button 
                    className={styles.addEquipmentButton}
                    onClick={() => handleAddEquipmentByNumber(editingEquipmentEventId)}
                    disabled={!equipmentInputValue[editingEquipmentEventId]?.trim()}
                  >
                    追加
                  </button>
                </div>
              </div>
              
              <div className={styles.modalActions}>
                <button 
                  className={styles.cancelButton}
                  onClick={handleCloseEquipmentEdit}
                >
                  キャンセル
                </button>
                <button 
                  className={styles.saveButton}
                  onClick={() => handleSaveEquipmentEdit(editingEquipmentEventId, eventData[editingEquipmentEventId]?.equipment || [])}
                >
                  保存
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </main>
  )
}
