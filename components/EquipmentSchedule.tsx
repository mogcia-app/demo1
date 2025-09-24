'use client'

import { useState } from 'react'
import { ChevronLeft, ChevronRight, Calendar, Plus, X } from 'lucide-react'
import styles from './EquipmentSchedule.module.css'
import DraggableEquipment from './DraggableEquipment'
import DroppableCalendarCell from './DroppableCalendarCell'

interface ScheduleItem {
  id: string
  equipmentName: string
  eventName: string
  startDate: string
  endDate: string
  color: string
}

interface EquipmentScheduleProps {
  equipment: Array<{
    id: string
    name: string
    category: string
    stock: number
  }>
  onAddSchedule: (equipmentId: string, eventName: string, startDate: string, endDate: string) => void
}

export default function EquipmentSchedule({ equipment, onAddSchedule }: EquipmentScheduleProps) {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [selectedEquipment, setSelectedEquipment] = useState<string | null>(null)
  const [newEventName, setNewEventName] = useState('')
  const [newStartDate, setNewStartDate] = useState('')
  const [newEndDate, setNewEndDate] = useState('')
  const [showAddForm, setShowAddForm] = useState(false)
  const [draggedEquipment, setDraggedEquipment] = useState<any>(null)
  const [showEquipmentList, setShowEquipmentList] = useState(false)

  // サンプルスケジュールデータ
  const [scheduleItems, setScheduleItems] = useState<ScheduleItem[]>([
    {
      id: '1',
      equipmentName: 'YAMAHA QL5',
      eventName: '高嶺のなでしこ 幕張',
      startDate: '2024-09-04',
      endDate: '2024-09-08',
      color: '#3b82f6'
    },
    {
      id: '2',
      equipmentName: 'YAMAHA QL1',
      eventName: 'じーこレンタル出し',
      startDate: '2024-09-05',
      endDate: '2024-09-08',
      color: '#10b981'
    },
    {
      id: '3',
      equipmentName: 'AD4Q Z16-①',
      eventName: '高嶺のなでしこ 幕張RH',
      startDate: '2024-09-01',
      endDate: '2024-09-03',
      color: '#f59e0b'
    },
    {
      id: '4',
      equipmentName: 'YAMAHA Rio3224 D ①',
      eventName: 'ハニフェス 日比谷野音',
      startDate: '2024-09-07',
      endDate: '2024-09-08',
      color: '#ef4444'
    }
  ])

  // カレンダーの日付を生成
  const generateCalendarDays = () => {
    const year = currentDate.getFullYear()
    const month = currentDate.getMonth()
    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)
    const daysInMonth = lastDay.getDate()
    const startingDayOfWeek = firstDay.getDay()

    const days = []
    
    // 前月の日付（空白セル）
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null)
    }
    
    // 当月の日付
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(new Date(year, month, day))
    }
    
    return days
  }

  // 日付をフォーマット
  const formatDate = (date: Date) => {
    return date.toISOString().split('T')[0]
  }

  // 日付文字列をDateオブジェクトに変換
  const parseDate = (dateString: string) => {
    return new Date(dateString)
  }

  // 指定された日付のスケジュールアイテムを取得
  const getScheduleItemsForDate = (date: Date) => {
    const dateString = formatDate(date)
    return scheduleItems.filter(item => {
      const startDate = parseDate(item.startDate)
      const endDate = parseDate(item.endDate)
      return date >= startDate && date <= endDate
    })
  }

  // 指定された日付で開始するスケジュールアイテムを取得
  const getStartingScheduleItems = (date: Date) => {
    const dateString = formatDate(date)
    return scheduleItems.filter(item => item.startDate === dateString)
  }

  // 月を変更
  const changeMonth = (direction: 'prev' | 'next') => {
    setCurrentDate(prev => {
      const newDate = new Date(prev)
      if (direction === 'prev') {
        newDate.setMonth(prev.getMonth() - 1)
      } else {
        newDate.setMonth(prev.getMonth() + 1)
      }
      return newDate
    })
  }

  // スケジュール追加
  const handleAddSchedule = () => {
    if (selectedEquipment && newEventName && newStartDate) {
      const endDate = newEndDate || newStartDate
      onAddSchedule(selectedEquipment, newEventName, newStartDate, endDate)
      
      // フォームをリセット
      setSelectedEquipment(null)
      setNewEventName('')
      setNewStartDate('')
      setNewEndDate('')
      setShowAddForm(false)
    }
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
  const handleDrop = (equipmentName: string, date: Date, eventName: string) => {
    const dateString = date.toISOString().split('T')[0]
    const newSchedule: ScheduleItem = {
      id: Date.now().toString(),
      equipmentName,
      eventName,
      startDate: dateString,
      endDate: dateString,
      color: getRandomColor()
    }
    
    setScheduleItems(prev => [...prev, newSchedule])
    onAddSchedule(equipmentName, eventName, dateString, dateString)
  }

  // スケジュールクリック
  const handleScheduleClick = (schedule: ScheduleItem) => {
    alert(`イベント: ${schedule.eventName}\n機材: ${schedule.equipmentName}\n期間: ${schedule.startDate} - ${schedule.endDate}`)
  }

  // ランダムカラー生成
  const getRandomColor = () => {
    const colors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#84cc16', '#f97316']
    return colors[Math.floor(Math.random() * colors.length)]
  }

  const days = generateCalendarDays()
  const monthNames = ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月']
  const dayNames = ['日', '月', '火', '水', '木', '金', '土']

  return (
    <div className={styles.scheduleContainer}>
      <div className={styles.scheduleHeader}>
        <h3 className={styles.scheduleTitle}>機材スケジュール</h3>
        <div className={styles.monthNavigation}>
          <button 
            className={styles.navButton}
            onClick={() => changeMonth('prev')}
          >
            <ChevronLeft className={styles.icon} />
          </button>
          <span className={styles.monthYear}>
            {currentDate.getFullYear()}年{monthNames[currentDate.getMonth()]}
          </span>
          <button 
            className={styles.navButton}
            onClick={() => changeMonth('next')}
          >
            <ChevronRight className={styles.icon} />
          </button>
        </div>
        <div className={styles.headerButtons}>
          <button 
            className={styles.equipmentListButton}
            onClick={() => setShowEquipmentList(!showEquipmentList)}
          >
            <Calendar className={styles.icon} />
            機材リスト
          </button>
          <button 
            className={styles.addScheduleButton}
            onClick={() => setShowAddForm(true)}
          >
            <Plus className={styles.icon} />
            スケジュール追加
          </button>
        </div>
      </div>

      {/* 機材リスト */}
      {showEquipmentList && (
        <div className={styles.equipmentListContainer}>
          <div className={styles.equipmentListHeader}>
            <h4>ドラッグ可能な機材</h4>
            <button 
              className={styles.closeButton}
              onClick={() => setShowEquipmentList(false)}
            >
              <X className={styles.icon} />
            </button>
          </div>
          <div className={styles.equipmentList}>
            {equipment.map((item) => (
              <DraggableEquipment
                key={item.id}
                equipment={item}
                onDragStart={handleDragStart}
                onDragEnd={handleDragEnd}
              />
            ))}
          </div>
        </div>
      )}

      <div className={styles.calendarContainer}>
        <div className={styles.calendarGrid}>
          {/* ヘッダー行 */}
          <div className={styles.calendarHeader}>
            <div className={styles.equipmentColumn}>機材名</div>
            {days.map((day, index) => (
              <div key={index} className={styles.dayHeader}>
                {day ? (
                  <>
                    <div className={styles.dayName}>{dayNames[day.getDay()]}</div>
                    <div className={styles.dayNumber}>{day.getDate()}</div>
                  </>
                ) : null}
              </div>
            ))}
          </div>

          {/* 機材行 */}
          {equipment.map((item) => (
            <div key={item.id} className={styles.equipmentRow}>
              <div className={styles.equipmentName}>
                {item.name}
                <span className={styles.stockBadge}>在庫: {item.stock}</span>
              </div>
              {days.map((day, dayIndex) => {
                if (!day) {
                  return <div key={dayIndex} className={styles.emptyCell}></div>
                }

                return (
                  <DroppableCalendarCell
                    key={dayIndex}
                    date={day}
                    equipmentName={item.name}
                    scheduleItems={scheduleItems}
                    onDrop={handleDrop}
                    onScheduleClick={handleScheduleClick}
                  />
                )
              })}
            </div>
          ))}
        </div>
      </div>

      {/* スケジュール追加フォーム */}
      {showAddForm && (
        <div className={styles.addFormOverlay}>
          <div className={styles.addForm}>
            <h4>スケジュール追加</h4>
            <div className={styles.formGroup}>
              <label>機材選択</label>
              <select 
                value={selectedEquipment || ''}
                onChange={(e) => setSelectedEquipment(e.target.value)}
                className={styles.formSelect}
              >
                <option value="">機材を選択してください</option>
                {equipment.map(item => (
                  <option key={item.id} value={item.name}>
                    {item.name}
                  </option>
                ))}
              </select>
            </div>
            <div className={styles.formGroup}>
              <label>イベント名</label>
              <input 
                type="text"
                value={newEventName}
                onChange={(e) => setNewEventName(e.target.value)}
                placeholder="イベント名を入力"
                className={styles.formInput}
              />
            </div>
            <div className={styles.formRow}>
              <div className={styles.formGroup}>
                <label>開始日</label>
                <input 
                  type="date"
                  value={newStartDate}
                  onChange={(e) => setNewStartDate(e.target.value)}
                  className={styles.formInput}
                />
              </div>
              <div className={styles.formGroup}>
                <label>終了日</label>
                <input 
                  type="date"
                  value={newEndDate}
                  onChange={(e) => setNewEndDate(e.target.value)}
                  min={newStartDate}
                  className={styles.formInput}
                />
              </div>
            </div>
            <div className={styles.formActions}>
              <button 
                className={styles.saveButton}
                onClick={handleAddSchedule}
              >
                追加
              </button>
              <button 
                className={styles.cancelButton}
                onClick={() => setShowAddForm(false)}
              >
                キャンセル
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
