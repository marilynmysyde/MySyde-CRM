import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import PostBoard from '../components/social/PostBoard'
import NewPostModal from '../components/social/NewPostModal'
import PlatformBadge, { ALL_PLATFORMS, PLATFORM_LABELS } from '../components/social/PlatformBadge'

// ─── Sample data ─────────────────────────────────────────────────────────────

const SAMPLE_PARTNERS = [
  { id: 'sample-partner-1', name: 'MH Chamber',  type: 'chamber' },
  { id: 'sample-partner-2', name: 'Downtown MH', type: 'downtown_assoc' },
  { id: 'sample-partner-3', name: 'City of MH',  type: 'city_gov' },
]

const SAMPLE_POSTS = [
  {
    id: 'sp-1',
    title: 'Chamber Expo Highlight',
    caption: 'What a great turnout at the Morgan Hill Business Expo! Thank you to all our partners for making it happen.',
    platforms: ['instagram', 'facebook'],
    status: 'idea',
    scheduled_at: null,
    published_at: null,
    partner_id: 'sample-partner-1',
    partners: { id: 'sample-partner-1', name: 'MH Chamber', type: 'chamber' },
    canva_file_url: null,
    canva_file_name: null,
    hashtags: ['#MorganHill', '#BusinessExpo'],
  },
  {
    id: 'sp-2',
    title: 'Kiosk Launch Announcement',
    caption: 'Exciting news — MySyde Connect kiosks are coming to Downtown Morgan Hill. Hyper-local advertising that actually works.',
    platforms: ['instagram', 'facebook', 'linkedin'],
    status: 'draft',
    scheduled_at: '2026-05-28T10:00:00Z',
    published_at: null,
    partner_id: 'sample-partner-2',
    partners: { id: 'sample-partner-2', name: 'Downtown MH', type: 'downtown_assoc' },
    canva_file_url: 'https://www.canva.com/design/DAGk123/kiosk-launch-edit',
    canva_file_name: 'Kiosk Launch Graphic',
    hashtags: ['#MySyde', '#DowntownMH', '#KioskAds'],
  },
  {
    id: 'sp-3',
    title: 'Partner Spotlight — City of MH',
    caption: 'Proud to partner with the City of Morgan Hill on our community kiosk network. Connecting residents with local businesses.',
    platforms: ['linkedin', 'facebook'],
    status: 'review',
    scheduled_at: '2026-05-30T09:00:00Z',
    published_at: null,
    partner_id: 'sample-partner-3',
    partners: { id: 'sample-partner-3', name: 'City of MH', type: 'city_gov' },
    canva_file_url: 'https://www.canva.com/design/DAGk456/partner-spotlight-edit',
    canva_file_name: 'Partner Spotlight Card',
    hashtags: ['#CityOfMorganHill', '#CommunityFirst'],
  },
  {
    id: 'sp-4',
    title: 'Weekend Events Roundup',
    caption: "Here's what's happening in Morgan Hill this weekend! From the Farmer's Market to live music — there's something for everyone.",
    platforms: ['instagram', 'facebook', 'tiktok'],
    status: 'scheduled',
    scheduled_at: '2026-05-24T08:00:00Z',
    published_at: null,
    partner_id: null,
    partners: null,
    canva_file_url: 'https://www.canva.com/design/DAGk789/weekend-roundup-edit',
    canva_file_name: 'Weekend Events Graphic',
    hashtags: ['#MorganHillEvents', '#WeekendVibes'],
  },
  {
    id: 'sp-5',
    title: 'May Community Update',
    caption: "Spring is in full swing in Morgan Hill! Here's a look at everything happening across our partner network this month.",
    platforms: ['instagram', 'facebook'],
    status: 'scheduled',
    scheduled_at: '2026-05-26T12:00:00Z',
    published_at: null,
    partner_id: null,
    partners: null,
    canva_file_url: null,
    canva_file_name: null,
    hashtags: ['#MorganHill', '#CommunityUpdate'],
  },
  {
    id: 'sp-6',
    title: 'Advertiser Success Story',
    caption: 'See how local businesses are growing with MySyde kiosk advertising. Real visibility. Real results.',
    platforms: ['linkedin'],
    status: 'live',
    scheduled_at: '2026-05-18T10:00:00Z',
    published_at: '2026-05-18T10:02:00Z',
    partner_id: 'sample-partner-1',
    partners: { id: 'sample-partner-1', name: 'MH Chamber', type: 'chamber' },
    canva_file_url: null,
    canva_file_name: null,
    hashtags: ['#LocalBusiness', '#KioskAdvertising'],
  },
  {
    id: 'sp-7',
    title: 'Downtown MH Foot Traffic Stats',
    caption: 'Our kiosks helped drive measurable foot traffic to Downtown Morgan Hill businesses last quarter.',
    platforms: ['linkedin', 'instagram'],
    status: 'idea',
    scheduled_at: null,
    published_at: null,
    partner_id: 'sample-partner-2',
    partners: { id: 'sample-partner-2', name: 'Downtown MH', type: 'downtown_assoc' },
    canva_file_url: null,
    canva_file_name: null,
    hashtags: ['#DowntownMH', '#FootTraffic'],
  },
]

