export interface CalendarEventData {
  siteName: string
  startDate: string
  endDate: string
  description?: string
  location?: string
  eventUrl: string
}

export const createCalendarEvent = async (eventData: CalendarEventData) => {
  try {
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

    return await response.json()
  } catch (error) {
    console.error('Calendar API エラー:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
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

export const deleteCalendarEvent = async (eventId: string) => {
  try {
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

    return await response.json()
  } catch (error) {
    console.error('Calendar API 削除エラー:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
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
