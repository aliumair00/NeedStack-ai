'use client'

import { useState, useRef, useEffect } from 'react'
import { Bell, CheckCheck, Zap, Users, MessageSquare, CheckCircle } from 'lucide-react'
import { Notification } from '@/lib/mockData'

interface NotificationsDropdownProps {
  notifications: Notification[]
  onMarkAllRead: () => void
}

const NOTIF_ICONS = {
  claim: <Zap size={13} className="text-indigo-400" />,
  similar: <Users size={13} className="text-cyan-400" />,
  message: <MessageSquare size={13} className="text-violet-400" />,
  solved: <CheckCircle size={13} className="text-emerald-400" />,
}

const NOTIF_BG = {
  claim: 'bg-indigo-500/10',
  similar: 'bg-cyan-500/10',
  message: 'bg-violet-500/10',
  solved: 'bg-emerald-500/10',
}

export default function NotificationsDropdown({ notifications, onMarkAllRead }: NotificationsDropdownProps) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const unreadCount = notifications.filter((n) => !n.isRead).length

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(!open)}
        className="relative w-8 h-8 rounded-lg bg-white/[0.05] border border-white/[0.08] flex items-center justify-center text-slate-400 hover:text-slate-200 hover:bg-white/[0.08] transition-all"
        aria-label="Notifications"
      >
        <Bell size={15} />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 w-4 h-4 bg-indigo-500 rounded-full text-[9px] text-white font-semibold flex items-center justify-center">
            {unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-10 w-80 bg-[#111118] border border-white/[0.08] rounded-xl shadow-2xl z-50 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-white/[0.06]">
            <span className="text-sm font-medium text-white">Notifications</span>
            {unreadCount > 0 && (
              <button
                onClick={onMarkAllRead}
                className="flex items-center gap-1 text-xs text-indigo-400 hover:text-indigo-300 transition-colors"
              >
                <CheckCheck size={12} />
                Mark all read
              </button>
            )}
          </div>

          <div className="max-h-80 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="py-8 text-center text-sm text-slate-600">No notifications yet</div>
            ) : (
              notifications.map((notif) => (
                <div
                  key={notif.id}
                  className={`flex items-start gap-3 px-4 py-3 border-b border-white/[0.04] hover:bg-white/[0.03] transition-colors cursor-pointer ${!notif.isRead ? 'bg-white/[0.02]' : ''}`}
                >
                  <div className={`w-6 h-6 rounded-full ${NOTIF_BG[notif.type]} flex items-center justify-center shrink-0 mt-0.5`}>
                    {NOTIF_ICONS[notif.type]}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`text-xs leading-relaxed ${notif.isRead ? 'text-slate-400' : 'text-slate-200'}`}>
                      {notif.message}
                    </p>
                    <p className="text-[10px] text-slate-600 mt-1">{notif.time}</p>
                  </div>
                  {!notif.isRead && (
                    <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 shrink-0 mt-1.5" />
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  )
}
