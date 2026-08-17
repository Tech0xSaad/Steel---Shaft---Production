import { useState } from 'react'
import { Outlet } from 'react-router-dom'
import { Sidebar } from './Sidebar'
import { Navbar }  from './Navbar'

/**
 * Shell layout for all authenticated dashboard pages.
 *
 * Layout structure (desktop):
 *  ┌──────────┬──────────────────────────────┐
 *  │          │  Navbar                      │
 *  │ Sidebar  ├──────────────────────────────┤
 *  │  (fixed) │  <Outlet /> — page content   │
 *  │          │                              │
 *  └──────────┴──────────────────────────────┘
 *
 * On mobile the sidebar is a slide-in drawer triggered by the hamburger icon.
 */
export function DashboardLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <div className="flex h-screen overflow-hidden bg-surface-50">
      {/* Sidebar */}
      <Sidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      {/* Main area */}
      <div className="flex flex-1 flex-col min-w-0 overflow-hidden">
        <Navbar onMenuClick={() => setSidebarOpen(true)} />

        {/* Scrollable page content */}
        <main
          id="main-content"
          className="flex-1 overflow-y-auto px-4 py-6 lg:px-8"
        >
          <Outlet />
        </main>
      </div>
    </div>
  )
}
