const PLATFORMS = {
  facebook:  { label: 'FB',  bg: 'bg-[#1877F2]', text: 'text-white' },
  instagram: { label: 'IG',  bg: 'bg-[#E1306C]', text: 'text-white' },
  linkedin:  { label: 'LI',  bg: 'bg-[#0A66C2]', text: 'text-white' },
  tiktok:    { label: 'TT',  bg: 'bg-[#010100]', text: 'text-white' },
}

export const ALL_PLATFORMS = Object.keys(PLATFORMS)

export const PLATFORM_LABELS = {
  facebook:  'Facebook',
  instagram: 'Instagram',
  linkedin:  'LinkedIn',
  tiktok:    'TikTok',
}

export default function PlatformBadge({ platform, size = 'sm' }) {
  const p = PLATFORMS[platform]
  if (!p) return null

  return (
    <span
      className={`inline-flex items-center justify-center rounded font-bold ${p.bg} ${p.text} ${
        size === 'xs' ? 'text-[8px] w-4 h-4' : 'text-[9px] w-5 h-5'
      }`}
      style={{ fontFamily: 'Roboto, sans-serif' }}
      title={PLATFORM_LABELS[platform]}
    >
      {p.label}
    </span>
  )
}
