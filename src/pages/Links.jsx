import { useState } from 'react'

// Edit this list to add/update/remove links. Grouped sections render in this order.
// url: null renders as "Add link" placeholder for Marilyn to fill in later.
const LINK_GROUPS = [
  {
    label: 'MySyde — Core',
    links: [
      { name: 'Website', url: 'https://mysyde.com' },
      { name: 'Kiosk Landing Page', url: 'https://mysyde.com/kiosk' },
      { name: 'Kiosk Product Site', url: 'https://mysydekiosk.com' },
      { name: 'MySyde Connect (CRM)', url: 'https://crm.mysyde.com' },
      { name: 'MySyde Connect User Guide', url: 'https://claude.ai/code/artifact/c60a854d-0c69-4e9e-ab53-0d870e596593' },
      { name: 'Selling in MySyde Connect (sales cheat sheet)', url: 'https://claude.ai/code/artifact/3a3e7910-cd87-4c08-a055-82e144bb422d' },
    ],
  },
  {
    label: 'Morgan Hill Kiosk — Sales Assets',
    links: [
      { name: 'Morgan Hill Launch Assets (Drive folder)', url: 'https://drive.google.com/drive/folders/1pXsvXVM_HUfKFplQ7s1UnX-BFSVak0rb' },
      { name: '[Morgan Hill] Community Kiosk Program Offer (Google Doc)', url: 'https://docs.google.com/document/d/1i_4Cu6JmmIuXIviMMN2WNX4o2FU0iQXu3Qnrif91xDc/edit' },
      { name: 'Morgan Hill Sales Offer (PDF, brand v2)', url: null, note: 'projects/active/morgan-hill-kiosk-launch/2026-08-14-morgan-hill-sales-offer.pdf' },
      { name: 'Creative Specs & Submission Guide (Google Doc)', url: 'https://docs.google.com/document/d/1Scq9BPuSZR_4on98pWKWhOTM62O2M8PtE4iqLkcqIGw/edit' },
      { name: 'Creative Submission Form', url: 'https://forms.gle/3WsFbG4hofW3XKXs7' },
      { name: 'Client Creative Intake (Drive folder — per-business art)', url: 'https://drive.google.com/drive/folders/127PWW5uYDH4nzaIHFBFnn3lLaJtX-RkX', note: 'Lives in the "Drive" shared drive (not My Drive) — one subfolder per advertiser, where their submitted art/files land.' },
      { name: 'Book a Kiosk Demo (Calendly — Sales)', url: 'https://calendly.com/digitalads-mysyde/30min' },
      { name: "Marilyn's Calendly", url: 'https://calendly.com/marilyn-mysyde' },
      { name: 'Exhibit A — Sales Compensation Plan v2', url: 'https://docs.google.com/document/d/1OyUNAdRrVRzwFhqfPlCVgEE5WQkxx_LljZkmc-VNvQY/edit' },
    ],
  },
  {
    label: 'Kiosk-Facing (Consumer)',
    links: [
      { name: 'Kiosk QR Landing — morganhill.mysyde.com', url: 'https://morganhill.mysyde.com' },
      { name: 'Alternate domain — morgan-hill.mysyde.com', url: 'https://morgan-hill.mysyde.com' },
    ],
  },
  {
    label: 'Marketing Funnels (Mailerlite)',
    links: [
      { name: '1. Kiosk QR Welcome', url: 'https://dashboard.mailerlite.com/automations', note: 'OFF — waits on the email-capture bar. 4 emails built.' },
      { name: '2. General MySyde Interest', url: null, note: 'Not built yet — post-launch (Q4)' },
      { name: '3. Sales Nurture (from Drew)', url: 'https://dashboard.mailerlite.com/automations', note: 'ON, live · reply-to has a typo in Mailerlite ("diigitalads@") — worth fixing' },
      { name: '4. Advertiser Interest', url: null, note: 'Blocked on dev — needs the "advertise here" QR + landing page' },
      { name: '5. Active Advertiser Onboarding', url: 'https://dashboard.mailerlite.com/automations', note: 'ON, live · all 4 automations built (Onboarding, Creative Deadline Nudge, Launch Day, Renewal/Transition)' },
    ],
  },
  {
    label: 'Team & Onboarding',
    links: [
      { name: 'Onboarding Packet MASTER (Drive folder)', url: 'https://drive.google.com/drive/folders/1LN4jedfqsVdjXHHba2ESuXvFFO7lOjyB' },
      { name: 'Welcome to MySyde — Day 1 Guide', url: 'https://docs.google.com/document/d/15I8dGHZJ2GRc0yrqw4Rv8wI6ngU3UnJB3wjibDmMiDY/edit' },
      { name: 'Welcome Email Template', url: 'https://docs.google.com/document/d/1cdB2FagR4ZQIskUN_HtF3GDAbR582t0SWDkUNi5GADk/edit' },
      { name: 'CRM Walkthrough — 30-Min Script', url: 'https://docs.google.com/document/d/1V4exAnatKR-KjtXgsvdhHlV6YmJzDBrx-4CjUChbldg/edit' },
      { name: 'Andrew Becks — Onboarding (Drive folder)', url: 'https://drive.google.com/drive/folders/14FMWtKrVRA_cnVZAGiHJkaPyDqwoEiBs' },
    ],
  },
  {
    label: 'Tools & Logins',
    links: [
      { name: 'Mandoe (digital signage scheduler)', url: 'https://us.mandoemedia.com/welcome' },
      { name: 'Stripe Dashboard', url: null, note: 'Add once new bank account Stripe is set up' },
      { name: 'Mailerlite', url: 'https://app.mailerlite.com' },
      { name: 'Plann That', url: 'https://web.plannthat.com' },
      { name: 'Scalefusion (kiosk remote viewer/MDM)', url: 'https://app.scalefusion.com/users/sign_in', note: 'Login: marilyn@mysyde.com' },
      { name: 'PostHog (analytics)', url: 'https://app.posthog.com' },
      { name: 'WordPress Admin (mysyde.com)', url: null, note: 'Add login URL — not in .env yet' },
      { name: 'Canva', url: null, note: 'Add brand kit URL' },
      { name: 'GitHub — mysyde-crm', url: 'https://github.com/marilynmysyde/MySyde-CRM' },
      { name: 'Vercel Dashboard', url: 'https://vercel.com/dashboard' },
      { name: 'Supabase Dashboard', url: 'https://supabase.com/dashboard/project/wyguubkjefkefqosguio' },
    ],
  },
]

