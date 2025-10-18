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

  // 日数が少ない予定を上に表示（1日 < 2日 < 3日）
  const sortedItems = itemsForThisDate.sort((a, b) => {
    const aDuration = Math.ceil((new Date(a.endDate).getTime() - new Date(a.startDate).getTime()) / (1000 * 60 * 60 * 24)) + 1
    const bDuration = Math.ceil((new Date(b.endDate).getTime() - new Date(b.startDate).getTime()) / (1000 * 60 * 60 * 24)) + 1
    
    // 日数が少ないものを上に
    if (aDuration !== bDuration) {
      return aDuration - bDuration
    }
    
    // 日数が同じ場合は開始日が早いものを上に
    return new Date(a.startDate).getTime() - new Date(b.startDate).getTime()
  })

  // 最大3個まで表示、残りは「他X個」として表示
  const maxDisplayItems = 3
  const displayItems = sortedItems.slice(0, maxDisplayItems)
  const remainingCount = sortedItems.length - maxDisplayItems

  return (
    <div
      className={`${styles.calendarCell} ${isDragOver ? styles.dragOver : ''} ${showDropZone ? styles.showDropZone : ''}`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onDragEnter={handleDragEnter}
    >
      {sortedItems.length > 0 ? (
        <>
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
          {remainingCount > 0 && (
            <div
              className={styles.moreItems}
              onClick={() => onShowMoreClick(date, equipmentName, sortedItems)}
              title={`他${remainingCount}個の予定を表示`}
            >
              他{remainingCount}個
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
