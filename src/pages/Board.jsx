import { useEffect, useState } from 'react'
import BoardView from '../components/board/BoardView'
import { supabase } from '../lib/supabase'
import { exportCsv, todaySlug } from '../lib/csvExport'

const SAMPLE_DEALS = [
  {
    id: 'sample-1',
    title: 'Top Banner — Screen 1',
    stage: 'prospect',
    placement_type: 'top_banner',
    screen: 'screen_1',
    pricing_tier: 'option_1',
    launch_pricing: true,
    monthly_rate: 150,   // 50% of $300 (Option 1 launch)
    months: 3,
    total_value: 450,
    run_start: null,
    run_end: null,
    partner_id: 'sample-partner-1',
    partners: { id: 'sample-partner-1', name: 'Morgan Hill Chamber of Commerce', type: 'chamber' },
  },
  {
    id: 'sample-2',
    title: 'Start Screen Sponsor — Both Screens',
    stage: 'proposal',
    placement_type: 'start_screen',
    screen: 'both',
    pricing_tier: 'option_2',
    launch_pricing: true,
    monthly_rate: 3400,  // 50% of $6,800 (Option 2 both-screens launch)
    months: 3,
    total_value: 10200,
    run_start: '2026-06-01',
    run_end: '2026-08-31',
    partner_id: 'sample-partner-2',
    partners: { id: 'sample-partner-2', name: 'Downtown Morgan Hill', type: 'downtown_assoc' },
  },
  {
    id: 'sample-3',
    title: 'PDF Map Bundle',
    stage: 'live',
    placement_type: 'map_bundle',
    screen: null,
    pricing_tier: 'option_2',
    launch_pricing: false,
    monthly_rate: 250,
    months: 3,
    total_value: 750,
    run_start: '2026-05-01',
    run_end: '2026-07-25',
    partner_id: 'sample-partner-3',
    partners: { id: 'sample-partner-3', name: 'City of Morgan Hill', type: 'city_gov' },
  },
]

export default function Board() {
  const [deals, setDeals]     = useState(SAMPLE_DEALS)
  const [loading, setLoading] = useState(true)

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
            onClick={handleExport}
            className="text-sm text-gray-500 hover:text-[#02348E] border border-gray-200 hover:border-[#02348E] px-3 py-1.5 rounded transition-colors"
            style={{ fontFamily: 'Roboto, sans-serif' }}
          >
            ↓ Export CSV
          </button>
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
