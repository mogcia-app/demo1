export interface CalendarEventData {
  siteName: string
  startDate: string
  endDate: string
  description?: string
  location?: string
  eventUrl: string
}

export const createCalendarEvent = async (eventData: CalendarEventData, retryCount = 3) => {
  for (let attempt = 1; attempt <= retryCount; attempt++) {
    try {
      console.log(`📅 Googleカレンダー作成試行 ${attempt}/${retryCount}`)
      
      const response = await fetch('/api/calendar', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'create',
          eventData
        })
      })

      const result = await response.json()
      
      if (result.success) {
        console.log(`✅ Googleカレンダー作成成功 (試行 ${attempt}/${retryCount})`)
        return result
      } else {
        console.warn(`⚠️ Googleカレンダー作成失敗 (試行 ${attempt}/${retryCount}):`, result.error)
        
        if (attempt < retryCount) {
          const delay = attempt * 1000 // 1秒, 2秒, 3秒...
          console.log(`⏳ ${delay}ms後にリトライします...`)
          await new Promise(resolve => setTimeout(resolve, delay))
        }
      }
    } catch (error) {
      console.error(`❌ Googleカレンダー作成エラー (試行 ${attempt}/${retryCount}):`, error)
      
      if (attempt < retryCount) {
        const delay = attempt * 1000
        console.log(`⏳ ${delay}ms後にリトライします...`)
        await new Promise(resolve => setTimeout(resolve, delay))
      }
    }
  }
  
  console.error(`❌ Googleカレンダー作成失敗: ${retryCount}回の試行後も成功しませんでした`)
  return {
    success: false,
    error: `${retryCount}回の試行後も作成に失敗しました`
  }
}

export const updateCalendarEvent = async (eventId: string, eventData: CalendarEventData) => {
  try {
    const response = await fetch('/api/calendar', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        action: 'update',
        eventId,
        eventData
      })
    })

    return await response.json()
  } catch (error) {
    console.error('Calendar API 更新エラー:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

export const deleteCalendarEvent = async (eventId: string, retryCount = 3) => {
  for (let attempt = 1; attempt <= retryCount; attempt++) {
    try {
      console.log(`🗑️ Googleカレンダー削除試行 ${attempt}/${retryCount}: ${eventId}`)
      
      const response = await fetch('/api/calendar', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'delete',
          eventId
        })
      })

      const result = await response.json()
      
      if (result.success) {
        console.log(`✅ Googleカレンダー削除成功 (試行 ${attempt}/${retryCount})`)
        return result
      } else {
        console.warn(`⚠️ Googleカレンダー削除失敗 (試行 ${attempt}/${retryCount}):`, result.error)
        
        if (attempt < retryCount) {
          const delay = attempt * 1000 // 1秒, 2秒, 3秒...
          console.log(`⏳ ${delay}ms後にリトライします...`)
          await new Promise(resolve => setTimeout(resolve, delay))
        }
      }
    } catch (error) {
      console.error(`❌ Googleカレンダー削除エラー (試行 ${attempt}/${retryCount}):`, error)
      
      if (attempt < retryCount) {
        const delay = attempt * 1000
        console.log(`⏳ ${delay}ms後にリトライします...`)
        await new Promise(resolve => setTimeout(resolve, delay))
      }
    }
  }
  
  console.error(`❌ Googleカレンダー削除失敗: ${retryCount}回の試行後も成功しませんでした`)
  return {
    success: false,
    error: `${retryCount}回の試行後も削除に失敗しました`
  }
}

export const getCalendarInfo = async () => {
  try {
    const response = await fetch('/api/calendar', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        action: 'info'
      })
    })

    return await response.json()
  } catch (error) {
    console.error('Calendar API 情報取得エラー:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}
