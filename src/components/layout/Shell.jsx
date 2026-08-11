import { Outlet } from 'react-router-dom'
import Topbar from './Topbar'
import AgendaSidebar from './AgendaSidebar'

export default function Shell() {
  return (
    <div className="min-h-screen bg-[#F9FAFB] flex flex-col">
      <Topbar />

      {/* Desktop: side-by-side with independent scroll. Mobile: stacked, full-page scroll */}
      <div className="flex flex-col lg:flex-row flex-1 pt-14 lg:overflow-hidden">
        <main className="flex-1 min-h-0 lg:overflow-y-auto">
          <Outlet />
        </main>
        <div className="shrink-0 lg:h-[calc(100vh-3.5rem)] lg:sticky lg:top-14">
          <AgendaSidebar />
        </div>
      </div>
    </div>
  )
}
