import { google } from 'googleapis'

// Google Calendar APIの設定
const auth = new google.auth.GoogleAuth({
  credentials: process.env.GOOGLE_SERVICE_ACCOUNT_KEY ? JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_KEY) : undefined,
  scopes: ['https://www.googleapis.com/auth/calendar']
})

const calendar = google.calendar({ version: 'v3', auth })

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
    // 終了日が開始日と同じ場合は翌日に設定
    const endDate = eventData.startDate === eventData.endDate 
      ? new Date(new Date(eventData.startDate).getTime() + 24 * 60 * 60 * 1000).toISOString().split('T')[0]
      : eventData.endDate

    const event = {
      summary: `現場: ${eventData.siteName}`,
      description: `
現場名: ${eventData.siteName}
開始日: ${eventData.startDate}
終了日: ${eventData.endDate}
${eventData.description ? `備考: ${eventData.description}` : ''}

詳細・機材一覧はこちら: ${eventData.eventUrl}
      `.trim(),
      location: eventData.location || '',
      start: {
        date: eventData.startDate,
      },
      end: {
        date: endDate,
      },
      visibility: 'public',
      guestsCanSeeOtherGuests: false,
      guestsCanModify: false,
    }

    const response = await calendar.events.insert({
      calendarId: 'primary',
      requestBody: event,
    })

    return {
      success: true,
      eventId: response.data.id,
      eventUrl: response.data.htmlLink,
      calendarUrl: `https://calendar.google.com/calendar/event?eid=${response.data.id}`
    }
  } catch (error) {
    console.error('Google Calendar API エラー:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

export const updateCalendarEvent = async (eventId: string, eventData: CalendarEventData) => {
  try {
    // 終了日が開始日と同じ場合は翌日に設定
    const endDate = eventData.startDate === eventData.endDate 
      ? new Date(new Date(eventData.startDate).getTime() + 24 * 60 * 60 * 1000).toISOString().split('T')[0]
      : eventData.endDate

    const event = {
      summary: `現場: ${eventData.siteName}`,
      description: `
現場名: ${eventData.siteName}
開始日: ${eventData.startDate}
終了日: ${eventData.endDate}
${eventData.description ? `備考: ${eventData.description}` : ''}

詳細・機材一覧はこちら: ${eventData.eventUrl}
      `.trim(),
      location: eventData.location || '',
      start: {
        date: eventData.startDate,
      },
      end: {
        date: endDate,
      },
    }

    const response = await calendar.events.update({
      calendarId: 'primary',
      eventId: eventId,
      requestBody: event,
    })

    return {
      success: true,
      eventId: response.data.id,
      eventUrl: response.data.htmlLink,
    }
  } catch (error) {
    console.error('Google Calendar API 更新エラー:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

export const deleteCalendarEvent = async (eventId: string) => {
  try {
    await calendar.events.delete({
      calendarId: 'primary',
      eventId: eventId,
    })

    return {
      success: true,
    }
  } catch (error) {
    console.error('Google Calendar API 削除エラー:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}
