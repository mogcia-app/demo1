'use client'

import { useState, useCallback, useEffect } from 'react'
import { 
  collection, 
  doc, 
  getDocs, 
  getDoc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  onSnapshot,
  query,
  orderBy,
  where,
  limit,
  DocumentData,
  QueryConstraint
} from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { firebaseFunctionsClient, FirebaseError } from '@/lib/gcf-client'

interface UseFirebaseState<T> {
  data: T | null
  loading: boolean
  error: string | null
}

interface UseFirebaseReturn<T> extends UseFirebaseState<T> {
  execute: (...args: any[]) => Promise<void>
  reset: () => void
}

// Firebase Functions呼び出し用のカスタムフック
export function useFirebaseFunction<T = any>(
  functionCall: (...args: any[]) => Promise<T>
): UseFirebaseReturn<T> {
  const [state, setState] = useState<UseFirebaseState<T>>({
    data: null,
    loading: false,
    error: null,
  })

  const execute = useCallback(async (...args: any[]) => {
    setState(prev => ({ ...prev, loading: true, error: null }))

    try {
      const result = await functionCall(...args)
      setState({
        data: result,
        loading: false,
        error: null,
      })
    } catch (err) {
      let errorMessage = '予期しないエラーが発生しました'
      
      if (err instanceof FirebaseError) {
        errorMessage = `Firebase Function Error: ${err.message}`
      } else if (err instanceof Error) {
        errorMessage = err.message
      }

      setState({
        data: null,
        loading: false,
        error: errorMessage,
      })
    }
  }, [functionCall])

  const reset = useCallback(() => {
    setState({
      data: null,
      loading: false,
      error: null,
    })
  }, [])

  return {
    ...state,
    execute,
    reset,
  }
}

// Firestoreコレクション用のフック
export function useFirestoreCollection<T = DocumentData>(
  collectionName: string,
  queryConstraints: QueryConstraint[] = []
) {
  const [documents, setDocuments] = useState<T[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const collectionRef = collection(db, collectionName)
    const q = query(collectionRef, ...queryConstraints)

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const docs = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as T[]
        setDocuments(docs)
        setLoading(false)
        setError(null)
      },
      (err) => {
        setError(err.message)
        setLoading(false)
      }
    )

    return unsubscribe
  }, [collectionName, queryConstraints])

  return { documents, loading, error }
}

// Firestoreドキュメント用のフック
export function useFirestoreDocument<T = DocumentData>(
  collectionName: string,
  documentId: string
) {
  const [document, setDocument] = useState<T | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!documentId) {
      setLoading(false)
      return
    }

    const docRef = doc(db, collectionName, documentId)

    const unsubscribe = onSnapshot(
      docRef,
      (snapshot) => {
        if (snapshot.exists()) {
          setDocument({
            id: snapshot.id,
            ...snapshot.data()
          } as T)
        } else {
          setDocument(null)
        }
        setLoading(false)
        setError(null)
      },
      (err) => {
        setError(err.message)
        setLoading(false)
      }
    )

    return unsubscribe
  }, [collectionName, documentId])

  return { document, loading, error }
}

// Firestore操作用のフック
export function useFirestoreOperations(collectionName: string) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const addDocument = useCallback(async (data: any) => {
    setLoading(true)
    setError(null)
    try {
      const docRef = await addDoc(collection(db, collectionName), {
        ...data,
        createdAt: new Date(),
        updatedAt: new Date()
      })
      setLoading(false)
      return docRef.id
    } catch (err: any) {
      setError(err.message)
      setLoading(false)
      throw err
    }
  }, [collectionName])

  const updateDocument = useCallback(async (documentId: string, data: any) => {
    setLoading(true)
    setError(null)
    try {
      await updateDoc(doc(db, collectionName, documentId), {
        ...data,
        updatedAt: new Date()
      })
      setLoading(false)
    } catch (err: any) {
      setError(err.message)
      setLoading(false)
      throw err
    }
  }, [collectionName])

  const deleteDocument = useCallback(async (documentId: string) => {
    setLoading(true)
    setError(null)
    try {
      await deleteDoc(doc(db, collectionName, documentId))
      setLoading(false)
    } catch (err: any) {
      setError(err.message)
      setLoading(false)
      throw err
    }
  }, [collectionName])

  return {
    loading,
    error,
    addDocument,
    updateDocument,
    deleteDocument
  }
}

// 特定のFirebase Function用のカスタムフック
export function useHelloWorld() {
  return useFirebaseFunction((name?: string) => firebaseFunctionsClient.helloWorld(name))
}

export function useProcessData() {
  return useFirebaseFunction((data: any) => firebaseFunctionsClient.processData(data))
}

export function useGetUserInfo() {
  return useFirebaseFunction((userId: string) => firebaseFunctionsClient.getUserInfo(userId))
}

export function useTaskOperations() {
  const createTask = useFirebaseFunction((task: { title: string; description?: string }) => 
    firebaseFunctionsClient.createTask(task)
  )
  
  const getTasks = useFirebaseFunction(() => firebaseFunctionsClient.getTasks())
  
  const updateTask = useFirebaseFunction((taskId: string, updates: any) =>
    firebaseFunctionsClient.updateTask(taskId, updates)
  )
  
  const deleteTask = useFirebaseFunction((taskId: string) =>
    firebaseFunctionsClient.deleteTask(taskId)
  )

  return {
    createTask,
    getTasks,
    updateTask,
    deleteTask
  }
}
