import { teamMemberChip } from '../../lib/team'

// Compact colored avatar + name for the assigned team member.
// Sizes: 'sm' (cards), 'md' (lists/detail views).
export default function AssigneeChip({ name, size = 'sm' }) {
  if (!name) return null
  const { initial, color } = teamMemberChip(name)

  const dims = size === 'md'
    ? { dot: 'w-5 h-5 text-[10px]', text: 'text-xs' }
    : { dot: 'w-4 h-4 text-[9px]',  text: 'text-[10px]' }

  return (
    <div className="flex items-center gap-1 shrink-0">
      <span
        className={`${dims.dot} rounded-full text-white font-bold flex items-center justify-center`}
        style={{ background: color, fontFamily: 'Manrope, sans-serif' }}
        aria-hidden
      >
        {initial}
      </span>
      <span
        className={`${dims.text} font-semibold`}
        style={{ color, fontFamily: 'Manrope, sans-serif' }}
      >
        {name}
      </span>
    </div>
  )
}
