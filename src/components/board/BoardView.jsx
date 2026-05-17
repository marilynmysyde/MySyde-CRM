import { useState } from 'react'
import {
  DndContext,
  DragOverlay,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core'
import { sortableKeyboardCoordinates, arrayMove } from '@dnd-kit/sortable'
import BoardColumn from './BoardColumn'
import DealCard from './DealCard'
import { supabase } from '../../lib/supabase'

const STAGES = [
  { stage: 'prospect', label: 'Prospect' },
  { stage: 'pitched',  label: 'Pitched' },
  { stage: 'proposal', label: 'Proposal' },
  { stage: 'creative', label: 'Creative' },
  { stage: 'live',     label: 'Live' },
]

export default function BoardView({ initialDeals }) {
  const [deals, setDeals]     = useState(initialDeals)
  const [activeId, setActiveId] = useState(null)

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  )

  function getDealsByStage(stage) {
    return deals.filter(d => d.stage === stage)
  }

  function findStageForDeal(id) {
    return deals.find(d => d.id === id)?.stage
  }

  function handleDragStart({ active }) {
    setActiveId(active.id)
  }

  async function handleDragEnd({ active, over }) {
    setActiveId(null)
    if (!over) return

    const fromStage = findStageForDeal(active.id)
    const toStage   = STAGES.find(s => s.stage === over.id)?.stage ?? findStageForDeal(over.id)

    if (!fromStage || !toStage) return

    if (fromStage === toStage) {
      // Reorder within same column
      setDeals(prev => {
        const stageDeals = prev.filter(d => d.stage === fromStage)
        const others     = prev.filter(d => d.stage !== fromStage)
        const oldIndex   = stageDeals.findIndex(d => d.id === active.id)
        const newIndex   = stageDeals.findIndex(d => d.id === over.id)
        return [...others, ...arrayMove(stageDeals, oldIndex, newIndex)]
      })
    } else {
      // Move to different stage
      setDeals(prev => prev.map(d => d.id === active.id ? { ...d, stage: toStage } : d))
      // Persist to Supabase (best-effort — silently fails if not connected yet)
      await supabase.from('deals').update({ stage: toStage }).eq('id', active.id).catch(() => null)
    }
  }

  const activeDeal = deals.find(d => d.id === activeId)

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="flex gap-3 p-4 overflow-x-auto min-h-full">
        {STAGES.map(({ stage, label }) => (
          <BoardColumn
            key={stage}
            stage={stage}
            label={label}
            deals={getDealsByStage(stage)}
          />
        ))}
      </div>

      <DragOverlay>
        {activeDeal ? <DealCard deal={activeDeal} /> : null}
      </DragOverlay>
    </DndContext>
  )
}
