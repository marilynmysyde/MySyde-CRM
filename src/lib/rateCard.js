// MySyde Kiosk Unified Rate Card — Morgan Hill, CA
// Three pricing tiers: option_1 (Launch-Friendly), option_2 (Market/Recommended), option_3 (Premium)
// Launch special: 50% off all monthly rates for first 6 months

export const CATEGORIES = [
  { key: 'digital', label: 'Digital Screen',   icon: '🖥️' },
  { key: 'wrap',    label: 'Exterior Wrap',     icon: '🏢' },
  { key: 'event',   label: 'Events',            icon: '📅' },
  { key: 'map',     label: 'PDF Downtown Map',  icon: '🗺️' },
]

export const TIER_LABELS = {
  option_1: 'Launch-Friendly',
  option_2: 'Market (Recommended)',
  option_3: 'Premium',
}

// All monthly rates are the standard (non-launch) rates.
// Apply 50% discount when launch_pricing === true.
// `perScreen` = rate for one screen / one placement
// `both` = bundle rate for same advertiser buying both screens (digital only, ~1.7×)
// `setupFee` = one-time fee (map placements only)

export const PLACEMENTS = {
  // ── Digital Screen ──────────────────────────────────────────────────────────
  top_banner: {
    key:           'top_banner',
    label:         'Dynamic Top Banner',
    category:      'digital',
    desc:          '7-sec rotation — max 10 advertisers per screen',
    exclusive:     false,
    defaultTerm:   3,
    termOptions:   [3],
    hasScreen:     true,
    perScreen:     { option_1: 300,  option_2: 450,  option_3: 650   },
    both:          { option_1: 510,  option_2: 765,  option_3: 1105  },
  },
  bottom_banner: {
    key:           'bottom_banner',
    label:         'Dynamic Bottom Banner',
    category:      'digital',
    desc:          '7-sec rotation — max 10 advertisers per screen',
    exclusive:     false,
    defaultTerm:   3,
    termOptions:   [3],
    hasScreen:     true,
    perScreen:     { option_1: 250,  option_2: 350,  option_3: 500   },
    both:          { option_1: 425,  option_2: 595,  option_3: 850   },
  },
  premier_welcome: {
    key:           'premier_welcome',
    label:         'Premier Welcome Sponsor',
    category:      'digital',
    desc:          'Static center-screen on Welcome experience — 1 exclusive sponsor/screen',
    exclusive:     true,
    defaultTerm:   3,
    termOptions:   [3],
    hasScreen:     true,
    perScreen:     { option_1: 1500, option_2: 2500, option_3: 3500  },
    both:          { option_1: 2550, option_2: 4250, option_3: 5950  },
  },
  start_screen: {
    key:           'start_screen',
    label:         'Start Screen Sponsor',
    category:      'digital',
    desc:          'Static full-screen "Touch to Begin" — 1 exclusive sponsor/screen',
    exclusive:     true,
    defaultTerm:   3,
    termOptions:   [3, 6],
    hasScreen:     true,
    perScreen:     { option_1: 2500, option_2: 4000, option_3: 6000  },
    both:          { option_1: 4250, option_2: 6800, option_3: 10200 },
  },
  search_button: {
    key:           'search_button',
    label:         'Sponsored Search Button',
    category:      'digital',
    desc:          'First-position button when users open search — only 5 available',
    exclusive:     false,
    defaultTerm:   3,
    termOptions:   [3],
    hasScreen:     true,
    perScreen:     { option_1: 250,  option_2: 400,  option_3: 600   },
    both:          { option_1: 425,  option_2: 680,  option_3: 1020  }, // 1.7×
  },

  // ── Exterior Wrap ────────────────────────────────────────────────────────────
  primary_wrap: {
    key:           'primary_wrap',
    label:         'Primary Wrap — Main Face',
    category:      'wrap',
    desc:          'Largest static panel — changes up to 2×/year, 6-month minimum',
    exclusive:     true,
    defaultTerm:   6,
    termOptions:   [6, 12],
    hasScreen:     false,
    perScreen:     { option_1: 1500, option_2: 2500, option_3: 3500  },
    both:          null,
  },
  side_wrap: {
    key:           'side_wrap',
    label:         'Side Wrap Panel (Left or Right)',
    category:      'wrap',
    desc:          '2 panels available (L + R) — 6-month minimum',
    exclusive:     false,
    defaultTerm:   6,
    termOptions:   [6, 12],
    hasScreen:     false,
    perScreen:     { option_1: 600,  option_2: 900,  option_3: 1200  },
    both:          null,
  },

  // ── Events ───────────────────────────────────────────────────────────────────
  featured_event: {
    key:           'featured_event',
    label:         'Featured Event — Top of What\'s To Come',
    category:      'event',
    desc:          'Top placement in events calendar — sold weekly or monthly',
    exclusive:     false,
    defaultTerm:   1,
    termOptions:   [1, 3],
    hasScreen:     false,
    perScreen:     { option_1: 250,  option_2: 350,  option_3: 500   }, // monthly
    weeklyRate:    { option_1: 75,   option_2: 100,  option_3: 150   },
    both:          null,
  },

  // ── PDF Downtown Map ─────────────────────────────────────────────────────────
  map_picture: {
    key:           'map_picture',
    label:         'Map — Handmade Business Picture',
    category:      'map',
    desc:          'Custom illustration placed on the interactive map',
    exclusive:     false,
    defaultTerm:   3,
    termOptions:   [3, 6, 12],
    hasScreen:     false,
    perScreen:     { option_1: 75,   option_2: 125,  option_3: 175   },
    both:          null,
    setupFee:      { option_1: 250,  option_2: 400,  option_3: 600   },
  },
  map_name_under: {
    key:           'map_name_under',
    label:         'Map — Bold Name Under Map',
    category:      'map',
    desc:          'Business name in bold color below the map graphic',
    exclusive:     false,
    defaultTerm:   3,
    termOptions:   [3, 6, 12],
    hasScreen:     false,
    perScreen:     { option_1: 50,   option_2: 85,   option_3: 120   },
    both:          null,
    setupFee:      null,
  },
  map_name_category: {
    key:           'map_name_category',
    label:         'Map — Bold Name in Category Section',
    category:      'map',
    desc:          'Business name in bold color under its business category',
    exclusive:     false,
    defaultTerm:   3,
    termOptions:   [3, 6, 12],
    hasScreen:     false,
    perScreen:     { option_1: 35,   option_2: 60,   option_3: 85    },
    both:          null,
    setupFee:      null,
  },
  map_bundle: {
    key:           'map_bundle',
    label:         'PDF Map Bundle ⭐ Best Seller',
    category:      'map',
    desc:          'Handmade picture + bold under-map name + bold category placement',
    exclusive:     false,
    defaultTerm:   3,
    termOptions:   [3, 6, 12],
    hasScreen:     false,
    perScreen:     { option_1: 150,  option_2: 250,  option_3: 350   },
    both:          null,
    setupFee:      { option_1: 300,  option_2: 500,  option_3: 700   },
  },
}

// ── Helper functions ──────────────────────────────────────────────────────────

export function getMonthlyRate(placementKey, tier, screen) {
  const p = PLACEMENTS[placementKey]
  if (!p) return 0
  const rates = (screen === 'both' && p.both) ? p.both : p.perScreen
  return rates?.[tier] ?? 0
}

export function applyLaunch(rate) {
  return Math.round(rate * 0.5)
}

export function calcRate(placementKey, tier, screen, isLaunch) {
  const base = getMonthlyRate(placementKey, tier, screen)
  return isLaunch ? applyLaunch(base) : base
}

export function calcTotal(placementKey, tier, screen, isLaunch, months) {
  return calcRate(placementKey, tier, screen, isLaunch) * months
}

export function getSetupFee(placementKey, tier) {
  return PLACEMENTS[placementKey]?.setupFee?.[tier] ?? 0
}

export function placementsByCategory(categoryKey) {
  return Object.values(PLACEMENTS).filter(p => p.category === categoryKey)
}

export function fmt(value) {
  if (!value && value !== 0) return '—'
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(value)
}
