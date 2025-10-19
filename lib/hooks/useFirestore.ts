import { useState, useEffect } from 'react'
import { 
  collection, 
  doc, 
  addDoc, 
  setDoc,
  updateDoc, 
  deleteDoc, 
  getDocs, 
  getDoc,
  onSnapshot,
  query,
  orderBy,
  where,
  Timestamp
} from 'firebase/firestore'
import { onAuthStateChanged } from 'firebase/auth'
import { db, auth } from '../firebase'
import { Event, Equipment, EquipmentCategory, Assignee, COLLECTIONS } from '../types'

// イベント管理
export const useEvents = () => {
  const [events, setEvents] = useState<Event[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let unsubscribeSnapshot: (() => void) | undefined

    // 認証状態を監視
    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      // 前のスナップショットリスナーをクリーンアップ
      if (unsubscribeSnapshot) {
        unsubscribeSnapshot()
        unsubscribeSnapshot = undefined
      }

      if (!user) {
        // 認証されていない場合は空のデータを設定
        console.log('useEvents: ユーザー未認証')
        setEvents([])
        setLoading(false)
        setError(null)
        return
      }

      // 認証済みの場合、Firestoreからデータを取得
      console.log('useEvents: ユーザー認証済み、データ取得開始')
      setLoading(true)
      setError(null)
      
      const q = query(
        collection(db, COLLECTIONS.EVENTS),
        orderBy('createdAt', 'desc')
      )

      unsubscribeSnapshot = onSnapshot(q, 
        (snapshot) => {
          const eventsData = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
            createdAt: doc.data().createdAt?.toDate() || new Date(),
            updatedAt: doc.data().updatedAt?.toDate() || new Date(),
          })) as Event[]
          
          console.log('useEvents: データ取得成功', eventsData.length, '件')
          setEvents(eventsData)
          setLoading(false)
          setError(null)
        },
        (err) => {
          console.error('useEvents error:', err)
          setError(err.message)
          setLoading(false)
        }
      )
    })

    return () => {
      unsubscribeAuth()
      if (unsubscribeSnapshot) unsubscribeSnapshot()
    }
  }, [])

  const createEvent = async (eventData: Omit<Event, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      const docRef = await addDoc(collection(db, COLLECTIONS.EVENTS), {
        ...eventData,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      })
      return docRef.id
    } catch (err) {
      setError(err instanceof Error ? err.message : 'イベント作成に失敗しました')
      throw err
    }
  }

  const updateEvent = async (eventId: string, eventData: Partial<Event>) => {
    try {
      const eventRef = doc(db, COLLECTIONS.EVENTS, eventId)
      await updateDoc(eventRef, {
        ...eventData,
        updatedAt: Timestamp.now(),
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'イベント更新に失敗しました')
      throw err
    }
  }

  const deleteEvent = async (eventId: string) => {
    try {
      await deleteDoc(doc(db, COLLECTIONS.EVENTS, eventId))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'イベント削除に失敗しました')
      throw err
    }
  }

  return {
    events,
    loading,
    error,
    createEvent,
    updateEvent,
    deleteEvent
  }
}

