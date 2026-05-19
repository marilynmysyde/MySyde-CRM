import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import TaskBoard from '../components/tasks/TaskBoard'
import NewTaskModal from '../components/tasks/NewTaskModal'

// ─── Sample data ─────────────────────────────────────────────────────────────

const SAMPLE_PARTNERS = [
  { id: 'sample-partner-1', name: 'MH Chamber',   type: 'chamber' },
  { id: 'sample-partner-2', name: 'Downtown MH',  type: 'downtown_assoc' },
  { id: 'sample-partner-3', name: 'City of MH',   type: 'city_gov' },
]

const SAMPLE_TASKS = [
  {
    id: 'st-1', title: 'Send proposal deck', status: 'todo', priority: 'high',
    due_date: '2026-05-19', assigned_to: 'Marilyn', is_recurring: false,
    partner_id: 'sample-partner-1', partners: { id: 'sample-partner-1', name: 'MH Chamber', type: 'chamber' },
  },
  {
    id: 'st-2', title: 'Design ad creative', status: 'todo', priority: 'high',
    due_date: '2026-05-17', assigned_to: 'Marilyn', is_recurring: false,
    partner_id: 'sample-partner-2', partners: { id: 'sample-partner-2', name: 'Downtown MH', type: 'downtown_assoc' },
  },
  {
    id: 'st-3', title: 'Follow up on invoice', status: 'in_progress', priority: 'medium',
    due_date: '2026-05-21', assigned_to: 'Marilyn', is_recurring: false,
    partner_id: 'sample-partner-1', partners: { id: 'sample-partner-1', name: 'MH Chamber', type: 'chamber' },
  },
  {
    id: 'st-4', title: 'Monthly check-in call', status: 'in_progress', priority: 'medium',
    due_date: '2026-05-20', assigned_to: 'Marilyn', is_recurring: true, recurrence_rule: 'monthly',
    partner_id: 'sample-partner-3', partners: { id: 'sample-partner-3', name: 'City of MH', type: 'city_gov' },
  },
  {
    id: 'st-5', title: 'Review creative brief', status: 'review', priority: 'medium',
    due_date: '2026-05-22', assigned_to: 'Marilyn', is_recurring: false,
    partner_id: 'sample-partner-2', partners: { id: 'sample-partner-2', name: 'Downtown MH', type: 'downtown_assoc' },
  },
  {
    id: 'st-6', title: 'Schedule kiosk walk-through', status: 'todo', priority: 'low',
    due_date: '2026-05-28', assigned_to: null, is_recurring: false,
    partner_id: 'sample-partner-3', partners: { id: 'sample-partner-3', name: 'City of MH', type: 'city_gov' },
  },
  {
    id: 'st-7', title: 'Onboarding call — complete', status: 'done', priority: 'low',
    due_date: '2026-05-14', assigned_to: 'Marilyn', is_recurring: false,
    partner_id: 'sample-partner-1', partners: { id: 'sample-partner-1', name: 'MH Chamber', type: 'chamber' },
  },
  {
    id: 'st-8', title: 'Weekly social content', status: 'todo', priority: 'medium',
    due_date: '2026-05-19', assigned_to: 'Marilyn', is_recurring: true, recurrence_rule: 'weekly',
    partner_id: null, partners: null,
  },
]

// ─── Tasks page ───────────────────────────────────────────────────────────────

export default function Tasks() {
  const [tasks,    setTasks]    = useState(SAMPLE_TASKS)
  const [partners, setPartners] = useState(SAMPLE_PARTNERS)
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
        if (t && t.length > 0) setTasks(t)
        if (p && p.length > 0) setPartners(p)
      } catch { /* no Supabase — sample data stays */ }
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
