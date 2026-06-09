import { useEffect, useState } from 'react'
import BoardView from '../components/board/BoardView'
import NewDealModal from '../components/board/NewDealModal'
import { supabase } from '../lib/supabase'
import { exportCsv, todaySlug } from '../lib/csvExport'

export default function Board() {
  const [deals, setDeals]         = useState([])
  const [loading, setLoading]     = useState(true)
  const [showNewDeal, setShowNewDeal] = useState(false)
  const [boardKey, setBoardKey]   = useState(0)

  function handleDealCreated(newDeal) {
    setDeals(prev => [newDeal, ...prev])
    setBoardKey(k => k + 1)
  }

  function handleExport() {
    exportCsv(
      deals.map(d => ({ ...d, partner: d.partners?.name ?? '' })),
      ['title', 'stage', 'placement_type', 'monthly_rate', 'months', 'total_value', 'partner', 'run_start', 'run_end'],
      { title: 'Deal', stage: 'Stage', placement_type: 'Placement', monthly_rate: 'Monthly Rate', months: 'Months', total_value: 'Total Value', partner: 'Partner', run_start: 'Run Start', run_end: 'Run End' },
      `deals-${todaySlug()}.csv`
    )
  }

  useEffect(() => {
    async function fetchDeals() {
      const { data, error } = await supabase
        .from('deals')
        .select('*, partners(id, name, type)')
        .not('stage', 'in', '("closed_won","closed_lost")')
        .order('created_at', { ascending: false })

      if (!error && data) setDeals(data)
      setLoading(false)
    }

    fetchDeals()
  }, [])

  return (
    <div className="h-full">
      {/* Page header */}
      <div className="px-4 pt-4 pb-2 flex items-center justify-between">
        <h1
          className="text-xl font-semibold text-[#010100]"
          style={{ fontFamily: "'IBM Plex Sans', sans-serif" }}
        >
          Sales Pipeline
        </h1>
        <div className="flex items-center gap-2">
          {loading && (
            <span className="text-xs text-gray-400" style={{ fontFamily: "'Roboto Condensed', sans-serif" }}>
              Loading…
            </span>
          )}
          <button
            onClick={handleExport}
            className="text-sm text-gray-500 hover:text-[#02348E] border border-gray-200 hover:border-[#02348E] px-3 py-1.5 rounded transition-colors"
            style={{ fontFamily: 'Roboto, sans-serif' }}
          >
            ↓ Export CSV
          </button>
          <button
            onClick={() => setShowNewDeal(true)}
            className="bg-[#02348E] hover:bg-[#02348E]/90 text-white text-sm font-medium px-3 py-1.5 rounded transition-colors"
            style={{ fontFamily: 'Roboto, sans-serif' }}
          >
            + New Deal
          </button>
        </div>
      </div>

      <BoardView key={boardKey} initialDeals={deals} />

      {showNewDeal && (
        <NewDealModal
          onClose={() => setShowNewDeal(false)}
          onCreated={handleDealCreated}
        />
      )}
    </div>
  )
}
