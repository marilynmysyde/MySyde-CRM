import { useDroppable } from '@dnd-kit/core'
import PostCard from './PostCard'

const COLUMN_CONFIG = {
  idea:      { label: 'Idea',      dotColor: 'bg-gray-400' },
  draft:     { label: 'Draft',     dotColor: 'bg-blue-400' },
  review:    { label: 'Review',    dotColor: 'bg-amber-400' },
  scheduled: { label: 'Scheduled', dotColor: 'bg-purple-500' },
  live:      { label: 'Live',      dotColor: 'bg-green-500' },
}

export default function PostColumn({ status, posts, onPostClick }) {
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
          {posts.length}
        </span>
      </div>

      {/* Droppable area */}
      <div
        ref={setNodeRef}
        className={`flex-1 min-h-[160px] rounded-lg p-2 space-y-2 transition-colors ${
          isOver ? 'bg-[#02348E]/8 ring-2 ring-[#02348E]/25' : 'bg-[#F2F3F7]'
        }`}
      >
        {posts.length === 0 && (
          <p
            className={`text-[10px] text-center py-6 italic transition-colors ${
              isOver ? 'text-[#02348E]/50' : 'text-gray-400'
            }`}
            style={{ fontFamily: "'Roboto Condensed', sans-serif" }}
          >
            {isOver ? 'Drop here' : 'Empty'}
          </p>
        )}
        {posts.map(post => (
          <PostCard
            key={post.id}
            post={post}
            onClick={() => onPostClick?.(post)}
          />
        ))}
      </div>
    </div>
  )
}
