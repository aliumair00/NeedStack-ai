export type ProblemCategory = 'Healthcare' | 'Education' | 'Business' | 'Technology' | 'Social' | 'Other'
export type ClaimStatus = 'unclaimed' | 'in_progress' | 'solved'

export interface UserProblem {
  id: string
  text: string
  category: ProblemCategory
  similarCount: number
  claimStatus: ClaimStatus
  claimedBy?: { id: string; name: string; avatar: string }
  createdAt: string
  hasUnreadMessage: boolean
}

export interface Notification {
  id: string
  type: 'claim' | 'similar' | 'solved' | 'message'
  message: string
  time: string
  isRead: boolean
  problemId?: string
}

export interface Message {
  id: string
  senderId: string
  senderName: string
  senderAvatar: string
  content: string
  time: string
  isMe: boolean
}

export interface Conversation {
  id: string
  developerName: string
  developerAvatar: string
  problemTitle: string
  lastMessage: string
  lastTime: string
  unreadCount: number
  messages: Message[]
}

export const MOCK_USER_PROBLEMS: UserProblem[] = []

export const MOCK_NOTIFICATIONS: Notification[] = []

export const MOCK_CONVERSATIONS: Conversation[] = []

export const CATEGORY_COLORS: Record<ProblemCategory, string> = {
  Healthcare: '#EC4899',
  Education: '#8B5CF6',
  Business: '#F59E0B',
  Technology: '#06B6D4',
  Social: '#10B981',
  Other: '#6B7280',
}

export const CATEGORY_BG: Record<ProblemCategory, string> = {
  Healthcare: 'rgba(236,72,153,0.12)',
  Education: 'rgba(139,92,246,0.12)',
  Business: 'rgba(245,158,11,0.12)',
  Technology: 'rgba(6,182,212,0.12)',
  Social: 'rgba(16,185,129,0.12)',
  Other: 'rgba(107,114,128,0.12)',
}
