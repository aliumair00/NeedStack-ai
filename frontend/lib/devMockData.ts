import { ProblemCategory } from './mockData'

export type ProgressStatus = 'in_progress' | 'testing' | 'solved'

export interface ProblemCard {
  id: string
  category: ProblemCategory
  reportCount: number
  title: string
  keywords: string[]
  claimStatus: 'unclaimed' | 'in_progress' | 'solved'
  claimedByMe?: boolean
  claimedByName?: string
  confidenceScore: number
  weeklyGrowth: number
  userCount: number
  isTrending?: boolean
  createdAt: string
}

export interface DevMessage {
  id: string
  content: string
  time: string
  isMe: boolean
  senderAvatar: string
}

export interface DevConversation {
  id: string
  userName: string
  userAvatar: string
  problemTitle: string
  lastMessage: string
  lastTime: string
  unreadCount: number
  messages: DevMessage[]
}

export interface MyClaimedProblem {
  id: string
  cardId: string
  title: string
  category: ProblemCategory
  reportCount: number
  progressStatus: ProgressStatus
  userCount: number
  claimedAt: string
  note?: string
}

export const MOCK_PROBLEM_CARDS: ProblemCard[] = []

export const MOCK_MY_CLAIMS: MyClaimedProblem[] = []

export const MOCK_DEV_CONVERSATIONS: DevConversation[] = []
