import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import Shell from './components/layout/Shell'
import Board from './pages/Board'
import Partners from './pages/Partners'
import Contacts from './pages/Contacts'
import Tasks from './pages/Tasks'
import Social from './pages/Social'
import Kiosks from './pages/Kiosks'
import Calendar from './pages/Calendar'
import Dashboard from './pages/Dashboard'
import DealRecord from './pages/DealRecord'
import PartnerRecord from './pages/PartnerRecord'

const queryClient = new QueryClient()

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Shell />}>
            <Route index element={<Navigate to="/board" replace />} />
            <Route path="board"          element={<Board />} />
            <Route path="deal/:id"       element={<DealRecord />} />
            <Route path="partners"       element={<Partners />} />
            <Route path="partner/:id"    element={<PartnerRecord />} />
            <Route path="tasks"          element={<Tasks />} />
            <Route path="social"         element={<Social />} />
            <Route path="contacts"       element={<Contacts />} />
            <Route path="kiosks"         element={<Kiosks />} />
            <Route path="calendar"       element={<Calendar />} />
            <Route path="dashboard"      element={<Dashboard />} />
          </Route>
          <Route path="*" element={<Navigate to="/board" replace />} />
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  )
}
