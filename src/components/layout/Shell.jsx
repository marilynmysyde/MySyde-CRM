import { Outlet } from 'react-router-dom'
import Topbar from './Topbar'
import AgendaSidebar from './AgendaSidebar'

export default function Shell() {
  return (
    <div className="min-h-screen bg-[#F2F3F7] flex flex-col">
      <Topbar />

      {/* Content area below fixed topbar */}
      <div className="flex flex-1 pt-14 overflow-hidden">
        {/* Main scrollable area */}
        <main className="flex-1 overflow-y-auto">
          <Outlet />
        </main>

        {/* Right sidebar — hidden on small screens */}
        <div className="hidden lg:block h-[calc(100vh-3.5rem)] sticky top-14">
          <AgendaSidebar />
        </div>
      </div>
    </div>
  )
}