function CopyButton({ url }) {
  const [copied, setCopied] = useState(false)
  if (!url) return null
  return (
    <button
      onClick={() => {
        navigator.clipboard.writeText(url)
        setCopied(true)
        setTimeout(() => setCopied(false), 1200)
      }}
      className="text-xs font-semibold px-2 py-1 rounded border border-[#E5E7EB] text-[#6B7280] hover:bg-[#F9FAFB] hover:text-[#1D4ED8] transition-colors shrink-0"
      style={{ fontFamily: 'Manrope, sans-serif' }}
      title="Copy link"
    >
      {copied ? 'Copied!' : 'Copy'}
    </button>
  )
}

function LinkRow({ link }) {
  return (
    <div className="flex items-center justify-between gap-3 px-4 py-3 border-b border-[#E5E7EB] last:border-b-0">
      <div className="min-w-0">
        <p className="text-sm font-medium text-[#111827] truncate" style={{ fontFamily: 'Manrope, sans-serif' }}>
          {link.name}
        </p>
        {link.url ? (
          <a
            href={link.url}
            target="_blank"
            rel="noreferrer"
            className="text-xs text-[#1D4ED8] hover:underline truncate block"
          >
            {link.url}
          </a>
        ) : (
          <p className="text-xs text-[#6B7280] italic truncate">{link.note ?? 'Link not set yet'}</p>
        )}
        {link.url && link.note && (
          <p className="text-[11px] text-[#6B7280] truncate mt-0.5">{link.note}</p>
        )}
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <CopyButton url={link.url} />
        {link.url && (
          <a
            href={link.url}
            target="_blank"
            rel="noreferrer"
            className="text-xs font-semibold px-2 py-1 rounded bg-[#1D4ED8] text-white hover:bg-[#1E40AF] transition-colors"
            style={{ fontFamily: 'Manrope, sans-serif' }}
          >
            Open
          </a>
        )}
      </div>
    </div>
  )
}

export default function Links() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-extrabold text-[#111827] mb-1" style={{ fontFamily: 'Manrope, sans-serif' }}>
        Links
      </h1>
      <p className="text-sm text-[#6B7280] mb-6" style={{ fontFamily: 'Manrope, sans-serif' }}>
        Every kiosk + MySyde link the field team needs, in one place. Edit <code className="text-xs bg-[#F9FAFB] px-1 py-0.5 rounded">src/pages/Links.jsx</code> to add or update.
      </p>

      {LINK_GROUPS.map((group) => (
        <div key={group.label} className="mb-6">
          <h2 className="text-xs font-bold uppercase tracking-wide text-[#6B7280] mb-2 px-1" style={{ fontFamily: 'Manrope, sans-serif' }}>
            {group.label}
          </h2>
          <div className="bg-white rounded-[14px] border border-[#E5E7EB] overflow-hidden">
            {group.links.map((link) => (
              <LinkRow key={link.name} link={link} />
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}
