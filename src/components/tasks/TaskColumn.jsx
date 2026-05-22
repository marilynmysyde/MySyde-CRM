import { useDroppable } from '@dnd-kit/core'
import TaskCard from './TaskCard'

const COLUMN_CONFIG = {
  todo:        { label: 'To Do',       dotColor: 'bg-gray-400' },
  in_progress: { label: 'In Progress', dotColor: 'bg-[#02348E]' },
  review:      { label: 'Review',      dotColor: 'bg-amber-400' },
  done:        { label: 'Done',        dotColor: 'bg-green-500' },
}

export default function TaskColumn({ status, tasks, showPartner = false }) {
  const { setNodeRef, isOver } = useDroppable({ id: status })
  const col = COLUMN_CONFIG[status]

  return (
    <div className="flex flex-col min-w-0">
      {/* Header */}
      <div className="flex items-center gap-2 mb-2 px-1">
        <span className={`w-2 h-2 rounded-full shrink-0 ${col.dotColor}`} />
        <span
          className="text-xs font-semibold text-[#010100] uppercase tracking-wide flex-1"
          style={{ fontFamily: 'Roboto, sans-serif' }}
        >
          {col.label}
        </span>
        <span
          className="text-[10px] text-gray-500 bg-white rounded-full px-1.5 py-0.5 font-medium border border-gray-100"
          style={{ fontFamily: "'Roboto Condensed', sans-serif" }}
        >
          {tasks.length}
        </span>
      </div>

      {/* Droppable area */}
      <div
        ref={setNodeRef}
        className={`flex-1 min-h-[160px] rounded-lg p-2 space-y-2 transition-colors ${
          isOver
            ? 'bg-[#02348E]/8 ring-2 ring-[#02348E]/25'
            : 'bg-[#F2F3F7]'
        }`}
      >
        {tasks.length === 0 && (
          <p
            className={`text-[10px] text-center py-6 italic transition-colors ${
              isOver ? 'text-[#02348E]/50' : 'text-gray-400'
            }`}
            style={{ fontFamily: "'Roboto Condensed', sans-serif" }}
          >
            {isOver ? 'Drop here' : 'Empty'}
          </p>
        )}
        {tasks.map(task => (
          <TaskCard key={task.id} task={task} showPartner={showPartner} />
        ))}
      </div>
    </div>
  )
}
