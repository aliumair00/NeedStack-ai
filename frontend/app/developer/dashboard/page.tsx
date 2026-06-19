'use client'

import { useState, useMemo, useEffect, useCallback, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Flame, CheckCircle, Clock, TrendingUp, MessageSquare, Users, Loader2, Search } from 'lucide-react'
import DevSidebar from '@/components/developer/DevSidebar'
import ConfidenceRing from '@/components/developer/ConfidenceRing'
import ClaimModal from '@/components/developer/ClaimModal'
import DevChatPanel from '@/components/developer/DevChatPanel'
import NotificationsDropdown from '@/components/shared/NotificationsDropdown'
import { api } from '@/lib/api'
import {
  ProblemCard,
  MyClaimedProblem,
  ProgressStatus,
  DevConversation,
} from '@/lib/devMockData'
import { CATEGORY_COLORS, CATEGORY_BG, ProblemCategory, Notification } from '@/lib/mockData'

type Tab = 'browse' | 'claims' | 'messages'
type SortOption = 'most_reported' | 'trending' | 'newest'
type FilterCategory = ProblemCategory | 'All'

const CATEGORIES: FilterCategory[] = ['All', 'Technology', 'Healthcare', 'Education', 'Business', 'Social', 'Other']

const PROGRESS_CONFIG: Record<ProgressStatus, { label: string; color: string; bg: string; next?: ProgressStatus; nextLabel?: string }> = {
  in_progress: { label: 'In progress', color: '#F59E0B', bg: 'rgba(245,158,11,0.1)', next: 'testing', nextLabel: 'Mark as Testing' },
  testing: { label: 'Testing', color: '#06B6D4', bg: 'rgba(6,182,212,0.1)', next: 'solved', nextLabel: 'Mark as Solved' },
  solved: { label: 'Solved', color: '#10B981', bg: 'rgba(16,185,129,0.1)' },
}

function DeveloperDashboardContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const defaultTab = (searchParams.get('tab') as Tab) || 'browse'

  const [tab, setTab] = useState<Tab>(defaultTab)
  
  useEffect(() => {
    if (searchParams.get('tab')) {
      setTab(searchParams.get('tab') as Tab)
    }
  }, [searchParams])

  const [cards, setCards] = useState<ProblemCard[]>([])
  const [claims, setClaims] = useState<MyClaimedProblem[]>([])
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [conversations, setConversations] = useState<DevConversation[]>([])

  const [sortBy, setSortBy] = useState<SortOption>('most_reported')
  const [filterCategory, setFilterCategory] = useState<FilterCategory>('All')
  const [searchQuery, setSearchQuery] = useState('')
  const [onlyTrending, setOnlyTrending] = useState(false)
  const [reportsToday, setReportsToday] = useState<string>('0')
  const [solvedThisWeek, setSolvedThisWeek] = useState<string>('0')

  const [claimModalCard, setClaimModalCard] = useState<ProblemCard | null>(null)
  const [chatOpen, setChatOpen] = useState(false)
  const [activeChatConvId, setActiveChatConvId] = useState<string | null>(null)

  const unreadMessages = conversations.reduce((a, c) => a + c.unreadCount, 0)
  const activeClaims = claims.filter((c) => c.progressStatus !== 'solved').length
  const [realName, setRealName] = useState<string>('')
  useEffect(() => {
    const savedName = localStorage.getItem('user_full_name')
    if (savedName) {
      setRealName(savedName)
    }

    ;(async () => {
      try {
        const data = await api.get<any>('/api/auth/me')
        setRealName(data.full_name)
        localStorage.setItem('user_full_name', data.full_name)
      } catch (e) {
        console.error('Failed to fetch user name', e)
      }
    })()
  }, [])

  const fetchProblems = useCallback(async () => {
    try {
      const queryParams = new URLSearchParams()
      if (filterCategory !== 'All') queryParams.append('category', filterCategory)
      if (sortBy) queryParams.append('sort', sortBy)
      if (onlyTrending) queryParams.append('trending', 'true')
      if (searchQuery) queryParams.append('search', searchQuery)

      const cardsData = await api.get<ProblemCard[]>(`/api/developer/problems?${queryParams.toString()}`)
      setCards(cardsData)
    } catch (err) {
      console.error('Failed to fetch developer problems:', err)
    }
  }, [filterCategory, sortBy, onlyTrending, searchQuery])

  const fetchDashboardData = useCallback(async () => {
    try {
      const myClaims = await api.get<any[]>('/api/developer/my-claims')
      setClaims(myClaims.map(c => ({
        id: c.claim_id,
        cardId: c.cluster_id,
        title: c.title,
        category: c.category,
        reportCount: c.reportCount,
        progressStatus: c.progressStatus,
        userCount: c.userCount,
        claimedAt: c.claimedAt,
        note: c.note
      })))

      const notifs = await api.get<any[]>('/api/notifications')
      setNotifications(notifs.map((n: any) => ({
        id: n.id,
        type: n.type,
        message: n.message,
        time: n.time,
        isRead: n.is_read,
        problemId: n.problem_id,
        clusterId: n.cluster_id
      })))

      const convs = await api.get<any[]>('/api/messages/conversations')
      setConversations(convs.map((c: any) => ({
        id: c.conversation_id,
        userName: c.other_user_name,
        userAvatar: c.other_user_avatar,
        problemTitle: c.problem_title,
        lastMessage: c.last_message,
        lastTime: c.last_time,
        unreadCount: c.unread_count,
        messages: [],
      })))

      const stats = await api.get<any>('/api/analytics/stats')
      setReportsToday(stats.reportsToday || '0')
      setSolvedThisWeek(stats.solvedThisWeek || '0')
    } catch (err) {
      console.error('Failed to load dashboard data:', err)
    }
  }, [])

  useEffect(() => {
    const auth = localStorage.getItem('is_authenticated')
    const role = localStorage.getItem('user_role')

    if (auth !== 'true' || role !== 'developer') {
      router.push('/login')
    } else {
      fetchProblems()
      fetchDashboardData()
    }
  }, [router, fetchProblems, fetchDashboardData])

  // Fetch problems when filters change
  useEffect(() => {
    const auth = localStorage.getItem('is_authenticated')
    const role = localStorage.getItem('user_role')
    if (auth === 'true' && role === 'developer') {
      fetchProblems()
    }
  }, [filterCategory, sortBy, onlyTrending, searchQuery, fetchProblems])

  const filteredCards = useMemo(() => cards, [cards])

  const handleClaim = (card: ProblemCard) => setClaimModalCard(card)

  const confirmClaim = async (note: string) => {
    if (!claimModalCard) return
    try {
      await api.post(`/api/developer/claim/${claimModalCard.id}`, { note })
      fetchProblems()
      fetchDashboardData()
    } catch (err) {
      console.error('Failed to claim problem:', err)
    }
    setClaimModalCard(null)
  }

  const updateProgress = async (claimId: string, next: ProgressStatus) => {
    try {
      await api.patch(`/api/developer/claim/${claimId}/progress`, { status: next })
      setClaims((prev) =>
        prev.map((c) => c.id === claimId ? { ...c, progressStatus: next } : c)
      )
    } catch (err) {
      console.error('Failed to update progress:', err)
    }
  }

  const openChat = (convId?: string) => {
  setActiveChatConvId(convId || null)
  setChatOpen(true)
    if (convId) {
      setConversations((prev) =>
        prev.map((c) => (c.id === convId ? { ...c, unreadCount: 0 } : c))
      )
    }
    setActiveChatConvId(convId || null)
    setChatOpen(true)
  }

  const closeChat = () => {
    // Reset to browse tab if currently on messages
    if (tab === 'messages') {
      setTab('browse')
      router.push('/developer/dashboard')
    }
    setChatOpen(false)
  }


  const handleTabChange = (t: Tab) => {
    setTab(t)
    router.push(`/developer/dashboard${t !== 'browse' ? `?tab=${t}` : ''}`)
  }

  const markAllNotifsRead = useCallback(async () => {
    try {
      await api.patch('/api/notifications/read-all')
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })))
    } catch (err) {
      console.error(err)
    }
  }, [])

  return (
    <div className="min-h-screen bg-[#0A0A0F] flex">
      <DevSidebar
        developerName={realName || "Developer"}
        activeClaims={activeClaims}
        unreadMessages={unreadMessages}
      />

      <main className="flex-1 min-w-0 flex flex-col">
        {/* Topbar */}
        <header className="flex items-center justify-between px-6 py-4 border-b border-white/[0.06]">
          <div className="flex items-center gap-1 flex-wrap">
            {(['browse', 'claims', 'messages'] as Tab[]).map((t) => (
              <button
                key={t}
                onClick={() => handleTabChange(t)}
                className={`px-4 py-1.5 rounded-lg text-xs font-medium transition-all capitalize ${
                  tab === t
                    ? 'bg-indigo-500/15 text-indigo-400 border border-indigo-500/30'
                    : 'text-slate-500 hover:text-slate-300'
                }`}
              >
                {t === 'claims' ? `My claims (${claims.length})` : t === 'messages' ? `Messages${unreadMessages > 0 ? ` · ${unreadMessages}` : ''}` : 'Browse problems'}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => openChat()}
              className="relative flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/[0.05] border border-white/[0.08] text-slate-400 hover:text-slate-200 transition-all text-xs"
            >
              <MessageSquare size={13} />
              Messages
              {unreadMessages > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-indigo-500 rounded-full text-[9px] text-white font-semibold flex items-center justify-center">
                  {unreadMessages}
                </span>
              )}
            </button>
            <NotificationsDropdown notifications={notifications} onMarkAllRead={markAllNotifsRead} />
          </div>
        </header>

        <div className="flex-1 overflow-y-auto px-6 py-6">

          {/* ── BROWSE TAB ── */}
          {tab === 'browse' && (
            <>
              {/* Stats */}
              <div className="grid grid-cols-4 gap-3 mb-6">
                {[
                  { label: 'Total problems', value: cards.length, color: '#F8FAFC' },
                  { label: 'My active claims', value: activeClaims, color: '#F59E0B' },
                  { label: 'Reports today', value: reportsToday, color: '#06B6D4' },
                  { label: 'Solved this week', value: solvedThisWeek, color: '#10B981' },
                ].map((s) => (
                  <div key={s.label} className="bg-white/[0.03] border border-white/[0.07] rounded-xl p-4">
                    <div className="text-xl font-semibold mb-1" style={{ color: s.color }}>{s.value}</div>
                    <div className="text-[11px] text-slate-500">{s.label}</div>
                  </div>
                ))}
              </div>

              {/* Filters */}
              <div className="flex items-center gap-2 mb-4 flex-wrap">
                <div className="relative flex-1 min-w-[180px]">
                  <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-600" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search problems..."
                    className="w-full bg-white/[0.04] border border-white/[0.08] rounded-lg pl-8 pr-3 py-2 text-xs text-white placeholder:text-slate-600 focus:outline-none focus:border-indigo-500/50 transition-colors"
                  />
                </div>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as SortOption)}
                  className="bg-white/[0.04] border border-white/[0.08] rounded-lg px-3 py-2 text-xs text-slate-400 focus:outline-none"
                >
                  <option value="most_reported">Most reported</option>
                  <option value="trending">Trending</option>
                  <option value="newest">Newest</option>
                </select>
                <button
                  onClick={() => setOnlyTrending(!onlyTrending)}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs border transition-all ${
                    onlyTrending
                      ? 'bg-amber-500/10 border-amber-500/30 text-amber-400'
                      : 'border-white/[0.08] text-slate-500 hover:border-white/20'
                  }`}
                >
                  <Flame size={12} />
                  Trending only
                </button>
              </div>

              {/* Category pills */}
              <div className="flex items-center gap-2 mb-5 flex-wrap">
                {CATEGORIES.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setFilterCategory(cat)}
                    className={`px-3 py-1 rounded-full text-[11px] border transition-all ${
                      filterCategory === cat
                        ? 'border-indigo-500/50 bg-indigo-500/10 text-indigo-400'
                        : 'border-white/[0.08] text-slate-500 hover:border-white/20 hover:text-slate-400'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>

              {/* Problem Cards Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {filteredCards.map((card) => (
                  <ProblemCardComponent
                    key={card.id}
                    card={card}
                    onClaim={() => handleClaim(card)}
                  />
                ))}
              </div>

              {filteredCards.length === 0 && (
                <div className="text-center py-16 text-slate-600 text-sm">
                  No problems match your filters
                </div>
              )}
            </>
          )}

          {/* ── MY CLAIMS TAB ── */}
          {tab === 'claims' && (
            <>
              <div className="mb-5">
                <h2 className="text-base font-semibold text-white mb-1">My claimed problems</h2>
                <p className="text-xs text-slate-500">Track your progress and message users</p>
              </div>
              <div className="space-y-4">
                {claims.map((claim) => {
                  const prog = PROGRESS_CONFIG[claim.progressStatus]
                  return (
                    <div key={claim.id} className="bg-white/[0.03] border border-white/[0.07] rounded-xl p-5">
                      <div className="flex items-start justify-between gap-3 mb-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1.5">
                            <span
                              className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium border"
                              style={{ color: CATEGORY_COLORS[claim.category], background: CATEGORY_BG[claim.category], borderColor: `${CATEGORY_COLORS[claim.category]}30` }}
                            >
                              {claim.category}
                            </span>
                            <span
                              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium border"
                              style={{ color: prog.color, background: prog.bg, borderColor: `${prog.color}30` }}
                            >
                              {claim.progressStatus === 'in_progress' && <Clock size={9} />}
                              {claim.progressStatus === 'testing' && <TrendingUp size={9} />}
                              {claim.progressStatus === 'solved' && <CheckCircle size={9} />}
                              {prog.label}
                            </span>
                          </div>
                          <h3 className="text-sm font-medium text-white">{claim.title}</h3>
                          {claim.note && (
                            <p className="text-xs text-slate-500 mt-1 italic">"{claim.note}"</p>
                          )}
                        </div>
                        <div className="text-right shrink-0">
                          <div className="text-lg font-semibold text-indigo-400">{claim.reportCount}</div>
                          <div className="text-[10px] text-slate-600">reports</div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 pt-3 border-t border-white/[0.05]">
                        <button
                          onClick={async () => {
                            try {
                              // Find existing conversation for this cluster
                              const existingConv = conversations.find(c => c.id.startsWith(claim.cardId))
                              if (existingConv) {
                                handleTabChange('messages')
                                openChat(existingConv.id)
                              } else {
                                // Create temporary conversation ID using clusterId and a placeholder user ID
                                const tempConvId = `${claim.cardId}_temp`
                                // Add a placeholder conversation to the state
                                setConversations(prev => [...prev, {
                                  id: tempConvId,
                                  userName: 'New User',
                                  userAvatar: 'NU',
                                  problemTitle: claim.title,
                                  lastMessage: 'Start typing to message...',
                                  lastTime: 'Now',
                                  unreadCount: 0,
                                  messages: []
                                }])
                                handleTabChange('messages')
                                openChat(tempConvId)
                              }
                            } catch (e) {
                              console.error(e)
                              handleTabChange('messages')
                            }
                          }}
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-white/[0.04] border border-white/[0.08] rounded-lg text-xs text-slate-400 hover:text-slate-200 hover:border-white/20 transition-all"
                        >
                          <Users size={12} />
                          Message users
                        </button>

                        {prog.next && (
                          <button
                            onClick={() => updateProgress(claim.id, prog.next!)}
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-500/10 border border-indigo-500/25 rounded-lg text-xs text-indigo-400 hover:bg-indigo-500/20 transition-all ml-auto"
                          >
                            {prog.nextLabel} →
                          </button>
                        )}

                        <span className="text-[10px] text-slate-600 ml-auto">
                          Claimed {new Date(claim.claimedAt).toLocaleDateString('en-PK', { day: 'numeric', month: 'short' })}
                        </span>
                      </div>
                    </div>
                  )
                })}
              </div>
            </>
          )}

          {/* ── MESSAGES TAB ── */}
          {tab === 'messages' && (
            <>
              <div className="mb-5">
                <h2 className="text-base font-semibold text-white mb-1">User conversations</h2>
                <p className="text-xs text-slate-500">Chat with users who reported your claimed problems</p>
              </div>
              <div className="space-y-2">
                {conversations.map((conv) => (
                  <button
                    key={conv.id}
                    onClick={() => openChat(conv.id)}
                    className="w-full flex items-start gap-3 p-4 bg-white/[0.03] border border-white/[0.07] rounded-xl hover:border-white/[0.12] transition-all text-left"
                  >
                    <div className="w-10 h-10 rounded-full bg-cyan-500/15 flex items-center justify-center text-sm font-semibold text-cyan-300 shrink-0">
                      {conv.userAvatar}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-0.5">
                        <span className="text-sm font-medium text-slate-200">{conv.userName}</span>
                        <span className="text-[11px] text-slate-600">{conv.lastTime}</span>
                      </div>
                      <p className="text-xs text-slate-500 truncate">{conv.lastMessage}</p>
                      <p className="text-[10px] text-slate-600 mt-0.5">{conv.problemTitle}</p>
                    </div>
                    {conv.unreadCount > 0 && (
                      <span className="bg-indigo-500 text-white text-[9px] font-semibold w-5 h-5 rounded-full flex items-center justify-center shrink-0">
                        {conv.unreadCount}
                      </span>
                    )}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
      </main>

      {/* Claim Modal */}
      {claimModalCard && (
        <ClaimModal
          card={claimModalCard}
          onConfirm={confirmClaim}
          onClose={() => setClaimModalCard(null)}
        />
      )}

      {/* Dev Chat Panel */}
      <DevChatPanel
        conversations={conversations}
        open={chatOpen}
        onClose={() => closeChat()}
        onRead={(convId) => setConversations((prev) =>
          prev.map((c) => (c.id === convId ? { ...c, unreadCount: 0 } : c))
        )}
        initialConvId={activeChatConvId}
      />
    </div>
  )
}

// ── Problem Card Sub-component ──
function ProblemCardComponent({ card, onClaim }: { card: ProblemCard; onClaim: () => void }) {
  const [claiming, setClaiming] = useState(false)

  const statusConfig = {
    unclaimed: { label: 'Unclaimed', color: '#10B981', bg: 'rgba(16,185,129,0.1)', border: 'rgba(16,185,129,0.25)' },
    in_progress: { label: 'In progress', color: '#F59E0B', bg: 'rgba(245,158,11,0.1)', border: 'rgba(245,158,11,0.25)' },
    solved: { label: 'Solved', color: '#6B7280', bg: 'rgba(107,114,128,0.1)', border: 'rgba(107,114,128,0.2)' },
  }

  const status = statusConfig[card.claimStatus]

  const handleClaim = async () => {
    setClaiming(true)
    await new Promise((r) => setTimeout(r, 200))
    setClaiming(false)
    onClaim()
  }

  return (
    <div className="bg-white/[0.03] border border-white/[0.08] rounded-xl p-4 hover:border-white/[0.14] transition-all flex flex-col">
      {/* Top row */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-1.5">
          <span
            className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium border"
            style={{ color: CATEGORY_COLORS[card.category], background: CATEGORY_BG[card.category], borderColor: `${CATEGORY_COLORS[card.category]}30` }}
          >
            {card.category}
          </span>
          {card.isTrending && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-medium bg-amber-500/10 border border-amber-500/25 text-amber-400">
              <Flame size={9} /> Trending
            </span>
          )}
        </div>
        <ConfidenceRing score={card.confidenceScore} size={34} />
      </div>

      {/* Title */}
      <h3 className="text-sm font-semibold text-white leading-snug mb-2">{card.title}</h3>

      {/* Report count */}
      <div className="flex items-baseline gap-1 mb-3">
        <span className="text-2xl font-bold text-indigo-400">{card.reportCount}</span>
        <span className="text-xs text-slate-500">reports</span>
        {card.weeklyGrowth > 0 && (
          <span className="ml-auto text-[10px] text-emerald-400 font-medium">+{card.weeklyGrowth}% this week</span>
        )}
      </div>

      {/* Keywords */}
      <div className="flex flex-wrap gap-1.5 mb-4">
        {card.keywords.map((kw) => (
          <span key={kw} className="bg-white/[0.05] border border-white/[0.08] rounded px-1.5 py-0.5 text-[10px] text-slate-500 font-mono">
            {kw}
          </span>
        ))}
      </div>

      {/* Bottom */}
      <div className="flex items-center gap-2 mt-auto pt-3 border-t border-white/[0.05]">
        <span
          className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium border"
          style={{ color: status.color, background: status.bg, borderColor: status.border }}
        >
          {status.label}
        </span>

        {card.claimStatus === 'unclaimed' && (
          <button
            onClick={handleClaim}
            disabled={claiming}
            className="ml-auto flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-xs font-medium rounded-lg transition-colors"
          >
            {claiming ? <Loader2 size={11} className="animate-spin" /> : null}
            I&apos;m Building This
          </button>
        )}

        {card.claimedByMe && card.claimStatus === 'in_progress' && (
          <span className="ml-auto text-xs text-emerald-400 font-medium">Claimed by you ✓</span>
        )}

        {card.claimStatus === 'solved' && (
          <span className="ml-auto text-xs text-slate-500">Solved</span>
        )}

        {!card.claimedByMe && card.claimStatus === 'in_progress' && (
          <span className="ml-auto text-xs text-amber-400">{card.claimedByName} building...</span>
        )}
      </div>
    </div>
  )
}

export default function DeveloperDashboard() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#0A0A0F] flex items-center justify-center">
        <span className="material-symbols-outlined text-primary text-5xl animate-spin">progress_activity</span>
      </div>
    }>
      <DeveloperDashboardContent />
    </Suspense>
  )
}
