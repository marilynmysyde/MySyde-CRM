import { NavLink } from 'react-router-dom'
import GlobalSearch from './GlobalSearch'
import { useAuth } from '../../contexts/AuthContext'

const NAV_TABS = [
  { label: 'Board',     to: '/board' },
  { label: 'Partners',  to: '/partners' },
  { label: 'Tasks',     to: '/tasks' },
  { label: 'Social',    to: '/social' },
  { label: 'Contacts',  to: '/contacts' },
  { label: 'Kiosks',    to: '/kiosks' },
  { label: 'Calendar',  to: '/calendar' },
  { label: 'Dashboard', to: '/dashboard' },
  { label: 'Links',     to: '/links' },
]

export default function Topbar() {
  const { user, signOut } = useAuth()
  const initials = user?.email?.slice(0, 2).toUpperCase() ?? '??'

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-[#1D4ED8] h-14 flex items-center px-4 gap-6 shadow-md">
      {/* Wordmark */}
      <span
        className="text-white font-bold text-lg tracking-tight shrink-0 mr-2"
        style={{ fontFamily: "'Manrope', sans-serif" }}
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
                'px-3 py-1.5 rounded text-sm font-semibold whitespace-nowrap transition-colors',
                isActive
                  ? 'bg-[#F59E0B] text-[#111827]'
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

      {/* User avatar + logout */}
      <div className="shrink-0 flex items-center gap-2 ml-1">
        <div
          className="w-7 h-7 rounded-full bg-white/20 flex items-center justify-center text-white text-[11px] font-bold"
          style={{ fontFamily: 'Manrope, sans-serif' }}
          title={user?.email}
        >
          {initials}
        </div>
        <button
          onClick={signOut}
          className="text-white/60 hover:text-white text-xs transition-colors"
          style={{ fontFamily: 'Manrope, sans-serif' }}
          title="Sign out"
        >
          Sign out
        </button>
      </div>
    </header>
  )
}
