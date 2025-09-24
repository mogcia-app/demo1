import { useState, useEffect } from 'react'
import { 
  collection, 
  doc, 
  addDoc, 
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
import { db } from '../firebase'
import { Event, Equipment, EquipmentCategory, COLLECTIONS } from '../types'

// イベント管理
export const useEvents = () => {
  const [events, setEvents] = useState<Event[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const q = query(
      collection(db, COLLECTIONS.EVENTS),
      orderBy('createdAt', 'desc')
    )

    const unsubscribe = onSnapshot(q, 
      (snapshot) => {
        const eventsData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          createdAt: doc.data().createdAt?.toDate() || new Date(),
          updatedAt: doc.data().updatedAt?.toDate() || new Date(),
        })) as Event[]
        
        setEvents(eventsData)
        setLoading(false)
      },
      (err) => {
        setError(err.message)
        setLoading(false)
      }
    )

    return () => unsubscribe()
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
    const q = query(
      collection(db, COLLECTIONS.EQUIPMENT),
      orderBy('name')
    )

    const unsubscribe = onSnapshot(q, 
      (snapshot) => {
        const equipmentData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          createdAt: doc.data().createdAt?.toDate() || new Date(),
          updatedAt: doc.data().updatedAt?.toDate() || new Date(),
        })) as Equipment[]
        
        setEquipment(equipmentData)
        setLoading(false)
      },
      (err) => {
        setError(err.message)
        setLoading(false)
      }
    )

    return () => unsubscribe()
  }, [])

  const createEquipment = async (equipmentData: Omit<Equipment, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      const docRef = await addDoc(collection(db, COLLECTIONS.EQUIPMENT), {
        ...equipmentData,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      })
      return docRef.id
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
    const q = query(
      collection(db, COLLECTIONS.EQUIPMENT_CATEGORIES),
      orderBy('order')
    )

    const unsubscribe = onSnapshot(q, 
      (snapshot) => {
        const categoriesData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
        })) as EquipmentCategory[]
        
        setCategories(categoriesData)
        setLoading(false)
      },
      (err) => {
        setError(err.message)
        setLoading(false)
      }
    )

    return () => unsubscribe()
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
    if (!eventId) return

    const eventRef = doc(db, COLLECTIONS.EVENTS, eventId)
    
    const unsubscribe = onSnapshot(eventRef, 
      (doc) => {
        if (doc.exists()) {
          const eventData = {
            id: doc.id,
            ...doc.data(),
            createdAt: doc.data().createdAt?.toDate() || new Date(),
            updatedAt: doc.data().updatedAt?.toDate() || new Date(),
          } as Event
          setEvent(eventData)
        } else {
          setEvent(null)
        }
        setLoading(false)
      },
      (err) => {
        setError(err.message)
        setLoading(false)
      }
    )

    return () => unsubscribe()
  }, [eventId])

  return {
    event,
    loading,
    error
  }
}
