import { useDroppable } from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import DealCard from './DealCard'

export default function BoardColumn({ stage, label, deals }) {
  const { setNodeRef, isOver } = useDroppable({ id: stage })

  return (
    <div className="flex flex-col w-64 shrink-0">
      {/* Column header */}
      <div className="bg-[#02348E] rounded-t-lg px-3 py-2 flex items-center justify-between">
        <h3
          className="text-sm font-semibold text-white"
          style={{ fontFamily: "'IBM Plex Sans', sans-serif" }}
        >
          {label}
        </h3>
        <span
          className="bg-white/20 text-white text-xs font-medium px-1.5 py-0.5 rounded-full min-w-[20px] text-center"
          style={{ fontFamily: 'Roboto, sans-serif' }}
        >
          {deals.length}
        </span>
      </div>

      {/* Drop zone */}
      <div
        ref={setNodeRef}
        className={[
          'flex-1 min-h-[400px] rounded-b-lg p-2 space-y-2 transition-colors',
          isOver ? 'bg-blue-50' : 'bg-[#F2F3F7]',
        ].join(' ')}
      >
        <SortableContext items={deals.map(d => d.id)} strategy={verticalListSortingStrategy}>
          {deals.map(deal => (
            <DealCard key={deal.id} deal={deal} />
          ))}
        </SortableContext>

        {deals.length === 0 && (
          <div className="flex items-center justify-center h-20 border-2 border-dashed border-gray-200 rounded-lg">
            <span
              className="text-xs text-gray-300"
              style={{ fontFamily: "'Roboto Condensed', sans-serif" }}
            >
              No deals here
            </span>
          </div>
        )}
      </div>
    </div>
  )
}
