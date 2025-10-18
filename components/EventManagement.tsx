'use client'

import { useState } from 'react'
import { Plus, Calendar, Users, MapPin, Eye } from 'lucide-react'
import styles from './EventManagement.module.css'

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

interface EventManagementProps {
  events: Event[]
  assignees: Assignee[]
  eventData: {[key: string]: EventData}
  savedEvents: Set<string>
  editingEventId: string | null
  onEditEvent: (eventId: string) => void
  onPreviewEvent: (eventId: string) => void
  onDeleteEvent: (eventId: string) => void
  onCreateEvent: () => void
  onInitializeData: () => void
  loading: boolean
}

export default function EventManagement({
  events,
  assignees,
  eventData,
  savedEvents,
  editingEventId,
  onEditEvent,
  onPreviewEvent,
  onDeleteEvent,
  onCreateEvent,
  onInitializeData,
  loading
}: EventManagementProps) {
  return (
    <div className={styles.eventsSection}>
      <div className={styles.eventsHeader}>
        <h2 className={styles.sectionTitle}>現場管理</h2>
        <button 
          className={styles.createEventButton}
          onClick={onCreateEvent}
          disabled={loading}
        >
          <Plus className={styles.icon} />
          {loading ? '作成中...' : '新しい現場を登録'}
        </button>
      </div>

      {events.length === 0 && (
        <div className={styles.emptyState}>
          <p>登録された現場がありません</p>
          <button 
            className={styles.initButton}
            onClick={onInitializeData}
          >
            サンプルデータを初期化
          </button>
        </div>
      )}

      <div className={styles.eventsList}>
        {events.reduce((acc, event) => {
          // 重複を除去（同じIDのイベントが複数ある場合）
          if (!acc.find(e => e.id === event.id)) {
            acc.push(event)
          }
          return acc
        }, [] as typeof events).map((event) => {
          const data = eventData[event.id] || {
            title: event.siteName,
            startDate: event.startDate,
            endDate: event.endDate,
            assigneeId: '',
            location: '',
            memo: '',
            equipment: []
          }
          const assignee = assignees.find(a => a.id === data.assigneeId)
          const isSaved = savedEvents.has(event.id)
          
          return (
            <div key={event.id} className={styles.eventCard}>
              {/* コンパクトな現場情報表示 */}
              <div className={styles.eventHeader}>
                <div className={styles.eventInfo}>
                  <div className={styles.eventTitleRow}>
                    <h3 className={styles.eventTitle}>{data.title || event.siteName}</h3>
                    <div className={styles.eventStatus}>
                      {isSaved ? (
                        <span className={styles.savedBadge}>✅ 保存済み</span>
                      ) : (
                        <span className={styles.draftBadge}>📝 下書き</span>
                      )}
                    </div>
                  </div>
                  
                  <div className={styles.eventMeta}>
                    <div className={styles.eventMetaItem}>
                      <Calendar className={styles.icon} />
                      <span>
                        {data.startDate === data.endDate 
                          ? data.startDate 
                          : `${data.startDate} - ${data.endDate}`
                        }
                      </span>
                    </div>
                    
                    {assignee && (
                      <div className={styles.eventMetaItem}>
                        <Users className={styles.icon} />
                        <span>{assignee.name}</span>
                      </div>
                    )}
                    
                    {data.location && (
                      <div className={styles.eventMetaItem}>
                        <MapPin className={styles.icon} />
                        <span>{data.location}</span>
                      </div>
                    )}
                    
                    <div className={styles.eventMetaItem}>
                      <span className={styles.equipmentCount}>
                        {data.equipment?.length || 0}種類の機材
                      </span>
                    </div>
                  </div>
                </div>
                
                <div className={styles.eventActions}>
                  {isSaved && (
                    <button 
                      className={styles.previewButton}
                      onClick={() => onPreviewEvent(event.id)}
                      title="詳細表示"
                    >
                      <Eye className={styles.icon} />
                    </button>
                  )}
                  <button 
                    className={styles.editButton}
                    onClick={() => onEditEvent(event.id)}
                    title="編集"
                  >
                    ✏️
                  </button>
                  <button 
                    className={styles.deleteButton}
                    onClick={() => onDeleteEvent(event.id)}
                    title="削除"
                  >
                    🗑️
                  </button>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
