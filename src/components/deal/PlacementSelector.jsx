import { useState } from 'react'
import { supabase } from '../../lib/supabase'
import {
  CATEGORIES, TIER_LABELS, PLACEMENTS, PACKAGES,
  placementsByCategory, calcRate, calcTotal, getSetupFee, fmt,
  getPackage, packageMonthlyRate,
} from '../../lib/rateCard'

const SCREEN_OPTIONS = [
  { key: 'screen_1', label: 'Screen 1' },
  { key: 'screen_2', label: 'Screen 2' },
  { key: 'both',     label: 'Both Screens (bundle)' },
]

const TIER_ORDER = ['option_1', 'option_2', 'option_3']

const TIER_COLORS = {
  option_1: { selected: 'border-gray-400 bg-gray-50',   dot: 'bg-gray-400'   },
  option_2: { selected: 'border-[#1D4ED8] bg-[#1D4ED8]/5', dot: 'bg-[#1D4ED8]' },
  option_3: { selected: 'border-[#F59E0B] bg-[#F59E0B]/10', dot: 'bg-yellow-400' },
}

export default function PlacementSelector({ deal, onUpdate }) {
  const [category, setCategory] = useState(() => {
    if (deal.placement_type === 'package') return 'package'
    if (PLACEMENTS[deal.placement_type]) return PLACEMENTS[deal.placement_type].category
    return 'package'
  })
  const [placementType, setPlacementType] = useState(deal.placement_type ?? null)
  const [packageKey,    setPackageKey]    = useState(deal.package_key ?? null)
  const [tier,          setTier]          = useState(deal.pricing_tier ?? 'option_2')
  const [screen,        setScreen]        = useState(deal.screen ?? 'screen_1')
  const [launchPricing, setLaunchPricing] = useState(deal.launch_pricing ?? false)
  const [months,        setMonths]        = useState(deal.months ?? 3)
  const [saving,        setSaving]        = useState(false)

  const isPackage = placementType === 'package'
  const placement = PLACEMENTS[placementType]
  const pkg       = isPackage ? getPackage(packageKey) : null

  const monthlyRate = isPackage
    ? (pkg ? packageMonthlyRate(pkg.key, launchPricing) : 0)
    : (placementType ? calcRate(placementType, tier, placement?.hasScreen ? screen : 'screen_1', launchPricing) : 0)

  const totalValue = isPackage
    ? monthlyRate * months
    : calcTotal(placementType, tier, placement?.hasScreen ? screen : 'screen_1', launchPricing, months)

  const setupFee = isPackage ? 0 : (placementType ? getSetupFee(placementType, tier) : 0)

  async function persist(patch) {
    setSaving(true)
    await supabase.from('deals').update(patch).eq('id', deal.id)
    setSaving(false)
    onUpdate?.(patch)
  }

  function handleCategory(cat) {
    setCategory(cat)
    setPlacementType(null)
    setPackageKey(null)
  }

  function handlePlacement(key) {
    const p = PLACEMENTS[key]
    const newMonths  = p.defaultTerm
    const newScreen  = p.hasScreen ? screen : 'screen_1'
    setPlacementType(key)
    setPackageKey(null)
    setMonths(newMonths)
    const rate  = calcRate(key, tier, p.hasScreen ? newScreen : 'screen_1', launchPricing)
    persist({
      placement_type: key,
      package_key:    null,
      pricing_tier:   tier,
      screen:         p.hasScreen ? newScreen : null,
      launch_pricing: launchPricing,
      monthly_rate:   rate,
      months:         newMonths,
    })
  }

  function handlePackage(key) {
    const p = getPackage(key)
    if (!p) return
    setPlacementType('package')
    setPackageKey(key)
    setMonths(p.minTerm)
    const rate = packageMonthlyRate(key, launchPricing)
    persist({
      placement_type: 'package',
      package_key:    key,
      screen:         null,
      pricing_tier:   null,
      launch_pricing: launchPricing,
      monthly_rate:   rate,
      months:         p.minTerm,
    })
  }

  function handleTier(t) {
    setTier(t)
    if (!placementType || isPackage) return
    const rate = calcRate(placementType, t, placement?.hasScreen ? screen : 'screen_1', launchPricing)
    persist({ pricing_tier: t, monthly_rate: rate })
  }

  function handleScreen(s) {
    setScreen(s)
    if (!placementType || isPackage) return
    const rate = calcRate(placementType, tier, s, launchPricing)
    persist({ screen: s, monthly_rate: rate })
  }

  function handleLaunch(val) {
    setLaunchPricing(val)
    if (isPackage) {
      if (!pkg) return
      const rate = packageMonthlyRate(pkg.key, val)
      persist({ launch_pricing: val, monthly_rate: rate })
      return
    }
    if (!placementType) return
    const rate = calcRate(placementType, tier, placement?.hasScreen ? screen : 'screen_1', val)
    persist({ launch_pricing: val, monthly_rate: rate })
  }

  function handleMonths(m) {
    setMonths(m)
    persist({ months: m })
  }

  return (
    <div className="bg-white rounded-[14px] border border-gray-100 p-4">
      <div className="flex items-center justify-between mb-3">
        <h3
          className="text-sm font-semibold text-[#111827]"
          style={{ fontFamily: "'Manrope', sans-serif" }}
        >
          Placement
        </h3>
        {saving && (
          <span className="text-xs text-gray-400" style={{ fontFamily: "'Manrope', sans-serif" }}>
            Saving…
          </span>
        )}
      </div>

      {/* Category tabs */}
      <div className="flex gap-1 mb-3 flex-wrap">
        {CATEGORIES.map(cat => (
          <button
            key={cat.key}
            onClick={() => handleCategory(cat.key)}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              category === cat.key
                ? 'bg-[#1D4ED8] text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
            style={{ fontFamily: 'Manrope, sans-serif' }}
          >
            <span>{cat.icon}</span>
            {cat.label}
          </button>
        ))}
      </div>

      {/* Placement type / package cards */}
      <div className="space-y-1.5 mb-4">
        {category === 'package'
          ? Object.values(PACKAGES).map(p => (
              <button
                key={p.key}
                onClick={() => handlePackage(p.key)}
                className={`w-full text-left rounded-lg border px-3 py-2.5 transition-all ${
                  isPackage && packageKey === p.key
                    ? 'border-[#1D4ED8] bg-[#1D4ED8]/5'
                    : 'border-gray-200 hover:border-gray-300 bg-white'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <span
                      className="text-xs font-semibold text-[#111827]"
                      style={{ fontFamily: 'Manrope, sans-serif' }}
                    >
                      {p.label}
                    </span>
                    <p
                      className="text-[10px] text-gray-400 mt-0.5"
                      style={{ fontFamily: "'Manrope', sans-serif" }}
                    >
                      {p.tagline} · {p.minTerm}-mo min
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <span
                      className="text-xs font-bold text-[#1D4ED8]"
                      style={{ fontFamily: "'Manrope', sans-serif" }}
                    >
                      {fmt(p.launchPrice)}
                    </span>
                    <span
                      className="text-[10px] text-gray-400 block"
                      style={{ fontFamily: "'Manrope', sans-serif" }}
                    >
                      /mo · launch
                    </span>
                  </div>
                </div>
              </button>
            ))
          : placementsByCategory(category).map(p => (
              <button
                key={p.key}
                onClick={() => handlePlacement(p.key)}
                className={`w-full text-left rounded-lg border px-3 py-2.5 transition-all ${
                  placementType === p.key
                    ? 'border-[#1D4ED8] bg-[#1D4ED8]/5'
                    : 'border-gray-200 hover:border-gray-300 bg-white'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span
                        className="text-xs font-semibold text-[#111827]"
                        style={{ fontFamily: 'Manrope, sans-serif' }}
                      >
                        {p.label}
                      </span>
                      {p.exclusive && (
                        <span
                          className="text-[9px] font-semibold px-1 py-0.5 rounded bg-yellow-100 text-yellow-700 uppercase tracking-wide"
                          style={{ fontFamily: 'Manrope, sans-serif' }}
                        >
                          Exclusive
                        </span>
                      )}
                    </div>
                    <p
                      className="text-[10px] text-gray-400 mt-0.5"
                      style={{ fontFamily: "'Manrope', sans-serif" }}
                    >
                      {p.desc}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <span
                      className="text-xs font-bold text-[#1D4ED8]"
                      style={{ fontFamily: "'Manrope', sans-serif" }}
                    >
                      {fmt(p.perScreen.option_2)}
                    </span>
                    <span
                      className="text-[10px] text-gray-400"
                      style={{ fontFamily: "'Manrope', sans-serif" }}
                    >
                      /mo
                    </span>
                  </div>
                </div>
              </button>
            ))}
      </div>

      {/* Package configuration — only shown once a package is selected */}
      {isPackage && pkg && (
        <div className="border-t border-gray-100 pt-4 space-y-4">

          {/* Includes */}
          <div>
            <p
              className="text-[10px] font-semibold uppercase tracking-wide text-gray-400 mb-1.5"
              style={{ fontFamily: 'Manrope, sans-serif' }}
            >
              Includes
            </p>
            <ul className="space-y-1">
              {pkg.includes.map(item => (
                <li
                  key={item}
                  className="text-xs text-[#111827] flex items-start gap-1.5"
                  style={{ fontFamily: 'Manrope, sans-serif' }}
                >
                  <span className="text-[#1D4ED8] mt-0.5">✓</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Launch pricing toggle */}
          <div className="flex items-center justify-between p-2.5 rounded-lg bg-[#F59E0B]/10 border border-[#F59E0B]/40">
            <div>
              <p
                className="text-xs font-semibold text-[#111827]"
                style={{ fontFamily: 'Manrope, sans-serif' }}
              >
                🚀 Launch Pricing (50% off)
              </p>
              <p
                className="text-[10px] text-gray-500"
                style={{ fontFamily: "'Manrope', sans-serif" }}
              >
                First 6 months — limited window
              </p>
            </div>
            <button
              onClick={() => handleLaunch(!launchPricing)}
              className={`w-10 h-6 rounded-full transition-colors relative ${
                launchPricing ? 'bg-[#1D4ED8]' : 'bg-gray-300'
              }`}
            >
              <span
                className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-transform ${
                  launchPricing ? 'translate-x-5' : 'translate-x-1'
                }`}
              />
            </button>
          </div>

          {/* Term + rate summary */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <label
                className="text-xs text-gray-500"
                style={{ fontFamily: 'Manrope, sans-serif' }}
              >
                Term (months)
              </label>
              <input
                type="number"
                min={pkg.minTerm}
                value={months}
                onChange={e => handleMonths(Number(e.target.value))}
                className="w-16 text-sm border border-gray-200 rounded px-2 py-1 text-[#111827] focus:outline-none focus:border-[#1D4ED8]"
                style={{ fontFamily: 'Manrope, sans-serif' }}
              />
            </div>

            <div className="flex items-baseline gap-3 ml-auto">
              <span
                className="text-xs text-gray-500"
                style={{ fontFamily: 'Manrope, sans-serif' }}
              >
                {fmt(monthlyRate)}/mo
              </span>
              <span
                className="text-base font-bold text-[#1D4ED8]"
                style={{ fontFamily: "'Manrope', sans-serif" }}
              >
                {fmt(totalValue)} total
              </span>
            </div>
          </div>

          <p
            className="text-[10px] text-gray-400"
            style={{ fontFamily: "'Manrope', sans-serif" }}
          >
            {pkg.minTerm}-month minimum term for this package.
          </p>

          {pkg.bonus && (
            <p
              className="text-xs text-[#1D4ED8] bg-[#1D4ED8]/5 rounded-lg px-3 py-2"
              style={{ fontFamily: "'Manrope', sans-serif" }}
            >
              🎁 {pkg.bonus}
            </p>
          )}
        </div>
      )}

      {/* À la carte configuration — only shown once an individual placement is selected */}
      {!isPackage && placement && (
        <div className="border-t border-gray-100 pt-4 space-y-4">

          {/* Screen selector — digital only */}
          {placement.hasScreen && (
            <div>
              <p
                className="text-[10px] font-semibold uppercase tracking-wide text-gray-400 mb-1.5"
                style={{ fontFamily: 'Manrope, sans-serif' }}
              >
                Screen
              </p>
              <div className="flex gap-1.5">
                {SCREEN_OPTIONS.map(s => (
                  <button
                    key={s.key}
                    onClick={() => handleScreen(s.key)}
                    disabled={s.key === 'both' && !placement.both}
                    className={`flex-1 text-xs px-2 py-1.5 rounded-lg border transition-colors disabled:opacity-30 disabled:cursor-not-allowed ${
                      screen === s.key
                        ? 'bg-[#1D4ED8] text-white border-[#1D4ED8]'
                        : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300'
                    }`}
                    style={{ fontFamily: 'Manrope, sans-serif' }}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
              {screen === 'both' && placement.both && (
                <p
                  className="text-[10px] text-[#1D4ED8] mt-1"
                  style={{ fontFamily: "'Manrope', sans-serif" }}
                >
                  Bundle rate (1.7× — value vs buying separately)
                </p>
              )}
            </div>
          )}

          {/* Pricing tier */}
          <div>
            <p
              className="text-[10px] font-semibold uppercase tracking-wide text-gray-400 mb-1.5"
              style={{ fontFamily: 'Manrope, sans-serif' }}
            >
              Pricing Tier
            </p>
            <div className="grid grid-cols-3 gap-1.5">
              {TIER_ORDER.map(t => {
                const rate = calcRate(
                  placementType, t,
                  placement.hasScreen ? screen : 'screen_1',
                  launchPricing
                )
                const colors = TIER_COLORS[t]
                return (
                  <button
                    key={t}
                    onClick={() => handleTier(t)}
                    className={`rounded-lg border-2 p-2 text-center transition-all ${
                      tier === t ? colors.selected : 'border-gray-200 bg-white hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-center justify-center gap-1 mb-0.5">
                      <div className={`w-1.5 h-1.5 rounded-full ${colors.dot}`} />
                      <span
                        className="text-[9px] font-semibold uppercase tracking-wide text-gray-500"
                        style={{ fontFamily: 'Manrope, sans-serif' }}
                      >
                        {t === 'option_1' ? 'Launch' : t === 'option_2' ? 'Market' : 'Premium'}
                      </span>
                    </div>
                    <span
                      className="text-sm font-bold text-[#111827]"
                      style={{ fontFamily: "'Manrope', sans-serif" }}
                    >
                      {fmt(rate)}
                    </span>
                    <span
                      className="text-[9px] text-gray-400 block"
                      style={{ fontFamily: "'Manrope', sans-serif" }}
                    >
                      /mo
                    </span>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Launch pricing toggle */}
          <div className="flex items-center justify-between p-2.5 rounded-lg bg-[#F59E0B]/10 border border-[#F59E0B]/40">
            <div>
              <p
                className="text-xs font-semibold text-[#111827]"
                style={{ fontFamily: 'Manrope, sans-serif' }}
              >
                🚀 Launch Pricing (50% off)
              </p>
              <p
                className="text-[10px] text-gray-500"
                style={{ fontFamily: "'Manrope', sans-serif" }}
              >
                First 6 months — limited window
              </p>
            </div>
            <button
              onClick={() => handleLaunch(!launchPricing)}
              className={`w-10 h-6 rounded-full transition-colors relative ${
                launchPricing ? 'bg-[#1D4ED8]' : 'bg-gray-300'
              }`}
            >
              <span
                className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-transform ${
                  launchPricing ? 'translate-x-5' : 'translate-x-1'
                }`}
              />
            </button>
          </div>

          {/* Term */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <label
                className="text-xs text-gray-500"
                style={{ fontFamily: 'Manrope, sans-serif' }}
              >
                Term (months)
              </label>
              <select
                value={months}
                onChange={e => handleMonths(Number(e.target.value))}
                className="text-sm border border-gray-200 rounded px-2 py-1 text-[#111827] focus:outline-none focus:border-[#1D4ED8]"
                style={{ fontFamily: 'Manrope, sans-serif' }}
              >
                {placement.termOptions.map(m => (
                  <option key={m} value={m}>{m} mo{m > 1 ? 's' : ''}</option>
                ))}
                {!placement.termOptions.includes(months) && (
                  <option value={months}>{months} mos</option>
                )}
              </select>
            </div>

            {/* Rate summary */}
            <div className="flex items-baseline gap-3 ml-auto">
              <span
                className="text-xs text-gray-500"
                style={{ fontFamily: 'Manrope, sans-serif' }}
              >
                {fmt(monthlyRate)}/mo
              </span>
              <span
                className="text-base font-bold text-[#1D4ED8]"
                style={{ fontFamily: "'Manrope', sans-serif" }}
              >
                {fmt(totalValue)} total
              </span>
            </div>
          </div>

          {/* Setup fee notice */}
          {setupFee > 0 && (
            <p
              className="text-xs text-gray-500 bg-gray-50 rounded-lg px-3 py-2"
              style={{ fontFamily: "'Manrope', sans-serif" }}
            >
              + {fmt(setupFee)} one-time setup fee (billed separately)
            </p>
          )}

          {/* Month-to-month note */}
          {placement.category !== 'wrap' && (
            <p
              className="text-[10px] text-gray-400"
              style={{ fontFamily: "'Manrope', sans-serif" }}
            >
              Month-to-month available at +20% — add a note in the activity log if applicable.
            </p>
          )}
        </div>
      )}
    </div>
  )
}
