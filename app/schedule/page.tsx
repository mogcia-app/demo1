'use client'

import { useState, useEffect } from 'react'
import { onAuthStateChange } from '@/lib/auth'
import { useEvents, useEquipment, useAssignees } from '@/lib/hooks/useFirestore'
import { Equipment } from '@/lib/types'
import styles from './page.module.css'
import { Calendar, ChevronLeft, ChevronRight, AlertTriangle, Info, ArrowLeft, Printer } from 'lucide-react'
import { useRouter } from 'next/navigation'

interface EventSchedule {
  eventId: string
  eventName: string
  startDate: string
  endDate: string
  location: string
  assigneeId: string
  assigneeName: string
  equipment: {
    equipmentId: string
    name: string
    quantity: number
  }[]
  isMultiDay: boolean
  duration: number
}

interface EquipmentSchedule {
  equipmentId: string
  equipmentName: string
  stock: number
  usage: {
    [date: string]: {
      eventId: string
      eventName: string
      quantity: number
      isConflict: boolean
    }[]
  }
}

export default function SchedulePage() {
  const router = useRouter()
  const { events } = useEvents()
  const { equipment, loading: equipmentLoading } = useEquipment()
  const { assignees } = useAssignees()

  const [user, setUser] = useState<any>(null)
  const [authChecking, setAuthChecking] = useState(true)
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [eventSchedules, setEventSchedules] = useState<EventSchedule[]>([])
  const [loading, setLoading] = useState(true)
  const [currentTime, setCurrentTime] = useState(new Date())
  const [selectedEvent, setSelectedEvent] = useState<EventSchedule | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [isDayModalOpen, setIsDayModalOpen] = useState(false)
  const [viewMode, setViewMode] = useState<'month' | 'week' | 'list'>('month')

  // 認証状態を監視
  useEffect(() => {
    console.log('認証状態監視開始')
    const unsubscribe = onAuthStateChange((user) => {
      console.log('認証状態変更:', user ? 'ログイン済み' : '未ログイン')
      setUser(user)
      setAuthChecking(false)
    })
    return unsubscribe
  }, [])

  // リアルタイムで現在時刻を更新（1分ごと）
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date())
    }, 60000) // 1分ごとに更新

    return () => clearInterval(timer)
  }, [])

  // 現場スケジュールデータを処理
  useEffect(() => {
    console.log('現場スケジュールデータ処理開始:', { events })
    
    if (!events) {
      console.log('現場データが不足')
      return
    }

    console.log('現場データ取得完了:', events.length)

    const schedules: EventSchedule[] = events.map(event => {
      const startDate = new Date(event.startDate)
      const endDate = event.endDate ? new Date(event.endDate) : startDate
      
      // 日跨ぎ判定：開始日と終了日が異なる場合
      const isMultiDay = event.startDate !== (event.endDate || event.startDate)
      
      // 日数計算：日跨ぎの場合は実際の日数、単日の場合は1
      const duration = isMultiDay 
        ? Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1
        : 1

      // 担当者名を取得
      const assignee = assignees?.find(a => a.id === event.assigneeId)
      const assigneeName = assignee?.name || '未設定'

      return {
        eventId: event.id,
        eventName: event.siteName,
        startDate: event.startDate,
        endDate: event.endDate || event.startDate,
        location: event.location || '',
        assigneeId: event.assigneeId || '',
        assigneeName,
        equipment: (event.equipment || []).map(eq => ({
          equipmentId: eq.equipmentId,
          name: eq.equipmentName,
          quantity: eq.quantity
        })),
        isMultiDay,
        duration
      }
    })

    console.log('現場スケジュールデータ完成:', schedules)
    console.log('日跨ぎイベント:', schedules.filter(s => s.isMultiDay))
    console.log('単日イベント:', schedules.filter(s => !s.isMultiDay))
    
    // デバッグ：各イベントの詳細
    schedules.forEach(s => {
      console.log(`イベント: ${s.eventName}`, {
        startDate: s.startDate,
        endDate: s.endDate,
        isMultiDay: s.isMultiDay,
        duration: s.duration,
        // デバッグ用：日付オブジェクトの詳細
        startDateObj: new Date(s.startDate).toLocaleDateString('en-CA'),
        endDateObj: new Date(s.endDate).toLocaleDateString('en-CA'),
        startDateLocal: new Date(s.startDate).toLocaleDateString('ja-JP'),
        endDateLocal: new Date(s.endDate).toLocaleDateString('ja-JP')
      })
    })
    setEventSchedules(schedules)
    setLoading(false)
  }, [events, assignees])

  // 月の日付配列を生成
  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear()
    const month = date.getMonth()
    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)
    const daysInMonth = lastDay.getDate()
    const startDate = new Date(firstDay)
    // 月曜日開始に調整（日曜日=0なので、月曜日=1になるように調整）
    const dayOfWeek = firstDay.getDay() // 0=日曜, 1=月曜, ..., 6=土曜
    const daysToSubtract = dayOfWeek === 0 ? 6 : dayOfWeek - 1 // 月曜日開始
    startDate.setDate(startDate.getDate() - daysToSubtract)
    
    const days = []
    for (let i = 0; i < 42; i++) { // 6週間分
      const day = new Date(startDate)
      day.setDate(startDate.getDate() + i)
      days.push(day)
    }
    return days
  }

  // 認証チェック
  if (authChecking) {
    return (
      <div className={styles.main}>
        <div className={styles.loading}>
          <p className={styles.subtitle}>認証確認中...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className={styles.main}>
        <div className={styles.error}>
          <p className={styles.subtitle}>ログインが必要です</p>
        </div>
      </div>
    )
  }

  const days = getDaysInMonth(currentMonth)
  const monthNames = [
    '1月', '2月', '3月', '4月', '5月', '6月',
    '7月', '8月', '9月', '10月', '11月', '12月'
  ]

  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentMonth(prev => {
      const newDate = new Date(prev)
      newDate.setMonth(newDate.getMonth() + (direction === 'next' ? 1 : -1))
      return newDate
    })
  }

  const handleEventClick = (event: EventSchedule) => {
    setSelectedEvent(event)
    setIsModalOpen(true)
  }

  const closeModal = () => {
    setIsModalOpen(false)
    setSelectedEvent(null)
  }

  // 特定の日のイベントを取得
  const getEventsForDate = (date: Date): EventSchedule[] => {
    const dateStr = date.toLocaleDateString('en-CA') // YYYY-MM-DD形式
    return eventSchedules.filter(event => {
      const eventStartDate = event.startDate
      const eventEndDate = event.endDate
      return dateStr >= eventStartDate && dateStr <= eventEndDate
    })
  }

  // 日付セルクリック時のハンドラー
  const handleDayClick = (date: Date) => {
    const eventsOnDay = getEventsForDate(date)
    if (eventsOnDay.length > 0) {
      setSelectedDate(date)
      setIsDayModalOpen(true)
    }
  }

  const closeDayModal = () => {
    setIsDayModalOpen(false)
    setSelectedDate(null)
  }

  // 印刷機能
  const handlePrint = () => {
    window.print()
  }

  const formatDate = (date: Date) => {
    return date.getDate().toString()
  }

  const isCurrentMonth = (date: Date) => {
    return date.getMonth() === currentMonth.getMonth()
  }

  const isToday = (date: Date) => {
    return date.toDateString() === currentTime.toDateString()
  }

  const isPastDate = (date: Date) => {
    const today = new Date(currentTime)
    today.setHours(0, 0, 0, 0)
    const targetDate = new Date(date)
    targetDate.setHours(0, 0, 0, 0)
    return targetDate < today
  }

  const isFutureDate = (date: Date) => {
    const today = new Date(currentTime)
    today.setHours(0, 0, 0, 0)
    const targetDate = new Date(date)
    targetDate.setHours(0, 0, 0, 0)
    return targetDate > today
  }

  // 日跨ぎイベントのgrid-columnを計算する関数
  const getEventGridColumn = (event: EventSchedule, currentDate: Date): string => {
    if (!event.isMultiDay) return ''
    
    const currentDateStr = currentDate.toISOString().split('T')[0]
    
    // イベントが開始日の場合のみ表示
    if (currentDateStr === event.startDate) {
      const duration = event.duration
      return `span ${duration}`
    }
    
    // イベントが中間日または終了日の場合は非表示
    return ''
  }

  if (loading) {
    return (
      <div className={styles.main}>
        <div className={styles.loading}>
          <p className={styles.subtitle}>スケジュールを読み込み中...</p>
          <p className={styles.subtitle}>現場数: {events?.length || 0}件</p>
        </div>
      </div>
    )
  }

  return (
    <div className={styles.main}>
      <div className={styles.header}>
        <div className={styles.headerContent}>
          <div className={styles.headerLeft}>
            <button 
              className={styles.backButton}
              onClick={() => router.push('/')}
              title="メインページに戻る"
            >
              <ArrowLeft className={styles.backIcon} />
            </button>
            <Calendar className={styles.headerIcon} />
            <h1 className={styles.title}>機材スケジュール</h1>
          </div>
          <div className={styles.headerActions}>
            <button 
              className={styles.printHeaderButton}
              onClick={handlePrint}
              title="印刷・PDF保存"
            >
              <Printer className={styles.navIcon} />
              <span className={styles.printButtonText}>印刷/PDF</span>
            </button>
            <button 
              className={styles.navButton}
              onClick={() => navigateMonth('prev')}
            >
              <ChevronLeft className={styles.navIcon} />
            </button>
            <span className={styles.monthDisplay}>
              {currentMonth.getFullYear()}年{monthNames[currentMonth.getMonth()]}
            </span>
            <div className={styles.currentTime}>
              {currentTime.toLocaleDateString('ja-JP', { 
                month: 'short', 
                day: 'numeric',
                weekday: 'short'
              })} {currentTime.toLocaleTimeString('ja-JP', { 
                hour: '2-digit', 
                minute: '2-digit' 
              })}
            </div>
            <button 
              className={styles.navButton}
              onClick={() => navigateMonth('next')}
            >
              <ChevronRight className={styles.navIcon} />
            </button>
          </div>
        </div>
      </div>

      <div className={styles.content}>
        <div className={styles.scheduleContainer}>
          <div className={styles.summary}>
            <div className={styles.summaryItem}>
              <span className={styles.summaryLabel}>総現場数</span>
              <span className={styles.summaryValue}>{eventSchedules.length}件</span>
            </div>
            <div className={styles.summaryItem}>
              <span className={styles.summaryLabel}>日跨ぎ現場</span>
              <span className={styles.summaryValue}>{eventSchedules.filter(e => e.isMultiDay).length}件</span>
            </div>
            <div className={styles.summaryItem}>
              <span className={styles.summaryLabel}>今月の現場</span>
              <span className={styles.summaryValue}>
                {eventSchedules.filter(e => {
                  const eventDate = new Date(e.startDate)
                  return eventDate.getMonth() === currentMonth.getMonth() && 
                         eventDate.getFullYear() === currentMonth.getFullYear()
                }).length}件
              </span>
            </div>
          </div>

          <div className={styles.calendarContainer}>
            <div className={styles.calendarHeader}>
              <div className={styles.calendarTitle}>現場スケジュール</div>
              <div className={styles.calendarDays}>
                {['月', '火', '水', '木', '金', '土', '日'].map((day, index) => (
                  <div key={index} className={styles.dayHeader}>
                    {day}
                  </div>
                ))}
              </div>
            </div>

            <div className={styles.calendarGrid}>
              {Array.from({ length: Math.ceil(days.length / 7) }).map((_, weekIndex) => {
                const weekStart = weekIndex * 7
                const weekDays = days.slice(weekStart, weekStart + 7)
                
                return (
                  <div key={weekIndex} className={styles.calendarWeek}>
                    {/* 日付セル */}
                    {weekDays.map((day, dayIndex) => {
                      if (!day) return <div key={dayIndex} className={styles.emptyDay}></div>
                      
                      const dateStr = day.toLocaleDateString('en-CA') // YYYY-MM-DD
                      const eventsOnDay = getEventsForDate(day)
                      const MAX_VISIBLE_EVENTS = 2 // 最大表示件数
                      const visibleEvents = eventsOnDay.slice(0, MAX_VISIBLE_EVENTS)
                      const remainingCount = eventsOnDay.length - MAX_VISIBLE_EVENTS
                      
                      return (
                        <div 
                          key={dayIndex}
                          className={`${styles.dayCell} ${
                            !isCurrentMonth(day) ? styles.otherMonth : ''
                          } ${isToday(day) ? styles.today : ''} ${
                            isPastDate(day) ? styles.pastDate : ''
                          } ${isFutureDate(day) ? styles.futureDate : ''} ${
                            eventsOnDay.length > 0 ? styles.hasEvents : ''
                          }`}
                          onClick={() => handleDayClick(day)}
                        >
                          <div className={styles.dateNumber}>
                            {formatDate(day)}
                          </div>
                          
                          {/* イベント表示（最大2件） */}
                          <div className={styles.dayEvents}>
                            {visibleEvents.map((event, idx) => {
                              const isStart = event.startDate === dateStr
                              const isEnd = event.endDate === dateStr
                              const isContinued = !isStart && !isEnd
                              
                              return (
                                <div
                                  key={event.eventId}
                                  className={`${styles.dayEventItem} ${
                                    event.isMultiDay ? styles.multiDay : styles.singleDay
                                  } ${isStart ? styles.eventStart : ''} ${
                                    isEnd ? styles.eventEnd : ''
                                  } ${isContinued ? styles.eventContinued : ''}`}
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    handleEventClick(event)
                                  }}
                                  title={`${event.eventName} (${event.startDate} ~ ${event.endDate})`}
                                >
                                  {isStart && (
                                    <span className={styles.eventText}>
                                      {event.eventName}
                                      {event.isMultiDay && ` (${event.duration}日)`}
                                    </span>
                                  )}
                                  {!isStart && event.isMultiDay && (
                                    <span className={styles.eventText}>...</span>
                                  )}
                                </div>
                              )
                            })}
                            
                            {/* +N件表示 */}
                            {remainingCount > 0 && (
                              <div 
                                className={styles.moreEvents}
                                onClick={(e) => {
                                  e.stopPropagation()
                                  handleDayClick(day)
                                }}
                              >
                                +{remainingCount}件
                              </div>
                            )}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </div>

      {/* 日付別イベント一覧モーダル */}
      {isDayModalOpen && selectedDate && (
        <div className={styles.modalOverlay} onClick={closeDayModal}>
          <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h2 className={styles.modalTitle}>
                {selectedDate.toLocaleDateString('ja-JP', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                  weekday: 'long'
                })} の予定
              </h2>
              <button className={styles.closeButton} onClick={closeDayModal}>
                ×
              </button>
            </div>
            
            <div className={styles.modalBody}>
              <div className={styles.dayEventsList}>
                {getEventsForDate(selectedDate).map((event) => (
                  <div 
                    key={event.eventId} 
                    className={styles.dayEventCard}
                    onClick={() => {
                      closeDayModal()
                      handleEventClick(event)
                    }}
                  >
                    <div className={styles.eventCardHeader}>
                      <h3 className={styles.eventCardTitle}>{event.eventName}</h3>
                      <span className={`${styles.eventBadge} ${
                        event.isMultiDay ? styles.multiDayBadge : styles.singleDayBadge
                      }`}>
                        {event.isMultiDay ? `${event.duration}日間` : '単日'}
                      </span>
                    </div>
                    
                    <div className={styles.eventCardDetails}>
                      <div className={styles.eventCardRow}>
                        <span className={styles.eventCardLabel}>期間:</span>
                        <span className={styles.eventCardValue}>
                          {event.startDate === event.endDate 
                            ? event.startDate
                            : `${event.startDate} ~ ${event.endDate}`
                          }
                        </span>
                      </div>
                      
                      {event.location && (
                        <div className={styles.eventCardRow}>
                          <span className={styles.eventCardLabel}>場所:</span>
                          <span className={styles.eventCardValue}>{event.location}</span>
                        </div>
                      )}
                      
                      <div className={styles.eventCardRow}>
                        <span className={styles.eventCardLabel}>担当:</span>
                        <span className={styles.eventCardValue}>{event.assigneeName}</span>
                      </div>
                      
                      <div className={styles.eventCardRow}>
                        <span className={styles.eventCardLabel}>機材:</span>
                        <span className={styles.eventCardValue}>
                          {event.equipment.length}種類
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* イベント詳細モーダル */}
      {isModalOpen && selectedEvent && (
        <div className={styles.modalOverlay} onClick={closeModal}>
          <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h2 className={styles.modalTitle}>{selectedEvent.eventName}</h2>
              <button className={styles.closeButton} onClick={closeModal}>
                ×
              </button>
            </div>
            
            <div className={styles.modalBody}>
              <div className={styles.eventInfo}>
                <div className={styles.infoRow}>
                  <span className={styles.infoLabel}>開始日:</span>
                  <span className={styles.infoValue}>
                    {new Date(selectedEvent.startDate).toLocaleDateString('ja-JP', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                      weekday: 'long'
                    })}
                  </span>
                </div>
                
                <div className={styles.infoRow}>
                  <span className={styles.infoLabel}>終了日:</span>
                  <span className={styles.infoValue}>
                    {new Date(selectedEvent.endDate).toLocaleDateString('ja-JP', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                      weekday: 'long'
                    })}
                  </span>
                </div>
                
                <div className={styles.infoRow}>
                  <span className={styles.infoLabel}>期間:</span>
                  <span className={styles.infoValue}>
                    {selectedEvent.duration}日間
                  </span>
                </div>
                
                <div className={styles.infoRow}>
                  <span className={styles.infoLabel}>場所:</span>
                  <span className={styles.infoValue}>
                    {selectedEvent.location || '未設定'}
                  </span>
                </div>
                
                <div className={styles.infoRow}>
                  <span className={styles.infoLabel}>担当者:</span>
                  <span className={styles.infoValue}>
                    {selectedEvent.assigneeName}
                  </span>
                </div>
              </div>
              
              <div className={styles.equipmentSection}>
                <h3 className={styles.sectionTitle}>使用機材</h3>
                {selectedEvent.equipment.length > 0 ? (
                  <div className={styles.equipmentList}>
                    {selectedEvent.equipment.map((eq, index) => (
                      <div key={index} className={styles.equipmentItem}>
                        <span className={styles.equipmentName}>{eq.name}</span>
                        <span className={styles.equipmentQuantity}>{eq.quantity}台</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className={styles.noEquipment}>使用機材なし</p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
