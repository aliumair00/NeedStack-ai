'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { api } from '@/lib/api'
import { LayoutGrid, Bookmark, MessageSquare, BarChart2, Settings, LogOut } from 'lucide-react'

interface DevSidebarProps {
  developerName: string
  activeClaims: number
  unreadMessages: number
  mobileOpen?: boolean
  onClose?: () => void
}

export default function DevSidebar({ developerName, activeClaims, unreadMessages, mobileOpen, onClose }: DevSidebarProps) {
  const pathname = usePathname()

  const initials = developerName
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)

  const handleLogout = async () => {
    try {
      await api.post('/api/auth/logout')
      localStorage.clear()
      window.location.href = '/login'
    } catch (err) {
      console.error('Logout failed:', err)
    }
  }

  const navItems = [
    { label: 'Browse problems', href: '/developer/dashboard', icon: <LayoutGrid size={15} /> },
    { label: 'My claims', href: '/developer/dashboard?tab=claims', icon: <Bookmark size={15} />, badge: activeClaims, badgeColor: 'bg-amber-500 text-[#412402]' },
    { label: 'Messages', href: '/developer/dashboard?tab=messages', icon: <MessageSquare size={15} />, badge: unreadMessages, badgeColor: 'bg-indigo-500 text-white' },
  ]

  const bottomItems = [
    { label: 'Analytics', href: '/analytics', icon: <BarChart2 size={15} /> },
    { label: 'Settings', href: '/developer/settings', icon: <Settings size={15} /> },
  ]

  return (
    <>
      {/* Mobile backdrop */}
      {mobileOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 md:hidden backdrop-blur-sm"
          onClick={onClose}
        />
      )}
      <aside className={`
        fixed inset-y-0 left-0 z-50 w-[210px] bg-[#0D0D15] border-r border-white/5 flex flex-col shrink-0
        transition-transform duration-300 ease-in-out md:relative md:translate-x-0
        ${mobileOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
      <div className="flex items-center gap-2 px-5 py-5 border-b border-white/5">
        <div className="w-2 h-2 rounded-full bg-indigo-500 shadow-[0_0_6px_#6366F1]" />
        <span className="text-white font-semibold text-sm tracking-tight">Needstack AI</span>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-0.5">
        {navItems.map((item) => {
          const isActive = pathname === item.href
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onClose}
              className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs transition-all ${
                isActive ? 'bg-indigo-500/10 text-indigo-400' : 'text-slate-500 hover:text-slate-300 hover:bg-white/5'
              }`}
            >
              <span className="shrink-0">{item.icon}</span>
              <span className="flex-1">{item.label}</span>
              {item.badge ? (
                <span className={`text-[9px] font-semibold px-1.5 py-0.5 rounded-full ${item.badgeColor}`}>
                  {item.badge}
                </span>
              ) : null}
            </Link>
          )
        })}

        <div className="h-px bg-white/5 my-3" />

        {bottomItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            onClick={onClose}
            className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs text-slate-500 hover:text-slate-300 hover:bg-white/5 transition-all"
          >
            <span className="shrink-0">{item.icon}</span>
            {item.label}
          </Link>
        ))}
      </nav>

      <div className="p-3 border-t border-white/5">
        <div className="flex items-center gap-2.5 px-2 py-2 rounded-lg">
          <div className="w-7 h-7 rounded-full bg-cyan-500/20 flex items-center justify-center text-[11px] font-semibold text-cyan-300 shrink-0">
            {initials}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-xs font-medium text-slate-300 truncate">{developerName}</div>
            <div className="text-[10px] text-slate-600">Developer</div>
          </div>
          <button onClick={handleLogout} className="text-slate-600 hover:text-slate-400 transition-colors" aria-label="Sign out">
            <LogOut size={13} />
          </button>
        </div>
      </div>
    </aside>
    </>
  )
}
