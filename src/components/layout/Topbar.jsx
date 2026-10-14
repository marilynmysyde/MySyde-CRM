import { useState, useEffect } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
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
  // Mobile only: on phones the inline tab strip has no room (and its hidden
  // scrollbar gave no hint there were more tabs), so tabs live in a dropdown.
  const [menuOpen, setMenuOpen] = useState(false)
  const location = useLocation()

  useEffect(() => { setMenuOpen(false) }, [location.pathname])

  const currentLabel = NAV_TABS.find(t => location.pathname.startsWith(t.to))?.label ?? 'Menu'

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-[#1D4ED8] h-14 flex items-center px-4 gap-3 md:gap-6 shadow-md">
      {/* Wordmark */}
      <span
        className="text-white font-bold text-lg tracking-tight shrink-0 md:mr-2"
        style={{ fontFamily: "'Manrope', sans-serif" }}
      >
        <span className="hidden sm:inline">MySyde Connect</span>
        <span className="sm:hidden">MySyde</span>
      </span>

      {/* Nav tabs — desktop/tablet */}
      <nav className="hidden md:flex items-center gap-1 overflow-x-auto scrollbar-none flex-1">
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

      {/* Nav menu — phones */}
      <div className="md:hidden flex-1 min-w-0">
        <button
          onClick={() => setMenuOpen(o => !o)}
          className="flex items-center gap-1.5 bg-white/10 hover:bg-white/20 text-white rounded px-3 py-1.5 text-sm font-semibold"
          aria-expanded={menuOpen}
          aria-label="Open navigation menu"
        >
          <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
            <path d="M4 6h16M4 12h16M4 18h16" />
          </svg>
          <span className="truncate">{currentLabel}</span>
        </button>
      </div>

      {menuOpen && (
        <>
          <div className="md:hidden fixed inset-0 top-14 bg-black/30" onClick={() => setMenuOpen(false)} />
          <nav className="md:hidden fixed top-14 left-0 right-0 bg-white shadow-lg border-b border-[#E5E7EB] py-2">
            {NAV_TABS.map(({ label, to }) => (
              <NavLink
                key={to}
                to={to}
                className={({ isActive }) =>
                  [
                    'block px-5 py-3 text-base font-semibold',
                    isActive
                      ? 'bg-[#F59E0B]/15 text-[#1D4ED8]'
                      : 'text-[#111827] hover:bg-[#F9FAFB]',
                  ].join(' ')
                }
              >
                {label}
              </NavLink>
            ))}
          </nav>
        </>
      )}

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
