import { NavLink } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'

const tabs = [
  { to: '/', label: 'Home', icon: '🏠', end: true },
  { to: '/letters', label: 'Letters', icon: '💌' },
  { to: '/journal', label: 'Journal', icon: '📔' },
  { to: '/profile', label: 'Profile', icon: null },
]

export default function NavBar() {
  const user = useAuthStore((s) => s.user)
  const initial = (user?.display_name || '?')[0].toUpperCase()

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 z-40">
      <div className="max-w-lg mx-auto flex items-center px-2 py-1">
        {tabs.map((tab) => (
          <NavLink
            key={tab.to}
            to={tab.to}
            end={tab.end}
            className={({ isActive }) =>
              `flex-1 flex flex-col items-center py-1.5 text-xs font-semibold transition-colors ${
                isActive ? 'text-primary' : 'text-gray-400'
              }`
            }
          >
            {tab.icon ? (
              <span className="text-xl mb-0.5">{tab.icon}</span>
            ) : (
              <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center text-white text-xs font-bold mb-0.5">
                {initial}
              </div>
            )}
            {tab.label}
          </NavLink>
        ))}
      </div>
    </nav>
  )
}
