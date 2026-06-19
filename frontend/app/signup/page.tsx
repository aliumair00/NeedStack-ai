'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Eye, EyeOff, X, AlertCircle, CheckCircle2 } from 'lucide-react'

type AccountType = 'user' | 'developer'

interface FormData {
  fullName: string
  email: string
  password: string
  confirmPassword: string
  bio: string
  skills: string[]
}

const SKILL_SUGGESTIONS = [
  'React', 'Next.js', 'Python', 'TypeScript', 'Node.js',
  'Flutter', 'Swift', 'Kotlin', 'Django', 'FastAPI',
]

const STEPS = ['Account type', 'Your info', 'Done']

export default function SignupPage() {
  const router = useRouter()
  const [accountType, setAccountType] = useState<AccountType>('user')
  const [step, setStep] = useState(0)
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [skillInput, setSkillInput] = useState('')

  const [form, setForm] = useState<FormData>({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: '',
    bio: '',
    skills: [],
  })

  const update = (field: keyof FormData, value: string) =>
    setForm((prev) => ({ ...prev, [field]: value }))

  const addSkill = (skill: string) => {
    const trimmed = skill.trim()
    if (trimmed && !form.skills.includes(trimmed) && form.skills.length < 8) {
      setForm((prev) => ({ ...prev, skills: [...prev.skills, trimmed] }))
    }
    setSkillInput('')
  }

  const removeSkill = (skill: string) =>
    setForm((prev) => ({ ...prev, skills: prev.skills.filter((s) => s !== skill) }))

  const validateStep1 = () => {
    if (!form.fullName.trim()) return 'Full name is required'
    if (!form.email.includes('@')) return 'Enter a valid email'
    if (form.password.length < 8) return 'Password must be at least 8 characters'
    if (form.password !== form.confirmPassword) return 'Passwords do not match'
    return ''
  }

  const handleNext = () => {
    setError('') // clear previous errors when trying to advance
    if (step === 0) { setStep(1); return }
    if (step === 1) {
      const err = validateStep1()
      if (err) { setError(err); return }
      if (accountType === 'user') { handleSubmit(); return }
      setStep(2)
    }
    if (step === 2) handleSubmit()
  }

  const handleSubmit = async () => {
    setError('')
    setLoading(true)
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8002'
      const res = await fetch(`${apiUrl}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: form.email,
          password: form.password,
          full_name: form.fullName,
          role: accountType,
          bio: accountType === 'developer' ? form.bio : '',
          skills: accountType === 'developer' ? form.skills : [],
        }),
      }).catch(() => null)

      if (!res || !res.ok) {
        const errData = res ? await res.json().catch(() => ({})) : {}
        throw new Error(errData.detail || 'Registration failed. Could not connect to API server.')
      }

      setStep(accountType === 'user' ? 3 : 4) // success screens
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Something went wrong. Please try again.';
      setError(msg);
    } finally {
      setLoading(false)
    }
  }

  // Success screens
  if (step === 3) {
    return <SuccessScreen type="user" onContinue={() => router.push('/user/dashboard')} />
  }
  if (step === 4) {
    return <SuccessScreen type="developer" onContinue={() => router.push('/login')} />
  }

  const progressStep = accountType === 'user' ? Math.min(step, 1) : step

  return (
    <div className="min-h-screen bg-[#050507] text-on-surface flex items-center justify-center px-margin-mobile md:px-margin-desktop py-12 relative overflow-hidden">
      {/* Background visual decorations */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-primary/15 blur-[120px] pointer-events-none"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-secondary/10 blur-[120px] pointer-events-none"></div>

      <div className="w-full max-w-md z-10 space-y-6">
        {/* Logo */}
        <div className="flex items-center gap-2 justify-center sm:justify-start">
          <div className="w-2.5 h-2.5 rounded-full bg-primary-container shadow-[0_0_10px_#8083ff]" />
          <span className="text-white font-headline-md text-headline-md tracking-tight font-bold">Needstack AI</span>
        </div>

        <div className="glass-card rounded-2xl p-8 border border-white/10 shadow-2xl">
          <h1 className="font-headline-lg text-headline-lg text-white mb-1">Create account</h1>
          <p className="text-on-surface-variant font-body-md text-body-md mb-6">Join the problem intelligence platform</p>

          {/* Progress Steps */}
          <div className="flex items-center gap-2 mb-7">
            {(accountType === 'user' ? ['Account type', 'Your info'] : STEPS).map((label, i) => (
              <div key={i} className="flex items-center gap-2 flex-1 last:flex-none">
                <div className={`
                  w-6 h-6 rounded-full flex items-center justify-center text-xs font-semibold shrink-0 border transition-all
                  ${i < progressStep ? 'bg-primary border-primary text-on-primary'
                    : i === progressStep ? 'border-primary bg-primary/20 text-primary'
                    : 'border-outline-variant/30 bg-transparent text-outline'}
                `}>
                  {i < progressStep ? '✓' : i + 1}
                </div>
                <span className={`text-xs ${i === progressStep ? 'text-on-surface' : 'text-outline'}`}>
                  {label}
                </span>
                {i < (accountType === 'user' ? 1 : 2) && (
                  <div className={`flex-1 h-px ${i < progressStep ? 'bg-primary/40' : 'bg-outline-variant/20'}`} />
                )}
              </div>
            ))}
          </div>

          {/* Step 0 — Account Type */}
          {step === 0 && (
            <div className="space-y-3">
              {(['user', 'developer'] as AccountType[]).map((type) => (
                <button
                  key={type}
                  onClick={() => setAccountType(type)}
                  className={`
                    w-full text-left p-4 rounded-xl border transition-all cursor-pointer
                    ${accountType === type
                      ? 'border-primary bg-primary/10'
                      : 'border-outline-variant/30 bg-surface-container-lowest hover:border-outline/40 hover:bg-surface-container-low'}
                  `}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className={`font-medium text-sm mb-0.5 ${accountType === type ? 'text-primary' : 'text-white'}`}>
                        {type === 'user' ? "I'm a User" : "I'm a Developer"}
                      </div>
                      <div className="text-xs text-on-surface-variant/80">
                        {type === 'user'
                          ? 'I want to submit real problems I face daily'
                          : 'I want to find and build solutions for real problems'}
                      </div>
                    </div>
                    <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 ${accountType === type ? 'border-primary' : 'border-outline/50'}`}>
                      {accountType === type && <div className="w-2 h-2 rounded-full bg-primary" />}
                    </div>
                  </div>
                  {type === 'developer' && (
                    <div className="mt-2 inline-flex items-center gap-1 bg-tertiary-container/10 border border-tertiary-container/20 rounded-md px-2 py-0.5">
                      <span className="text-[10px] text-tertiary">Requires admin approval</span>
                    </div>
                  )}
                </button>
              ))}
            </div>
          )}

          {/* Step 1 — Basic Info */}
          {step === 1 && (
            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="block text-label-sm font-bold text-on-surface-variant">Full name</label>
                <input
                  type="text"
                  value={form.fullName}
                  onChange={(e) => update('fullName', e.target.value)}
                  placeholder="Ali Hassan"
                  className="w-full bg-surface-container-lowest border border-outline-variant/30 rounded-lg px-3.5 py-2.5 text-body-md text-on-surface placeholder:text-outline-variant/50 focus:border-primary focus:ring-0 outline-none transition-all"
                />
              </div>
              <div className="space-y-1.5">
                <label className="block text-label-sm font-bold text-on-surface-variant">Email address</label>
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => update('email', e.target.value)}
                  placeholder="ali@example.com"
                  className="w-full bg-surface-container-lowest border border-outline-variant/30 rounded-lg px-3.5 py-2.5 text-body-md text-on-surface placeholder:text-outline-variant/50 focus:border-primary focus:ring-0 outline-none transition-all"
                />
              </div>
              <div className="space-y-1.5">
                <label className="block text-label-sm font-bold text-on-surface-variant">Password</label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={form.password}
                    onChange={(e) => update('password', e.target.value)}
                    placeholder="Min 8 characters"
                    className="w-full bg-surface-container-lowest border border-outline-variant/30 rounded-lg pl-3.5 pr-10 py-2.5 text-body-md text-on-surface placeholder:text-outline-variant/50 focus:border-primary focus:ring-0 outline-none transition-all"
                  />
                  <button type="button" onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-outline/80 hover:text-on-surface cursor-pointer">
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="block text-label-sm font-bold text-on-surface-variant">Confirm password</label>
                <input
                  type="password"
                  value={form.confirmPassword}
                  onChange={(e) => update('confirmPassword', e.target.value)}
                  placeholder="Repeat password"
                  className="w-full bg-surface-container-lowest border border-outline-variant/30 rounded-lg px-3.5 py-2.5 text-body-md text-on-surface placeholder:text-outline-variant/50 focus:border-primary focus:ring-0 outline-none transition-all"
                />
              </div>
            </div>
          )}

          {/* Step 2 — Developer Extra Info */}
          {step === 2 && (
            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="block text-label-sm font-bold text-on-surface-variant">Bio <span className="text-outline/70 font-normal">(optional)</span></label>
                <textarea
                  value={form.bio}
                  onChange={(e) => update('bio', e.target.value)}
                  placeholder="Tell us what you build and what you're passionate about..."
                  rows={3}
                  className="w-full bg-surface-container-lowest border border-outline-variant/30 rounded-lg px-3.5 py-2.5 text-body-md text-on-surface placeholder:text-outline-variant/50 focus:border-primary focus:ring-0 outline-none transition-all resize-none"
                />
              </div>
              <div className="space-y-1.5">
                <label className="block text-label-sm font-bold text-on-surface-variant">Skills</label>
                <div className="bg-surface-container-lowest border border-outline-variant/30 rounded-lg p-2.5 min-h-[60px]">
                  <div className="flex flex-wrap gap-1.5 mb-2">
                    {form.skills.map((skill) => (
                      <span key={skill} className="inline-flex items-center gap-1 bg-primary/20 border border-primary/30 rounded-full px-2.5 py-0.5 text-xs text-primary">
                        {skill}
                        <button onClick={() => removeSkill(skill)} className="text-primary hover:text-white cursor-pointer">
                          <X size={10} />
                        </button>
                      </span>
                    ))}
                  </div>
                  <input
                    type="text"
                    value={skillInput}
                    onChange={(e) => setSkillInput(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ',') { e.preventDefault(); addSkill(skillInput) } }}
                    placeholder="Type skill + Enter"
                    className="bg-transparent text-sm text-on-surface placeholder:text-outline-variant/50 outline-none w-full"
                  />
                </div>
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {SKILL_SUGGESTIONS.filter((s) => !form.skills.includes(s)).slice(0, 6).map((s) => (
                    <button key={s} onClick={() => addSkill(s)}
                      className="text-xs text-outline border border-outline-variant/20 rounded-full px-2.5 py-0.5 hover:border-primary/40 hover:text-primary transition-colors cursor-pointer">
                      + {s}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="flex items-center gap-2 bg-error-container/20 border border-error-container/40 text-error rounded-lg px-3 py-2.5 mt-4">
              <AlertCircle size={15} className="text-error shrink-0" />
              <span className="text-label-sm text-error">{error}</span>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-2 mt-6">
            {step > 0 && (
              <button
                onClick={() => { setStep(step - 1); setError('') }}
                className="flex-1 border border-outline-variant/30 hover:border-outline/40 hover:bg-surface-container-low text-on-surface-variant text-label-md rounded-xl py-3 transition-all cursor-pointer"
              >
                ← Back
              </button>
            )}
            <button
              onClick={handleNext}
              disabled={loading}
              className="flex-1 bg-primary hover:bg-[#8083ff] text-on-primary disabled:opacity-50 text-label-md font-bold rounded-xl py-3 hover:shadow-[0_0_15px_rgba(192,193,255,0.4)] active:scale-[0.98] transition-all cursor-pointer"
            >
              {loading ? 'Creating account...'
                : step === 0 ? 'Continue →'
                : (accountType === 'user' && step === 1) || step === 2 ? 'Create account →'
                : 'Next →'}
            </button>
          </div>

          <p className="text-center text-label-sm text-on-surface-variant mt-5">
            Already have an account?{' '}
            <Link href="/login" className="text-primary hover:underline">Sign in →</Link>
          </p>
        </div>
      </div>
    </div>
  )
}

function SuccessScreen({ type, onContinue }: { type: 'user' | 'developer'; onContinue: () => void }) {
  return (
    <div className="min-h-screen bg-[#050507] text-on-surface flex items-center justify-center px-margin-mobile md:px-margin-desktop py-12 relative overflow-hidden">
      {/* Background visual decorations */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-primary/15 blur-[120px] pointer-events-none"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-secondary/10 blur-[120px] pointer-events-none"></div>

      <div className="w-full max-w-md z-10 text-center space-y-6">
        <div className="flex items-center gap-2 justify-center">
          <div className="w-2.5 h-2.5 rounded-full bg-primary-container shadow-[0_0_10px_#8083ff]" />
          <span className="text-white font-headline-md text-headline-md tracking-tight font-bold">Needstack AI</span>
        </div>
        <div className="glass-card rounded-2xl p-10 border border-white/10 shadow-2xl">
          <div className="w-14 h-14 rounded-full bg-[#34A853]/10 border border-[#34A853]/30 flex items-center justify-center mx-auto mb-5">
            <CheckCircle2 size={28} className="text-[#34A853]" />
          </div>
          <h2 className="font-headline-lg text-headline-lg text-white mb-2">
            {type === 'user' ? 'You\'re all set!' : 'Application submitted!'}
          </h2>
          <p className="text-on-surface-variant font-body-md text-body-md mb-6">
            {type === 'user'
              ? 'Your account is ready. Start submitting problems and help shape what gets built next.'
              : 'Your developer account is pending admin review. You\'ll get an email once approved — usually within 24 hours.'}
          </p>
          {type === 'developer' && (
            <div className="bg-tertiary-container/10 border border-tertiary-container/20 rounded-xl p-3 mb-5 text-left">
              <p className="text-label-sm text-tertiary font-bold mb-0.5">While you wait...</p>
              <p className="text-[11px] text-on-surface-variant">Browse the public problem feed to see what opportunities exist on the platform.</p>
            </div>
          )}
          <button
            onClick={onContinue}
            className="w-full bg-primary hover:bg-[#8083ff] text-on-primary font-bold text-label-md rounded-xl py-3 hover:shadow-[0_0_15px_rgba(192,193,255,0.4)] transition-all cursor-pointer"
          >
            {type === 'user' ? 'Go to dashboard →' : 'Sign in when approved →'}
          </button>
        </div>
      </div>
    </div>
  )
}
