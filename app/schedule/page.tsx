'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/lib/auth'
import { useFirestore } from '@/lib/hooks/useFirestore'
import { useEquipment } from '@/lib/hooks/useEquipment'
import { Equipment, EventData } from '@/lib/types'
import styles from './page.module.css'
import { Calendar, ChevronLeft, ChevronRight, AlertTriangle, Info, ArrowLeft } from 'lucide-react'
import { useRouter } from 'next/navigation'

interface ScheduleEvent {
  eventId: string
  eventName: string
  startDate: string
  endDate: string
  equipment: {
    equipmentId: string
    name: string
    quantity: number
  }[]
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
  const { user, loading: authLoading } = useAuth()
  const { data: events } = useFirestore<EventData>('events')
  const { equipment, loading: equipmentLoading } = useEquipment()

  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [equipmentSchedules, setEquipmentSchedules] = useState<EquipmentSchedule[]>([])
  const [loading, setLoading] = useState(true)

  // 認証チェック
  if (authLoading) {
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

  // スケジュールデータを処理
  useEffect(() => {
    if (!events || !equipment || equipmentLoading) return

    const schedules: EquipmentSchedule[] = []
    
    // 各機材のスケジュールを初期化
    equipment.forEach(eq => {
      schedules.push({
        equipmentId: eq.id,
        equipmentName: eq.name,
        stock: eq.stock,
        usage: {}
      })
    })

    // 現場データから機材使用状況を抽出
    events.forEach(event => {
      if (!event.equipment || event.equipment.length === 0) return
      
      const startDate = new Date(event.startDate)
      const endDate = event.endDate ? new Date(event.endDate) : startDate
      
      // 日付範囲を生成
      const currentDate = new Date(startDate)
      while (currentDate <= endDate) {
        const dateStr = currentDate.toISOString().split('T')[0]
        
        event.equipment.forEach(eventEq => {
          const scheduleIndex = schedules.findIndex(s => s.equipmentId === eventEq.equipmentId)
          if (scheduleIndex === -1) return
          
          if (!schedules[scheduleIndex].usage[dateStr]) {
            schedules[scheduleIndex].usage[dateStr] = []
          }
          
          // 在庫競合チェック
          const totalUsage = schedules[scheduleIndex].usage[dateStr]
            .reduce((sum, usage) => sum + usage.quantity, 0)
          const isConflict = (totalUsage + eventEq.quantity) > schedules[scheduleIndex].stock
          
          schedules[scheduleIndex].usage[dateStr].push({
            eventId: event.id,
            eventName: event.title,
            quantity: eventEq.quantity,
            isConflict
          })
        })
        
        currentDate.setDate(currentDate.getDate() + 1)
      }
    })

    setEquipmentSchedules(schedules)
    setLoading(false)
  }, [events, equipment, equipmentLoading])

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
    const today = new Date()
    return date.toDateString() === today.toDateString()
  }

  if (loading) {
    return (
      <div className={styles.main}>
        <div className={styles.loading}>
          <p className={styles.subtitle}>スケジュールを読み込み中...</p>
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
          <div className={styles.legend}>
            <div className={styles.legendItem}>
              <div className={`${styles.legendColor} ${styles.normalUsage}`}></div>
              <span>通常使用</span>
            </div>
            <div className={styles.legendItem}>
              <div className={`${styles.legendColor} ${styles.conflictUsage}`}></div>
              <span>在庫競合</span>
            </div>
            <div className={styles.legendItem}>
              <AlertTriangle className={styles.warningIcon} />
              <span>注意が必要</span>
            </div>
          </div>

          <div className={styles.scheduleTable}>
            <div className={styles.tableHeader}>
              <div className={styles.equipmentHeader}>機材名</div>
              <div className={styles.datesHeader}>
                {days.slice(0, 7).map((day, index) => (
                  <div key={index} className={styles.dayHeader}>
                    {['日', '月', '火', '水', '木', '金', '土'][index]}
                  </div>
                ))}
              </div>
            </div>

            <div className={styles.tableBody}>
              {equipmentSchedules.map(schedule => (
                <div key={schedule.equipmentId} className={styles.scheduleRow}>
                  <div className={styles.equipmentCell}>
                    <div className={styles.equipmentName}>
                      #{schedule.equipmentId} {schedule.equipmentName}
                    </div>
                    <div className={styles.stockInfo}>
                      在庫: {schedule.stock}台
                    </div>
                  </div>
                  <div className={styles.datesCell}>
                    {days.map((day, dayIndex) => {
                      const dateStr = day.toISOString().split('T')[0]
                      const usage = schedule.usage[dateStr] || []
                      const hasUsage = usage.length > 0
                      const hasConflict = usage.some(u => u.isConflict)
                      
                      return (
                        <div 
                          key={dayIndex}
                          className={`${styles.dateCell} ${
                            !isCurrentMonth(day) ? styles.otherMonth : ''
                          } ${isToday(day) ? styles.today : ''}`}
                        >
                          <div className={styles.dateNumber}>
                            {formatDate(day)}
                          </div>
                          {hasUsage && (
                            <div className={`${styles.usageContainer} ${
                              hasConflict ? styles.conflict : styles.normal
                            }`}>
                              {usage.map((u, uIndex) => (
                                <div 
                                  key={uIndex}
                                  className={styles.usageItem}
                                  title={`${u.eventName} - ${u.quantity}台${u.isConflict ? ' (在庫不足)' : ''}`}
                                >
                                  {u.isConflict && (
                                    <AlertTriangle className={styles.conflictIcon} />
                                  )}
                                  <span className={styles.usageText}>
                                    {u.quantity}台
                                  </span>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
