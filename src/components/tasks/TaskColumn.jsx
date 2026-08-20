import { useDroppable } from '@dnd-kit/core'
import { useState } from 'react'
import TaskCard from './TaskCard'

const COLUMN_CONFIG = {
  todo:        { label: 'To Do',       dotColor: 'bg-gray-400' },
  in_progress: { label: 'In Progress', dotColor: 'bg-[#1D4ED8]' },
  review:      { label: 'Review',      dotColor: 'bg-amber-400' },
  done:        { label: 'Done',        dotColor: 'bg-green-500' },
}

// Done tasks completed within this window stay visible by default; older ones
// (and legacy done tasks with no completed_at yet) collapse behind "Show older".
const DONE_WINDOW_DAYS = 7

function isRecent(task) {
  if (!task.completed_at) return false
  const ageMs = Date.now() - new Date(task.completed_at).getTime()
  return ageMs <= DONE_WINDOW_DAYS * 24 * 60 * 60 * 1000
}

export default function TaskColumn({ status, tasks, showPartner = false, onOpenTask }) {
  const { setNodeRef, isOver } = useDroppable({ id: status })
  const col = COLUMN_CONFIG[status]
  const [showOlder, setShowOlder] = useState(false)

  const isDone      = status === 'done'
  const recentTasks = isDone ? tasks.filter(isRecent) : tasks
  const olderTasks  = isDone ? tasks.filter(t => !isRecent(t)) : []
  const visibleTasks = isDone && showOlder ? tasks : recentTasks

  return (
    <div className="flex flex-col min-w-0">
      {/* Header */}
      <div className="flex items-center gap-2 mb-2 px-1">
        <span className={`w-2 h-2 rounded-full shrink-0 ${col.dotColor}`} />
        <span
          className="text-xs font-semibold text-[#111827] uppercase tracking-wide flex-1"
          style={{ fontFamily: 'Manrope, sans-serif' }}
        >
          {col.label}
        </span>
        <span
          className="text-[10px] text-gray-500 bg-white rounded-full px-1.5 py-0.5 font-medium border border-gray-100"
          style={{ fontFamily: "'Manrope', sans-serif" }}
        >
          {tasks.length}
        </span>
      </div>

      {/* Droppable area */}
      <div
        ref={setNodeRef}
        className={`flex-1 min-h-[160px] rounded-lg p-2 space-y-2 transition-colors ${
          isOver
            ? 'bg-[#1D4ED8]/8 ring-2 ring-[#1D4ED8]/25'
            : 'bg-[#F9FAFB]'
        }`}
      >
        {tasks.length === 0 && (
          <p
            className={`text-[10px] text-center py-6 italic transition-colors ${
              isOver ? 'text-[#1D4ED8]/50' : 'text-gray-400'
            }`}
            style={{ fontFamily: "'Manrope', sans-serif" }}
          >
            {isOver ? 'Drop here' : 'Empty'}
          </p>
        )}
        {visibleTasks.map(task => (
          <TaskCard key={task.id} task={task} showPartner={showPartner} onOpen={onOpenTask} />
        ))}
        {isDone && olderTasks.length > 0 && (
          <button
            onClick={() => setShowOlder(v => !v)}
            className="w-full text-center text-[10px] font-semibold text-gray-400 hover:text-[#1D4ED8] transition-colors py-1.5"
            style={{ fontFamily: "'Manrope', sans-serif" }}
          >
            {showOlder ? '↑ Hide older' : `Show ${olderTasks.length} older (7+ days) →`}
          </button>
        )}
      </div>
    </div>
  )
}
