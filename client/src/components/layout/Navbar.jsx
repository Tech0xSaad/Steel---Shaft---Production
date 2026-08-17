import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Menu, Bell, ChevronDown, LogOut, User } from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import { Avatar } from '@/components/ui/Avatar'

/**
 * Top navigation bar.
 *
 * @param {()=>void} onMenuClick - toggles the mobile sidebar drawer
 */
export function Navbar({ onMenuClick }) {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const [dropdownOpen, setDropdownOpen] = useState(false)
  const dropdownRef = useRef(null)

  const displayName = user?.user_metadata?.full_name ?? user?.email ?? 'Admin'
  const email       = user?.email ?? ''

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(e) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  async function handleLogout() {
    setDropdownOpen(false)
    await logout()
    navigate('/login', { replace: true })
  }

  return (
    <header className="flex h-16 items-center justify-between border-b border-surface-200 bg-white px-4 lg:px-6 shrink-0">
      {/* Left: hamburger (mobile) */}
      <button
        onClick={onMenuClick}
        className="lg:hidden rounded-md p-1.5 text-surface-600 hover:bg-surface-100 transition-colors"
        aria-label="Open navigation menu"
      >
        <Menu className="h-5 w-5" />
      </button>

      {/* Right: notifications + profile */}
      <div className="ml-auto flex items-center gap-2">
        {/* Notifications bell */}
        <button
          className="relative rounded-full p-2 text-surface-500 hover:bg-surface-100 transition-colors"
          aria-label="Notifications"
        >
          <Bell className="h-5 w-5" />
          {/* Unread dot — will be wired up in a later phase */}
          <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-red-500" aria-hidden="true" />
        </button>

        {/* Profile dropdown */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setDropdownOpen((o) => !o)}
            className="flex items-center gap-2 rounded-lg px-2 py-1.5 hover:bg-surface-100 transition-colors"
            aria-expanded={dropdownOpen}
            aria-haspopup="true"
            aria-label="User menu"
          >
            <Avatar name={displayName} size="sm" />
            <span className="hidden sm:block text-sm font-medium text-surface-800 max-w-[120px] truncate">
              {displayName}
            </span>
            <ChevronDown className="h-4 w-4 text-surface-400" aria-hidden="true" />
          </button>

          {dropdownOpen && (
            <div className="absolute right-0 top-full mt-1 w-56 rounded-xl border border-surface-200 bg-white py-1.5 shadow-dropdown z-50">
              {/* User info header */}
              <div className="px-4 py-2.5 border-b border-surface-100">
                <p className="text-sm font-semibold text-surface-900 truncate">{displayName}</p>
                <p className="text-xs text-surface-500 truncate">{email}</p>
              </div>

              <DropdownItem icon={<User className="h-4 w-4" />} label="Profile" onClick={() => setDropdownOpen(false)} />
              <DropdownItem
                icon={<LogOut className="h-4 w-4" />}
                label="Sign out"
                onClick={handleLogout}
                danger
              />
            </div>
          )}
        </div>
      </div>
    </header>
  )
}

function DropdownItem({ icon, label, onClick, danger }) {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-3 px-4 py-2 text-sm transition-colors hover:bg-surface-50
        ${danger ? 'text-red-600 hover:text-red-700' : 'text-surface-700 hover:text-surface-900'}`}
    >
      {icon}
      {label}
    </button>
  )
}
