import { useEffect, useState } from 'react'
import BoardView from '../components/board/BoardView'
import { supabase } from '../lib/supabase'

const SAMPLE_DEALS = [
  {
    id: 'sample-1',
    title: 'Spring Ad Campaign — Banner Slot',
    stage: 'prospect',
    package: 'starter',
    monthly_rate: 299,
    months: 3,
    total_value: 897,
    run_start: null,
    run_end: null,
    partner_id: 'sample-partner-1',
    partners: { id: 'sample-partner-1', name: 'Morgan Hill Chamber of Commerce', type: 'chamber' },
  },
  {
    id: 'sample-2',
    title: 'Full Panel Ad — Downtown Feature',
    stage: 'proposal',
    package: 'standard',
    monthly_rate: 499,
    months: 3,
    total_value: 1497,
    run_start: '2026-06-01',
    run_end: '2026-08-31',
    partner_id: 'sample-partner-2',
    partners: { id: 'sample-partner-2', name: 'Downtown Morgan Hill', type: 'downtown_assoc' },
  },
  {
    id: 'sample-3',
    title: 'Full Screen Premium Placement',
    stage: 'live',
    package: 'premium',
    monthly_rate: 799,
    months: 3,
    total_value: 2397,
    run_start: '2026-05-01',
    run_end: '2026-07-25',
    partner_id: 'sample-partner-3',
    partners: { id: 'sample-partner-3', name: 'City of Morgan Hill', type: 'city_gov' },
  },
]

export default function Board() {
  const [deals, setDeals]     = useState(SAMPLE_DEALS)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchDeals() {
      const { data, error } = await supabase
        .from('deals')
        .select('*, partners(id, name, type)')
        .not('stage', 'in', '("closed_won","closed_lost")')
        .order('created_at', { ascending: false })

      if (!error && data && data.length > 0) {
        setDeals(data)
      }
      // If Supabase isn't connected yet, sample deals remain visible
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
            className="bg-[#02348E] hover:bg-[#02348E]/90 text-white text-sm font-medium px-3 py-1.5 rounded transition-colors"
            style={{ fontFamily: 'Roboto, sans-serif' }}
          >
            + New Deal
          </button>
        </div>
      </div>

      <BoardView initialDeals={deals} />
    </div>
  )
}
