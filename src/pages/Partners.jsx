import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import PartnerTypeTag from '../components/shared/PartnerTypeTag'
import NewPartnerModal from '../components/partners/NewPartnerModal'
import { exportCsv, todaySlug } from '../lib/csvExport'

const TYPE_FILTERS = [
  { value: 'all',            label: 'All' },
  { value: 'chamber',        label: 'Chambers' },
  { value: 'city_gov',       label: 'City / Gov' },
  { value: 'downtown_assoc', label: 'Downtown' },
  { value: 'community_org',  label: 'Community' },
  { value: 'nonprofit',      label: 'Nonprofit' },
  { value: 'local_business', label: 'Businesses' },
]

export default function Partners() {
  const navigate                      = useNavigate()
  const [partners, setPartners]       = useState([])
  const [filter, setFilter]           = useState('all')
  const [search, setSearch]           = useState('')
  const [showNewPartner, setShowNewPartner] = useState(false)

  function handlePartnerCreated(newPartner) {
    setPartners(prev => [...prev, newPartner].sort((a, b) => a.name.localeCompare(b.name)))
  }

  function handleExport() {
    exportCsv(
      partners,
      ['name', 'type', 'website', 'active'],
      { name: 'Name', type: 'Type', website: 'Website', active: 'Active' },
      `partners-${todaySlug()}.csv`
    )
  }

  useEffect(() => {
    async function fetchPartners() {
      const { data, error } = await supabase
        .from('partners')
        .select('*')
        .eq('active', true)
        .order('name')

      if (!error && data) setPartners(data)
    }
    fetchPartners()
  }, [])

  const visible = partners.filter(p => {
    const matchesFilter = filter === 'all' || p.type === filter
    const matchesSearch = p.name.toLowerCase().includes(search.toLowerCase())
    return matchesFilter && matchesSearch
  })

  return (
    <div className="p-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h1
          className="text-xl font-semibold text-[#010100]"
          style={{ fontFamily: "'IBM Plex Sans', sans-serif" }}
        >
          Partners
        </h1>
        <div className="flex items-center gap-2">
          <button
            onClick={handleExport}
            className="text-sm text-gray-500 hover:text-[#02348E] border border-gray-200 hover:border-[#02348E] px-3 py-1.5 rounded transition-colors"
            style={{ fontFamily: 'Roboto, sans-serif' }}
          >
            ↓ Export CSV
          </button>
          <button
            onClick={() => setShowNewPartner(true)}
            className="bg-[#02348E] hover:bg-[#02348E]/90 text-white text-sm font-medium px-3 py-1.5 rounded transition-colors"
            style={{ fontFamily: 'Roboto, sans-serif' }}
          >
            + Add Partner
          </button>
        </div>
      </div>

      {/* Search + filter */}
      <div className="flex flex-wrap items-center gap-2 mb-4">
        <input
          type="text"
          placeholder="Search partners…"
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="border border-gray-200 rounded px-3 py-1.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#02348E]/30 w-48"
          style={{ fontFamily: 'Roboto, sans-serif' }}
        />
        <div className="flex gap-1 flex-wrap">
          {TYPE_FILTERS.map(({ value, label }) => (
            <button
              key={value}
              onClick={() => setFilter(value)}
              className={[
                'px-2.5 py-1 rounded text-xs font-medium transition-colors',
                filter === value
                  ? 'bg-[#02348E] text-white'
                  : 'bg-white border border-gray-200 text-gray-600 hover:border-[#02348E] hover:text-[#02348E]',
              ].join(' ')}
              style={{ fontFamily: 'Roboto, sans-serif' }}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Partner list */}
      <div className="space-y-2">
        {visible.length === 0 && (
          <div className="text-center py-12 text-gray-400 text-sm" style={{ fontFamily: "'Roboto Condensed', sans-serif" }}>
            No partners match your filter.
          </div>
        )}
        {visible.map(partner => (
          <div
            key={partner.id}
            onClick={() => navigate(`/partner/${partner.id}`)}
            className="bg-white rounded-lg border border-gray-100 px-4 py-3 flex items-center justify-between hover:shadow-sm transition-shadow cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <PartnerTypeTag type={partner.type} />
              <div>
                <p
                  className="text-sm font-medium text-[#010100]"
                  style={{ fontFamily: 'Roboto, sans-serif' }}
                >
                  {partner.name}
                </p>
                {partner.website && (
                  <p
                    className="text-xs text-gray-400"
                    style={{ fontFamily: "'Roboto Condensed', sans-serif" }}
                  >
                    {partner.website}
                  </p>
                )}
              </div>
            </div>
            <span className="text-xs text-[#02348E] font-medium" style={{ fontFamily: 'Roboto, sans-serif' }}>
              View →
            </span>
          </div>
        ))}
      </div>
      {showNewPartner && (
        <NewPartnerModal
          onClose={() => setShowNewPartner(false)}
          onCreated={handlePartnerCreated}
        />
      )}
    </div>
  )
}
