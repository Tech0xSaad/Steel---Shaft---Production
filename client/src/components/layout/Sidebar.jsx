import { NavLink } from 'react-router-dom'
import { clsx } from 'clsx'
import { X, Cog } from 'lucide-react'
import { NAV_ITEMS, BOTTOM_NAV_ITEMS } from '@/constants/navigation'
import { APP_NAME } from '@/constants/app'

/**
 * Responsive sidebar navigation.
 *
 * On desktop (lg+) it is always visible.
 * On mobile it is an overlay controlled by `isOpen` / `onClose` props.
 *
 * @param {boolean} isOpen  - mobile: whether the drawer is visible
 * @param {()=>void} onClose - mobile: close the drawer
 */
export function Sidebar({ isOpen, onClose }) {
  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-20 bg-black/40 lg:hidden"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      {/* Sidebar panel */}
      <aside
        className={clsx(
          // Base
          'fixed inset-y-0 left-0 z-30 flex w-64 flex-col bg-surface-900 text-white',
          'transition-transform duration-300 ease-in-out',
          // Desktop: always visible
          'lg:static lg:translate-x-0 lg:z-auto',
          // Mobile: slide in/out
          isOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        {/* Logo / brand */}
        <div className="flex h-16 items-center justify-between px-5 border-b border-surface-700/60 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary-600">
              <Cog className="h-4 w-4 text-white" aria-hidden="true" />
            </div>
            <span className="text-sm font-bold tracking-wide">{APP_NAME}</span>
          </div>

          {/* Close button — mobile only */}
          <button
            onClick={onClose}
            className="lg:hidden rounded-md p-1 text-surface-400 hover:text-white transition-colors"
            aria-label="Close navigation"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Primary nav */}
        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-0.5" aria-label="Main navigation">
          {NAV_ITEMS.map((item) => (
            <SidebarLink key={item.path} item={item} onClick={onClose} />
          ))}
        </nav>

        {/* Bottom nav */}
        <div className="px-3 pb-4 border-t border-surface-700/60 pt-3 space-y-0.5">
          {BOTTOM_NAV_ITEMS.map((item) => (
            <SidebarLink key={item.path} item={item} onClick={onClose} />
          ))}
        </div>
      </aside>
    </>
  )
}

function SidebarLink({ item, onClick }) {
  const Icon = item.icon

  return (
    <NavLink
      to={item.path}
      end={item.end}
      onClick={onClick}
      className={({ isActive }) =>
        clsx(
          'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors duration-150',
          isActive
            ? 'bg-primary-600 text-white'
            : 'text-surface-300 hover:bg-surface-700/60 hover:text-white'
        )
      }
    >
      <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />
      {item.label}
    </NavLink>
  )
}
