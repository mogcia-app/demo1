import { NextRequest, NextResponse } from 'next/server'
import { createCalendarEvent, updateCalendarEvent, deleteCalendarEvent } from '../../../lib/google/calendar'

export async function POST(request: NextRequest) {
  try {
    const { action, eventData, eventId } = await request.json()

    let result
    switch (action) {
      case 'create':
        result = await createCalendarEvent(eventData)
        break
      case 'update':
        result = await updateCalendarEvent(eventId, eventData)
        break
      case 'delete':
        result = await deleteCalendarEvent(eventId)
        break
      default:
        return NextResponse.json({ success: false, error: 'Invalid action' }, { status: 400 })
    }

    return NextResponse.json(result)
  } catch (error) {
    console.error('Calendar API error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
