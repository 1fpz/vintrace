import {
  LayoutDashboard,
  Cpu,
  Activity,
  SlidersHorizontal,
  History,
  X,
} from 'lucide-react'

import { NavLink } from 'react-router-dom'

interface SidebarProps {
  isOpen: boolean
  onClose: () => void
}

const links = [
  {
    name: 'Visão Geral',
    path: '/',
    icon: LayoutDashboard,
  },
  {
    name: 'Dispositivos',
    path: '/dispositivos',
    icon: Cpu,
  },
  {
    name: 'Monitoramento',
    path: '/monitoramento',
    icon: Activity,
  },
  {
    name: 'Triggers',
    path: '/triggers',
    icon: SlidersHorizontal,
  },
  {
    name: 'Wine Memory',
    path: '/wine-memory',
    icon: History,
  },
]

function Sidebar({ isOpen, onClose }: SidebarProps) {
  return (
    <>
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 lg:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={`
          fixed left-0 top-0 z-50 h-screen w-64
          border-r border-zinc-800 bg-zinc-950 p-5
          transition-transform duration-300
          ${isOpen ? 'translate-x-0' : '-translate-x-full'}
          lg:translate-x-0
        `}
      >
        <div className="mb-10 flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold text-amber-400">
              VinTrace
            </h1>

            <p className="mt-1 text-sm text-zinc-500">
              Environmental Guardian
            </p>
          </div>

          <button
            onClick={onClose}
            className="text-zinc-400 hover:text-white lg:hidden"
          >
            <X size={24} />
          </button>
        </div>

        <nav className="space-y-2">
          {links.map((link) => {
            const Icon = link.icon

            return (
              <NavLink
                key={link.path}
                to={link.path}
                end={link.path === '/'}
                onClick={onClose}
                className={({ isActive }) =>
                  `flex items-center gap-3 rounded-lg px-3 py-2.5 transition ${
                    isActive
                      ? 'bg-amber-400 text-zinc-950'
                      : 'text-zinc-400 hover:bg-zinc-900 hover:text-white'
                  }`
                }
              >
                <Icon size={20} />
                <span>{link.name}</span>
              </NavLink>
            )
          })}
        </nav>
      </aside>
    </>
  )
}

export default Sidebar