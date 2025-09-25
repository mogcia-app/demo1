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

// サンプルイベントデータの初期化
export const initializeSampleEvents = async (userId: string) => {
  try {
    // 既存のイベントをチェック
    const eventsQuery = query(collection(db, COLLECTIONS.EVENTS))
    const eventsSnapshot = await getDocs(eventsQuery)
    
    if (eventsSnapshot.empty) {
      console.log('サンプルイベントデータを初期化中...')
      
      const sampleEvents = [
        {
          siteName: '東京ドーム イベント会場',
          startDate: '2024-01-15',
          endDate: '2024-01-17',
          equipment: [],
          description: '大型イベント会場での音響・照明機材セットアップ',
          status: 'confirmed' as const,
          createdBy: userId,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          siteName: '横浜アリーナ コンサート',
          startDate: '2024-01-20',
          endDate: '2024-01-20',
          equipment: [],
          description: 'コンサート会場での大型音響システム設置',
          status: 'confirmed' as const,
          createdBy: userId,
          createdAt: new Date(),
          updatedAt: new Date(),
        }
      ]
      
      for (const event of sampleEvents) {
        await addDoc(collection(db, COLLECTIONS.EVENTS), event)
      }
      
      console.log('サンプルイベントデータの初期化が完了しました')
    } else {
      console.log('イベントデータは既に存在します')
    }
  } catch (error) {
    console.error('サンプルイベントデータの初期化エラー:', error)
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
