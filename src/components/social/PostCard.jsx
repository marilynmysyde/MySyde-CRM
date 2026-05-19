import { useDraggable } from '@dnd-kit/core'
import { CSS } from '@dnd-kit/utilities'
import PlatformBadge from './PlatformBadge'
import PartnerTypeTag from '../shared/PartnerTypeTag'

function GripIcon() {
  return (
    <svg width="10" height="14" viewBox="0 0 10 14" fill="currentColor" className="opacity-30">
      <circle cx="2" cy="2"  r="1.2" /><circle cx="8" cy="2"  r="1.2" />
      <circle cx="2" cy="7"  r="1.2" /><circle cx="8" cy="7"  r="1.2" />
      <circle cx="2" cy="12" r="1.2" /><circle cx="8" cy="12" r="1.2" />
    </svg>
  )
}

function fmtDate(ts) {
  if (!ts) return null
  return new Date(ts).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })
}

export default function PostCard({ post, onClick }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({ id: post.id })

  const style = {
    transform: CSS.Translate.toString(transform),
    opacity:   isDragging ? 0.45 : 1,
    zIndex:    isDragging ? 50 : undefined,
    position:  isDragging ? 'relative' : undefined,
  }

  const scheduledLabel = fmtDate(post.scheduled_at ?? post.published_at)

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      className="bg-white rounded-md border border-gray-100 p-2.5 shadow-sm group cursor-pointer hover:shadow-md transition-shadow"
      onClick={onClick}
    >
      {/* Top row: grip + platform badges */}
      <div className="flex items-center gap-1.5 mb-1.5">
        <div
          {...listeners}
          className="cursor-grab active:cursor-grabbing text-gray-300 hover:text-gray-500 transition-colors shrink-0"
          onClick={e => e.stopPropagation()}
        >
          <GripIcon />
        </div>
        <div className="flex items-center gap-1 flex-1 flex-wrap">
          {(post.platforms ?? []).map(p => (
            <PlatformBadge key={p} platform={p} size="xs" />
          ))}
        </div>
        {post.canva_file_url && (
          <span
            className="text-[9px] text-[#02348E] font-semibold uppercase tracking-wide shrink-0"
            title="Canva design linked"
            style={{ fontFamily: 'Roboto, sans-serif' }}
          >
            ✦ Canva
          </span>
        )}
      </div>

      {/* Title */}
      <p
        className="text-xs font-medium text-[#010100] leading-snug mb-1 group-hover:text-[#02348E] transition-colors"
        style={{ fontFamily: 'Roboto, sans-serif' }}
      >
        {post.title}
      </p>

      {/* Caption preview */}
      {post.caption && (
        <p
          className="text-[10px] text-gray-400 leading-snug line-clamp-2 mb-1.5"
          style={{ fontFamily: "'Roboto Condensed', sans-serif" }}
        >
          {post.caption}
        </p>
      )}

      {/* Footer: scheduled date + partner */}
      <div className="flex items-center justify-between gap-1 mt-1.5">
        {scheduledLabel ? (
          <span
            className="text-[10px] text-gray-400"
            style={{ fontFamily: "'Roboto Condensed', sans-serif" }}
          >
            {scheduledLabel}
          </span>
        ) : <span />}
        {post.partners?.type && (
          <PartnerTypeTag type={post.partners.type} />
        )}
      </div>
    </div>
  )
}
