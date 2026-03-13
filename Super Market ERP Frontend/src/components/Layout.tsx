import { Link, useLocation, Outlet } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

const navItems: { to: string; label: string; roles?: ('Admin' | 'Manager' | 'Staff')[] }[] = [
  { to: '/', label: 'Dashboard' },
  { to: '/sales', label: 'Sales' },
  { to: '/products', label: 'Products', roles: ['Admin', 'Manager', 'Staff'] },
  { to: '/categories', label: 'Categories', roles: ['Admin', 'Manager'] },
  { to: '/customers', label: 'Customers', roles: ['Admin', 'Staff'] },
  { to: '/suppliers', label: 'Suppliers', roles: ['Admin', 'Manager'] },
  { to: '/stockbatch', label: 'Stock Batches', roles: ['Admin', 'Manager'] },
  { to: '/porderdetail', label: 'PO Details', roles: ['Admin', 'Manager'] },
  { to: '/users', label: 'Users', roles: ['Admin', 'Manager'] },
]

export default function Layout() {
  const { user, logout, isRole } = useAuth()
  const location = useLocation()

  return (
    <div className="flex min-h-screen bg-slate-50">
      <aside className="w-56 bg-slate-900 text-white flex flex-col shrink-0">
        <div className="p-4 border-b border-slate-700">
          <Link to="/" className="font-semibold text-teal-400 flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"/>
            </svg>
            RetailSphere
          </Link>
        </div>
        <nav className="flex-1 p-2 space-y-0.5 overflow-y-auto">
          {navItems.map((item) => {
            const allowed = !item.roles || item.roles.some((r) => isRole(r))
            if (!allowed) return null
            const active = location.pathname === item.to || (item.to !== '/' && location.pathname.startsWith(item.to))
            return (
              <Link
                key={item.to}
                to={item.to}
                className={`block px-3 py-2 rounded-lg text-sm transition ${
                  active ? 'bg-teal-600 text-white' : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                }`}
              >
                {item.label}
              </Link>
            )
          })}
        </nav>
        <div className="p-3 border-t border-slate-700">
          <Link to="/profile" className="block p-2 -m-2 rounded hover:bg-slate-800 transition mb-2">
            <div className="text-xs text-slate-300 truncate font-medium" title={user?.username}>
              {user?.username}
            </div>
            <div className="text-[10px] text-slate-500">{user?.role}</div>
          </Link>
          <button
            type="button"
            onClick={logout}
            className="text-xs text-red-400 hover:text-red-300 transition focus:outline-none"
          >
            Sign out
          </button>
        </div>
      </aside>
      <main className="flex-1 overflow-auto p-6">
        <Outlet />
      </main>
    </div>
  )
}
