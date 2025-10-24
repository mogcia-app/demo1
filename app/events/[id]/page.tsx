'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { ArrowLeft, Calendar, MapPin, Edit, Trash2, ExternalLink, User } from 'lucide-react'
import styles from './page.module.css'
import { useEvent, useAssignees } from '../../../lib/hooks/useFirestore'
import { onAuthStateChange, isCompanyUser } from '../../../lib/auth'

export default function EventDetailPage() {
  const params = useParams()
  const router = useRouter()
  const eventId = params.id as string
  const { event, loading, error } = useEvent(eventId)
  const { assignees } = useAssignees()
  const [isAuthenticated, setIsAuthenticated] = useState(false)

  // 認証状態の確認
  useEffect(() => {
    const unsubscribe = onAuthStateChange((user) => {
      if (user && isCompanyUser(user)) {
        setIsAuthenticated(true)
      } else {
        setIsAuthenticated(false)
        router.push('/login')
      }
    })

    return () => unsubscribe()
  }, [router])

  if (!isAuthenticated) {
    return (
      <main className={styles.main}>
        <div className={styles.authContainer}>
          <h1 className={styles.title}>認証が必要です</h1>
          <p className={styles.subtitle}>ログインしてください</p>
        </div>
      </main>
    )
  }

  if (loading) {
    return (
      <main className={styles.main}>
        <div className={styles.container}>
          <div className={styles.loading}>
            <h1 className={styles.title}>読み込み中...</h1>
          </div>
        </div>
      </main>
    )
  }

  if (error || !event) {
    return (
      <main className={styles.main}>
        <div className={styles.container}>
          <div className={styles.error}>
            <h1 className={styles.title}>エラーが発生しました</h1>
            <p className={styles.subtitle}>
              {error || 'イベントが見つかりません'}
            </p>
            <button 
              className={styles.backButton}
              onClick={() => router.push('/')}
            >
              <ArrowLeft className={styles.icon} />
              ホームに戻る
            </button>
          </div>
        </div>
      </main>
    )
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('ja-JP', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      weekday: 'long'
    })
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'draft': return '#6b7280'
      case 'confirmed': return '#1a1a1a'
      case 'in_progress': return '#4a4a4a'
      case 'completed': return '#6b7280'
      case 'cancelled': return '#9ca3af'
      default: return '#6b7280'
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'draft': return '下書き'
      case 'confirmed': return '確定'
      case 'in_progress': return '進行中'
      case 'completed': return '完了'
      case 'cancelled': return 'キャンセル'
      default: return '不明'
    }
  }

  // 担当者名を取得する関数
  const getAssigneeNames = (assigneeIds: string[] | undefined, assigneeId: string | undefined) => {
    if (assigneeIds && assigneeIds.length > 0) {
      // 複数担当者対応
      return assigneeIds
        .map(id => assignees.find(a => a.id === id)?.name)
        .filter(Boolean)
        .join(', ')
    } else if (assigneeId) {
      // 単一担当者（後方互換性）
      return assignees.find(a => a.id === assigneeId)?.name || assigneeId
    }
    return null
  }

  return (
    <main className={styles.main}>
      <div className={styles.container}>
        {/* ヘッダー */}
        <header className={styles.header}>
          <button 
            className={styles.backButton}
            onClick={() => router.push('/')}
          >
            <ArrowLeft className={styles.icon} />
            戻る
          </button>
          <div className={styles.headerActions}>
            <button className={styles.actionButton}>
              <Edit className={styles.icon} />
              編集
            </button>
            <button className={styles.deleteButton}>
              <Trash2 className={styles.icon} />
              削除
            </button>
          </div>
        </header>

        {/* イベント情報 */}
        <div className={styles.eventInfo}>
          <div className={styles.eventHeader}>
            <h1 className={styles.eventTitle}>{event.siteName}</h1>
            <div 
              className={styles.statusBadge}
              style={{ backgroundColor: getStatusColor(event.status) }}
            >
              {getStatusText(event.status)}
            </div>
          </div>

          <div className={styles.eventDetails}>
            <div className={styles.detailItem}>
              <Calendar className={styles.icon} />
              <div>
                <h3>開催日時</h3>
                <p>
                  {event.startDate === event.endDate 
                    ? formatDate(event.startDate)
                    : `${formatDate(event.startDate)} - ${formatDate(event.endDate)}`
                  }
                </p>
              </div>
            </div>

            {event.location && (
              <div className={styles.detailItem}>
                <MapPin className={styles.icon} />
                <div>
                  <h3>場所</h3>
                  <p>{event.location}</p>
                </div>
              </div>
            )}

            {getAssigneeNames(event.assigneeIds, event.assigneeId) && (
              <div className={styles.detailItem}>
                <User className={styles.icon} />
                <div>
                  <h3>担当者</h3>
                  <p>{getAssigneeNames(event.assigneeIds, event.assigneeId)}</p>
                </div>
              </div>
            )}

            {event.description && (
              <div className={styles.detailItem}>
                <div>
                  <h3>メモ・詳細</h3>
                  <p>{event.description}</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* 機材リスト */}
        <div className={styles.equipmentSection}>
          <h2 className={styles.sectionTitle}>
            機材リスト ({event.equipment.length}種類)
          </h2>
          
          {event.equipment.length === 0 ? (
            <div className={styles.emptyEquipment}>
              <p>登録された機材がありません</p>
            </div>
          ) : (
            <div className={styles.equipmentList}>
              {event.equipment.map((equipment, index) => (
                <div key={equipment.equipmentId || index} className={styles.equipmentItem}>
                  <div className={styles.equipmentInfo}>
                    <h3 className={styles.equipmentName}>{equipment.equipmentName}</h3>
                    <span className={styles.equipmentCategory}>機材ID: {equipment.equipmentId}</span>
                  </div>
                  <div className={styles.equipmentQuantity}>
                    {equipment.quantity}台
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Google カレンダー連携 */}
        {event.googleCalendarEventId && (
          <div className={styles.calendarSection}>
            <h2 className={styles.sectionTitle}>Google カレンダー</h2>
            <div className={styles.calendarInfo}>
              <p>このイベントは Google カレンダーに登録されています</p>
              <button className={styles.calendarButton}>
                <ExternalLink className={styles.icon} />
                カレンダーで開く
              </button>
            </div>
          </div>
        )}

        {/* メタ情報 */}
        <div className={styles.metaInfo}>
          <p>作成日: {event.createdAt?.toLocaleDateString('ja-JP') || '不明'}</p>
          <p>最終更新: {event.updatedAt?.toLocaleDateString('ja-JP') || '不明'}</p>
        </div>
      </div>
    </main>
  )
}
