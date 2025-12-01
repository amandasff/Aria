'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'

export default function AcceptInvitePage() {
  const router = useRouter()
  const params = useParams()
  const token = (params?.token as string) || ''
  
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [validating, setValidating] = useState(true)
  const [studentInfo, setStudentInfo] = useState<{ name?: string; email?: string } | null>(null)

  useEffect(() => {
    // Validate token exists
    if (!token) {
      setError('Invalid invitation link')
      setValidating(false)
      return
    }

    // Optionally fetch student info to show name/email
    const fetchInviteInfo = async () => {
      try {
        const response = await fetch(`/api/students/invite-info?token=${encodeURIComponent(token)}`)
        if (response.ok) {
          const data = await response.json()
          if (data.success) {
            setStudentInfo(data.data)
          } else {
            // If API returns error, show it but still allow form submission
            console.warn('Invite info error:', data.error)
          }
        } else {
          // Non-200 response - still show form, just without student info
          console.warn('Failed to fetch invite info')
        }
      } catch (err) {
        // Silently fail - we'll still show the form
        console.error('Error fetching invite info:', err)
      } finally {
        setValidating(false)
      }
    }

    fetchInviteInfo()
  }, [token])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (password !== confirmPassword) {
      setError('Passwords do not match')
      return
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters')
      return
    }

    setLoading(true)

    try {
      const response = await fetch('/api/students/accept-invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token,
          password,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || 'Failed to accept invitation')
        setLoading(false)
        return
      }

      // Store token
      if (data.data.token) {
        localStorage.setItem('token', data.data.token)
      }

      // Redirect to student dashboard
      router.push('/dashboard/student')
    } catch (err) {
      setError('Network error. Please try again.')
      setLoading(false)
    }
  }

  if (validating) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center">
        <div className="text-2xl font-semibold text-gray-900">Validating invitation...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full">
        <div className="bg-white/80 backdrop-blur-md rounded-2xl shadow-2xl border border-gray-100/50 p-10">
          <div className="text-center mb-10">
            <Link href="/" className="text-2xl font-semibold text-gray-900 tracking-tight inline-block mb-2">
              MusicPractice
            </Link>
            <h2 className="text-4xl font-bold bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 bg-clip-text text-transparent tracking-tight mt-4">
              Accept Student Invitation
            </h2>
            {studentInfo && (
              <p className="mt-3 text-gray-700 font-medium">
                Welcome, {studentInfo.name}! ({studentInfo.email})
              </p>
            )}
            <p className="mt-2 text-gray-600 font-light">
              Create a password to activate your account
            </p>
          </div>

          {error && (
            <div className="mb-6 bg-red-50/80 backdrop-blur-sm border border-red-200 text-red-700 px-4 py-3 rounded-xl">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="password" className="block text-sm font-semibold text-gray-900 mb-2">
                Password
              </label>
              <input
                id="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 bg-white/80 backdrop-blur-sm border border-gray-200 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all text-gray-900 placeholder-gray-400"
                placeholder="••••••••"
              />
              <p className="mt-2 text-xs text-gray-500 font-light">Must be at least 8 characters</p>
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-semibold text-gray-900 mb-2">
                Confirm Password
              </label>
              <input
                id="confirmPassword"
                type="password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full px-4 py-3 bg-white/80 backdrop-blur-sm border border-gray-200 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all text-gray-900 placeholder-gray-400"
                placeholder="••••••••"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex justify-center items-center gap-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-6 py-4 rounded-xl text-base font-semibold hover:from-indigo-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-indigo-500/25 hover:shadow-xl hover:shadow-indigo-500/30 hover:scale-[1.02]"
            >
              {loading ? (
                <>
                  <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Activating account...
                </>
              ) : (
                'Activate Account'
              )}
            </button>
          </form>

          <div className="mt-8 text-center">
            <p className="text-sm text-gray-600">
              Already have an account?{' '}
              <Link href="/login" className="font-semibold text-indigo-600 hover:text-indigo-700 transition-colors">
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
