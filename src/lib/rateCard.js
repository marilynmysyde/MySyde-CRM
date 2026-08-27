// MySyde Kiosk Unified Rate Card — Morgan Hill, CA
// Refreshed 2026-08-14 from the "Unified Advertising Rate Card 8-2026" PDF.
// Source PDF: brand/rate-card/2026-08-14-unified-rate-card-morgan-hill.pdf
//
// Three pricing tiers: option_1 (Launch-Friendly), option_2 (Market/Recommended), option_3 (Premium)
// Launch special: 50% off all monthly rates for first 6 months (setup/one-time fees excluded).

export const CATEGORIES = [
  { key: 'package', label: 'Packages',        icon: '📦' },
  { key: 'digital', label: 'Digital Screen',   icon: '🖥️' },
  { key: 'wrap',    label: 'Exterior Wrap',    icon: '🏢' },
  { key: 'event',   label: 'Events',           icon: '📅' },
  { key: 'map',     label: 'PDF Downtown Map', icon: '🗺️' },
]

export const TIER_LABELS = {
  option_1: 'Launch-Friendly',
  option_2: 'Market (Recommended)',
  option_3: 'Premium',
}

// All monthly rates are standard (non-launch). Apply 50% discount when launch_pricing === true.
// `perScreen` = per one screen / per one placement
// `both`      = same-advertiser-on-both-screens bundle (1.7× per-screen), null when N/A
// `setupFee`  = one-time fee
// `weeklyRate`= present on featured_event for weekly buys

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
  middle_takeover: {
    key:           'middle_takeover',
    label:         'Complete Middle-Screen Takeover',
    category:      'digital',
    desc:          'Exclusive static takeover of the Welcome-to-Morgan-Hill center — 1 sponsor/screen',
    exclusive:     true,
    defaultTerm:   3,
    termOptions:   [3, 6, 12],
    hasScreen:     true,
    perScreen:     { option_1: 2000, option_2: 3250, option_3: 4500  },
    both:          { option_1: 3400, option_2: 5525, option_3: 7650  },
  },
  featured_box: {
    key:           'featured_box',
    label:         'Welcome Featured Sponsor Box',
    category:      'digital',
    desc:          'Static sponsor box on Welcome screen — 3 boxes/screen (6 split-screen)',
    exclusive:     false,
    defaultTerm:   3,
    termOptions:   [3, 6, 12],
    hasScreen:     true,
    perScreen:     { option_1: 500,  option_2: 750,  option_3: 1000  },
    both:          { option_1: 850,  option_2: 1275, option_3: 1700  },
  },
  community_static_slot: {
    key:           'community_static_slot',
    label:         'Community Static Page Slot (Free)',
    category:      'digital',
    desc:          '4th static screen page — 5 slots total, free for City/Chamber/local orgs. Track booking here so we know how many of the 5 are still open.',
    exclusive:     false,
    defaultTerm:   3,
    termOptions:   [3, 6, 12],
    hasScreen:     false,
    perScreen:     { option_1: 0, option_2: 0, option_3: 0 },
    both:          null,
  },
  search_button: {
    key:           'search_button',
    label:         'Sponsored Search Button',
    category:      'digital',
    desc:          'First-position button on search — only 5 available',
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
    desc:          'Largest static panel — up to 2 changes/year, 6-month minimum',
    exclusive:     true,
    defaultTerm:   6,
    termOptions:   [6, 12],
    hasScreen:     false,
    perScreen:     { option_1: 1500, option_2: 2500, option_3: 3500  },
    both:          null,
  },
  side_qr_tile: {
    key:           'side_qr_tile',
    label:         'Side Panel QR Sponsor Tile',
    category:      'wrap',
    desc:          'One sponsor tile on the spine — up to 6 tiles total (sellable side only; the other side is not available) — 6-month minimum',
    exclusive:     false,
    defaultTerm:   6,
    termOptions:   [6, 12],
    hasScreen:     false,
    perScreen:     { option_1: 300,  option_2: 450,  option_3: 650   },
    both:          null, // 2026-08-26: only one side of the spine is sellable — no "both sides" bundle
    setupFee:      { option_1: 150,  option_2: 200,  option_3: 250   }, // one-time tile production
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
    perScreen:     { option_1: 250,  option_2: 350,  option_3: 500   }, // monthly (4 weeks)
    weeklyRate:    { option_1: 75,   option_2: 100,  option_3: 150   },
    both:          null,
  },

  // ── PDF Downtown Map ─────────────────────────────────────────────────────────
  map_stand_out: {
    key:           'map_stand_out',
    label:         'Stand Out Building Feature',
    category:      'map',
    desc:          'Enlarged, visually emphasized hand-drawn storefront on the map',
    exclusive:     false,
    defaultTerm:   3,
    termOptions:   [3, 6, 12],
    hasScreen:     false,
    perScreen:     { option_1: 150,  option_2: 250,  option_3: 350   },
    both:          null,
    setupFee:      { option_1: 250,  option_2: 400,  option_3: 600   },
  },
  map_name_under: {
    key:           'map_name_under',
    label:         'Bold Business Name on Map',
    category:      'map',
    desc:          'Business name displayed in bold/color directly on the map',
    exclusive:     false,
    defaultTerm:   3,
    termOptions:   [3, 6, 12],
    hasScreen:     false,
    perScreen:     { option_1: 75,   option_2: 125,  option_3: 175   },
    both:          null,
    setupFee:      null,
  },
  map_name_category: {
    key:           'map_name_category',
    label:         'Bold Name in Category Section',
    category:      'map',
    desc:          'Business name highlighted in bold/color within the category list',
    exclusive:     false,
    defaultTerm:   3,
    termOptions:   [3, 6, 12],
    hasScreen:     false,
    perScreen:     { option_1: 50,   option_2: 85,   option_3: 125   },
    both:          null,
    setupFee:      null,
  },
  map_bundle: {
    key:           'map_bundle',
    label:         'Stand Out Map Bundle ⭐ Best Value',
    category:      'map',
    desc:          'Stand Out Building + Bold Name on Map + Bold Name in Category',
    exclusive:     false,
    defaultTerm:   3,
    termOptions:   [3, 6, 12],
    hasScreen:     false,
    perScreen:     { option_1: 225,  option_2: 375,  option_3: 525   },
    both:          null,
    setupFee:      { option_1: 300,  option_2: 500,  option_3: 700   },
  },
}

