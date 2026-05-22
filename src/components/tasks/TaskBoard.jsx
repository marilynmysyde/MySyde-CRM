import { DndContext, DragOverlay, PointerSensor, useSensor, useSensors } from '@dnd-kit/core'
import { useState } from 'react'
import { supabase } from '../../lib/supabase'
import TaskColumn from './TaskColumn'
import TaskCard from './TaskCard'

const STATUSES = ['todo', 'in_progress', 'review', 'done']

function nextDueDate(due, rule) {
  if (!due || !rule) return null
  const d = new Date(due + 'T00:00:00')
  if (rule === 'weekly')    d.setDate(d.getDate() + 7)
  if (rule === 'monthly')   d.setMonth(d.getMonth() + 1)
  if (rule === 'quarterly') d.setMonth(d.getMonth() + 3)
  return d.toISOString().slice(0, 10)
}

export default function TaskBoard({ tasks, setTasks, showPartner = false }) {
  const [activeTask, setActiveTask] = useState(null)

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  )

  function handleDragStart(event) {
    const task = tasks.find(t => t.id === event.active.id)
    setActiveTask(task ?? null)
  }

  async function handleDragEnd(event) {
    const { active, over } = event
    setActiveTask(null)
    if (!over || !STATUSES.includes(over.id)) return

    const taskId    = active.id
    const newStatus = over.id
    const task      = tasks.find(t => t.id === taskId)
    if (!task || task.status === newStatus) return

    // Optimistic update
    setTasks(prev => prev.map(t => t.id === taskId ? { ...t, status: newStatus } : t))

    // Supabase
    await supabase.from('tasks').update({ status: newStatus }).eq('id', taskId).catch(() => null)

    // Recurring: when moved to done, auto-generate the next instance
    if (newStatus === 'done' && task.is_recurring && task.recurrence_rule) {
      const { id: _id, created_at: _ca, ...rest } = task
      const nextTask = { ...rest, status: 'todo', due_date: nextDueDate(task.due_date, task.recurrence_rule) }

      const { data } = await supabase
        .from('tasks')
        .insert(nextTask)
        .select('*, partners(id, name, type)')
        .single()
        .catch(() => ({ data: null }))

      setTasks(prev => [
        data ?? { ...nextTask, id: crypto.randomUUID(), created_at: new Date().toISOString() },
        ...prev,
      ])
    }
  }

  function handleDragCancel() {
    setActiveTask(null)
  }

  return (
    <DndContext
      sensors={sensors}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDragCancel={handleDragCancel}
    >
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {STATUSES.map(status => (
          <TaskColumn
            key={status}
            status={status}
            tasks={tasks.filter(t => t.status === status)}
            showPartner={showPartner}
          />
        ))}
      </div>

      {/* Drag ghost */}
      <DragOverlay>
        {activeTask ? <TaskCard task={activeTask} showPartner={showPartner} /> : null}
      </DragOverlay>
    </DndContext>
  )
}
