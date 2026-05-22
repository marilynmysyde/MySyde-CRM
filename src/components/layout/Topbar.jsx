import { NavLink } from 'react-router-dom'
import GlobalSearch from './GlobalSearch'

const NAV_TABS = [
  { label: 'Board',     to: '/board' },
  { label: 'Partners',  to: '/partners' },
  { label: 'Tasks',     to: '/tasks' },
  { label: 'Social',    to: '/social' },
  { label: 'Contacts',  to: '/contacts' },
  { label: 'Kiosks',    to: '/kiosks' },
  { label: 'Calendar',  to: '/calendar' },
  { label: 'Dashboard', to: '/dashboard' },
]

export default function Topbar() {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-[#02348E] h-14 flex items-center px-4 gap-6 shadow-md">
      {/* Wordmark */}
      <span
        className="text-white font-bold text-lg tracking-tight shrink-0 mr-2"
        style={{ fontFamily: "'IBM Plex Sans', sans-serif" }}
      >
        MySyde Connect
      </span>

      {/* Nav tabs */}
      <nav className="flex items-center gap-1 overflow-x-auto scrollbar-none flex-1">
        {NAV_TABS.map(({ label, to }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              [
                'px-3 py-1.5 rounded text-sm font-medium whitespace-nowrap transition-colors',
                'font-[Roboto]',
                isActive
                  ? 'bg-[#FFEC00] text-[#010100]'
                  : 'text-white/80 hover:text-white hover:bg-white/10',
              ].join(' ')
            }
          >
            {label}
          </NavLink>
        ))}
      </nav>

      {/* Global search */}
      <div className="shrink-0">
        <GlobalSearch />
      </div>
    </header>
  )
}
