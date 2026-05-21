// src/lib/googleCalendar.js
// Fetches Google Calendar events and Gmail thread details using the OAuth token.

import { getGoogleToken } from './googleAuth'

// ─── Calendar ───────────────────────────────────────────────────────────────

/**
 * Fetch events for today (midnight→midnight local) from the primary calendar.
 * Returns an array of { id, summary, start, end, colorId }
 */
export async function fetchTodayEvents() {
  const token = getGoogleToken()
  if (!token) return []

  const now       = new Date()
  const dayStart  = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const dayEnd    = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1)

  const params = new URLSearchParams({
    timeMin:      dayStart.toISOString(),
    timeMax:      dayEnd.toISOString(),
    singleEvents: 'true',
    orderBy:      'startTime',
    maxResults:   '20',
  })

  const res = await fetch(
    `https://www.googleapis.com/calendar/v3/calendars/primary/events?${params}`,
    { headers: { Authorization: `Bearer ${token}` } }
  )
  if (!res.ok) return []

  const { items = [] } = await res.json()
  return items.map(e => ({
    id:      e.id,
    summary: e.summary ?? '(No title)',
    start:   e.start?.dateTime ?? e.start?.date ?? null,
    end:     e.end?.dateTime   ?? e.end?.date   ?? null,
    colorId: e.colorId ?? null,
    allDay:  !e.start?.dateTime,
  }))
}

/** Format event start time as "10:00 AM" */
export function fmtEventTime(startIso) {
  if (!startIso) return ''
  // All-day events are YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}$/.test(startIso)) return 'All day'
  return new Date(startIso).toLocaleTimeString('en-US', {
    hour:   'numeric',
    minute: '2-digit',
  })
}

// ─── Gmail ──────────────────────────────────────────────────────────────────

/**
 * Parse a Gmail URL or raw thread ID.
 * Handles:
 *   https://mail.google.com/mail/u/0/#inbox/17abc123
 *   17abc123
 */
export function parseGmailThreadId(input) {
  if (!input) return null
  const match = input.match(/#[^/]+\/([a-f0-9]+)/)
  if (match) return match[1]
  if (/^[a-f0-9]{16}$/.test(input.trim())) return input.trim()
  return input.trim() || null
}

/**
 * Fetch Gmail thread metadata.
 * Returns { subject, participants, lastDate, messageCount } | null
 */
export async function fetchGmailThread(threadId) {
  const token = getGoogleToken()
  if (!token || !threadId) return null

  const res = await fetch(
    `https://www.googleapis.com/gmail/v1/users/me/threads/${threadId}?format=metadata&metadataHeaders=Subject&metadataHeaders=From&metadataHeaders=To`,
    { headers: { Authorization: `Bearer ${token}` } }
  )
  if (!res.ok) return null

  const thread = await res.json()
  const messages = thread.messages ?? []
  if (messages.length === 0) return null

  // Subject from first message
  const firstHeaders = messages[0].payload?.headers ?? []
  const subject = firstHeaders.find(h => h.name === 'Subject')?.value ?? '(No subject)'

  // Collect unique participants
  const emails = new Set()
  for (const msg of messages) {
    const headers = msg.payload?.headers ?? []
    for (const h of headers) {
      if (h.name === 'From' || h.name === 'To') {
        h.value.split(',').forEach(e => emails.add(e.trim().toLowerCase()))
      }
    }
  }

  // Last message internal date (ms since epoch)
  const lastMsg     = messages[messages.length - 1]
  const lastDate    = lastMsg.internalDate
    ? new Date(Number(lastMsg.internalDate)).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    : null

  return {
    subject,
    participants:   emails.size,
    messageCount:   messages.length,
    lastDate,
  }
}