// ─── Social page ─────────────────────────────────────────────────────────────

export default function Social() {
  const [posts,     setPosts]     = useState([])
  const [partners,  setPartners]  = useState([])
  const [platform,  setPlatform]  = useState('all')
  const [modal,     setModal]     = useState(false)
  const [editPost,  setEditPost]  = useState(null)
  const [loading,   setLoading]   = useState(true)

  useEffect(() => {
    async function load() {
      try {
        const { data: po } = await supabase
          .from('posts')
          .select('*, partners(id, name, type)')
          .neq('status', 'archived')
          .order('created_at', { ascending: false })
        const { data: pa } = await supabase
          .from('partners')
          .select('id, name, type')
          .eq('active', true)
          .order('name')
        if (po) setPosts(po)
        if (pa) setPartners(pa)
      } catch { /* ignore */ }
      setLoading(false)
    }
    load()
  }, [])

  const visiblePosts = platform === 'all'
    ? posts
    : posts.filter(p => (p.platforms ?? []).includes(platform))

  function handleSaved(post) {
    setPosts(prev => {
      const exists = prev.find(p => p.id === post.id)
      return exists
        ? prev.map(p => p.id === post.id ? post : p)
        : [post, ...prev]
    })
  }

  function openEdit(post) {
    setEditPost(post)
    setModal(true)
  }

  function closeModal() {
    setModal(false)
    setEditPost(null)
  }

  return (
    <div className="px-4 py-4">

      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h1
          className="text-xl font-semibold text-[#010100]"
          style={{ fontFamily: "'IBM Plex Sans', sans-serif" }}
        >
          Social
        </h1>
        <div className="flex items-center gap-2">
          {loading && (
            <span className="text-xs text-gray-400" style={{ fontFamily: "'Roboto Condensed', sans-serif" }}>
              Loading…
            </span>
          )}
          <button
            onClick={() => { setEditPost(null); setModal(true) }}
            className="bg-[#02348E] hover:bg-[#02348E]/90 text-white text-sm font-medium px-3 py-1.5 rounded transition-colors"
            style={{ fontFamily: 'Roboto, sans-serif' }}
          >
            + New Post
          </button>
        </div>
      </div>

      {/* Platform filter tabs */}
      <div className="flex items-center gap-1 flex-wrap mb-4 border-b border-gray-200 pb-0">
        {[{ id: 'all', label: 'All Platforms' }, ...ALL_PLATFORMS.map(p => ({ id: p, label: PLATFORM_LABELS[p] }))].map(p => (
          <button
            key={p.id}
            onClick={() => setPlatform(p.id)}
            className={`flex items-center gap-1.5 px-3 py-2 text-sm font-medium border-b-2 transition-colors -mb-px whitespace-nowrap ${
              platform === p.id
                ? 'border-[#02348E] text-[#02348E]'
                : 'border-transparent text-gray-500 hover:text-[#010100]'
            }`}
            style={{ fontFamily: 'Roboto, sans-serif' }}
          >
            {p.id !== 'all' && <PlatformBadge platform={p.id} size="xs" />}
            {p.label}
            <span className="text-[10px] bg-gray-100 text-gray-500 rounded-full px-1.5 py-0.5">
              {p.id === 'all'
                ? posts.length
                : posts.filter(post => (post.platforms ?? []).includes(p.id)).length}
            </span>
          </button>
        ))}
      </div>

      {/* Board */}
      <PostBoard
        posts={visiblePosts}
        setPosts={setPosts}
        onPostClick={openEdit}
      />

      {/* Modal */}
      {modal && (
        <NewPostModal
          partners={partners}
          post={editPost}
          onClose={closeModal}
          onSaved={handleSaved}
        />
      )}
    </div>
  )
}
