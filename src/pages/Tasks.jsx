import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import TaskBoard from '../components/tasks/TaskBoard'
import NewTaskModal from '../components/tasks/NewTaskModal'
import TaskDetailModal from '../components/tasks/TaskDetailModal'
import ConfettiBurst from '../components/tasks/ConfettiBurst'
import CelebrateToast from '../components/tasks/CelebrateToast'

// ─── Tasks page ───────────────────────────────────────────────────────────────

export default function Tasks() {
  const [tasks,       setTasks]       = useState([])
  const [partners,    setPartners]    = useState([])
  const [filter,      setFilter]      = useState('all')
  const [modal,       setModal]       = useState(false)
  const [openTask,    setOpenTask]    = useState(null)
  const [celebrating, setCelebrating] = useState(false)
  const [loading,     setLoading]     = useState(true)

  useEffect(() => {
    async function load() {
      try {
        const { data: t } = await supabase
          .from('tasks')
          .select('*, partners(id, name, type)')
          .order('created_at', { ascending: false })
        const { data: p } = await supabase
          .from('partners')
          .select('id, name, type')
          .eq('active', true)
          .order('name')
        if (t) setTasks(t)
        if (p) setPartners(p)
      } catch { /* ignore */ }
      setLoading(false)
    }
    load()
  }, [])

  // Partners that actually appear in the task list
  const activePartnerIds = [...new Set(tasks.map(t => t.partner_id).filter(Boolean))]
  const filterPartners   = partners.filter(p => activePartnerIds.includes(p.id))

  const visibleTasks = filter === 'all'
    ? tasks
    : tasks.filter(t => t.partner_id === filter)

  function handleCreated(task) {
    setTasks(prev => [task, ...prev])
  }

  function handleUpdated(updated) {
    setTasks(prev => prev.map(t => t.id === updated.id ? { ...t, ...updated } : t))
  }

  function celebrate() {
    setCelebrating(true)
  }

  return (
    <div className="px-4 py-4">

      {/* Page header */}
      <div className="flex items-center justify-between mb-4">
        <h1
          className="text-xl font-semibold text-[#111827]"
          style={{ fontFamily: "'Manrope', sans-serif" }}
        >
          Tasks
        </h1>
        <div className="flex items-center gap-2">
          {loading && (
            <span className="text-xs text-gray-400" style={{ fontFamily: "'Manrope', sans-serif" }}>
              Loading…
            </span>
          )}
          <button
            onClick={() => setModal(true)}
            className="bg-[#1D4ED8] hover:bg-[#1D4ED8]/90 text-white text-sm font-medium px-3 py-1.5 rounded transition-colors"
            style={{ fontFamily: 'Manrope, sans-serif' }}
          >
            + New Task
          </button>
        </div>
      </div>

      {/* Partner filter tabs */}
      <div className="flex items-center gap-1 flex-wrap mb-4 border-b border-gray-200 pb-0">
        {[{ id: 'all', name: 'All' }, ...filterPartners].map(p => (
          <button
            key={p.id}
            onClick={() => setFilter(p.id)}
            className={`px-3 py-2 text-sm font-medium border-b-2 transition-colors -mb-px whitespace-nowrap ${
              filter === p.id
                ? 'border-[#1D4ED8] text-[#1D4ED8]'
                : 'border-transparent text-gray-500 hover:text-[#111827]'
            }`}
            style={{ fontFamily: 'Manrope, sans-serif' }}
          >
            {p.name}
            {p.id !== 'all' && (
              <span className="ml-1.5 text-[10px] bg-gray-100 text-gray-500 rounded-full px-1.5 py-0.5">
                {tasks.filter(t => t.partner_id === p.id).length}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Board */}
      <TaskBoard
        tasks={visibleTasks}
        setTasks={setTasks}
        showPartner={filter === 'all'}
        onOpenTask={setOpenTask}
        onCelebrate={celebrate}
      />

      {/* New task modal */}
      {modal && (
        <NewTaskModal
          partners={partners}
          onClose={() => setModal(false)}
          onCreated={handleCreated}
        />
      )}

      {/* Task detail modal */}
      {openTask && (
        <TaskDetailModal
          task={openTask}
          partners={partners}
          onClose={() => setOpenTask(null)}
          onUpdated={handleUpdated}
          onCelebrate={celebrate}
        />
      )}

      {/* Celebration overlays */}
      {celebrating && (
        <>
          <ConfettiBurst onDone={() => setCelebrating(false)} />
          <CelebrateToast onDone={() => { /* handled by confetti unmount */ }} />
        </>
      )}
    </div>
  )
}

export function ComingSoon({ title, phase, description }) {
  return (
    <div className="flex flex-col items-center justify-center h-[60vh] text-center px-8">
      <div className="w-12 h-12 rounded-full bg-[#1D4ED8]/10 flex items-center justify-center mb-4">
        <span className="text-[#1D4ED8] text-xl">⚙</span>
      </div>
      <h2 className="text-lg font-semibold text-[#111827] mb-1" style={{ fontFamily: "'Manrope', sans-serif" }}>
        {title}
      </h2>
      <p className="text-sm text-gray-400 max-w-xs" style={{ fontFamily: "'Manrope', sans-serif" }}>
        {description}
      </p>
      <span className="mt-4 text-xs font-medium text-[#1D4ED8] bg-[#1D4ED8]/10 px-3 py-1 rounded-full" style={{ fontFamily: 'Manrope, sans-serif' }}>
        Coming in Phase {phase}
      </span>
    </div>
  )
}
