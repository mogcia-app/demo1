'use client'

import { useState } from 'react'
import styles from './EventEditModal.module.css'

interface Event {
  id: string
  siteName: string
  startDate: string
  endDate: string
  location?: string
  description?: string
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
  assigneeId: string
  location: string
  memo: string
  equipment: Array<{
    equipmentId: string
    name: string
    quantity: number
    maxStock: number
  }>
}

interface EventEditModalProps {
  isOpen: boolean
  eventId: string | null
  event: Event | null
  eventData: EventData
  assignees: Assignee[]
  equipmentInputValue: string
  onClose: () => void
  onUpdateEventData: (eventId: string, field: string, value: any) => void
  onEquipmentInput: (eventId: string, value: string) => void
  onAddEquipmentByNumber: (eventId: string) => void
  onRemoveEquipment: (eventId: string, equipmentId: string) => void
  onUpdateEquipmentQuantity: (eventId: string, equipmentId: string, quantity: number) => void
  onSaveEvent: (eventId: string) => void
}

export default function EventEditModal({
  isOpen,
  eventId,
  event,
  eventData,
  assignees,
  equipmentInputValue,
  onClose,
  onUpdateEventData,
  onEquipmentInput,
  onAddEquipmentByNumber,
  onRemoveEquipment,
  onUpdateEquipmentQuantity,
  onSaveEvent
}: EventEditModalProps) {
  if (!isOpen || !eventId) return null

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <h2 className={styles.modalTitle}>
            {eventId.startsWith('temp-') ? '新しい現場を作成' : '現場編集'}
          </h2>
          <button className={styles.closeButton} onClick={onClose}>
            ×
          </button>
        </div>
        
        <div className={styles.modalBody}>
          {/* タイトル */}
          <div className={styles.inputSection}>
            <h4>現場名（タイトル）</h4>
            <input 
              type="text" 
              placeholder="現場名を入力"
              className={styles.titleInput}
              value={eventData.title}
              onChange={(e) => onUpdateEventData(eventId, 'title', e.target.value)}
            />
          </div>

          {/* 日付 */}
          <div className={styles.inputSection}>
            <h4>日付</h4>
            <div className={styles.dateRow}>
              <div className={styles.dateField}>
                <label>開始日</label>
                <input 
                  type="date" 
                  value={eventData.startDate}
                  onChange={(e) => onUpdateEventData(eventId, 'startDate', e.target.value)}
                  className={styles.dateInput}
                />
              </div>
              <div className={styles.dateField}>
                <label>終了日</label>
                <input 
                  type="date" 
                  value={eventData.endDate}
                  onChange={(e) => onUpdateEventData(eventId, 'endDate', e.target.value)}
                  className={styles.dateInput}
                  min={eventData.startDate}
                />
              </div>
            </div>
          </div>

          {/* 担当者 */}
          <div className={styles.inputSection}>
            <h4>担当者</h4>
            <select 
              className={styles.assigneeSelect}
              value={eventData.assigneeId}
              onChange={(e) => onUpdateEventData(eventId, 'assigneeId', e.target.value)}
            >
              <option value="">担当者を選択</option>
              {assignees.filter(a => a.isActive).map((assignee) => (
                <option key={assignee.id} value={assignee.id}>
                  {assignee.name}
                </option>
              ))}
            </select>
          </div>

          {/* 場所 */}
          <div className={styles.inputSection}>
            <h4>場所（Googleマップ紐付け）</h4>
            <input 
              type="text" 
              placeholder="場所を入力"
              className={styles.locationInput}
              value={eventData.location}
              onChange={(e) => onUpdateEventData(eventId, 'location', e.target.value)}
            />
          </div>

          {/* メモ */}
          <div className={styles.inputSection}>
            <h4>メモ</h4>
            <textarea 
              placeholder="備考やメモを入力してください"
              className={styles.textarea}
              value={eventData.memo}
              onChange={(e) => onUpdateEventData(eventId, 'memo', e.target.value)}
              rows={3}
            />
          </div>

          {/* 機材選択 */}
          <div className={styles.inputSection}>
            <h4>機材選択</h4>
            <div className={styles.equipmentInputContainer}>
              <input 
                type="text" 
                placeholder="例: #1*2 または #1*2,#2*5 （左の機材をドラッグ&ドロップも可）"
                className={styles.equipmentInputField}
                value={equipmentInputValue}
                onChange={(e) => onEquipmentInput(eventId, e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    onAddEquipmentByNumber(eventId)
                  }
                }}
              />
              <button 
                className={styles.addEquipmentButton}
                onClick={() => onAddEquipmentByNumber(eventId)}
                disabled={!equipmentInputValue?.trim()}
              >
                追加
              </button>
            </div>
            
            <div className={styles.equipmentList}>
              {(eventData.equipment || []).length === 0 ? (
                <div className={styles.emptyEquipmentMessage}>
                  機材Noを入力して機材を追加してください
                </div>
              ) : (
                (eventData.equipment || []).map((eq) => (
                  <div key={eq.equipmentId} className={styles.equipmentCard}>
                    <div className={styles.equipmentCardHeader}>
                      <span className={styles.equipmentCardName}>
                        #{eq.equipmentId} {eq.name}
                      </span>
                      <button 
                        className={styles.equipmentCardRemove}
                        onClick={() => onRemoveEquipment(eventId, eq.equipmentId)}
                      >
                        ×
                      </button>
                    </div>
                    <div className={styles.equipmentCardBody}>
                      <div className={styles.quantityControl}>
                        <label className={styles.quantityLabel}>数量:</label>
                        <button
                          className={styles.quantityButton}
                          onClick={() => onUpdateEquipmentQuantity(eventId, eq.equipmentId, eq.quantity - 1)}
                          disabled={eq.quantity <= 1}
                        >
                          -
                        </button>
                        <input
                          type="number"
                          className={styles.quantityInput}
                          value={eq.quantity}
                          onChange={(e) => onUpdateEquipmentQuantity(eventId, eq.equipmentId, parseInt(e.target.value) || 1)}
                          min="1"
                          max={eq.maxStock}
                        />
                        <button
                          className={styles.quantityButton}
                          onClick={() => onUpdateEquipmentQuantity(eventId, eq.equipmentId, eq.quantity + 1)}
                          disabled={eq.quantity >= eq.maxStock}
                        >
                          +
                        </button>
                      </div>
                      <div className={styles.stockInfo}>
                        <span className={eq.quantity > eq.maxStock ? styles.stockWarning : styles.stockNormal}>
                          在庫: {eq.maxStock}台
                        </span>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
        
        <div className={styles.modalActions}>
          <button 
            className={styles.cancelButton}
            onClick={onClose}
          >
            キャンセル
          </button>
          <button 
            className={styles.saveButton}
            onClick={() => onSaveEvent(eventId)}
          >
            {eventId.startsWith('temp-') ? '作成' : '保存'}
          </button>
        </div>
      </div>
    </div>
  )
}
