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
}

export default function DroppableCalendarCell({ 
  date, 
  equipmentName, 
  scheduleItems, 
  onDrop, 
  onScheduleClick 
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

  return (
    <div
      className={`${styles.calendarCell} ${isDragOver ? styles.dragOver : ''} ${showDropZone ? styles.showDropZone : ''}`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onDragEnter={handleDragEnter}
    >
      {itemsForThisDate.length > 0 ? (
        itemsForThisDate.map((item, index) => (
          <div
            key={item.id}
            className={styles.scheduleItem}
            style={{ backgroundColor: item.color }}
            onClick={() => onScheduleClick(item)}
            title={`${item.eventName} (${item.startDate} - ${item.endDate})`}
          >
            {item.eventName}
          </div>
        ))
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
