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
    item.startDate === dateString
  )

  // 連日予定を優先してソート（終了日が後のものを優先）
  const sortedItems = itemsForThisDate.sort((a, b) => {
    const aEndDate = new Date(a.endDate)
    const bEndDate = new Date(b.endDate)
    return bEndDate.getTime() - aEndDate.getTime()
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
          {displayItems.map((item, index) => (
            <div
              key={item.id}
              className={styles.scheduleItem}
              style={{ backgroundColor: item.color }}
              onClick={() => onScheduleClick(item)}
              title={`${item.eventName} (${item.startDate} - ${item.endDate})`}
            >
              {item.eventName}
            </div>
          ))}
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
