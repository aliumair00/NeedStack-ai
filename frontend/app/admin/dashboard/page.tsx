'use client'

import { useState, useMemo, useEffect, useCallback, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import {
  Users, Code2, Layers, TrendingUp, CheckCircle,
  Clock, Search, Star, StarOff, Trash2, ShieldOff,
  ShieldCheck, AlertTriangle, Activity,
} from 'lucide-react'
import AdminSidebar from '@/components/admin/AdminSidebar'
import { api } from '@/lib/api'
import {
  AdminUser,
  AdminDeveloper,
  AdminCluster,
  UserStatus,
  DevStatus,
} from '@/lib/adminMockData'
import { CATEGORY_COLORS, CATEGORY_BG } from '@/lib/mockData'

type Tab = 'overview' | 'users' | 'developers' | 'clusters' | 'analytics'

const ACTIVITY_ICONS = {
  new_user: <Users size={11} className="text-indigo-400" />,
  new_developer: <Code2 size={11} className="text-cyan-400" />,
  problem_claimed: <CheckCircle size={11} className="text-amber-400" />,
  problem_solved: <CheckCircle size={11} className="text-emerald-400" />,
  user_banned: <ShieldOff size={11} className="text-red-400" />,
}

const ACTIVITY_BG = {
  new_user: 'bg-indigo-500/10',
  new_developer: 'bg-cyan-500/10',
  problem_claimed: 'bg-amber-500/10',
  problem_solved: 'bg-emerald-500/10',
  user_banned: 'bg-red-500/10',
}

function AdminDashboardContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const defaultTab = (searchParams.get('tab') as Tab) || 'overview'

  const [tab, setTab] = useState<Tab>(defaultTab)

  useEffect(() => {
    if (searchParams.get('tab')) {
      setTab(searchParams.get('tab') as Tab)
    }
  }, [searchParams])

  const [users, setUsers] = useState<AdminUser[]>([])
  const [developers, setDevelopers] = useState<AdminDeveloper[]>([])
  const [clusters, setClusters] = useState<AdminCluster[]>([])
  const [activity, setActivity] = useState<any[]>([])
  const [stats, setStats] = useState<any>({
    totalUsers: 0,
    totalDevelopers: 0,
    totalProblems: 0,
    totalClusters: 0,
    pendingApprovals: 0,
    avgConfidence: 0,
    problemsClaimedToday: 0,
    problemsSolvedThisWeek: 0,
  })

  const [userSearch, setUserSearch] = useState('')
  const [devFilter, setDevFilter] = useState<DevStatus | 'all'>('all')
  const [clusterSearch, setClusterSearch] = useState('')
  const [confirmAction, setConfirmAction] = useState<{ type: string; id: string; name: string } | null>(null)

  const pendingDevs = developers.filter((d) => d.status === 'pending')

  const fetchAdminData = useCallback(async () => {
    try {
      const statsData = await api.get<any>('/api/admin/stats')
      setStats(statsData)

      const usersData = await api.get<AdminUser[]>('/api/admin/users')
      setUsers(usersData)

      const devsData = await api.get<AdminDeveloper[]>('/api/admin/developers')
      setDevelopers(devsData)

      const clustersData = await api.get<AdminCluster[]>('/api/admin/clusters')
      setClusters(clustersData)

      const activityData = await api.get<any[]>('/api/admin/activity')
      setActivity(activityData)
    } catch (err) {
      console.error('Failed to load admin data:', err)
    }
  }, [])

  useEffect(() => {
    const auth = localStorage.getItem('is_authenticated')
    const role = localStorage.getItem('user_role')

    if (auth !== 'true' || role !== 'admin') {
      router.push('/login')
    } else {
      fetchAdminData()
    }
  }, [router, fetchAdminData])

  // Users tab filtered
  const filteredUsers = useMemo(() => {
    if (!userSearch.trim()) return users
    const q = userSearch.toLowerCase()
    return users.filter((u) => u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q))
  }, [users, userSearch])

  // Developers tab filtered
  const filteredDevs = useMemo(() => {
    let devs = [...developers]
    if (devFilter !== 'all') devs = devs.filter((d) => d.status === devFilter)
    return devs
  }, [developers, devFilter])

  // Clusters filtered
  const filteredClusters = useMemo(() => {
    if (!clusterSearch.trim()) return clusters
    const q = clusterSearch.toLowerCase()
    return clusters.filter((c) => c.title.toLowerCase().includes(q))
  }, [clusters, clusterSearch])

  const approveDev = async (id: string) => {
    try {
      await api.patch(`/api/admin/developers/${id}/approve`)
      fetchAdminData()
    } catch (err) {
      console.error(err)
    }
  }

  const rejectDev = async (id: string) => {
    try {
      await api.patch(`/api/admin/developers/${id}/reject`)
      fetchAdminData()
    } catch (err) {
      console.error(err)
    }
  }

  const toggleUserBan = async (id: string) => {
    try {
      await api.patch(`/api/admin/users/${id}/ban`)
      fetchAdminData()
    } catch (err) {
      console.error(err)
    }
    setConfirmAction(null)
  }

  const toggleDevBan = async (id: string) => {
    try {
      await api.patch(`/api/admin/developers/${id}/ban`)
      fetchAdminData()
    } catch (err) {
      console.error(err)
    }
    setConfirmAction(null)
  }

  const toggleFeature = async (id: string) => {
    try {
      await api.patch(`/api/admin/clusters/${id}/feature`)
      fetchAdminData()
    } catch (err) {
      console.error(err)
    }
  }

  const deleteCluster = async (id: string) => {
    try {
      await api.delete(`/api/admin/clusters/${id}`)
      fetchAdminData()
    } catch (err) {
      console.error(err)
    }
    setConfirmAction(null)
  }

  const TABS: { key: Tab; label: string }[] = [
    { key: 'overview', label: 'Overview' },
    { key: 'users', label: `Users (${users.length})` },
    { key: 'developers', label: `Developers${pendingDevs.length > 0 ? ` · ${pendingDevs.length} pending` : ''}` },
    { key: 'clusters', label: `Clusters (${clusters.length})` },
    { key: 'analytics', label: 'Analytics' },
  ]

  const handleTabChange = (t: Tab) => {
    setTab(t)
    router.push(`/admin/dashboard${t !== 'overview' ? `?tab=${t}` : ''}`)
  }

  return (
    <div className="min-h-screen bg-[#0A0A0F] flex">
      <AdminSidebar pendingApprovals={pendingDevs.length} totalUsers={users.length} />

      <main className="flex-1 min-w-0 flex flex-col">
        {/* Header */}
        <header className="flex items-center justify-between px-6 py-4 border-b border-white/[0.06]">
          <div className="flex items-center gap-1 flex-wrap">
            {TABS.map((t) => (
              <button
                key={t.key}
                onClick={() => handleTabChange(t.key)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  tab === t.key
                    ? 'bg-indigo-500/15 text-indigo-400 border border-indigo-500/30'
                    : 'text-slate-500 hover:text-slate-300'
                }`}
              >
                {t.label}
                {t.key === 'developers' && pendingDevs.length > 0 && (
                  <span className="ml-1.5 w-1.5 h-1.5 rounded-full bg-amber-400 inline-block" />
                )}
              </button>
            ))}
          </div>
          <span className="text-[11px] text-slate-600">Last updated: just now</span>
        </header>

        <div className="flex-1 overflow-y-auto px-6 py-6">

          {/* ── OVERVIEW TAB ── */}
          {tab === 'overview' && (
            <>
              {/* Stats grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
                {[
                  { label: 'Total users', value: stats.totalUsers, color: '#F8FAFC', icon: <Users size={14} /> },
                  { label: 'Total developers', value: stats.totalDevelopers, color: '#06B6D4', icon: <Code2 size={14} /> },
                  { label: 'Total problems', value: stats.totalProblems.toLocaleString(), color: '#6366F1', icon: <Layers size={14} /> },
                  { label: 'Pending approvals', value: stats.pendingApprovals, color: '#F59E0B', icon: <Clock size={14} /> },
                  { label: 'Avg AI confidence', value: `${stats.avgConfidence}%`, color: '#10B981', icon: <TrendingUp size={14} /> },
                  { label: 'Claimed today', value: stats.problemsClaimedToday, color: '#818CF8', icon: <CheckCircle size={14} /> },
                  { label: 'Solved this week', value: stats.problemsSolvedThisWeek, color: '#34D399', icon: <CheckCircle size={14} /> },
                  { label: 'Active clusters', value: stats.totalClusters, color: '#94A3B8', icon: <Layers size={14} /> },
                ].map((s) => (
                  <div key={s.label} className="bg-white/[0.03] border border-white/[0.07] rounded-xl p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[11px] text-slate-500">{s.label}</span>
                      <span style={{ color: s.color }} className="opacity-60">{s.icon}</span>
                    </div>
                    <div className="text-xl font-semibold" style={{ color: s.color }}>{s.value}</div>
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                {/* Pending approvals */}
                {pendingDevs.length > 0 && (
                  <div>
                    <h2 className="text-xs font-medium text-slate-500 uppercase tracking-widest mb-3 flex items-center gap-2">
                      <AlertTriangle size={12} className="text-amber-400" />
                      Pending developer approvals ({pendingDevs.length})
                    </h2>
                    <div className="bg-amber-500/[0.05] border border-amber-500/[0.15] rounded-xl overflow-hidden">
                      {pendingDevs.map((dev, i) => (
                        <div
                          key={dev.id}
                          className={`flex items-center gap-3 px-4 py-3.5 ${i < pendingDevs.length - 1 ? 'border-b border-white/[0.04]' : ''}`}
                        >
                          <div className="w-8 h-8 rounded-full bg-indigo-500/20 flex items-center justify-center text-xs font-semibold text-indigo-300 shrink-0">
                            {dev.avatar}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="text-sm font-medium text-slate-200">{dev.name}</div>
                            <div className="text-[10px] text-slate-500 truncate">{dev.email} · {dev.skills.slice(0, 3).join(', ')}</div>
                          </div>
                          <div className="text-[10px] text-slate-600 shrink-0">
                            {new Date(dev.appliedAt).toLocaleDateString('en-PK', { day: 'numeric', month: 'short' })}
                          </div>
                          <div className="flex gap-1.5 shrink-0">
                            <button
                              onClick={() => approveDev(dev.id)}
                              className="flex items-center gap-1 bg-emerald-500/10 border border-emerald-500/25 rounded-lg px-2.5 py-1 text-[11px] text-emerald-400 hover:bg-emerald-500/20 transition-all"
                            >
                              <ShieldCheck size={11} /> Approve
                            </button>
                            <button
                              onClick={() => rejectDev(dev.id)}
                              className="flex items-center gap-1 bg-red-500/10 border border-red-500/20 rounded-lg px-2.5 py-1 text-[11px] text-red-400 hover:bg-red-500/20 transition-all"
                            >
                              Reject
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Recent activity */}
                <div>
                  <h2 className="text-xs font-medium text-slate-500 uppercase tracking-widest mb-3 flex items-center gap-2">
                    <Activity size={12} />
                    Recent activity
                  </h2>
                  <div className="bg-white/[0.02] border border-white/[0.06] rounded-xl overflow-hidden">
                    {activity.map((item, i) => (
                      <div
                        key={item.id}
                        className={`flex items-center gap-3 px-4 py-3 ${i < activity.length - 1 ? 'border-b border-white/[0.04]' : ''}`}
                      >
                        <div className={`w-6 h-6 rounded-full ${ACTIVITY_BG[item.type as keyof typeof ACTIVITY_BG] || 'bg-slate-500/10'} flex items-center justify-center shrink-0`}>
                          {ACTIVITY_ICONS[item.type as keyof typeof ACTIVITY_ICONS] || <Clock size={11} className="text-slate-400" />}
                        </div>
                        <p className="flex-1 text-xs text-slate-400 leading-relaxed">{item.message}</p>
                        <span className="text-[10px] text-slate-600 shrink-0">{item.time}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </>
          )}

          {/* ── USERS TAB ── */}
          {tab === 'users' && (
            <>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-base font-semibold text-white">All users</h2>
                <div className="relative">
                  <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-600" />
                  <input
                    type="text"
                    value={userSearch}
                    onChange={(e) => setUserSearch(e.target.value)}
                    placeholder="Search users..."
                    className="bg-white/[0.04] border border-white/[0.08] rounded-lg pl-8 pr-3 py-2 text-xs text-white placeholder:text-slate-600 focus:outline-none focus:border-indigo-500/50 w-56"
                  />
                </div>
              </div>

              <div className="bg-white/[0.02] border border-white/[0.06] rounded-xl overflow-hidden">
                {/* Table header */}
                <div className="grid grid-cols-[1.5fr_1.5fr_80px_120px_80px_120px] gap-3 px-4 py-2.5 border-b border-white/[0.06] text-[10px] text-slate-500 uppercase tracking-wider">
                  <span>User</span>
                  <span>Email</span>
                  <span>Problems</span>
                  <span>Last active</span>
                  <span>Status</span>
                  <span>Actions</span>
                </div>

                {filteredUsers.map((user) => (
                  <div
                    key={user.id}
                    className={`grid grid-cols-[1.5fr_1.5fr_80px_120px_80px_120px] gap-3 px-4 py-3 border-b border-white/[0.04] last:border-0 items-center ${user.status === 'banned' ? 'opacity-60' : ''}`}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <div className={`w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-semibold shrink-0 ${user.status === 'banned' ? 'bg-red-500/15 text-red-400' : 'bg-indigo-500/20 text-indigo-300'}`}>
                        {user.avatar}
                      </div>
                      <span className="text-xs font-medium text-slate-200 truncate">{user.name}</span>
                    </div>
                    <span className="text-[11px] text-slate-500 truncate">{user.email}</span>
                    <span className="text-xs text-slate-300">{user.problemsSubmitted}</span>
                    <span className="text-[11px] text-slate-500 truncate" title={user.lastActive}>
                      {new Date(user.lastActive).toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </span>
                    <div>
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium border ${
                        user.status === 'active'
                          ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/25'
                          : 'bg-red-500/10 text-red-400 border-red-500/20'
                      }`}>
                        {user.status === 'active' ? 'Active' : 'Banned'}
                      </span>
                    </div>
                    <div className="flex gap-1.5">
                      <button
                        onClick={() =>
                          setConfirmAction({ type: user.status === 'banned' ? 'unban_user' : 'ban_user', id: user.id, name: user.name })
                        }
                        className={`flex items-center gap-1 rounded-lg px-2 py-1 text-[10px] border transition-all ${
                          user.status === 'banned'
                            ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/20'
                            : 'bg-red-500/[0.07] border-red-500/15 text-red-400 hover:bg-red-500/15'
                        }`}
                      >
                        {user.status === 'banned' ? <><ShieldCheck size={10} /> Unban</> : <><ShieldOff size={10} /> Ban</>}
                      </button>
                    </div>
                  </div>
                ))}

                {filteredUsers.length === 0 && (
                  <div className="py-10 text-center text-sm text-slate-600">No users found</div>
                )}
              </div>
            </>
          )}

          {/* ── DEVELOPERS TAB ── */}
          {tab === 'developers' && (
            <>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-base font-semibold text-white">All developers</h2>
                <div className="flex items-center gap-2">
                  {(['all', 'pending', 'approved', 'rejected', 'banned'] as const).map((f) => (
                    <button
                      key={f}
                      onClick={() => setDevFilter(f)}
                      className={`px-3 py-1 rounded-full text-[11px] border transition-all capitalize ${
                        devFilter === f
                          ? 'border-indigo-500/50 bg-indigo-500/10 text-indigo-400'
                          : 'border-white/[0.08] text-slate-500 hover:border-white/20'
                      }`}
                    >
                      {f === 'all' ? 'All' : f}
                      {f === 'pending' && pendingDevs.length > 0 && (
                        <span className="ml-1 text-amber-400">({pendingDevs.length})</span>
                      )}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-3">
                {filteredDevs.map((dev) => (
                  <div
                    key={dev.id}
                    className={`bg-white/[0.03] border rounded-xl p-4 ${
                      dev.status === 'pending'
                        ? 'border-amber-500/20'
                        : dev.status === 'banned'
                        ? 'border-red-500/15 opacity-60'
                        : 'border-white/[0.07]'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold shrink-0 ${
                        dev.status === 'banned' ? 'bg-red-500/15 text-red-400'
                          : dev.status === 'pending' ? 'bg-amber-500/15 text-amber-300'
                          : 'bg-cyan-500/15 text-cyan-300'
                      }`}>
                        {dev.avatar}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                          <span className="text-sm font-medium text-slate-200">{dev.name}</span>
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium border ${
                            dev.status === 'pending' ? 'bg-amber-500/10 text-amber-400 border-amber-500/25'
                              : dev.status === 'approved' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/25'
                              : dev.status === 'rejected' ? 'bg-slate-500/10 text-slate-400 border-slate-500/20'
                              : 'bg-red-500/10 text-red-400 border-red-500/20'
                          }`}>
                            {dev.status}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500 mb-2">{dev.email}</p>
                        {dev.bio && <p className="text-xs text-slate-400 mb-2 italic">"{dev.bio}"</p>}
                        <div className="flex flex-wrap gap-1.5 mb-2">
                          {dev.skills.map((s) => (
                            <span key={s} className="bg-white/[0.05] border border-white/[0.08] rounded px-1.5 py-0.5 text-[10px] text-slate-500 font-mono">
                              {s}
                            </span>
                          ))}
                        </div>
                        <div className="flex items-center gap-3 text-[10px] text-slate-600">
                          <span>{dev.problemsClaimed} claimed</span>
                          <span>{dev.problemsSolved} solved</span>
                          <span>Applied {new Date(dev.appliedAt).toLocaleDateString('en-PK', { day: 'numeric', month: 'short' })}</span>
                        </div>
                      </div>

                      <div className="flex flex-col gap-1.5 shrink-0">
                        {dev.status === 'pending' && (
                          <>
                            <button
                              onClick={() => approveDev(dev.id)}
                              className="flex items-center gap-1 bg-emerald-500/10 border border-emerald-500/25 rounded-lg px-3 py-1.5 text-[11px] text-emerald-400 hover:bg-emerald-500/20 transition-all"
                            >
                              <ShieldCheck size={11} /> Approve
                            </button>
                            <button
                              onClick={() => rejectDev(dev.id)}
                              className="flex items-center gap-1 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-1.5 text-[11px] text-red-400 hover:bg-red-500/20 transition-all"
                            >
                              Reject
                            </button>
                          </>
                        )}
                        {dev.status === 'approved' && (
                          <button
                            onClick={() => setConfirmAction({ type: 'ban_dev', id: dev.id, name: dev.name })}
                            className="flex items-center gap-1 bg-red-500/[0.07] border border-red-500/15 rounded-lg px-3 py-1.5 text-[11px] text-red-400 hover:bg-red-500/15 transition-all"
                          >
                            <ShieldOff size={11} /> Ban
                          </button>
                        )}
                        {dev.status === 'banned' && (
                          <button
                            onClick={() => setConfirmAction({ type: 'unban_dev', id: dev.id, name: dev.name })}
                            className="flex items-center gap-1 bg-emerald-500/10 border border-emerald-500/25 rounded-lg px-3 py-1.5 text-[11px] text-emerald-400 hover:bg-emerald-500/20 transition-all"
                          >
                            <ShieldCheck size={11} /> Unban
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}

          {/* ── CLUSTERS TAB ── */}
          {tab === 'clusters' && (
            <>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-base font-semibold text-white">Problem clusters</h2>
                <div className="relative">
                  <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-600" />
                  <input
                    type="text"
                    value={clusterSearch}
                    onChange={(e) => setClusterSearch(e.target.value)}
                    placeholder="Search clusters..."
                    className="bg-white/[0.04] border border-white/[0.08] rounded-lg pl-8 pr-3 py-2 text-xs text-white placeholder:text-slate-600 focus:outline-none focus:border-indigo-500/50 w-56"
                  />
                </div>
              </div>

              <div className="space-y-2">
                {filteredClusters.map((cluster) => (
                  <div
                    key={cluster.id}
                    className={`flex items-center gap-3 bg-white/[0.03] border rounded-xl px-4 py-3.5 ${cluster.isFeatured ? 'border-indigo-500/25' : 'border-white/[0.07]'}`}
                  >
                    {cluster.isFeatured && (
                      <Star size={13} className="text-indigo-400 shrink-0" />
                    )}

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span
                          className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium border shrink-0"
                          style={{ color: CATEGORY_COLORS[cluster.category], background: CATEGORY_BG[cluster.category], borderColor: `${CATEGORY_COLORS[cluster.category]}30` }}
                        >
                          {cluster.category}
                        </span>
                        {cluster.isTrending && (
                          <span className="text-[10px] text-amber-400 font-medium">Trending</span>
                        )}
                      </div>
                      <p className="text-sm text-slate-200 font-medium truncate">{cluster.title}</p>
                      <div className="flex items-center gap-3 mt-1 text-[10px] text-slate-600">
                        <span className="text-indigo-400 font-medium">{cluster.reportCount} reports</span>
                        <span>Confidence {cluster.confidenceScore}%</span>
                        <span className={`font-medium ${
                          cluster.claimStatus === 'unclaimed' ? 'text-emerald-400'
                            : cluster.claimStatus === 'in_progress' ? 'text-amber-400'
                            : 'text-slate-500'
                        }`}>
                          {cluster.claimStatus === 'unclaimed' ? 'Unclaimed'
                            : cluster.claimStatus === 'in_progress' ? `In progress · ${cluster.claimedBy}`
                            : `Solved · ${cluster.claimedBy}`}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        onClick={() => toggleFeature(cluster.id)}
                        className={`flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-[11px] border transition-all ${
                          cluster.isFeatured
                            ? 'bg-indigo-500/15 border-indigo-500/30 text-indigo-400 hover:bg-indigo-500/25'
                            : 'bg-white/[0.04] border-white/[0.08] text-slate-500 hover:text-slate-300'
                        }`}
                        title={cluster.isFeatured ? 'Unfeature' : 'Feature'}
                      >
                        {cluster.isFeatured ? <><StarOff size={11} /> Unfeature</> : <><Star size={11} /> Feature</>}
                      </button>
                      <button
                        onClick={() => setConfirmAction({ type: 'delete_cluster', id: cluster.id, name: cluster.title })}
                        className="flex items-center gap-1 bg-red-500/[0.07] border border-red-500/15 rounded-lg px-2.5 py-1.5 text-[11px] text-red-400 hover:bg-red-500/15 transition-all"
                      >
                        <Trash2 size={11} /> Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}

          {/* ── ANALYTICS TAB ── */}
          {tab === 'analytics' && (
            <>
              <h2 className="text-base font-semibold text-white mb-5">Platform analytics</h2>

              {/* Category breakdown */}
              <div className="bg-white/[0.03] border border-white/[0.07] rounded-xl p-5 mb-5">
                <h3 className="text-xs font-medium text-slate-500 uppercase tracking-widest mb-4">Problems by category</h3>
                <div className="space-y-3">
                  {[
                    { label: 'Technology', count: 421, pct: 33 },
                    { label: 'Business', count: 359, pct: 28 },
                    { label: 'Healthcare', count: 230, pct: 18 },
                    { label: 'Education', count: 179, pct: 14 },
                    { label: 'Social', count: 95, pct: 7 },
                  ].map((cat) => (
                    <div key={cat.label} className="flex items-center gap-3">
                      <span className="text-xs text-slate-400 w-20 shrink-0">{cat.label}</span>
                      <div className="flex-1 h-2 bg-white/[0.05] rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all"
                          style={{
                            width: `${cat.pct}%`,
                            background: CATEGORY_COLORS[cat.label as keyof typeof CATEGORY_COLORS] || '#6366F1',
                          }}
                        />
                      </div>
                      <span className="text-xs text-slate-400 w-10 text-right shrink-0">{cat.count}</span>
                      <span className="text-[10px] text-slate-600 w-8 text-right shrink-0">{cat.pct}%</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Quick stats grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {[
                  { label: 'Claim rate', value: '38%', sub: 'problems get claimed', color: '#6366F1' },
                  { label: 'Solve rate', value: '61%', sub: 'of claimed get solved', color: '#10B981' },
                  { label: 'Avg cluster size', value: '5.2', sub: 'problems per cluster', color: '#06B6D4' },
                  { label: 'Growth this week', value: '+24%', sub: 'more submissions', color: '#F59E0B' },
                ].map((s) => (
                  <div key={s.label} className="bg-white/[0.03] border border-white/[0.07] rounded-xl p-4">
                    <div className="text-xs text-slate-500 mb-1">{s.label}</div>
                    <div className="text-2xl font-semibold mb-0.5" style={{ color: s.color }}>{s.value}</div>
                    <div className="text-[10px] text-slate-600">{s.sub}</div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </main>

      {/* Confirm Action Modal */}
      {confirmAction && (
        <div
          className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center px-4"
          onClick={(e) => { if (e.target === e.currentTarget) setConfirmAction(null) }}
        >
          <div className="w-full max-w-sm bg-[#111118] border border-white/[0.1] rounded-2xl p-6">
            <div className="flex items-center justify-center w-12 h-12 rounded-full bg-red-500/10 border border-red-500/20 mx-auto mb-4">
              <AlertTriangle size={20} className="text-red-400" />
            </div>
            <h3 className="text-sm font-semibold text-white text-center mb-1">Confirm action</h3>
            <p className="text-xs text-slate-400 text-center mb-5">
              {confirmAction.type === 'ban_user' && `Ban "${confirmAction.name}"? They won't be able to submit problems.`}
              {confirmAction.type === 'unban_user' && `Unban "${confirmAction.name}"? They'll regain full access.`}
              {confirmAction.type === 'ban_dev' && `Ban developer "${confirmAction.name}"? They'll lose dashboard access.`}
              {confirmAction.type === 'unban_dev' && `Unban "${confirmAction.name}"? They'll regain developer access.`}
              {confirmAction.type === 'delete_cluster' && `Delete cluster "${confirmAction.name}"? This can't be undone.`}
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setConfirmAction(null)}
                className="flex-1 border border-white/10 text-slate-400 text-sm rounded-lg py-2 hover:border-white/20 transition-all"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  if (confirmAction.type === 'ban_user' || confirmAction.type === 'unban_user') toggleUserBan(confirmAction.id)
                  if (confirmAction.type === 'ban_dev' || confirmAction.type === 'unban_dev') toggleDevBan(confirmAction.id)
                  if (confirmAction.type === 'delete_cluster') deleteCluster(confirmAction.id)
                }}
                className={`flex-1 text-white font-medium text-sm rounded-lg py-2 transition-colors ${
                  confirmAction.type.includes('unban')
                    ? 'bg-emerald-600 hover:bg-emerald-500'
                    : 'bg-red-600 hover:bg-red-500'
                }`}
              >
                {confirmAction.type.includes('unban') ? 'Confirm unban' : confirmAction.type === 'delete_cluster' ? 'Delete' : 'Confirm ban'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default function AdminDashboard() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#0A0A0F] flex items-center justify-center">
        <span className="material-symbols-outlined text-primary text-5xl animate-spin">progress_activity</span>
      </div>
    }>
      <AdminDashboardContent />
    </Suspense>
  )
}
