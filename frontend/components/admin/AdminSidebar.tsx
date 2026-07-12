'use client'

import { api } from '@/lib/api'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard, Users, Code2, Layers,
  BarChart2, Settings, LogOut, Shield,
} from 'lucide-react'

interface AdminSidebarProps {
  pendingApprovals: number
  totalUsers: number
  mobileOpen?: boolean
  onClose?: () => void
}

export default function AdminSidebar({ pendingApprovals, totalUsers, mobileOpen, onClose }: AdminSidebarProps) {
  const pathname = usePathname()

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
    { label: 'Overview', href: '/admin/dashboard', icon: <LayoutDashboard size={15} /> },
    {
      label: 'Users',
      href: '/admin/dashboard?tab=users',
      icon: <Users size={15} />,
      badge: totalUsers,
      badgeStyle: 'bg-white/10 text-slate-500',
    },
    {
      label: 'Developers',
      href: '/admin/dashboard?tab=developers',
      icon: <Code2 size={15} />,
      badge: pendingApprovals,
      badgeStyle: 'bg-amber-500/20 text-amber-400',
    },
    { label: 'Clusters', href: '/admin/dashboard?tab=clusters', icon: <Layers size={15} /> },
    { label: 'Analytics', href: '/admin/dashboard?tab=analytics', icon: <BarChart2 size={15} /> },
  ]

  return (
    <>
      {}
      {mobileOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 md:hidden backdrop-blur-sm"
          onClick={onClose}
        />
      )}
      <aside className={`
        fixed inset-y-0 left-0 z-50 w-[200px] bg-[#0D0D15] border-r border-white/5 flex flex-col shrink-0
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
                isActive
                  ? 'bg-indigo-500/10 text-indigo-400'
                  : 'text-slate-500 hover:text-slate-300 hover:bg-white/5'
              }`}
            >
              <span className="shrink-0">{item.icon}</span>
              <span className="flex-1">{item.label}</span>
              {item.badge ? (
                <span className={`text-[9px] font-semibold px-1.5 py-0.5 rounded-full ${item.badgeStyle}`}>
                  {item.badge}
                </span>
              ) : null}
            </Link>
          )
        })}

        <div className="h-px bg-white/5 my-3" />

        <Link
          href="/admin/settings"
          onClick={onClose}
          className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs text-slate-500 hover:text-slate-300 hover:bg-white/5 transition-all"
        >
          <Settings size={15} />
          Settings
        </Link>
      </nav>

      <div className="p-3 border-t border-white/5">
        <div className="bg-indigo-500/10 border border-indigo-500/20 rounded-lg px-3 py-2.5 mb-2">
          <div className="flex items-center gap-2">
            <Shield size={13} className="text-indigo-400 shrink-0" />
            <div>
              <div className="text-xs font-medium text-indigo-300">Admin Panel</div>
              <div className="text-[10px] text-slate-600">Super Admin</div>
            </div>
          </div>
        </div>
        <button 
          onClick={handleLogout}
          className="flex items-center gap-2 w-full px-2 py-1.5 text-xs text-slate-600 hover:text-slate-400 transition-colors"
        >
          <LogOut size={13} />
          Sign out
        </button>
      </div>
    </aside>
    </>
  )
}
