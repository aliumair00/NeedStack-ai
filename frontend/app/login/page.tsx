'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Eye, EyeOff, Shield, Zap, User, AlertCircle } from 'lucide-react'

type Role = 'user' | 'developer' | 'admin'

interface RoleConfig {
  key: Role
  label: string
  description: string
  icon: React.ReactNode
  redirect: string
}

const roles: RoleConfig[] = [
  {
    key: 'user',
    label: 'User',
    description: 'Submit problems',
    icon: <User size={22} />,
    redirect: '/user/dashboard',
  },
  {
    key: 'developer',
    label: 'Developer',
    description: 'Build solutions',
    icon: <Zap size={22} />,
    redirect: '/developer/dashboard',
  },
  {
    key: 'admin',
    label: 'Admin',
    description: 'Manage platform',
    icon: <Shield size={22} />,
    redirect: '/admin/dashboard',
  },
]

export default function LoginPage() {
  const router = useRouter()
  const [selectedRole, setSelectedRole] = useState<Role>('user')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // Clear previous session on load
  useEffect(() => {
    localStorage.removeItem("is_authenticated");
    localStorage.removeItem("access_token");
    localStorage.removeItem("user_id");
    localStorage.removeItem("user_role");
    localStorage.removeItem("user_email");
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8002";
      const res = await fetch(`${apiUrl}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      }).catch(() => null);

      if (!res || !res.ok) {
        const errData = res ? await res.json().catch(() => ({})) : {};
        throw new Error(errData.detail || "Invalid credentials or server connection failed.");
      }

      const data = await res.json();
      
      // Store session state in localStorage
      localStorage.setItem("is_authenticated", "true");
      localStorage.setItem("access_token", data.access_token);
      localStorage.setItem("user_id", data.user_id);
      localStorage.setItem("user_role", data.role);
      localStorage.setItem("user_email", data.email);
      localStorage.setItem("user_full_name", data.full_name);

      // Route based on role
      if (data.role === "developer") {
        router.push("/developer/dashboard");
      } else if (data.role === "admin") {
        router.push("/admin/dashboard");
      } else {
        router.push("/user/dashboard");
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Invalid credentials or server connection failed.";
      setError(msg);
    } finally {
      setLoading(false)
    }
  }

  const autofill = (userType: 'user' | 'developer') => {
    if (userType === 'user') {
      setEmail('user@needstack.com')
      setPassword('user123')
      setSelectedRole('user')
    } else {
      setEmail('dev@needstack.com')
      setPassword('dev123')
      setSelectedRole('developer')
    }
  }

  const currentRole = roles.find((r) => r.key === selectedRole)!

  return (
    <div className="min-h-screen bg-[#050507] text-on-surface flex items-center justify-center px-margin-mobile md:px-margin-desktop py-12 relative overflow-hidden">
      {/* Background visual decorations */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-primary/15 blur-[120px] pointer-events-none"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-secondary/10 blur-[120px] pointer-events-none"></div>

      <div className="w-full max-w-[450px] z-10 space-y-6">
        {/* Logo */}
        <div className="flex items-center gap-2 justify-center sm:justify-start">
          <div className="w-2.5 h-2.5 rounded-full bg-primary-container shadow-[0_0_10px_#8083ff]" />
          <span className="text-white font-headline-md text-headline-md tracking-tight font-bold">Needstack AI</span>
        </div>

        <div className="glass-card rounded-2xl p-8 border border-white/10 shadow-2xl">
          <h1 className="font-headline-lg text-headline-lg text-white mb-1">Welcome back</h1>
          <p className="text-on-surface-variant font-body-md text-body-md mb-6">Select your role to continue</p>

          {/* Role Selector */}
          <div className="grid grid-cols-3 gap-2 mb-6">
            {roles.map((role) => (
              <button
                key={role.key}
                type="button"
                onClick={() => { setSelectedRole(role.key); setError('') }}
                className={`
                  flex flex-col items-center gap-1.5 p-3 rounded-xl border text-center transition-all duration-200 cursor-pointer
                  ${selectedRole === role.key
                    ? 'border-primary bg-primary/10 text-primary'
                    : 'border-outline-variant/30 bg-surface-container-lowest text-on-surface-variant hover:border-outline/40 hover:bg-surface-container-low'
                  }
                `}
              >
                <span className={selectedRole === role.key ? 'text-primary' : 'text-on-surface-variant/75'}>
                  {role.icon}
                </span>
                <span className="text-label-sm font-semibold">{role.label}</span>
                <span className="text-[10px] text-on-surface-variant/60">{role.description}</span>
              </button>
            ))}
          </div>

          {/* Form */}
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-1.5">
              <label className="block text-label-md font-bold text-on-surface-variant" htmlFor="email">
                Email Address
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
                className="w-full bg-surface-container-lowest border border-outline-variant/30 rounded-lg px-3.5 py-3 text-body-md text-on-surface placeholder:text-outline-variant/50 focus:border-primary focus:ring-0 outline-none transition-all"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-label-md font-bold text-on-surface-variant" htmlFor="password">
                Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="w-full bg-surface-container-lowest border border-outline-variant/30 rounded-lg pl-3.5 pr-10 py-3 text-body-md text-on-surface placeholder:text-outline-variant/50 focus:border-primary focus:ring-0 outline-none transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-outline/80 hover:text-on-surface transition-colors cursor-pointer"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {/* Error */}
            {error && (
              <div className="flex items-center gap-2 bg-error-container/20 border border-error-container/40 text-error rounded-lg px-3 py-2.5">
                <AlertCircle size={15} className="text-error shrink-0" />
                <span className="text-label-sm text-error">{error}</span>
              </div>
            )}

            <div className="flex justify-end">
              <Link href="/forgot-password" className="text-label-sm text-primary hover:underline">
                Forgot password?
              </Link>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-primary hover:bg-[#8083ff] text-on-primary disabled:opacity-50 disabled:cursor-not-allowed font-bold text-label-md rounded-xl py-3.5 hover:shadow-[0_0_15px_rgba(192,193,255,0.4)] active:scale-[0.98] transition-all cursor-pointer"
            >
              {loading ? 'Signing in...' : `Sign in as ${currentRole.label}`}
            </button>
          </form>

          {/* Divider */}
          <p className="text-center text-label-sm text-on-surface-variant mt-6">
            Don&apos;t have an account?{' '}
            <Link href="/signup" className="text-primary hover:underline">
              Sign up →
            </Link>
          </p>
        </div>
        <div className="text-center">
          <Link href="/" className="text-label-sm text-outline hover:text-white transition-colors">
            ← Return to Landing Page
          </Link>
        </div>
      </div>
    </div>
  )
}
