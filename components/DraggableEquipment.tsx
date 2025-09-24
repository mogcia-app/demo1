'use client'

import { useState } from 'react'
import { GripVertical } from 'lucide-react'
import styles from './DraggableEquipment.module.css'

interface Equipment {
  id: string
  name: string
  category: string
  stock: number
}

interface DraggableEquipmentProps {
  equipment: Equipment
  onDragStart: (equipment: Equipment) => void
  onDragEnd: () => void
}

export default function DraggableEquipment({ equipment, onDragStart, onDragEnd }: DraggableEquipmentProps) {
  const [isDragging, setIsDragging] = useState(false)

  const handleDragStart = (e: React.DragEvent) => {
    setIsDragging(true)
    onDragStart(equipment)
    
    // ドラッグデータを設定
    e.dataTransfer.setData('text/plain', JSON.stringify(equipment))
    e.dataTransfer.effectAllowed = 'move'
    
    // ドラッグ画像を設定
    const dragImage = e.currentTarget.cloneNode(true) as HTMLElement
    dragImage.style.transform = 'rotate(5deg)'
    dragImage.style.opacity = '0.8'
    document.body.appendChild(dragImage)
    e.dataTransfer.setDragImage(dragImage, 0, 0)
    
    // ドラッグ画像をクリーンアップ
    setTimeout(() => {
      document.body.removeChild(dragImage)
    }, 0)
  }

  const handleDragEnd = (e: React.DragEvent) => {
    setIsDragging(false)
    onDragEnd()
  }

  return (
    <div
      className={`${styles.draggableEquipment} ${isDragging ? styles.dragging : ''}`}
      draggable
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className={styles.dragHandle}>
        <GripVertical className={styles.gripIcon} />
      </div>
      <div className={styles.equipmentInfo}>
        <div className={styles.equipmentName}>{equipment.name}</div>
        <div className={styles.equipmentCategory}>{equipment.category}</div>
        <div className={styles.stockInfo}>在庫: {equipment.stock}</div>
      </div>
    </div>
  )
}
