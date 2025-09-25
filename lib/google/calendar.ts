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
    // 日付の形式を確認・修正
    const startDate = eventData.startDate
    const endDate = eventData.endDate || eventData.startDate
    
    // 日付が有効かチェック
    if (!startDate || isNaN(new Date(startDate).getTime())) {
      throw new Error('開始日が無効です')
    }
    
    if (!endDate || isNaN(new Date(endDate).getTime())) {
      throw new Error('終了日が無効です')
    }

    // 終了日が開始日と同じ場合は翌日に設定
    const finalEndDate = startDate === endDate 
      ? new Date(new Date(startDate).getTime() + 24 * 60 * 60 * 1000).toISOString().split('T')[0]
      : endDate

    const event = {
      summary: `現場: ${eventData.siteName}`,
      description: `
現場名: ${eventData.siteName}
開始日: ${startDate}
終了日: ${endDate}
${eventData.description ? `備考: ${eventData.description}` : ''}

詳細・機材一覧はこちら: ${eventData.eventUrl}
      `.trim(),
      location: eventData.location || '',
      start: {
        date: startDate,
      },
      end: {
        date: finalEndDate,
      },
      visibility: 'public',
      guestsCanSeeOtherGuests: false,
      guestsCanModify: false,
    }

    const response = await calendar.events.insert({
      calendarId: '3dd362fe785ceadafe32b3e2ee3587a67843115f8b1747f1ad01e776c738cf39@group.calendar.google.com',
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
    // 日付の形式を確認・修正
    const startDate = eventData.startDate
    const endDate = eventData.endDate || eventData.startDate
    
    // 日付が有効かチェック
    if (!startDate || isNaN(new Date(startDate).getTime())) {
      throw new Error('開始日が無効です')
    }
    
    if (!endDate || isNaN(new Date(endDate).getTime())) {
      throw new Error('終了日が無効です')
    }

    // 終了日が開始日と同じ場合は翌日に設定
    const finalEndDate = startDate === endDate 
      ? new Date(new Date(startDate).getTime() + 24 * 60 * 60 * 1000).toISOString().split('T')[0]
      : endDate

    const event = {
      summary: `現場: ${eventData.siteName}`,
      description: `
現場名: ${eventData.siteName}
開始日: ${startDate}
終了日: ${endDate}
${eventData.description ? `備考: ${eventData.description}` : ''}

詳細・機材一覧はこちら: ${eventData.eventUrl}
      `.trim(),
      location: eventData.location || '',
      start: {
        date: startDate,
      },
      end: {
        date: finalEndDate,
      },
    }

    const response = await calendar.events.update({
      calendarId: '3dd362fe785ceadafe32b3e2ee3587a67843115f8b1747f1ad01e776c738cf39@group.calendar.google.com',
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
      calendarId: '3dd362fe785ceadafe32b3e2ee3587a67843115f8b1747f1ad01e776c738cf39@group.calendar.google.com',
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
