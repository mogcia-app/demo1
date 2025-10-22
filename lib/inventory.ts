import { doc, runTransaction, collection, query, where, getDocs } from 'firebase/firestore'
import { db } from './firebase'

// 在庫減算用のトランザクション処理
export interface InventoryItem {
  equipmentId: string
  quantity: number
}

// 在庫を減算（現場登録時）
export const decreaseInventory = async (items: InventoryItem[]) => {
  try {
    console.log('🔍 在庫減算開始 - 対象機材:', items)
    
    await runTransaction(db, async (transaction) => {
      // 全ての機材データを取得（フィールド内のidで検索）
      const equipmentDocs = await Promise.all(
        items.map(async (item) => {
          console.log(`🔍 機材 #${item.equipmentId} を検索中...`)
          const q = query(collection(db, 'equipment'), where('id', '==', item.equipmentId))
          const snapshot = await getDocs(q)
          if (snapshot.empty) {
            console.error(`❌ 機材 #${item.equipmentId} が見つかりません`)
            // デバッグ: 全ての機材をリストアップ
            const allEquipmentRef = collection(db, 'equipment')
            const allEquipmentSnapshot = await getDocs(allEquipmentRef)
            console.log('📋 Firestoreに存在する機材:', allEquipmentSnapshot.docs.map(doc => ({
              docId: doc.id,
              fieldId: doc.data().id,
              name: doc.data().name,
              stock: doc.data().stock
            })))
            throw new Error(`機材 #${item.equipmentId} が見つかりません`)
          }
          const equipmentDoc = snapshot.docs[0]
          console.log(`✅ 機材 #${item.equipmentId} が見つかりました:`, equipmentDoc.data().name)
          return equipmentDoc
        })
      )

      // 在庫チェック
      for (let i = 0; i < items.length; i++) {
        const item = items[i]
        const equipmentDoc = equipmentDocs[i]
        const currentStock = equipmentDoc.data().stock || 0

        if (currentStock < item.quantity) {
          const equipmentName = equipmentDoc.data().name
          throw new Error(
            `⚠️ 在庫不足\n\n機材: ${equipmentName}\n要求数量: ${item.quantity}台\n現在の在庫: ${currentStock}台\n\n在庫が不足しています。`
          )
        }
      }

      // 在庫を減算
      for (let i = 0; i < items.length; i++) {
        const item = items[i]
        const equipmentDoc = equipmentDocs[i]
        const currentStock = equipmentDoc.data().stock || 0
        const newStock = currentStock - item.quantity

        transaction.update(doc(db, 'equipment', equipmentDoc.id), {
          stock: newStock,
          quantity: newStock,
          updatedAt: new Date()
        })
      }
    })

    console.log('✅ 在庫減算成功')
    return { success: true }
  } catch (error: any) {
    console.error('❌ 在庫減算エラー:', error)
    return { success: false, error: error.message }
  }
}

// 在庫を増加（現場削除時、またはキャンセル時）
export const increaseInventory = async (items: InventoryItem[]) => {
  try {
    await runTransaction(db, async (transaction) => {
      // 全ての機材データを取得（フィールド内のidで検索）
      const equipmentDocs = await Promise.all(
        items.map(async (item) => {
          const q = query(collection(db, 'equipment'), where('id', '==', item.equipmentId))
          const snapshot = await getDocs(q)
          if (snapshot.empty) {
            throw new Error(`機材 #${item.equipmentId} が見つかりません`)
          }
          return snapshot.docs[0]
        })
      )

      // 在庫を増加
      for (let i = 0; i < items.length; i++) {
        const item = items[i]
        const equipmentDoc = equipmentDocs[i]
        const currentStock = equipmentDoc.data().stock || 0
        const newStock = currentStock + item.quantity

        transaction.update(doc(db, 'equipment', equipmentDoc.id), {
          stock: newStock,
          quantity: newStock,
          updatedAt: new Date()
        })
      }
    })

    console.log('✅ 在庫復元成功')
    return { success: true }
  } catch (error: any) {
    console.error('❌ 在庫復元エラー:', error)
    return { success: false, error: error.message }
  }
}

