import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import PartnerTypeTag from '../components/shared/PartnerTypeTag'
import EmptyState from '../components/shared/EmptyState'
import NewContactModal from '../components/contacts/NewContactModal'
import { exportCsv, todaySlug } from '../lib/csvExport'

export default function Contacts() {
  const navigate                        = useNavigate()
  const [contacts, setContacts]         = useState([])
  const [search, setSearch]             = useState('')
  const [showNewContact, setShowNewContact] = useState(false)

  function handleContactCreated(newContact) {
    setContacts(prev => [...prev, newContact].sort((a, b) => a.name.localeCompare(b.name)))
  }

  function handleExport() {
    exportCsv(
      contacts.map(c => ({ ...c, partner: c.partners?.name ?? '' })),
      ['name', 'role', 'email', 'phone', 'partner'],
      { name: 'Name', role: 'Role', email: 'Email', phone: 'Phone', partner: 'Partner' },
      `contacts-${todaySlug()}.csv`
    )
  }

  useEffect(() => {
    async function fetchContacts() {
      const { data, error } = await supabase
        .from('contacts')
        .select('*, partners(name, type)')
        .order('name')

      if (!error && data) setContacts(data)
    }
    fetchContacts()
  }, [])

  const visible = contacts.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.email?.toLowerCase().includes(search.toLowerCase()) ||
    c.partners?.name.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="p-4">
      <div className="flex items-center justify-between mb-4">
        <h1
          className="text-xl font-semibold text-[#111827]"
          style={{ fontFamily: "'Manrope', sans-serif" }}
        >
          Contacts
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
            onClick={() => setShowNewContact(true)}
            className="bg-[#1D4ED8] hover:bg-[#1D4ED8]/90 text-white text-sm font-medium px-3 py-1.5 rounded transition-colors"
            style={{ fontFamily: 'Manrope, sans-serif' }}
          >
            + Add Contact
          </button>
        </div>
      </div>

      <input
        type="text"
        placeholder="Search contacts…"
        value={search}
        onChange={e => setSearch(e.target.value)}
        className="border border-gray-200 rounded px-3 py-1.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#1D4ED8]/30 w-64 mb-4 block"
        style={{ fontFamily: 'Manrope, sans-serif' }}
      />

      <div className="bg-white rounded-[14px] border border-gray-100 overflow-hidden">
        {visible.length === 0 && contacts.length === 0 && (
          <EmptyState
            icon="👤"
            title="No contacts yet"
            subtitle="The people behind the partners — decision-makers you'll email, call, and sit down with. Add them as you meet them, or import from MailerLite."
            ctaLabel="+ Add your first contact"
            onCta={() => setShowNewContact(true)}
          />
        )}
        {visible.length === 0 && contacts.length > 0 && (
          <EmptyState
            variant="filtered"
            icon="🔍"
            title="No contacts match"
            subtitle={search ? `Nothing matches "${search}".` : 'Try a different search.'}
            ctaLabel="Clear search"
            onCta={() => setSearch('')}
          />
        )}
        {visible.map((contact, i) => (
          <div
            key={contact.id}
            onClick={() => navigate(`/contacts/${contact.id}`)}
            className={`flex items-center justify-between px-4 py-3 hover:bg-gray-50 cursor-pointer ${i > 0 ? 'border-t border-gray-50' : ''}`}
          >
            <div className="flex items-center gap-3">
              {/* Avatar initials */}
              <div className="w-8 h-8 rounded-full bg-[#1D4ED8] flex items-center justify-center shrink-0">
                <span className="text-white text-xs font-semibold" style={{ fontFamily: 'Manrope, sans-serif' }}>
                  {contact.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                </span>
              </div>
              <div>
                <p
                  className="text-sm font-medium text-[#111827]"
                  style={{ fontFamily: 'Manrope, sans-serif' }}
                >
                  {contact.name}
                </p>
                <p
                  className="text-xs text-gray-400"
                  style={{ fontFamily: "'Manrope', sans-serif" }}
                >
                  {contact.role}{contact.email ? ` · ${contact.email}` : ''}
                </p>
              </div>
            </div>
            {contact.partners && (
              <PartnerTypeTag type={contact.partners.type} />
            )}
          </div>
        ))}
      </div>
      {showNewContact && (
        <NewContactModal
          onClose={() => setShowNewContact(false)}
          onCreated={handleContactCreated}
        />
      )}
    </div>
  )
}
