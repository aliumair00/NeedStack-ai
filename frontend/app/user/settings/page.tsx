'use client'

import React, { useState, useEffect, Suspense } from 'react'
import { useRouter } from 'next/navigation'
import UserSidebar from '@/components/user/UserSidebar'
import { User, Bell, Shield, Key, Loader2, CheckCircle2 } from 'lucide-react'

function UserSettingsContent() {
  const router = useRouter()
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [userName, setUserName] = useState('Ali Hassan')
  const [userEmail, setUserEmail] = useState('user@needstack.com')
  const [unreadMessages, setUnreadMessages] = useState(0) // Mocked for now

  // Form states
  const [nameInput, setNameInput] = useState('')
  const [emailInput, setEmailInput] = useState('')
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  
  // Notification states
  const [emailNotifs, setEmailNotifs] = useState(true)
  const [pushNotifs, setPushNotifs] = useState(true)

  const [isSaving, setIsSaving] = useState(false)
  const [saveSuccess, setSaveSuccess] = useState(false)

  useEffect(() => {
    const auth = localStorage.getItem('is_authenticated')
    const role = localStorage.getItem('user_role')
    const email = localStorage.getItem('user_email')
    const name = localStorage.getItem('user_name')

    if (auth !== 'true' || role !== 'user') {
      router.push('/login')
    } else {
      setIsAuthenticated(true)
      if (email) {
        setUserEmail(email)
        setEmailInput(email)
      }
      if (name) {
        setUserName(name)
        setNameInput(name)
      } else if (email) {
        const prefix = email.split('@')[0]
        const formattedName = prefix.charAt(0).toUpperCase() + prefix.slice(1).replace('.', ' ')
        setUserName(formattedName || 'Ali Hassan')
        setNameInput(formattedName || 'Ali Hassan')
      }
    }
  }, [router])

  const handleSave = () => {
    setIsSaving(true)
    setSaveSuccess(false)
    
    // Simulate API call to save settings
    setTimeout(() => {
      setIsSaving(false)
      setSaveSuccess(true)
      setUserName(nameInput)
      setUserEmail(emailInput)
      localStorage.setItem('user_name', nameInput)
      localStorage.setItem('user_email', emailInput)
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
      <UserSidebar userName={userName} unreadMessages={unreadMessages} />

      <main className="flex-1 min-w-0 flex flex-col">
        {/* Topbar */}
        <header className="flex items-center justify-between px-6 py-4 border-b border-white/[0.06]">
          <div>
            <h1 className="text-lg font-semibold text-white">Settings</h1>
            <p className="text-xs text-slate-500 mt-0.5">Manage your account preferences and details</p>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto px-6 py-8">
          <div className="max-w-3xl mx-auto space-y-8">
            
            {/* Profile Section */}
            <section className="bg-white/[0.03] border border-white/[0.07] rounded-xl overflow-hidden">
              <div className="px-6 py-4 border-b border-white/[0.05] flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-indigo-500/20 flex items-center justify-center text-indigo-400">
                  <User size={16} />
                </div>
                <div>
                  <h2 className="text-sm font-semibold text-slate-200">Profile Information</h2>
                  <p className="text-xs text-slate-500">Update your personal details</p>
                </div>
              </div>
              <div className="p-6 space-y-5">
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1.5">Full Name</label>
                  <input 
                    type="text" 
                    value={nameInput}
                    onChange={(e) => setNameInput(e.target.value)}
                    className="w-full bg-[#111118] border border-white/[0.08] rounded-lg px-4 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-indigo-500/50 transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1.5">Email Address</label>
                  <input 
                    type="email" 
                    value={emailInput}
                    onChange={(e) => setEmailInput(e.target.value)}
                    className="w-full bg-[#111118] border border-white/[0.08] rounded-lg px-4 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-indigo-500/50 transition-colors"
                  />
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
                  <h2 className="text-sm font-semibold text-slate-200">Security</h2>
                  <p className="text-xs text-slate-500">Manage your password and account security</p>
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

            {/* Notifications Section */}
            <section className="bg-white/[0.03] border border-white/[0.07] rounded-xl overflow-hidden">
              <div className="px-6 py-4 border-b border-white/[0.05] flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-400">
                  <Bell size={16} />
                </div>
                <div>
                  <h2 className="text-sm font-semibold text-slate-200">Notifications</h2>
                  <p className="text-xs text-slate-500">Choose what updates you want to receive</p>
                </div>
              </div>
              <div className="p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm text-slate-200">Email Notifications</div>
                    <div className="text-xs text-slate-500 mt-0.5">Receive updates about your problems via email</div>
                  </div>
                  <button 
                    onClick={() => setEmailNotifs(!emailNotifs)}
                    className={`w-11 h-6 rounded-full transition-colors relative ${emailNotifs ? 'bg-emerald-500' : 'bg-white/10'}`}
                  >
                    <span className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${emailNotifs ? 'left-6' : 'left-1'}`} />
                  </button>
                </div>
                
                <div className="h-px bg-white/[0.05] w-full my-4" />
                
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm text-slate-200">Push Notifications</div>
                    <div className="text-xs text-slate-500 mt-0.5">Get real-time browser alerts when developers message you</div>
                  </div>
                  <button 
                    onClick={() => setPushNotifs(!pushNotifs)}
                    className={`w-11 h-6 rounded-full transition-colors relative ${pushNotifs ? 'bg-emerald-500' : 'bg-white/10'}`}
                  >
                    <span className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${pushNotifs ? 'left-6' : 'left-1'}`} />
                  </button>
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
                className="px-5 py-2.5 text-sm font-medium text-slate-300 hover:text-white transition-colors"
                onClick={() => {
                  setNameInput(userName)
                  setEmailInput(userEmail)
                  setCurrentPassword('')
                  setNewPassword('')
                }}
              >
                Discard Changes
              </button>
              
              <button 
                onClick={handleSave}
                disabled={isSaving || (!nameInput.trim() || !emailInput.trim())}
                className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white px-6 py-2.5 rounded-lg text-sm font-medium transition-colors cursor-pointer"
              >
                {isSaving ? <Loader2 size={16} className="animate-spin" /> : <Key size={16} />}
                {isSaving ? 'Saving...' : 'Save Settings'}
              </button>
            </div>

          </div>
        </div>
      </main>
    </div>
  )
}

export default function UserSettingsPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#0A0A0F] flex items-center justify-center">
        <span className="material-symbols-outlined text-indigo-500 text-5xl animate-spin">progress_activity</span>
      </div>
    }>
      <UserSettingsContent />
    </Suspense>
  )
}
