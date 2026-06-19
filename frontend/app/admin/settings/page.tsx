'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import AdminSidebar from '@/components/admin/AdminSidebar'
import { api } from '@/lib/api'
import { Shield, Key, Loader2, CheckCircle2, Sliders, Globe } from 'lucide-react'

export default function AdminSettingsPage() {
  const router = useRouter()
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [pendingApprovals, setPendingApprovals] = useState(0)
  const [totalUsers, setTotalUsers] = useState(0)
  const [adminEmail, setAdminEmail] = useState('admin@needstack.ai')

  // Form states
  const [siteName, setSiteName] = useState('Needstack AI')
  const [contactEmail, setContactEmail] = useState('support@needstack.ai')
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  
  // Platform toggles
  const [maintenanceMode, setMaintenanceMode] = useState(false)
  const [autoApproveDevs, setAutoApproveDevs] = useState(false)

  const [isSaving, setIsSaving] = useState(false)
  const [saveSuccess, setSaveSuccess] = useState(false)

  useEffect(() => {
    const auth = localStorage.getItem('is_authenticated')
    const role = localStorage.getItem('user_role')
    const email = localStorage.getItem('user_email')

    if (auth !== 'true' || role !== 'admin') {
      router.push('/login')
    } else {
      setIsAuthenticated(true)
      if (email) setAdminEmail(email)
      
      // Fetch sidebar stats
      api.get<any>('/api/admin/stats')
        .then(data => {
          setTotalUsers(data.totalUsers || 0)
          setPendingApprovals(data.pendingApprovals || 0)
        })
        .catch(err => console.error("Failed to fetch stats", err))
    }
  }, [router])

  const handleSave = () => {
    setIsSaving(true)
    setSaveSuccess(false)
    
    // Simulate API call to save settings
    setTimeout(() => {
      setIsSaving(false)
      setSaveSuccess(true)
      setCurrentPassword('')
      setNewPassword('')
      
      setTimeout(() => setSaveSuccess(false), 3000)
    }, 1500)
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-[#0A0A0F] flex items-center justify-center">
        <span className="material-symbols-outlined text-indigo-500 text-5xl animate-spin">progress_activity</span>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#0A0A0F] flex">
      <AdminSidebar pendingApprovals={pendingApprovals} totalUsers={totalUsers} />

      <main className="flex-1 min-w-0 flex flex-col">
        {/* Topbar */}
        <header className="flex items-center justify-between px-6 py-4 border-b border-white/[0.06]">
          <div>
            <h1 className="text-lg font-semibold text-white">Platform Settings</h1>
            <p className="text-xs text-slate-500 mt-0.5">Manage global platform configurations and admin security</p>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto px-6 py-8">
          <div className="max-w-3xl mx-auto space-y-8">
            
            {/* Platform Config */}
            <section className="bg-white/[0.03] border border-white/[0.07] rounded-xl overflow-hidden">
              <div className="px-6 py-4 border-b border-white/[0.05] flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-400">
                  <Globe size={16} />
                </div>
                <div>
                  <h2 className="text-sm font-semibold text-slate-200">Global Details</h2>
                  <p className="text-xs text-slate-500">Public facing platform information</p>
                </div>
              </div>
              <div className="p-6 space-y-5">
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1.5">Platform Name</label>
                  <input 
                    type="text" 
                    value={siteName}
                    onChange={(e) => setSiteName(e.target.value)}
                    className="w-full bg-[#111118] border border-white/[0.08] rounded-lg px-4 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-indigo-500/50 transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1.5">Support Email</label>
                  <input 
                    type="email" 
                    value={contactEmail}
                    onChange={(e) => setContactEmail(e.target.value)}
                    className="w-full bg-[#111118] border border-white/[0.08] rounded-lg px-4 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-indigo-500/50 transition-colors"
                  />
                </div>
              </div>
            </section>

            {/* Platform Controls */}
            <section className="bg-white/[0.03] border border-white/[0.07] rounded-xl overflow-hidden">
              <div className="px-6 py-4 border-b border-white/[0.05] flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-indigo-500/20 flex items-center justify-center text-indigo-400">
                  <Sliders size={16} />
                </div>
                <div>
                  <h2 className="text-sm font-semibold text-slate-200">System Controls</h2>
                  <p className="text-xs text-slate-500">Core behaviors and platform availability</p>
                </div>
              </div>
              <div className="p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm text-slate-200">Maintenance Mode</div>
                    <div className="text-xs text-slate-500 mt-0.5">Disables public access for updates (Admins still allowed)</div>
                  </div>
                  <button 
                    onClick={() => setMaintenanceMode(!maintenanceMode)}
                    className={`w-11 h-6 rounded-full transition-colors relative ${maintenanceMode ? 'bg-indigo-500' : 'bg-white/10'}`}
                  >
                    <span className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${maintenanceMode ? 'left-6' : 'left-1'}`} />
                  </button>
                </div>
                
                <div className="h-px bg-white/[0.05] w-full my-4" />
                
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm text-slate-200">Auto-Approve Developers</div>
                    <div className="text-xs text-slate-500 mt-0.5">Automatically grant access to new developer applications</div>
                  </div>
                  <button 
                    onClick={() => setAutoApproveDevs(!autoApproveDevs)}
                    className={`w-11 h-6 rounded-full transition-colors relative ${autoApproveDevs ? 'bg-emerald-500' : 'bg-white/10'}`}
                  >
                    <span className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${autoApproveDevs ? 'left-6' : 'left-1'}`} />
                  </button>
                </div>
              </div>
            </section>

            {/* Security Section */}
            <section className="bg-white/[0.03] border border-white/[0.07] rounded-xl overflow-hidden">
              <div className="px-6 py-4 border-b border-white/[0.05] flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-amber-500/20 flex items-center justify-center text-amber-400">
                  <Shield size={16} />
                </div>
                <div>
                  <h2 className="text-sm font-semibold text-slate-200">Admin Security</h2>
                  <p className="text-xs text-slate-500">Change your root admin password ({adminEmail})</p>
                </div>
              </div>
              <div className="p-6 space-y-5">
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1.5">Current Password</label>
                  <input 
                    type="password" 
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full bg-[#111118] border border-white/[0.08] rounded-lg px-4 py-2.5 text-sm text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-amber-500/50 transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1.5">New Password</label>
                  <input 
                    type="password" 
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Min 8 characters"
                    className="w-full bg-[#111118] border border-white/[0.08] rounded-lg px-4 py-2.5 text-sm text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-amber-500/50 transition-colors"
                  />
                </div>
              </div>
            </section>

            {/* Save Actions */}
            <div className="flex items-center justify-end gap-4 pt-4 border-t border-white/[0.06]">
              {saveSuccess && (
                <div className="flex items-center gap-2 text-emerald-400 text-sm">
                  <CheckCircle2 size={16} />
                  Settings saved successfully
                </div>
              )}
              
              <button 
                onClick={handleSave}
                disabled={isSaving || (!siteName.trim() || !contactEmail.trim())}
                className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white px-6 py-2.5 rounded-lg text-sm font-medium transition-colors cursor-pointer"
              >
                {isSaving ? <Loader2 size={16} className="animate-spin" /> : <Key size={16} />}
                {isSaving ? 'Saving...' : 'Save Configuration'}
              </button>
            </div>

          </div>
        </div>
      </main>
    </div>
  )
}
