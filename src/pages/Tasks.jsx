import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import TaskBoard from '../components/tasks/TaskBoard'
import NewTaskModal from '../components/tasks/NewTaskModal'

// ─── Tasks page ───────────────────────────────────────────────────────────────

export default function Tasks() {
  const [tasks,    setTasks]    = useState([])
  const [partners, setPartners] = useState([])
  const [filter,   setFilter]   = useState('all')
  const [modal,    setModal]    = useState(false)
  const [loading,  setLoading]  = useState(true)

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

  return (
    <div className="px-4 py-4">

      {/* Page header */}
      <div className="flex items-center justify-between mb-4">
        <h1
          className="text-xl font-semibold text-[#010100]"
          style={{ fontFamily: "'IBM Plex Sans', sans-serif" }}
        >
          Tasks
        </h1>
        <div className="flex items-center gap-2">
          {loading && (
            <span className="text-xs text-gray-400" style={{ fontFamily: "'Roboto Condensed', sans-serif" }}>
              Loading…
            </span>
          )}
          <button
            onClick={() => setModal(true)}
            className="bg-[#02348E] hover:bg-[#02348E]/90 text-white text-sm font-medium px-3 py-1.5 rounded transition-colors"
            style={{ fontFamily: 'Roboto, sans-serif' }}
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
                ? 'border-[#02348E] text-[#02348E]'
                : 'border-transparent text-gray-500 hover:text-[#010100]'
            }`}
            style={{ fontFamily: 'Roboto, sans-serif' }}
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
      <TaskBoard tasks={visibleTasks} setTasks={setTasks} showPartner={filter === 'all'} />

      {/* New task modal */}
      {modal && (
        <NewTaskModal
          partners={partners}
          onClose={() => setModal(false)}
          onCreated={handleCreated}
        />
      )}
    </div>
  )
}

export function ComingSoon({ title, phase, description }) {
  return (
    <div className="flex flex-col items-center justify-center h-[60vh] text-center px-8">
      <div className="w-12 h-12 rounded-full bg-[#02348E]/10 flex items-center justify-center mb-4">
        <span className="text-[#02348E] text-xl">⚙</span>
      </div>
      <h2 className="text-lg font-semibold text-[#010100] mb-1" style={{ fontFamily: "'IBM Plex Sans', sans-serif" }}>
        {title}
      </h2>
      <p className="text-sm text-gray-400 max-w-xs" style={{ fontFamily: "'Roboto Condensed', sans-serif" }}>
        {description}
      </p>
      <span className="mt-4 text-xs font-medium text-[#02348E] bg-[#02348E]/10 px-3 py-1 rounded-full" style={{ fontFamily: 'Roboto, sans-serif' }}>
        Coming in Phase {phase}
      </span>
    </div>
  )
}
