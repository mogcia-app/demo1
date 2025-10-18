'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Calendar, Settings, LogOut, Grid3X3 } from 'lucide-react'
import EquipmentSchedule from '../components/EquipmentSchedule'
import EquipmentManagement from '../components/EquipmentManagement'
import EventManagement from '../components/EventManagement'
import EventEditModal from '../components/EventEditModal'
import EventPreviewModal from '../components/EventPreviewModal'
import styles from './page.module.css'
import { signOutUser, onAuthStateChange, isCompanyUser } from '../lib/auth'
import { useEvents, useEquipment, useEquipmentCategories, useAssignees } from '../lib/hooks/useFirestore'
import { Event } from '../lib/types'
import { initializeAllData } from '../lib/initData'
import { useFirestoreOperations } from '../lib/hooks/useCloudFunction'
import { createCalendarEvent, updateCalendarEvent, deleteCalendarEvent, getCalendarInfo } from '../lib/google/calendar-client'
import { decreaseInventory, increaseInventory, adjustInventory } from '../lib/inventory'

export default function Home() {
  const router = useRouter()
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [user, setUser] = useState<any>(null)
  const [authChecking, setAuthChecking] = useState(true)
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set())
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

  // デバッグ用: 設定メニューの状態を監視
  useEffect(() => {
    console.log('設定メニューの状態:', showSettingsMenu)
  }, [showSettingsMenu])
  const [editingEventId, setEditingEventId] = useState<string | null>(null)
  const [previewingEventId, setPreviewingEventId] = useState<string | null>(null)
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
  const { addDocument: addCategory, loading: addCategoryLoading, deleteDocument: deleteCategory } = useFirestoreOperations('equipmentCategories')

  // イベントが読み込まれた時に初期データを設定
  useEffect(() => {
    if (events.length > 0) {
      // 重複を除去（同じIDのイベントが複数ある場合）
      const uniqueEvents = events.reduce((acc, event) => {
        if (!acc.find(e => e.id === event.id)) {
          acc.push(event)
        }
        return acc
      }, [] as typeof events)

      setEventData(prev => {
        const newEventData = { ...prev }
        uniqueEvents.forEach(event => {
          // 既存のeventDataがない場合のみ初期化
          if (!newEventData[event.id]) {
            newEventData[event.id] = {
              title: event.siteName || '',
              startDate: event.startDate || '',
              endDate: event.endDate || '',
              assigneeId: event.assigneeId || '', // 修正: assigneeIdを正しく設定
              location: event.location || '',
              memo: event.description || '',
              equipment: event.equipment?.map(eq => ({
                equipmentId: eq.equipmentId,
                name: eq.equipmentName || '',
                quantity: eq.quantity,
                maxStock: equipment.find(e => e.id === eq.equipmentId)?.stock || 0 // 修正: 機材データから在庫数を取得
              })) || []
            }
          }
        })
        return newEventData
      })

      // 保存済みイベントのSetを更新
      setSavedEvents(prev => {
        const newSavedEvents = new Set(prev)
        uniqueEvents.forEach(event => {
          newSavedEvents.add(event.id)
        })
        return newSavedEvents
      })

      // 保存済み機材情報も更新
      setSavedEventEquipment(prev => {
        const newSavedEquipment = { ...prev }
        uniqueEvents.forEach(event => {
          if (event.equipment && event.equipment.length > 0) {
            newSavedEquipment[event.id] = event.equipment.map(eq => ({
              equipmentId: eq.equipmentId,
              quantity: eq.quantity
            }))
          }
        })
        return newSavedEquipment
      })
    }
  }, [events])

  // 機材データが読み込まれた時にmaxStockを更新
  useEffect(() => {
    if (equipment.length > 0) {
      setEventData(prev => {
        const newEventData = { ...prev }
        Object.keys(newEventData).forEach(eventId => {
          if (newEventData[eventId].equipment) {
            newEventData[eventId].equipment = newEventData[eventId].equipment.map(eq => ({
              ...eq,
              maxStock: equipment.find(e => e.id === eq.equipmentId)?.stock || eq.maxStock
            }))
          }
        })
        return newEventData
      })
    }
  }, [equipment])

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

  // 機材グループを個別削除
  const handleDeleteGroup = async (groupId: string) => {
    if (!user) return
    
    try {
      // Firestoreからグループを削除
      await deleteCategory(groupId)
      alert('グループを削除しました！')
      } catch (error) {
      console.error('グループ削除エラー:', error)
      alert('グループの削除に失敗しました。')
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

      console.log('機材編集 - 在庫調整開始...')
      console.log('前回の機材:', previousEquipment)
      console.log('新しい機材:', newEquipmentItems)

      // 在庫調整処理
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
      // 新規作成か既存編集かを判定
      const isNewEvent = eventId.startsWith('temp-')
      let actualEventId = eventId

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

      if (isNewEvent) {
        // 新しい現場を作成
        actualEventId = await createEvent(eventToSave)
        
        // 一時的なeventDataを実際のIDに移行
        if (actualEventId) {
          setEventData(prev => {
            const newData = { ...prev }
            delete newData[eventId] // 一時IDを削除
            newData[actualEventId] = data // 実際のIDで保存
            return newData
          })
          
          // 保存した機材情報も移行
          setSavedEventEquipment(prev => ({
            ...prev,
            [actualEventId]: newEquipmentItems
          }))
        }
      } else {
        // 既存の現場を更新
        await updateEvent(eventId, eventToSave)
        
        // 保存した機材情報を更新
        setSavedEventEquipment(prev => ({
          ...prev,
          [eventId]: newEquipmentItems
        }))
      }

      // このイベントを保存済みとしてマーク
      setSavedEvents(prev => new Set(prev).add(actualEventId))

      // 編集中状態を解除
      setEditingEventId(null)

      // eventDataを更新（機材名などの表示を確実にするため）
      setEventData(prev => ({
        ...prev,
        [actualEventId]: {
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
      if (calendarEventIds[actualEventId]) {
        // 既存のイベントを更新
        result = await updateCalendarEvent(calendarEventIds[actualEventId], calendarData)
      } else {
        // 新しいイベントを作成
        result = await createCalendarEvent(calendarData)
        if (result.success && result.eventId) {
          setCalendarEventIds(prev => ({
            ...prev,
            [actualEventId]: result.eventId!
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
    // 新しい現場のIDを生成（一時的なもの）
    const tempEventId = `temp-${Date.now()}`
    
    // 新しい現場の初期データを設定
    setEventData(prev => ({
      ...prev,
      [tempEventId]: {
        title: '新しい現場',
        startDate: new Date().toISOString().split('T')[0],
        endDate: new Date().toISOString().split('T')[0],
        assigneeId: '',
        location: '',
        memo: '',
        equipment: []
      }
    }))
    
    // 編集中状態に設定（モーダルを開く）
    setEditingEventId(tempEventId)
    
    console.log('新しい現場を作成しました:', tempEventId)
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
              onClick={() => {
                console.log('設定ボタンがクリックされました')
                setShowSettingsMenu(!showSettingsMenu)
              }}
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
            <EquipmentManagement
              equipment={equipment}
              categories={categories}
              searchTerm={searchTerm}
              onSearchChange={setSearchTerm}
              equipmentViewMode={equipmentViewMode}
              onViewModeChange={setEquipmentViewMode}
              expandedGroups={expandedGroups}
              onToggleGroup={toggleGroup}
              onDragStart={handleDragStart}
                        onDragEnd={handleDragEnd}
              showAddGroup={showAddGroup}
              onShowAddGroup={setShowAddGroup}
              newGroupName={newGroupName}
              onNewGroupNameChange={setNewGroupName}
              onAddGroup={handleAddGroup}
              onCancelAddGroup={cancelAddGroup}
              addCategoryLoading={addCategoryLoading}
              onDeleteGroup={handleDeleteGroup}
            />

            {/* 右側: 現場管理 */}
            <EventManagement
              events={events}
              assignees={assignees}
              eventData={eventData}
              savedEvents={savedEvents}
              editingEventId={editingEventId}
              onEditEvent={(eventId) => {
                setEditingEventId(eventId)
              }}
              onPreviewEvent={(eventId) => {
                setPreviewingEventId(eventId)
              }}
              onDeleteEvent={handleDeleteEvent}
              onCreateEvent={handleCreateEvent}
              onInitializeData={handleInitializeData}
              loading={loading}
            />
              </div>
            )}
          </div>

      {/* 現場プレビューモーダル */}
      <EventPreviewModal
        isOpen={!!previewingEventId}
        event={previewingEventId ? events.find(e => e.id === previewingEventId) || null : null}
        eventData={previewingEventId ? eventData[previewingEventId] || {
          title: '',
          startDate: '',
          endDate: '',
                  assigneeId: '',
                  location: '',
                  memo: '',
                  equipment: []
        } : {
          title: '',
          startDate: '',
          endDate: '',
          assigneeId: '',
          location: '',
          memo: '',
          equipment: []
        }}
        assignees={assignees}
        onClose={() => setPreviewingEventId(null)}
        onEdit={() => setEditingEventId(previewingEventId)}
      />

      {/* 現場編集モーダル */}
      <EventEditModal
        isOpen={!!editingEventId}
        eventId={editingEventId}
        event={editingEventId ? events.find(e => e.id === editingEventId) || null : null}
        eventData={editingEventId ? eventData[editingEventId] || {
          title: '',
          startDate: '',
          endDate: '',
          assigneeId: '',
          location: '',
          memo: '',
          equipment: []
        } : {
          title: '',
          startDate: '',
          endDate: '',
          assigneeId: '',
          location: '',
          memo: '',
          equipment: []
        }}
        assignees={assignees}
        equipmentInputValue={editingEventId ? equipmentInputValue[editingEventId] || '' : ''}
        onClose={() => {
          setEditingEventId(null)
        }}
        onUpdateEventData={updateEventData}
        onEquipmentInput={handleEquipmentInput}
        onAddEquipmentByNumber={handleAddEquipmentByNumber}
        onRemoveEquipment={removeEquipment}
        onUpdateEquipmentQuantity={updateEquipmentQuantity}
        onSaveEvent={handleSaveEvent}
      />

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
                          {eq.quantity > eq.maxStock && (
                            <span className={styles.stockError}>
                              ⚠️ 在庫不足
                            </span>
                          )}
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
                  onClick={() => {
                    // 在庫チェック
                    const hasStockIssue = (eventData[editingEquipmentEventId]?.equipment || []).some(eq => eq.quantity > eq.maxStock)
                    if (hasStockIssue) {
                      alert('⚠️ 在庫不足の機材があります。\n\n数量を調整してから保存してください。')
                      return
                    }
                    handleSaveEquipmentEdit(editingEquipmentEventId, eventData[editingEquipmentEventId]?.equipment || [])
                  }}
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