// 在庫を調整（機材変更時）
export const adjustInventory = async (
  previousItems: InventoryItem[],
  newItems: InventoryItem[]
) => {
  try {
    console.log('🔄 在庫調整処理開始')
    console.log('前回の機材:', previousItems)
    console.log('新しい機材:', newItems)

    // 差分を計算
    const adjustments = new Map<string, number>()

    // 前回の機材を在庫に戻す
    previousItems.forEach(item => {
      const current = adjustments.get(item.equipmentId) || 0
      adjustments.set(item.equipmentId, current + item.quantity)
      console.log(`機材 #${item.equipmentId}: +${item.quantity} (復元)`)
    })

    // 新しい機材を在庫から減らす
    newItems.forEach(item => {
      const current = adjustments.get(item.equipmentId) || 0
      adjustments.set(item.equipmentId, current - item.quantity)
      console.log(`機材 #${item.equipmentId}: -${item.quantity} (使用)`)
    })

    // 変更があるもののみ処理
    const itemsToAdjust = Array.from(adjustments.entries())
      .filter(([_, diff]) => diff !== 0)
      .map(([equipmentId, diff]) => ({
        equipmentId,
        adjustment: diff
      }))

    console.log('調整が必要な機材:', itemsToAdjust)

    if (itemsToAdjust.length === 0) {
      console.log('✅ 在庫調整不要 - 変更なし')
      return { success: true }
    }

    await runTransaction(db, async (transaction) => {
      console.log('🔄 Firestoreトランザクション開始')
      
      // 全ての機材データを取得（フィールド内のidで検索）
      const equipmentDocs = await Promise.all(
        itemsToAdjust.map(async (item) => {
          const q = query(collection(db, 'equipment'), where('id', '==', item.equipmentId))
          const snapshot = await getDocs(q)
          if (snapshot.empty) {
            throw new Error(`機材 #${item.equipmentId} が見つかりません`)
          }
          return { doc: snapshot.docs[0], adjustment: item.adjustment }
        })
      )

      // 在庫チェック（減算の場合のみ）
      for (const { doc: equipmentDoc, adjustment } of equipmentDocs) {
        if (adjustment < 0) {
          const currentStock = equipmentDoc.data().stock || 0
          const requiredStock = Math.abs(adjustment)
          
          console.log(`在庫チェック - 機材 #${equipmentDoc.data().id}: 現在${currentStock}台, 必要${requiredStock}台`)
          
          if (currentStock < requiredStock) {
            const equipmentName = equipmentDoc.data().name
            const errorMessage = `⚠️ 在庫不足\n\n機材: ${equipmentName}\n要求数量: ${requiredStock}台\n現在の在庫: ${currentStock}台\n\n在庫が不足しています。`
            console.error('❌ 在庫不足エラー:', errorMessage)
            throw new Error(errorMessage)
          }
        }
      }

      // 在庫を調整
      for (const { doc: equipmentDoc, adjustment } of equipmentDocs) {
        const currentStock = equipmentDoc.data().stock || 0
        const newStock = currentStock + adjustment

        console.log(`在庫調整 - 機材 #${equipmentDoc.data().id}: ${currentStock} → ${newStock} (${adjustment > 0 ? '+' : ''}${adjustment})`)

        transaction.update(doc(db, 'equipment', equipmentDoc.id), {
          stock: newStock,
          quantity: newStock,
          updatedAt: new Date()
        })
      }
    })

    console.log('✅ 在庫調整成功')
    return { success: true }
  } catch (error: any) {
    console.error('❌ 在庫調整エラー:', error)
    return { success: false, error: error.message }
  }
}
