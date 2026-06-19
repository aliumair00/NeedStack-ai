'use client'

import Link from 'next/link'
import { usePathname, useSearchParams } from 'next/navigation'
import { api } from '@/lib/api'
import {
  LayoutDashboard, Plus, List, MessageSquare,
  BarChart2, Settings, LogOut,
} from 'lucide-react'

interface NavItem {
  label: string
  href: string
  key?: string
  icon: React.ReactNode
  badge?: number
}

interface UserSidebarProps {
  userName: string
  unreadMessages: number
}

export default function UserSidebar({ userName, unreadMessages }: UserSidebarProps) {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const currentTab = searchParams.get('tab') || 'overview'

  const initials = userName
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)

  const navItems: NavItem[] = [
    { label: 'Overview', href: '/user/dashboard', key: 'overview', icon: <LayoutDashboard size={16} /> },
    { label: 'Submit problem', href: '/user/dashboard?tab=submit', key: 'submit', icon: <Plus size={16} /> },
    { label: 'My problems', href: '/user/dashboard?tab=problems', key: 'problems', icon: <List size={16} /> },
    { label: 'Messages', href: '/user/dashboard?tab=messages', key: 'messages', icon: <MessageSquare size={16} />, badge: unreadMessages },
  ]

  const bottomItems: NavItem[] = [
    { label: 'Analytics', href: '/analytics', icon: <BarChart2 size={16} /> },
    { label: 'Settings', href: '/user/settings', icon: <Settings size={16} /> },
  ]

  const handleLogout = async () => {
    try {
      await api.post('/api/auth/logout')
      localStorage.clear()
      window.location.href = '/login'
    } catch (err) {
      console.error('Logout failed:', err)
    }
  }

  return (
    <aside className="w-[220px] shrink-0 bg-[#0D0D15] border-r border-white/[0.06] flex flex-col">
      {/* Logo */}
      <div className="flex items-center gap-2 px-5 py-5 border-b border-white/[0.05]">
        <div className="w-2 h-2 rounded-full bg-indigo-500 shadow-[0_0_6px_#6366F1]" />
        <span className="text-white font-semibold text-sm tracking-tight">Needstack AI</span>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-0.5">
        {navItems.map((item) => {
          const isActive = item.key ? currentTab === item.key : pathname === item.href
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`
                flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs transition-all
                ${isActive
                  ? 'bg-indigo-500/10 text-indigo-400'
                  : 'text-slate-500 hover:text-slate-300 hover:bg-white/[0.04]'
                }
              `}
            >
              <span className="shrink-0">{item.icon}</span>
              <span className="flex-1">{item.label}</span>
              {item.badge ? (
                <span className="bg-indigo-500 text-white text-[9px] font-semibold px-1.5 py-0.5 rounded-full">
                  {item.badge}
                </span>
              ) : null}
            </Link>
          )
        })}

        <div className="h-px bg-white/[0.05] my-3" />

        {bottomItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs text-slate-500 hover:text-slate-300 hover:bg-white/[0.04] transition-all"
          >
            <span className="shrink-0">{item.icon}</span>
            {item.label}
          </Link>
        ))}
      </nav>

      {/* User info + logout */}
      <div className="p-3 border-t border-white/[0.05]">
        <div className="flex items-center gap-2.5 px-2 py-2 rounded-lg">
          <div className="w-7 h-7 rounded-full bg-indigo-500/25 flex items-center justify-center text-[11px] font-semibold text-indigo-300 shrink-0">
            {initials}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-xs font-medium text-slate-300 truncate">{userName}</div>
            <div className="text-[10px] text-slate-600">User account</div>
          </div>
          <button
            onClick={handleLogout}
            className="text-slate-600 hover:text-slate-400 transition-colors"
            aria-label="Sign out"
          >
            <LogOut size={13} />
          </button>
        </div>
      </div>
    </aside>
  )
}
