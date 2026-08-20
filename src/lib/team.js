// MySyde Connect — Team members eligible for task assignment.
// Operational team only. Update this list as the team changes.
// Board members and advisors are intentionally excluded — they don't get tasks in the day-to-day flow.

export const TEAM_MEMBERS = [
  'Marilyn',
  'Francesca',
  'Ricky',
  'Ilse',
  'Matin',
  'Drew',
]

// Per-person color for visual identity across the app (avatars, task assignees, etc.)
// Feel free to swap any of these — just keep the values distinct + accessible against white.
export const TEAM_COLORS = {
  Marilyn:   '#1D4ED8', // MySyde Blue
  Francesca: '#F59E0B', // Amber
  Ricky:     '#10B981', // Emerald
  Ilse:      '#EC4899', // Pink
  Matin:     '#8B5CF6', // Purple
  Drew:      '#0EA5E9', // Sky
}

const FALLBACK_COLOR = '#6B7280'

// Small helper — returns { initial, color } for any name (handles unknowns gracefully).
export function teamMemberChip(name) {
  return {
    initial: name?.[0]?.toUpperCase() ?? '?',
    color:   TEAM_COLORS[name] ?? FALLBACK_COLOR,
  }
}

// Maps a login email (e.g. marilyn@mysyde.com) to a TEAM_MEMBERS name (e.g. "Marilyn"),
// so "assigned to me" filters work without a separate email-to-name mapping table.
export function teamMemberFromEmail(email) {
  if (!email) return null
  const localPart = email.split('@')[0]?.toLowerCase()
  return TEAM_MEMBERS.find(m => m.toLowerCase() === localPart) ?? null
}
