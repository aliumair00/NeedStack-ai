import { ProblemCategory } from './mockData'

export type UserStatus = 'active' | 'banned'
export type DevStatus = 'pending' | 'approved' | 'rejected' | 'banned'
export type ClusterStatus = 'unclaimed' | 'in_progress' | 'solved'

export interface AdminUser {
  id: string
  name: string
  email: string
  avatar: string
  problemsSubmitted: number
  status: UserStatus
  joinedAt: string
  lastActive: string
}

export interface AdminDeveloper {
  id: string
  name: string
  email: string
  avatar: string
  bio: string
  skills: string[]
  problemsClaimed: number
  problemsSolved: number
  status: DevStatus
  appliedAt: string
  approvedAt?: string
}

export interface AdminCluster {
  id: string
  title: string
  category: ProblemCategory
  reportCount: number
  confidenceScore: number
  claimStatus: ClusterStatus
  claimedBy?: string
  isFeatured: boolean
  isTrending: boolean
  createdAt: string
}

export interface ActivityItem {
  id: string
  type: 'new_user' | 'new_developer' | 'problem_claimed' | 'problem_solved' | 'user_banned'
  message: string
  time: string
  avatar: string
}

export const MOCK_ADMIN_USERS: AdminUser[] = []

export const MOCK_ADMIN_DEVELOPERS: AdminDeveloper[] = []

export const MOCK_ADMIN_CLUSTERS: AdminCluster[] = []

export const MOCK_ACTIVITY: ActivityItem[] = []

export const PLATFORM_STATS = {
  totalUsers: 0,
  totalDevelopers: 0,
  totalProblems: 0,
  totalClusters: 0,
  pendingApprovals: 0,
  avgConfidence: 0,
  problemsClaimedToday: 0,
  problemsSolvedThisWeek: 0,
}
