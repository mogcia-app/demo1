'use client'

import { useState } from 'react'
import { Plus } from 'lucide-react'
import styles from './DroppableCalendarCell.module.css'

interface ScheduleItem {
  id: string
  equipmentName: string
  eventName: string
  startDate: string
  endDate: string
  color: string
}

interface DroppableCalendarCellProps {
  date: Date
  equipmentName: string
  scheduleItems: ScheduleItem[]
  onDrop: (equipmentName: string, date: Date, eventName: string) => void
  onScheduleClick: (schedule: ScheduleItem) => void
  onShowMoreClick: (date: Date, equipmentName: string, schedules: ScheduleItem[]) => void
}

export default function DroppableCalendarCell({ 
  date, 
  equipmentName, 
  scheduleItems, 
  onDrop, 
  onScheduleClick,
  onShowMoreClick
}: DroppableCalendarCellProps) {
  const [isDragOver, setIsDragOver] = useState(false)
  const [showDropZone, setShowDropZone] = useState(false)

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
    setIsDragOver(true)
    setShowDropZone(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
    setShowDropZone(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
    setShowDropZone(false)

    try {
      const equipmentData = JSON.parse(e.dataTransfer.getData('text/plain'))
      
      if (equipmentData.name === equipmentName) {
        const eventName = prompt('イベント名を入力してください:', '')
        if (eventName) {
          onDrop(equipmentName, date, eventName)
        }
      } else {
        alert('この機材はこのセルにドロップできません')
      }
    } catch (error) {
      console.error('ドロップエラー:', error)
    }
  }

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault()
    setShowDropZone(true)
  }

  const dateString = date.toISOString().split('T')[0]
  const itemsForThisDate = scheduleItems.filter(item => 
    item.equipmentName === equipmentName && 
    (item.startDate === dateString || 
     (new Date(item.startDate) <= date && new Date(item.endDate) >= date))
  )

  // 連日予定（2日以上）と1日予定を分離
  const multiDayItems = itemsForThisDate.filter(item => {
    const duration = Math.ceil((new Date(item.endDate).getTime() - new Date(item.startDate).getTime()) / (1000 * 60 * 60 * 24)) + 1
    return duration > 1
  })
  
  const singleDayItems = itemsForThisDate.filter(item => {
    const duration = Math.ceil((new Date(item.endDate).getTime() - new Date(item.startDate).getTime()) / (1000 * 60 * 60 * 24)) + 1
    return duration === 1
  })


  // 連日予定のみを表示（日数が長い順）
  const sortedMultiDayItems = multiDayItems.sort((a, b) => {
    const aDuration = Math.ceil((new Date(a.endDate).getTime() - new Date(a.startDate).getTime()) / (1000 * 60 * 60 * 24)) + 1
    const bDuration = Math.ceil((new Date(b.endDate).getTime() - new Date(b.startDate).getTime()) / (1000 * 60 * 60 * 24)) + 1
    return bDuration - aDuration // 長い日数を優先
  })

  // 最大2個まで表示、残りは「他X個」として表示
  const maxDisplayItems = 2
  const displayItems = sortedMultiDayItems.slice(0, maxDisplayItems)
  const remainingMultiDayCount = sortedMultiDayItems.length - maxDisplayItems
  const singleDayCount = singleDayItems.length

  return (
    <div
      className={`${styles.calendarCell} ${isDragOver ? styles.dragOver : ''} ${showDropZone ? styles.showDropZone : ''}`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onDragEnter={handleDragEnter}
    >
      {(displayItems.length > 0 || singleDayCount > 0 || remainingMultiDayCount > 0) ? (
        <>
          {/* 連日予定を表示 */}
          {displayItems.map((item, index) => {
            const isStartDate = item.startDate === dateString
            const isEndDate = item.endDate === dateString
            const isMultiDay = item.startDate !== item.endDate
            
            return (
              <div
                key={item.id}
                className={`${styles.scheduleItem} ${
                  isMultiDay && !isStartDate ? styles.continued : ''
                } ${isStartDate ? styles.startDate : ''} ${isEndDate ? styles.endDate : ''}`}
                style={{ backgroundColor: item.color }}
                onClick={() => onScheduleClick(item)}
                title={`${item.eventName} (${item.startDate} - ${item.endDate})`}
              >
                {isMultiDay && !isStartDate ? '...' : item.eventName}
              </div>
            )
          })}
          
          {/* 1日予定の件数表示 */}
          {singleDayCount > 0 && (
            <div
              className={styles.singleDayItems}
              onClick={() => onShowMoreClick(date, equipmentName, singleDayItems)}
              title={`1日予定 ${singleDayCount}件を表示`}
            >
              他→{singleDayCount}件
            </div>
          )}
          
          {/* 残りの連日予定 */}
          {remainingMultiDayCount > 0 && (
            <div
              className={styles.moreItems}
              onClick={() => onShowMoreClick(date, equipmentName, sortedMultiDayItems.slice(maxDisplayItems))}
              title={`他${remainingMultiDayCount}個の連日予定を表示`}
            >
              他{remainingMultiDayCount}個
            </div>
          )}
        </>
      ) : (
        <div className={styles.emptyCell}>
          {showDropZone && (
            <div className={styles.dropZone}>
              <Plus className={styles.plusIcon} />
              <span className={styles.dropText}>ここにドロップ</span>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
