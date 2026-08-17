import {
  LayoutDashboard,
  Factory,
  Package,
  Database,
  ClipboardCheck,
  BarChart3,
  Settings,
} from 'lucide-react'

/**
 * Primary sidebar navigation items.
 * `icon` references the Lucide component — rendered directly in the Sidebar.
 *
 * Phase 7: Reports item now points to the live ReportsPage.
 *          Removed placeholder Orders / Dispatch / Customers entries that
 *          have no pages yet — they can be re-added when those modules ship.
 */
export const NAV_ITEMS = [
  {
    label: 'Dashboard',
    path:  '/dashboard',
    icon:  LayoutDashboard,
    end:   true,
  },
  {
    label: 'Master Data',
    path:  '/dashboard/masters',
    icon:  Database,
  },
  {
    label: 'Production',
    path:  '/dashboard/production',
    icon:  Factory,
  },
  {
    label: 'Inventory',
    path:  '/dashboard/inventory',
    icon:  Package,
  },
  {
    label: 'Quality Control',
    path:  '/dashboard/quality',
    icon:  ClipboardCheck,
  },
  {
    label: 'Reports',
    path:  '/dashboard/reports',
    icon:  BarChart3,
  },
]

export const BOTTOM_NAV_ITEMS = [
  {
    label: 'Settings',
    path:  '/dashboard/settings',
    icon:  Settings,
  },
]
