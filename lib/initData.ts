import { 
  collection, 
  addDoc, 
  getDocs, 
  query, 
  where,
  deleteDoc,
  doc
} from 'firebase/firestore'
import { db } from './firebase'
import { COLLECTIONS, DEFAULT_EQUIPMENT_CATEGORIES, SAMPLE_EQUIPMENT } from './types'

// 全ての機材グループを削除
export const removeAllGroups = async () => {
  try {
    console.log('全ての機材グループを削除中...')
    
    const categoriesQuery = query(collection(db, COLLECTIONS.EQUIPMENT_CATEGORIES))
    const categoriesSnapshot = await getDocs(categoriesQuery)
    
    for (const categoryDoc of categoriesSnapshot.docs) {
      await deleteDoc(doc(db, COLLECTIONS.EQUIPMENT_CATEGORIES, categoryDoc.id))
      console.log(`グループ「${categoryDoc.data().name}」を削除しました`)
    }
    
    console.log('全ての機材グループの削除が完了しました')
  } catch (error) {
    console.error('機材グループ削除エラー:', error)
    throw error
  }
}

// 機材カテゴリーの初期化（空の状態で開始）
export const initializeEquipmentCategories = async () => {
  try {
    // 全ての既存グループを削除
    await removeAllGroups()
    console.log('機材カテゴリーは空の状態で開始します')
  } catch (error) {
    console.error('機材カテゴリーの初期化エラー:', error)
    throw error
  }
}

// サンプル機材データの初期化（空の状態で開始）
export const initializeSampleEquipment = async () => {
  try {
    console.log('機材データは空の状態で開始します')
    // デフォルト機材は作成しない
  } catch (error) {
    console.error('サンプル機材データの初期化エラー:', error)
    throw error
  }
}

// サンプルイベントデータの初期化（空の状態で開始）
export const initializeSampleEvents = async (userId: string) => {
  try {
    console.log('イベントデータは空の状態で開始します')
    // デフォルトイベントは作成しない
  } catch (error) {
    console.error('サンプルイベントデータの初期化エラー:', error)
    throw error
  }
}

// 既存のサンプルイベントを削除
export const removeSampleEvents = async () => {
  try {
    console.log('サンプルイベントを削除中...')
    
    const eventsQuery = query(collection(db, COLLECTIONS.EVENTS))
    const eventsSnapshot = await getDocs(eventsQuery)
    
    for (const eventDoc of eventsSnapshot.docs) {
      const eventData = eventDoc.data()
      // サンプルイベントかどうかを判定
      if (eventData.siteName === '東京ドーム イベント会場' || 
          eventData.siteName === '横浜アリーナ コンサート') {
        await deleteDoc(doc(db, COLLECTIONS.EVENTS, eventDoc.id))
        console.log(`サンプルイベント「${eventData.siteName}」を削除しました`)
      }
    }
    
    console.log('サンプルイベントの削除が完了しました')
  } catch (error) {
    console.error('サンプルイベント削除エラー:', error)
    throw error
  }
}

// 全てのデータをクリア
export const clearAllData = async () => {
  try {
    console.log('全データをクリア中...')
    
    // 機材カテゴリーを削除
    const categoriesQuery = query(collection(db, COLLECTIONS.EQUIPMENT_CATEGORIES))
    const categoriesSnapshot = await getDocs(categoriesQuery)
    for (const categoryDoc of categoriesSnapshot.docs) {
      await deleteDoc(doc(db, COLLECTIONS.EQUIPMENT_CATEGORIES, categoryDoc.id))
    }
    
    // 機材を削除
    const equipmentQuery = query(collection(db, COLLECTIONS.EQUIPMENT))
    const equipmentSnapshot = await getDocs(equipmentQuery)
    for (const equipmentDoc of equipmentSnapshot.docs) {
      await deleteDoc(doc(db, COLLECTIONS.EQUIPMENT, equipmentDoc.id))
    }
    
    // イベントを削除
    const eventsQuery = query(collection(db, COLLECTIONS.EVENTS))
    const eventsSnapshot = await getDocs(eventsQuery)
    for (const eventDoc of eventsSnapshot.docs) {
      await deleteDoc(doc(db, COLLECTIONS.EVENTS, eventDoc.id))
    }
    
    console.log('全データのクリアが完了しました')
  } catch (error) {
    console.error('データクリアエラー:', error)
    throw error
  }
}

// 全ての初期化を実行
export const initializeAllData = async (userId: string) => {
  try {
    await initializeEquipmentCategories()
    await initializeSampleEquipment()
    await initializeSampleEvents(userId)
    console.log('全ての初期化が完了しました')
  } catch (error) {
    console.error('初期化エラー:', error)
    throw error
  }
}
