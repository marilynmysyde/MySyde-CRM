import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import PartnerTypeTag from '../components/shared/PartnerTypeTag'
import EmptyState from '../components/shared/EmptyState'
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
          className="text-xl font-semibold text-[#111827]"
          style={{ fontFamily: "'Manrope', sans-serif" }}
        >
          Partners
        </h1>
        <div className="flex items-center gap-2">
          <button
            onClick={handleExport}
            className="text-sm text-gray-500 hover:text-[#1D4ED8] border border-gray-200 hover:border-[#1D4ED8] px-3 py-1.5 rounded transition-colors"
            style={{ fontFamily: 'Manrope, sans-serif' }}
          >
            ↓ Export CSV
          </button>
          <button
            onClick={() => setShowNewPartner(true)}
            className="bg-[#1D4ED8] hover:bg-[#1D4ED8]/90 text-white text-sm font-medium px-3 py-1.5 rounded transition-colors"
            style={{ fontFamily: 'Manrope, sans-serif' }}
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
          className="border border-gray-200 rounded px-3 py-1.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#1D4ED8]/30 w-48"
          style={{ fontFamily: 'Manrope, sans-serif' }}
        />
        <div className="flex gap-1 flex-wrap">
          {TYPE_FILTERS.map(({ value, label }) => (
            <button
              key={value}
              onClick={() => setFilter(value)}
              className={[
                'px-2.5 py-1 rounded text-xs font-medium transition-colors',
                filter === value
                  ? 'bg-[#1D4ED8] text-white'
                  : 'bg-white border border-gray-200 text-gray-600 hover:border-[#1D4ED8] hover:text-[#1D4ED8]',
              ].join(' ')}
              style={{ fontFamily: 'Manrope, sans-serif' }}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Partner list */}
      <div className="space-y-2">
        {visible.length === 0 && partners.length === 0 && (
          <EmptyState
            icon="🤝"
            title="No partners yet"
            subtitle="Chambers, cities, downtown associations, event organizers — everyone you'll pitch kiosk ad space to. Start with the big three for Morgan Hill."
            ctaLabel="+ Add your first partner"
            onCta={() => setShowNewPartner(true)}
          />
        )}
        {visible.length === 0 && partners.length > 0 && (
          <EmptyState
            variant="filtered"
            icon="🔍"
            title="No partners match"
            subtitle={search ? `Nothing matches "${search}"${filter !== 'all' ? ` in the current filter` : ''}.` : 'Try a different filter.'}
            ctaLabel="Clear filters"
            onCta={() => { setSearch(''); setFilter('all') }}
          />
        )}
        {visible.map(partner => (
          <div
            key={partner.id}
            onClick={() => navigate(`/partner/${partner.id}`)}
            className="bg-white rounded-[14px] border border-gray-100 px-4 py-3 flex items-center justify-between hover:shadow-sm transition-shadow cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <PartnerTypeTag type={partner.type} />
              <div>
                <p
                  className="text-sm font-medium text-[#111827]"
                  style={{ fontFamily: 'Manrope, sans-serif' }}
                >
                  {partner.name}
                </p>
                {partner.website && (
                  <p
                    className="text-xs text-gray-400"
                    style={{ fontFamily: "'Manrope', sans-serif" }}
                  >
                    {partner.website}
                  </p>
                )}
              </div>
            </div>
            <span className="text-xs text-[#1D4ED8] font-medium" style={{ fontFamily: 'Manrope, sans-serif' }}>
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
