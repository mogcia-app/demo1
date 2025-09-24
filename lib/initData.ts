import { 
  collection, 
  addDoc, 
  getDocs, 
  query, 
  where 
} from 'firebase/firestore'
import { db } from './firebase'
import { COLLECTIONS, DEFAULT_EQUIPMENT_CATEGORIES, SAMPLE_EQUIPMENT } from './types'

// 機材カテゴリーの初期化
export const initializeEquipmentCategories = async () => {
  try {
    // 既存のカテゴリーをチェック
    const categoriesQuery = query(collection(db, COLLECTIONS.EQUIPMENT_CATEGORIES))
    const categoriesSnapshot = await getDocs(categoriesQuery)
    
    if (categoriesSnapshot.empty) {
      console.log('機材カテゴリーを初期化中...')
      
      for (const category of DEFAULT_EQUIPMENT_CATEGORIES) {
        await addDoc(collection(db, COLLECTIONS.EQUIPMENT_CATEGORIES), category)
      }
      
      console.log('機材カテゴリーの初期化が完了しました')
    } else {
      console.log('機材カテゴリーは既に存在します')
    }
  } catch (error) {
    console.error('機材カテゴリーの初期化エラー:', error)
    throw error
  }
}

// サンプル機材データの初期化
export const initializeSampleEquipment = async () => {
  try {
    // 既存の機材をチェック
    const equipmentQuery = query(collection(db, COLLECTIONS.EQUIPMENT))
    const equipmentSnapshot = await getDocs(equipmentQuery)
    
    if (equipmentSnapshot.empty) {
      console.log('サンプル機材データを初期化中...')
      
      for (const equipment of SAMPLE_EQUIPMENT) {
        await addDoc(collection(db, COLLECTIONS.EQUIPMENT), {
          ...equipment,
          createdAt: new Date(),
          updatedAt: new Date(),
        })
      }
      
      console.log('サンプル機材データの初期化が完了しました')
    } else {
      console.log('機材データは既に存在します')
    }
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
          equipment: [
            { id: 'eq1', name: '音響システム A', category: '音響', quantity: 2 },
            { id: 'eq2', name: '照明器具 B', category: '照明', quantity: 4 },
            { id: 'eq3', name: 'マイクセット C', category: '音響', quantity: 6 }
          ],
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
          equipment: [
            { id: 'eq4', name: '大型スピーカー D', category: '音響', quantity: 8 },
            { id: 'eq5', name: 'レーザー照明 E', category: '照明', quantity: 2 }
          ],
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
