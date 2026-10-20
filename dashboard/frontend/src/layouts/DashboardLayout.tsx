import { useState } from 'react'
import { Menu } from 'lucide-react'
import { Outlet } from 'react-router-dom'
import Sidebar from '../components/Sidebar'

function DashboardLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      <Sidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      <header className="flex h-16 items-center border-b border-zinc-800 px-4 lg:hidden">
        <button
          onClick={() => setSidebarOpen(true)}
          className="rounded-lg p-2 text-zinc-300 hover:bg-zinc-900 hover:text-white"
        >
          <Menu size={24} />
        </button>

        <span className="ml-3 font-semibold text-amber-400">
          VinTrace
        </span>
      </header>

      <main className="min-h-screen p-4 sm:p-6 lg:ml-64 lg:p-8">
        <Outlet />
      </main>
    </div>
  )
}

export default DashboardLayout