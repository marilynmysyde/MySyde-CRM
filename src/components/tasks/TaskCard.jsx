import { useDraggable } from '@dnd-kit/core'
import { CSS } from '@dnd-kit/utilities'

const PRIORITY_DOT = {
  high:   'bg-red-500',
  medium: 'bg-yellow-400',
  low:    'bg-gray-300',
}

function GripIcon() {
  return (
    <svg width="10" height="14" viewBox="0 0 10 14" fill="currentColor" className="opacity-30">
      <circle cx="2" cy="2"  r="1.2" /><circle cx="8" cy="2"  r="1.2" />
      <circle cx="2" cy="7"  r="1.2" /><circle cx="8" cy="7"  r="1.2" />
      <circle cx="2" cy="12" r="1.2" /><circle cx="8" cy="12" r="1.2" />
    </svg>
  )
}

function fmtDate(dateStr) {
  if (!dateStr) return null
  const d = new Date(dateStr + 'T00:00:00')
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

function dateStatus(dateStr) {
  if (!dateStr) return null
  const today = new Date(); today.setHours(0, 0, 0, 0)
  const due   = new Date(dateStr + 'T00:00:00')
  if (due < today) return 'overdue'
  if (due.getTime() === today.getTime()) return 'today'
  return 'upcoming'
}

export default function TaskCard({ task, showPartner = false }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({ id: task.id })

  const style = {
    transform: CSS.Translate.toString(transform),
    opacity:   isDragging ? 0.45 : 1,
    zIndex:    isDragging ? 50 : undefined,
    position:  isDragging ? 'relative' : undefined,
  }

  const ds = dateStatus(task.due_date)

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      className="bg-white rounded-md border border-gray-100 p-2.5 shadow-sm"
    >
      {/* Top row: grip + priority dot + recurring badge */}
      <div className="flex items-center gap-1.5 mb-1.5">
        <div
          {...listeners}
          className="cursor-grab active:cursor-grabbing text-gray-300 hover:text-gray-500 transition-colors shrink-0"
          onClick={e => e.stopPropagation()}
        >
          <GripIcon />
        </div>
        <span
          className={`w-2 h-2 rounded-full shrink-0 ${PRIORITY_DOT[task.priority] ?? 'bg-gray-300'}`}
          title={`${task.priority ?? 'low'} priority`}
        />
        {task.is_recurring && (
          <span
            className="text-[9px] text-[#02348E] font-semibold uppercase tracking-wide ml-auto"
            style={{ fontFamily: 'Roboto, sans-serif' }}
            title={`Repeats ${task.recurrence_rule}`}
          >
            ↻
          </span>
        )}
      </div>

      {/* Title */}
      <p
        className="text-xs text-[#010100] leading-snug mb-1.5"
        style={{ fontFamily: 'Roboto, sans-serif' }}
      >
        {task.title}
      </p>

      {/* Footer: due date + partner + assigned */}
      <div className="flex items-end justify-between gap-1">
        <div className="flex flex-col gap-0.5 min-w-0">
          {task.due_date && (
            <span
              className={`text-[10px] font-medium ${
                ds === 'overdue' ? 'text-red-500' :
                ds === 'today'   ? 'text-amber-500' :
                                   'text-gray-400'
              }`}
              style={{ fontFamily: "'Roboto Condensed', sans-serif" }}
            >
              {ds === 'overdue' ? '⚠ ' : ds === 'today' ? '● ' : ''}{fmtDate(task.due_date)}
            </span>
          )}
          {showPartner && task.partners?.name && (
            <span
              className="text-[10px] text-gray-400 truncate"
              style={{ fontFamily: "'Roboto Condensed', sans-serif" }}
            >
              {task.partners.name}
            </span>
          )}
        </div>
        {task.assigned_to && (
          <span
            className="text-[10px] text-gray-400 shrink-0"
            style={{ fontFamily: "'Roboto Condensed', sans-serif" }}
          >
            {task.assigned_to}
          </span>
        )}
      </div>
    </div>
  )
}