// 機材管理
export const useEquipment = () => {
  const [equipment, setEquipment] = useState<Equipment[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let unsubscribeSnapshot: (() => void) | undefined

    // 認証状態を監視
    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      // 前のスナップショットリスナーをクリーンアップ
      if (unsubscribeSnapshot) {
        unsubscribeSnapshot()
        unsubscribeSnapshot = undefined
      }

      if (!user) {
        // 認証されていない場合は空のデータを設定
        console.log('useEquipment: ユーザー未認証')
        setEquipment([])
        setLoading(false)
        setError(null)
        return
      }

      // 認証済みの場合、Firestoreからデータを取得
      console.log('useEquipment: ユーザー認証済み、データ取得開始')
      setLoading(true)
      setError(null)
      
      const q = query(
        collection(db, COLLECTIONS.EQUIPMENT),
        orderBy('name')
      )

      unsubscribeSnapshot = onSnapshot(q, 
        (snapshot) => {
          const equipmentData = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
            createdAt: doc.data().createdAt?.toDate() || new Date(),
            updatedAt: doc.data().updatedAt?.toDate() || new Date(),
          })) as Equipment[]
          
          console.log('useEquipment: データ取得成功', equipmentData.length, '件')
          setEquipment(equipmentData)
          setLoading(false)
          setError(null)
        },
        (err) => {
          console.error('useEquipment error:', err)
          setError(err.message)
          setLoading(false)
        }
      )
    })

    return () => {
      unsubscribeAuth()
      if (unsubscribeSnapshot) unsubscribeSnapshot()
    }
  }, [])

  const createEquipment = async (equipmentData: Omit<Equipment, 'id' | 'createdAt' | 'updatedAt'> & { id?: string }) => {
    try {
      // IDが指定されている場合はsetDocを使用、指定されていない場合はaddDocを使用
      if (equipmentData.id) {
        const customId = equipmentData.id
        const { id, ...dataWithoutId } = equipmentData
        const equipmentRef = doc(db, COLLECTIONS.EQUIPMENT, customId)
        await setDoc(equipmentRef, {
          ...dataWithoutId,
          createdAt: Timestamp.now(),
          updatedAt: Timestamp.now(),
        })
        return customId
      } else {
        const docRef = await addDoc(collection(db, COLLECTIONS.EQUIPMENT), {
          ...equipmentData,
          createdAt: Timestamp.now(),
          updatedAt: Timestamp.now(),
        })
        return docRef.id
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '機材作成に失敗しました')
      throw err
    }
  }

  const updateEquipment = async (equipmentId: string, equipmentData: Partial<Equipment>) => {
    try {
      const equipmentRef = doc(db, COLLECTIONS.EQUIPMENT, equipmentId)
      await updateDoc(equipmentRef, {
        ...equipmentData,
        updatedAt: Timestamp.now(),
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : '機材更新に失敗しました')
      throw err
    }
  }

  const deleteEquipment = async (equipmentId: string) => {
    try {
      await deleteDoc(doc(db, COLLECTIONS.EQUIPMENT, equipmentId))
    } catch (err) {
      setError(err instanceof Error ? err.message : '機材削除に失敗しました')
      throw err
    }
  }

  return {
    equipment,
    loading,
    error,
    createEquipment,
    updateEquipment,
    deleteEquipment
  }
}

// 機材カテゴリー管理
export const useEquipmentCategories = () => {
  const [categories, setCategories] = useState<EquipmentCategory[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let unsubscribeSnapshot: (() => void) | undefined

    // 認証状態を監視
    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      // 前のスナップショットリスナーをクリーンアップ
      if (unsubscribeSnapshot) {
        unsubscribeSnapshot()
        unsubscribeSnapshot = undefined
      }

      if (!user) {
        // 認証されていない場合は空のデータを設定
        console.log('useEquipmentCategories: ユーザー未認証')
        setCategories([])
        setLoading(false)
        setError(null)
        return
      }

      // 認証済みの場合、Firestoreからデータを取得
      console.log('useEquipmentCategories: ユーザー認証済み、データ取得開始')
      setLoading(true)
      setError(null)
      
      const q = query(
        collection(db, COLLECTIONS.EQUIPMENT_CATEGORIES),
        orderBy('order')
      )

      unsubscribeSnapshot = onSnapshot(q, 
        (snapshot) => {
          const categoriesData = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
          })) as EquipmentCategory[]
          
          console.log('useEquipmentCategories: データ取得成功', categoriesData.length, '件')
          setCategories(categoriesData)
          setLoading(false)
          setError(null)
        },
        (err) => {
          console.error('useEquipmentCategories error:', err)
          setError(err.message)
          setLoading(false)
        }
      )
    })

    return () => {
      unsubscribeAuth()
      if (unsubscribeSnapshot) unsubscribeSnapshot()
    }
  }, [])

  return {
    categories,
    loading,
    error
  }
}