// ── Packages (fixed bundles, Option 2 pricing only) ──────────────────────────
// Regular = "Package price"; launchPrice = "Launch price - First 6 months" from PDF.
// Deals sold as a package should record placement_type='package', package_key set below,
// and monthly_rate = launchPrice (or regularPrice post-launch).

export const PACKAGES = {
  morgan_hill_takeover: {
    key:            'morgan_hill_takeover',
    label:          'Morgan Hill Takeover',
    tagline:        'Maximum visibility — own the kiosk experience',
    minTerm:        6,
    aLaCarteValue:  12910,
    regularPrice:   9695,   // Save 25%
    launchPrice:    4848,   // First 6 months
    includes: [
      'Primary Main-Face Wrap',
      'Side Panel QR Sponsorship (spine)',
      'Complete Middle-Screen Takeover on BOTH screens',
      'Top Banner on BOTH screens',
      'Bottom Banner on BOTH screens',
      '2 Sponsored Search Buttons',
      'Featured Event monthly placement',
      'Stand Out Map Bundle',
      'PrimeTime scheduling on BOTH screens',
      'Up to weekly creative refresh',
    ],
    bonus: 'Setup/onboarding fee waived + one static ad design included',
  },
  downtown_headliner: {
    key:            'downtown_headliner',
    label:          'Downtown Headliner',
    tagline:        'Big presence without full takeover',
    minTerm:        3,
    aLaCarteValue:  4465,
    regularPrice:   3575,   // Save 20%
    launchPrice:    1788,
    includes: [
      'Welcome Featured Sponsor Box on BOTH screens',
      'Top Banner on BOTH screens',
      'Bottom Banner on BOTH screens',
      '1 Sponsored Search Button on BOTH screens',
      'Featured Event monthly placement',
      'Stand Out Map Bundle',
      'PrimeTime scheduling on BOTH screens',
    ],
    bonus: 'Up to 2×/month creative refresh included',
  },
  downtown_pop: {
    key:            'downtown_pop',
    label:          'Downtown Pop',
    tagline:        'Strong local visibility, low commitment',
    minTerm:        3,
    aLaCarteValue:  1760,
    regularPrice:   1495,   // Save 15%
    launchPrice:    748,
    includes: [
      'Welcome Featured Sponsor Box on ONE screen',
      'Top Banner on ONE screen',
      'Bold Business Name on Map',
      'Bold Business Name in Category Section',
      'One Featured Event monthly placement',
    ],
    bonus: 'Up to one creative update per month included',
  },
  main_street_moment: {
    key:            'main_street_moment',
    label:          'Main Street Moment',
    tagline:        'Smart visibility for local shops + services',
    minTerm:        3,
    aLaCarteValue:  1035,
    regularPrice:   525,    // Save ~50%
    launchPrice:    263,
    includes: [
      'Bold Business Name on Map',
      'Bold Business Name in Category Section',
      'Welcome Featured Sponsor Box on ONE screen',
      'One Featured Event week each month',
    ],
    bonus: null,
  },
  local_spark: {
    key:            'local_spark',
    label:          'Local Spark',
    tagline:        'Easy entry — perfect for new/small businesses',
    minTerm:        3,
    aLaCarteValue:  310,
    regularPrice:   279,    // Save 10%
    launchPrice:    140,
    includes: [
      'Bold Business Name on Map',
      'Bold Business Name in Category Section',
      'One Featured Event week each month',
    ],
    bonus: null,
  },
}

// ── Creative services & production (billed separately, not commissionable) ───

export const CREATIVE_SERVICES = {
  copy: {
    label:    'MySyde-Created Copy',
    desc:     'MySyde writes the ad messaging',
    fees:     { option_1: 150,  option_2: 250,  option_3: 400 },
  },
  static_ad: {
    label:    'Static Ad Design',
    desc:     'MySyde designs a static ad',
    fees:     { option_1: 200,  option_2: 350,  option_3: 500 },
  },
  animated_ad: {
    label:    'Animated / Dynamic Creative',
    desc:     'MySyde designs animated or dynamic creative (with sound)',
    fees:     { option_1: 400,  option_2: 650,  option_3: 900 },
  },
  wrap_production: {
    label:    'Wrap Production',
    desc:     'Design + Print + Install of physical kiosk wrap',
    feeRange: { min: 2200, max: 3300 }, // one-time
  },
}

// Advertiser-supplied creative (upload/swap) is INCLUDED. No upload, onboarding, or change-frequency fees.
export const CREATIVE_POLICY = {
  suppliedCreative:    'included',
  swapFrequencyCap:    null, // unlimited
  onboardingFee:       0,
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

export function getPackage(packageKey) {
  return PACKAGES[packageKey] ?? null
}

export function packageMonthlyRate(packageKey, isLaunch) {
  const pkg = PACKAGES[packageKey]
  if (!pkg) return 0
  return isLaunch ? pkg.launchPrice : pkg.regularPrice
}

export function fmt(value) {
  if (!value && value !== 0) return '—'
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(value)
}
