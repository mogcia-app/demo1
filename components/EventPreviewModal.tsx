'use client'

import { Calendar, Users, MapPin, Package, Printer, FileDown } from 'lucide-react'
import styles from './EventPreviewModal.module.css'
import { useRef } from 'react'

interface Event {
  id: string
  siteName: string
  startDate: string
  endDate: string
  location?: string
  description?: string
  equipment?: Array<{
    equipmentId: string
    equipmentName: string
    quantity: number
  }>
}

interface Assignee {
  id: string
  name: string
  isActive: boolean
}

interface EventData {
  title: string
  startDate: string
  endDate: string
  assigneeId: string // 後方互換性のため残す
  assigneeIds: string[] // 複数担当者対応
  location: string
  memo: string
  equipment: Array<{
    equipmentId: string
    name: string
    quantity: number
    maxStock: number
  }>
}

interface EventPreviewModalProps {
  isOpen: boolean
  event: Event | null
  eventData: EventData
  assignees: Assignee[]
  onClose: () => void
  onEdit: () => void
}

export default function EventPreviewModal({
  isOpen,
  event,
  eventData,
  assignees,
  onClose,
  onEdit
}: EventPreviewModalProps) {
  const printRef = useRef<HTMLDivElement>(null)

  if (!isOpen || !event) return null

  // 複数担当者対応
  const assigneeList = (eventData.assigneeIds || []).length > 0
    ? assignees.filter(a => (eventData.assigneeIds || []).includes(a.id))
    : eventData.assigneeId 
      ? [assignees.find(a => a.id === eventData.assigneeId)].filter(Boolean) as Assignee[]
      : []

  // 印刷・PDF出力機能
  const handlePrint = () => {
    window.print()
  }

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modalContent} onClick={(e) => e.stopPropagation()} ref={printRef}>
        <div className={styles.modalHeader}>
          <h2 className={styles.modalTitle}>現場詳細</h2>
          <div className={styles.headerActions}>
            <button 
              className={styles.printButton}
              onClick={handlePrint}
              title="印刷・PDF保存"
            >
              <Printer className={styles.icon} />
              <span className={styles.buttonText}>印刷/PDF</span>
            </button>
            <button className={styles.closeButton} onClick={onClose}>
              ×
            </button>
          </div>
        </div>
        
        <div className={styles.modalBody}>
          {/* 基本情報 */}
          <div className={styles.section}>
            <h3 className={styles.sectionTitle}>基本情報</h3>
            <div className={styles.infoGrid}>
              <div className={styles.infoItem}>
                <label className={styles.infoLabel}>現場名</label>
                <div className={styles.infoValue}>{eventData.title || event.siteName}</div>
              </div>
              
              <div className={styles.infoItem}>
                <label className={styles.infoLabel}>日付</label>
                <div className={styles.infoValue}>
                  <Calendar className={styles.icon} />
                  {eventData.startDate === eventData.endDate 
                    ? eventData.startDate 
                    : `${eventData.startDate} 〜 ${eventData.endDate}`
                  }
                </div>
              </div>
              
              {assigneeList.length > 0 && (
                <div className={styles.infoItem}>
                  <label className={styles.infoLabel}>担当者</label>
                  <div className={styles.infoValue}>
                    <Users className={styles.icon} />
                    {assigneeList.map(a => a.name).join(', ')}
                  </div>
                </div>
              )}
              
              <div className={styles.infoItem}>
                <label className={styles.infoLabel}>場所</label>
                <div className={styles.infoValue}>
                  <MapPin className={styles.icon} />
                  {eventData.location || event.location || '未設定'}
                </div>
              </div>
            </div>
          </div>

          {/* 機材情報 */}
          <div className={styles.section}>
            <h3 className={styles.sectionTitle}>
              <Package className={styles.icon} />
              使用機材 ({eventData.equipment?.length || 0}種類)
            </h3>
            
            {eventData.equipment && eventData.equipment.length > 0 ? (
              <div className={styles.equipmentList}>
                {eventData.equipment.map((eq) => (
                  <div key={eq.equipmentId} className={styles.equipmentItem}>
                    <div className={styles.equipmentInfo}>
                      <span className={styles.equipmentNumber}>#{eq.equipmentId}</span>
                      <span className={styles.equipmentName}>{eq.name}</span>
                    </div>
                    <div className={styles.equipmentQuantity}>
                      {eq.quantity}台
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className={styles.emptyEquipment}>
                機材が登録されていません
              </div>
            )}
          </div>

          {/* メモ */}
          <div className={styles.section}>
            <h3 className={styles.sectionTitle}>メモ・備考</h3>
            <div className={styles.memoContent}>
              {eventData.memo || event.description || 'メモなし'}
            </div>
          </div>
        </div>
        
        <div className={styles.modalActions}>
          <button 
            className={styles.editButton}
            onClick={() => {
              onEdit()
              onClose()
            }}
          >
            ✏️ 編集
          </button>
          <button 
            className={styles.closeActionButton}
            onClick={onClose}
          >
            閉じる
          </button>
        </div>
      </div>
    </div>
  )
}