// 単一イベント取得
export const useEvent = (eventId: string) => {
  const [event, setEvent] = useState<Event | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!eventId) {
      setLoading(false)
      return
    }

    let unsubscribeSnapshot: (() => void) | undefined

    // 認証状態を監視
    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      // 前のスナップショットリスナーをクリーンアップ
      if (unsubscribeSnapshot) {
        unsubscribeSnapshot()
        unsubscribeSnapshot = undefined
      }

      if (!user) {
        // 認証されていない場合はnullを設定
        console.log('useEvent: ユーザー未認証')
        setEvent(null)
        setLoading(false)
        setError(null)
        return
      }

      // 認証済みの場合、Firestoreからデータを取得
      console.log('useEvent: ユーザー認証済み、データ取得開始')
      setLoading(true)
      setError(null)
      
      const eventRef = doc(db, COLLECTIONS.EVENTS, eventId)
      
      unsubscribeSnapshot = onSnapshot(eventRef, 
        (doc) => {
          if (doc.exists()) {
            const eventData = {
              id: doc.id,
              ...doc.data(),
              createdAt: doc.data().createdAt?.toDate() || new Date(),
              updatedAt: doc.data().updatedAt?.toDate() || new Date(),
            } as Event
            console.log('useEvent: データ取得成功')
            setEvent(eventData)
          } else {
            console.log('useEvent: イベントが存在しません')
            setEvent(null)
          }
          setLoading(false)
          setError(null)
        },
        (err) => {
          console.error('useEvent error:', err)
          setError(err.message)
          setLoading(false)
        }
      )
    })

    return () => {
      unsubscribeAuth()
      if (unsubscribeSnapshot) unsubscribeSnapshot()
    }
  }, [eventId])

  return {
    event,
    loading,
    error
  }
}

// 担当者管理
export const useAssignees = () => {
  const [assignees, setAssignees] = useState<Assignee[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let unsubscribeSnapshot: (() => void) | undefined

    // 認証状態を監視
    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      // 前のスナップショットリスナーをクリーンアップ
      if (unsubscribeSnapshot) {
        unsubscribeSnapshot()
        unsubscribeSnapshot = undefined
      }

      if (!user) {
        // 認証されていない場合は空のデータを設定
        console.log('useAssignees: ユーザー未認証')
        setAssignees([])
        setLoading(false)
        setError(null)
        return
      }

      // 認証済みの場合、Firestoreからデータを取得
      console.log('useAssignees: ユーザー認証済み、データ取得開始')
      setLoading(true)
      setError(null)
      
      const q = query(
        collection(db, COLLECTIONS.ASSIGNEES),
        orderBy('name')
      )

      unsubscribeSnapshot = onSnapshot(q, 
        (snapshot) => {
          const assigneesData = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
            createdAt: doc.data().createdAt?.toDate() || new Date(),
            updatedAt: doc.data().updatedAt?.toDate() || new Date(),
          })) as Assignee[]
          
          console.log('useAssignees: データ取得成功', assigneesData.length, '件')
          setAssignees(assigneesData)
          setLoading(false)
          setError(null)
        },
        (err) => {
          console.error('useAssignees error:', err)
          setError(err.message)
          setLoading(false)
        }
      )
    })

    return () => {
      unsubscribeAuth()
      if (unsubscribeSnapshot) unsubscribeSnapshot()
    }
  }, [])

  const createAssignee = async (assigneeData: Omit<Assignee, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      const docRef = await addDoc(collection(db, COLLECTIONS.ASSIGNEES), {
        ...assigneeData,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      })
      return docRef.id
    } catch (err) {
      setError(err instanceof Error ? err.message : '担当者作成に失敗しました')
      throw err
    }
  }

  const updateAssignee = async (assigneeId: string, assigneeData: Partial<Assignee>) => {
    try {
      const assigneeRef = doc(db, COLLECTIONS.ASSIGNEES, assigneeId)
      await updateDoc(assigneeRef, {
        ...assigneeData,
        updatedAt: Timestamp.now(),
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : '担当者更新に失敗しました')
      throw err
    }
  }

  const deleteAssignee = async (assigneeId: string) => {
    try {
      await deleteDoc(doc(db, COLLECTIONS.ASSIGNEES, assigneeId))
    } catch (err) {
      setError(err instanceof Error ? err.message : '担当者削除に失敗しました')
      throw err
    }
  }

  return {
    assignees,
    loading,
    error,
    createAssignee,
    updateAssignee,
    deleteAssignee
  }
}
