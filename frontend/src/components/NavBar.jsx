import { NavLink } from 'react-router-dom'
import { useEffect } from 'react'
import { useAuthStore } from '../store/authStore'
import { useUnreadStore } from '../store/unreadStore'

export default function NavBar() {
  const user = useAuthStore((s) => s.user)
  const { unreadLetters, fetchUnread } = useUnreadStore()
  const initial = (user?.display_name || '?')[0].toUpperCase()

  useEffect(() => {
    fetchUnread()
    const interval = setInterval(fetchUnread, 30000)
    return () => clearInterval(interval)
  }, [])

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 z-40">
      <div className="max-w-lg mx-auto flex items-center px-2 py-1">
        <NavLink to="/" end className={({ isActive }) =>
          `flex-1 flex flex-col items-center py-1.5 text-xs font-semibold transition-colors ${isActive ? 'text-primary' : 'text-gray-400'}`}>
          <span className="text-xl mb-0.5">🏠</span>
          Home
        </NavLink>

        <NavLink to="/letters" className={({ isActive }) =>
          `flex-1 flex flex-col items-center py-1.5 text-xs font-semibold transition-colors ${isActive ? 'text-primary' : 'text-gray-400'}`}>
          <div className="relative mb-0.5">
            <span className="text-xl">💌</span>
            {unreadLetters > 0 && (
              <span className="absolute -top-1 -right-2 bg-accent text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
                {unreadLetters > 9 ? '9+' : unreadLetters}
              </span>
            )}
          </div>
          Letters
        </NavLink>

        <NavLink to="/journal" className={({ isActive }) =>
          `flex-1 flex flex-col items-center py-1.5 text-xs font-semibold transition-colors ${isActive ? 'text-primary' : 'text-gray-400'}`}>
          <span className="text-xl mb-0.5">📔</span>
          Journal
        </NavLink>

        <NavLink to="/profile" className={({ isActive }) =>
          `flex-1 flex flex-col items-center py-1.5 text-xs font-semibold transition-colors ${isActive ? 'text-primary' : 'text-gray-400'}`}>
          {user?.avatar ? (
            <img src={user.avatar} alt="" className="w-6 h-6 rounded-full object-cover mb-0.5" />
          ) : (
            <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center text-white text-xs font-bold mb-0.5">
              {initial}
            </div>
          )}
          Profile
        </NavLink>
      </div>
    </nav>
  )
}
