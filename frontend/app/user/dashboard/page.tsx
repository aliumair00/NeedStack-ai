'use client'

import React, { useState, useEffect, useCallback, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { 
  Clock, TrendingUp, CheckCircle, 
  MessageSquare, Loader2, Menu,
  ChevronDown, ChevronUp, AlertCircle
} from 'lucide-react'
import UserSidebar from '@/components/user/UserSidebar'
import NotificationsDropdown from '@/components/shared/NotificationsDropdown'
import ChatPanel from '@/components/shared/ChatPanel'
import { api } from '@/lib/api'
import {
  CATEGORY_COLORS,
  CATEGORY_BG,
  UserProblem,
  Notification,
  ProblemCategory,
  Conversation,
} from '@/lib/mockData'

const CATEGORIES: ProblemCategory[] = ['Healthcare', 'Education', 'Business', 'Technology', 'Social', 'Other']

type SubmitState = 'idle' | 'loading' | 'matched' | 'new'

function UserDashboardContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const currentTab = searchParams.get('tab') || 'overview'

  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [userName, setUserName] = useState('Ali Hassan')


  const [problems, setProblems] = useState<UserProblem[]>([])
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [chatOpen, setChatOpen] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [activeChatConvId, setActiveChatConvId] = useState<string | null>(null)
  const [expandedProblem, setExpandedProblem] = useState<string | null>(null)

  
  const [problemText, setProblemText] = useState('')
  const [category, setCategory] = useState<ProblemCategory>('Technology')
  const [submitState, setSubmitState] = useState<SubmitState>('idle')
  const [submitResult, setSubmitResult] = useState<{ matched: boolean; count: number } | null>(null)

  const openChat = (convId?: string) => {
    if (convId) {
      setConversations((prev) =>
        prev.map((c) => (c.id === convId ? { ...c, unreadCount: 0 } : c))
      )
    }
    setActiveChatConvId(convId || null)
    setChatOpen(true)
  }

  const closeChat = () => {
    setChatOpen(false)
    setActiveChatConvId(null)
  }

  const fetchDashboardData = useCallback(async () => {
    try {
      const myProbs = await api.get<unknown[]>('/api/problems/my-problems')
      setProblems(myProbs as import('@/lib/mockData').UserProblem[])

      const notifs = await api.get<{ id: string, type: string, message: string, time: string, is_read: boolean, problem_id: string, cluster_id: string }[]>('/api/notifications')
      setNotifications(notifs.map((n) => ({
        id: n.id,
        type: n.type as 'solved' | 'claim' | 'similar' | 'message',
        message: n.message,
        time: n.time,
        isRead: n.is_read,
        problemId: n.problem_id,
        clusterId: n.cluster_id
      })))

      const convs = await api.get<{ conversation_id: string, other_user_name: string, other_user_avatar: string, problem_title: string, last_message: string, last_time: string, unread_count: number }[]>('/api/messages/conversations')
      setConversations(convs.map((c) => ({
        id: c.conversation_id,
        developerName: c.other_user_name,
        developerAvatar: c.other_user_avatar,
        problemTitle: c.problem_title,
        lastMessage: c.last_message,
        lastTime: c.last_time,
        unreadCount: c.unread_count,
        messages: [],
      })))
    } catch (err) {
      console.error('Failed to load dashboard data:', err)
    }
  }, [])

  
  useEffect(() => {
  const auth = localStorage.getItem('is_authenticated')
  const role = localStorage.getItem('user_role')
  const email = localStorage.getItem('user_email')

  if (auth !== 'true' || role !== 'user') {
    router.push('/login')
  } else {
    setTimeout(() => {
      setIsAuthenticated(true)
      if (email) {
      const prefix = email.split('@')[0]
      const formattedName = prefix.charAt(0).toUpperCase() + prefix.slice(1).replace('.', ' ')
      setUserName(formattedName || 'Ali Hassan')
    }
      fetchDashboardData()
    }, 0)
  }
}, [router, fetchDashboardData]);


useEffect(() => {
  const interval = setInterval(fetchDashboardData, 15000);
  return () => clearInterval(interval);
}, [fetchDashboardData]);

  
  useEffect(() => {
    if (currentTab === 'messages') {
      setTimeout(() => setChatOpen(true), 0)
    }
  }, [currentTab])

  const unreadMessages = conversations.reduce((acc, c) => acc + c.unreadCount, 0)


  const handleSubmit = async () => {
    if (problemText.trim().length < 10) return
    setSubmitState('loading')
    setSubmitResult(null)

    try {
      const result = await api.post<{ similarReportsCount: number; clusterId: string; isNewCluster: boolean }>(
        '/api/problems/submit',
        { text: problemText.trim(), category }
      )

      setSubmitResult({
        matched: !result.isNewCluster,
        count: result.similarReportsCount,
      })
      setSubmitState(result.isNewCluster ? 'new' : 'matched')

      
      const myProbs = await api.get<unknown[]>('/api/problems/my-problems')
      setProblems(myProbs as import('@/lib/mockData').UserProblem[])
    } catch (err) {
      console.error(err)
      setSubmitState('idle')
    }

    
    setTimeout(() => {
      setProblemText('')
      setSubmitState('idle')
      setSubmitResult(null)
    }, 4000)
  }

  const markAllNotifsRead = useCallback(async () => {
    try {
      await api.patch('/api/notifications/read-all')
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })))
    } catch (err) {
      console.error(err)
    }
  }, [])

  const totalSimilar = problems.reduce((acc, p) => acc + p.similarCount, 0)
  const activeDevs = problems.filter((p) => p.claimStatus === 'in_progress').length

  const statusConfig = {
    unclaimed: { label: 'Unclaimed', color: '#10B981', bg: 'rgba(16,185,129,0.1)', icon: <Clock size={11} /> },
    in_progress: { label: 'In progress', color: '#F59E0B', bg: 'rgba(245,158,11,0.1)', icon: <TrendingUp size={11} /> },
    solved: { label: 'Solved', color: '#6B7280', bg: 'rgba(107,114,128,0.1)', icon: <CheckCircle size={11} /> },
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-[#0A0A0F] flex items-center justify-center">
        <span className="material-symbols-outlined text-primary text-5xl animate-spin">progress_activity</span>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#0A0A0F] flex overflow-hidden">
      <UserSidebar userName={userName} unreadMessages={unreadMessages} mobileOpen={mobileMenuOpen} onClose={() => setMobileMenuOpen(false)} />

      <main className="flex-1 min-w-0 flex flex-col h-screen">
        {}
        <header className="flex items-center justify-between px-4 md:px-6 py-4 border-b border-white/5">
          <div className="flex items-center gap-3">
            <button 
              onClick={() => setMobileMenuOpen(true)}
              className="md:hidden text-slate-400 hover:text-white transition-colors"
            >
              <Menu size={20} />
            </button>
            <div>
              <h1 className="text-base md:text-lg font-semibold text-white">Good morning, {userName.split(' ')[0]} 👋</h1>
              <p className="text-[10px] md:text-xs text-slate-500 mt-0.5">Here&apos;s what&apos;s happening with your problems</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setChatOpen(true)}
              className="relative flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-slate-400 hover:text-slate-200 hover:bg-white/10 transition-all text-xs"
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

        <div className="flex-1 overflow-y-auto px-4 md:px-6 py-6">

          {}
          {(currentTab === 'overview' || currentTab === 'messages') && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
              {[
                { label: 'Problems submitted', value: problems.length, color: '#F8FAFC' },
                { label: 'Total similar reports', value: totalSimilar.toLocaleString(), color: '#06B6D4' },
                { label: 'Developers building', value: activeDevs, color: '#10B981' },
              ].map((stat) => (
                <div key={stat.label} className="bg-white/5 border border-white/10 rounded-xl p-4">
                  <div className="text-2xl font-semibold mb-1" style={{ color: stat.color }}>{stat.value}</div>
                  <div className="text-xs text-slate-500">{stat.label}</div>
                </div>
              ))}
            </div>
          )}

          {}
          {(currentTab === 'overview' || currentTab === 'submit' || currentTab === 'messages') && (
            <section className="mb-8">
              <h2 className="text-xs font-medium text-slate-500 uppercase tracking-widest mb-3">Submit a problem</h2>
              <div className="bg-white/5 border border-white/10 rounded-xl p-5">
                <textarea
                  value={problemText}
                  onChange={(e) => setProblemText(e.target.value)}
                  placeholder="Describe your problem in plain language... (e.g. My internet disconnects every time I get a call)"
                  rows={4}
                  maxLength={1000}
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-indigo-500/50 transition-colors resize-none"
                />
                <div className="flex items-center justify-between mt-1 mb-3">
                  <span className="text-[10px] text-slate-600">Minimum 10 characters</span>
                  <span className={`text-[10px] ${problemText.length > 900 ? 'text-amber-400' : 'text-slate-600'}`}>
                    {problemText.length}/1000
                  </span>
                </div>

                <div className="flex items-center gap-3">
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as ProblemCategory)}
                    className="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-slate-300 focus:outline-none focus:border-indigo-500/50 transition-colors"
                  >
                    {CATEGORIES.map((c) => (
                      <option key={c} value={c} className="bg-[#111118]">{c}</option>
                    ))}
                  </select>

                  <button
                    onClick={handleSubmit}
                    disabled={problemText.trim().length < 10 || submitState === 'loading'}
                    className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-medium rounded-lg transition-colors flex items-center gap-2 cursor-pointer"
                  >
                    {submitState === 'loading' ? (
                      <><Loader2 size={14} className="animate-spin" /> Analyzing...</>
                    ) : (
                      'Submit →'
                    )}
                  </button>
                </div>

                {}
                {submitResult && (
                  <div className={`mt-3 flex items-start gap-2.5 px-4 py-3 rounded-lg border ${
                    submitResult.matched
                      ? 'bg-cyan-500/10 border-cyan-500/20'
                      : 'bg-emerald-500/10 border-emerald-500/20'
                  }`}>
                    <CheckCircle size={14} className={submitResult.matched ? 'text-cyan-400 mt-0.5 shrink-0' : 'text-emerald-400 mt-0.5 shrink-0'} />
                    <p className={`text-xs ${submitResult.matched ? 'text-cyan-300' : 'text-emerald-300'}`}>
                      {submitResult.matched
                        ? `${submitResult.count} other users face this exact problem — a developer may pick this up soon!`
                        : "New problem recorded! We'll notify you when a developer picks this up."}
                    </p>
                  </div>
                )}
              </div>
            </section>
          )}

          {}
          {(currentTab === 'overview' || currentTab === 'problems' || currentTab === 'messages') && (
            <section>
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-xs font-medium text-slate-500 uppercase tracking-widest">My submitted problems</h2>
                <span className="text-xs text-slate-600">{problems.length} total</span>
              </div>

              <div className="space-y-3">
                {problems.map((problem) => {
                  const status = statusConfig[problem.claimStatus]
                  const isExpanded = expandedProblem === problem.id

                  return (
                    <div
                      key={problem.id}
                      className="bg-white/5 border border-white/10 rounded-xl p-4 transition-all hover:border-white/10"
                    >
                      <div className="flex items-start gap-3">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-slate-200 leading-relaxed mb-2.5">{problem.text}</p>

                          <div className="flex items-center flex-wrap gap-2">
                            {}
                            <span
                              className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium border"
                              style={{
                                color: CATEGORY_COLORS[problem.category],
                                background: CATEGORY_BG[problem.category],
                                borderColor: `${CATEGORY_COLORS[problem.category]}30`,
                              }}
                            >
                              {problem.category}
                            </span>

                            {}
                            <span
                              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium border"
                              style={{
                                color: status.color,
                                background: status.bg,
                                borderColor: `${status.color}30`,
                              }}
                            >
                              {status.icon}
                              {status.label}
                            </span>

                            {}
                            <span className="text-[11px] text-slate-500">
                              <span className="text-indigo-400 font-medium">{problem.similarCount}</span> similar reports
                            </span>

                            {}
                            <span className="text-[10px] text-slate-600 ml-auto">
                              {new Date(problem.createdAt).toLocaleDateString('en-PK', { day: 'numeric', month: 'short' })}
                            </span>
                          </div>

                          {}
                          {problem.claimedBy && (
                            <div className="mt-3 flex items-center gap-2.5 pt-2.5 border-t border-white/5">
                              <div className="w-5 h-5 rounded-full bg-indigo-500/20 flex items-center justify-center text-[9px] font-semibold text-indigo-300">
                                {problem.claimedBy.avatar}
                              </div>
                              <span className="text-xs text-slate-400">
                                <span className="text-slate-300 font-medium">{problem.claimedBy.name}</span>
                                {problem.claimStatus === 'in_progress' ? ' is building a solution' : ' solved this'}
                              </span>
                              {problem.claimStatus === 'in_progress' && (
                                <button
                                  onClick={() => openChat(`${problem.clusterId}_${problem.claimedBy?.id}`)}
                                  className="ml-auto flex items-center gap-1 bg-indigo-500/15 border border-indigo-500/30 rounded-lg px-2.5 py-1 text-[11px] text-indigo-300 hover:bg-indigo-500/25 transition-colors cursor-pointer"
                                >
                                  <MessageSquare size={11} />
                                  {problem.hasUnreadMessage ? 'New message' : 'Chat'}
                                  {problem.hasUnreadMessage && (
                                    <span className="w-1.5 h-1.5 rounded-full bg-indigo-400" />
                                  )}
                                </button>
                              )}
                            </div>
                          )}
                        </div>

                        <button
                          onClick={() => setExpandedProblem(isExpanded ? null : problem.id)}
                          className="text-slate-600 hover:text-slate-400 transition-colors shrink-0 mt-0.5 cursor-pointer"
                          aria-label={isExpanded ? 'Collapse' : 'Expand'}
                        >
                          {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                        </button>
                      </div>

                      {}
                      {isExpanded && (
                        <div className="mt-3 pt-3 border-t border-white/5">
                          <p className="text-[11px] text-slate-500 mb-2">Similar problems from other users</p>
                          <div className="space-y-1.5">
                            {[
                              'My phone internet drops every time someone calls me on WhatsApp',
                              'Data connection stops after switching wifi off, need to toggle airplane mode',
                              'Mobile network disconnects randomly, especially on 4G LTE',
                            ].map((similar, i) => (
                              <div key={i} className="flex items-start gap-2 text-[11px] text-slate-500 pl-2 border-l border-white/5">
                                <AlertCircle size={10} className="text-slate-600 mt-0.5 shrink-0" />
                                {similar}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </section>
          )}
        </div>
      </main>

      {}
      <ChatPanel
        conversations={conversations}
        open={chatOpen}
        onClose={closeChat}
        initialConvId={activeChatConvId}
        onRead={(convId) => {
          
          setConversations((prev) =>
            prev.map((c) =>
              c.id === convId ? { ...c, unreadCount: 0 } : c
            )
          );
          
          api.patch(`/api/messages/read/${convId.split('_')[0]}/${convId.split('_')[1]}`).catch((err) => {
            console.error('Failed to mark messages as read:', err);
          });
        }}
      />
    </div>
  )
}

export default function UserDashboardPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#0A0A0F] flex items-center justify-center">
        <span className="material-symbols-outlined text-primary text-5xl animate-spin">progress_activity</span>
      </div>
    }>
      <UserDashboardContent />
    </Suspense>
  )
}
