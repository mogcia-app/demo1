'use client'

import { useState, useEffect } from 'react'
import { onAuthStateChange } from '@/lib/auth'
import { useEvents, useEquipment } from '@/lib/hooks/useFirestore'
import { Equipment } from '@/lib/types'
import styles from './page.module.css'
import { Calendar, ChevronLeft, ChevronRight, AlertTriangle, Info, ArrowLeft } from 'lucide-react'
import { useRouter } from 'next/navigation'

interface EventSchedule {
  eventId: string
  eventName: string
  startDate: string
  endDate: string
  location: string
  assigneeId: string
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

  const [user, setUser] = useState<any>(null)
  const [authChecking, setAuthChecking] = useState(true)
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [eventSchedules, setEventSchedules] = useState<EventSchedule[]>([])
  const [loading, setLoading] = useState(true)
  const [currentTime, setCurrentTime] = useState(new Date())

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

      return {
        eventId: event.id,
        eventName: event.siteName,
        startDate: event.startDate,
        endDate: event.endDate || event.startDate,
        location: event.location || '',
        assigneeId: '',
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
        duration: s.duration
      })
    })
    setEventSchedules(schedules)
    setLoading(false)
  }, [events])

  // 月の日付配列を生成
  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear()
    const month = date.getMonth()
    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)
    const daysInMonth = lastDay.getDate()
    const startDate = new Date(firstDay)
    startDate.setDate(startDate.getDate() - firstDay.getDay()) // 月曜日開始
    
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
                {['日', '月', '火', '水', '木', '金', '土'].map((day, index) => (
                  <div key={index} className={styles.dayHeader}>
                    {day}
                  </div>
                ))}
              </div>
            </div>

            <div className={styles.calendarGrid}>
              {days.map((day, dayIndex) => {
                const dateStr = day.toISOString().split('T')[0]
                const dayEvents = eventSchedules.filter(event => {
                  const eventStartDate = new Date(event.startDate).toISOString().split('T')[0]
                  const eventEndDate = new Date(event.endDate).toISOString().split('T')[0]
                  return dateStr >= eventStartDate && dateStr <= eventEndDate
                })

                return (
                  <div 
                    key={dayIndex}
                    className={`${styles.calendarCell} ${
                      !isCurrentMonth(day) ? styles.otherMonth : ''
                    } ${isToday(day) ? styles.today : ''} ${
                      isPastDate(day) ? styles.pastDate : ''
                    } ${isFutureDate(day) ? styles.futureDate : ''}`}
                  >
                    <div className={styles.dateNumber}>
                      {formatDate(day)}
                    </div>
                    <div className={styles.eventsList}>
                      {dayEvents.map(event => {
                        const eventStartDate = new Date(event.startDate).toISOString().split('T')[0]
                        const eventEndDate = new Date(event.endDate).toISOString().split('T')[0]
                        const isEventStart = dateStr === eventStartDate
                        const isEventEnd = dateStr === eventEndDate
                        const isEventMiddle = dateStr > eventStartDate && dateStr < eventEndDate
                        
                        // 日跨ぎイベントは全ての日に表示（連続バーのため）
                        
                        return (
                          <div 
                            key={event.eventId}
                            className={`${styles.eventItem} ${
                              event.isMultiDay ? styles.multiDay : styles.singleDay
                            } ${event.isMultiDay && isEventStart ? styles.eventStart : ''} ${
                              event.isMultiDay && isEventEnd ? styles.eventEnd : ''
                            } ${event.isMultiDay && isEventMiddle ? styles.eventMiddle : ''}`}
                          >
                            {/* 日跨ぎイベントの連続バー */}
                            {event.isMultiDay && (
                              <div className={`${styles.eventMultiDayBar} ${
                                isEventStart ? styles.eventStart : ''
                              } ${isEventMiddle ? styles.eventMiddle : ''} ${
                                isEventEnd ? styles.eventEnd : ''
                              }`}></div>
                            )}
                            
                            <div className={event.isMultiDay ? styles.eventMultiDayContent : ''}>
                              <div className={styles.eventNameRow}>
                                {(isEventStart || !event.isMultiDay) && (
                                  <span className={styles.eventName}>{event.eventName}</span>
                                )}
                                {event.isMultiDay && (
                                  <span className={styles.eventDuration}>
                                    {isEventStart && `&gt; ${event.duration}日間`}
                                    {isEventEnd && `&lt; 終了`}
                                    {isEventMiddle && `- 継続中`}
                                  </span>
                                )}
                              </div>
                              {(isEventStart || !event.isMultiDay) && event.location && (
                                <span className={styles.eventLocation}>📍 {event.location}</span>
                              )}
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
