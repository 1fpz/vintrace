import { Route, Routes } from 'react-router-dom'

import DashboardLayout from './layouts/DashboardLayout'

import DashboardPage from './pages/DashboardPage'
import DevicesPage from './pages/DevicesPage'
import MonitoringPage from './pages/MonitoringPage'
import TriggersPage from './pages/TriggersPage'
import WineMemoryPage from './pages/WineMemoryPage'

function App() {
  return (
    <Routes>
      <Route element={<DashboardLayout />}>
        <Route path="/" element={<DashboardPage />} />
        <Route path="/dispositivos" element={<DevicesPage />} />
        <Route path="/monitoramento" element={<MonitoringPage />} />
        <Route path="/triggers" element={<TriggersPage />} />
        <Route path="/wine-memory" element={<WineMemoryPage />} />
      </Route>
    </Routes>
  )
}

export default App