'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import AudioPlayer from '@/components/AudioPlayer'

interface Student {
  id: string
  name: string
  email: string
  createdAt: string
  inviteToken: string | null
  _count: {
    practiceSessions: number
  }
}

interface Session {
  id: string
  title: string
  duration: number
  createdAt: string
  status: string
  student: {
    id: string
    name: string
    email: string
  }
  analysis: any
}

export default function TeacherDashboard() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [students, setStudents] = useState<Student[]>([])
  const [sessions, setSessions] = useState<Session[]>([])
  const [loading, setLoading] = useState(true)
  const [showInviteModal, setShowInviteModal] = useState(false)
  const [inviteFormData, setInviteFormData] = useState({ name: '', email: '' })
  const [inviteUrl, setInviteUrl] = useState('')
  const [selectedSession, setSelectedSession] = useState<Session | null>(null)
  const [analyzing, setAnalyzing] = useState<string | null>(null)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const token = localStorage.getItem('token')
      if (!token) {
        router.push('/login')
        return
      }

      const userRes = await fetch('/api/auth/me', {
        headers: { Authorization: `Bearer ${token}` },
      })
      const userData = await userRes.json()

      if (!userRes.ok || userData.data.role !== 'TEACHER') {
        router.push('/login')
        return
      }

      setUser(userData.data)

      const studentsRes = await fetch('/api/students', {
        headers: { Authorization: `Bearer ${token}` },
      })
      const studentsData = await studentsRes.json()
      setStudents(studentsData.data || [])

      const sessionsRes = await fetch('/api/practice/sessions', {
        headers: { Authorization: `Bearer ${token}` },
      })
      const sessionsData = await sessionsRes.json()
      setSessions(sessionsData.data || [])

      setLoading(false)
    } catch (error) {
      console.error('Error fetching data:', error)
      setLoading(false)
    }
  }

  const handleInviteStudent = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      const token = localStorage.getItem('token')
      const response = await fetch('/api/students/invite', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(inviteFormData),
      })

      const data = await response.json()

      if (response.ok) {
        setInviteUrl(data.data.inviteUrl)
        setInviteFormData({ name: '', email: '' })
        fetchData()
      } else {
        alert(data.error)
      }
    } catch (error) {
      alert('Error inviting student')
    }
  }

  const handleAnalyze = async (sessionId: string) => {
    setAnalyzing(sessionId)
    try {
      const token = localStorage.getItem('token')
      await fetch(`/api/analysis/${sessionId}`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      })
      fetchData()
    } catch (error) {
      alert('Error analyzing session')
    } finally {
      setAnalyzing(null)
    }
  }

  const handleLogout = () => {
    localStorage.removeItem('token')
    router.push('/login')
  }

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center">
        <div className="text-2xl font-semibold text-gray-900">Loading...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-40 bg-white/80 backdrop-blur-md border-b border-gray-100/50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <div className="flex items-center gap-8">
              <Link href="/" className="text-xl font-semibold text-gray-900 tracking-tight">
                MusicPractice
              </Link>
              <span className="text-sm text-gray-600 font-medium">Teacher Dashboard</span>
            </div>
            <div className="flex items-center gap-6">
              <span className="text-sm text-gray-900 font-medium">{user?.name}</span>
              <button
                onClick={handleLogout}
                className="text-sm text-gray-600 hover:text-gray-900 font-medium transition-colors"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </nav>

      <div className="pt-20 pb-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
            <div className="bg-white/80 backdrop-blur-md rounded-2xl border border-gray-100/50 shadow-lg p-8 hover:shadow-xl transition-shadow">
              <div className="text-5xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent mb-2">
                {students.length}
              </div>
              <div className="text-gray-600 font-medium">Total Students</div>
            </div>
            <div className="bg-white/80 backdrop-blur-md rounded-2xl border border-gray-100/50 shadow-lg p-8 hover:shadow-xl transition-shadow">
              <div className="text-5xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent mb-2">
                {sessions.length}
              </div>
              <div className="text-gray-600 font-medium">Total Sessions</div>
            </div>
            <div className="bg-white/80 backdrop-blur-md rounded-2xl border border-gray-100/50 shadow-lg p-8 hover:shadow-xl transition-shadow">
              <div className="text-5xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent mb-2">
                {Math.floor(sessions.reduce((acc, s) => acc + s.duration, 0) / 60)}
              </div>
              <div className="text-gray-600 font-medium">Minutes Practiced</div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Students Section */}
            <div className="bg-white/80 backdrop-blur-md rounded-2xl border border-gray-100/50 shadow-xl overflow-hidden">
              <div className="p-8 border-b border-gray-100 flex justify-between items-center">
                <h2 className="text-2xl font-bold bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 bg-clip-text text-transparent">
                  Students
                </h2>
                <button
                  onClick={() => setShowInviteModal(true)}
                  className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-6 py-3 rounded-xl text-sm font-semibold hover:from-indigo-700 hover:to-purple-700 shadow-lg shadow-indigo-500/25 hover:shadow-xl hover:shadow-indigo-500/30 hover:scale-[1.02] transition-all"
                >
                  Invite Student
                </button>
              </div>
              <div className="p-8">
                {students.length === 0 ? (
                  <p className="text-gray-500 text-center py-12 font-medium">
                    No students yet. Invite your first student!
                  </p>
                ) : (
                  <div className="space-y-4">
                    {students.map((student) => (
                      <div key={student.id} className="bg-white/60 backdrop-blur-sm border border-gray-100 rounded-xl p-6 hover:shadow-lg transition-all">
                        <div className="flex justify-between items-start">
                          <div>
                            <h3 className="font-bold text-gray-900 text-lg mb-1">
                              {student.name}
                            </h3>
                            <p className="text-sm text-gray-600 mb-2">
                              {student.email}
                            </p>
                            {student.inviteToken && (
                              <span className="inline-block px-3 py-1 bg-yellow-100 text-yellow-800 text-xs font-semibold rounded-lg">
                                Pending Invitation
                              </span>
                            )}
                          </div>
                          <div className="text-right">
                            <div className="text-3xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                              {student._count.practiceSessions}
                            </div>
                            <div className="text-xs text-gray-600 font-medium">sessions</div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Recent Sessions */}
            <div className="bg-white/80 backdrop-blur-md rounded-2xl border border-gray-100/50 shadow-xl overflow-hidden">
              <div className="p-8 border-b border-gray-100">
                <h2 className="text-2xl font-bold bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 bg-clip-text text-transparent">
                  Recent Practice Sessions
                </h2>
              </div>
              <div className="p-8">
                {sessions.length === 0 ? (
                  <p className="text-gray-500 text-center py-12 font-medium">
                    No practice sessions yet
                  </p>
                ) : (
                  <div className="space-y-4">
                    {sessions.slice(0, 10).map((session) => (
                      <div key={session.id} className="bg-white/60 backdrop-blur-sm border border-gray-100 rounded-xl p-6 hover:shadow-lg transition-all">
                        <div className="flex justify-between items-start mb-4">
                          <div>
                            <h3 className="font-bold text-gray-900 text-lg mb-1">
                              {session.title}
                            </h3>
                            <p className="text-sm text-gray-600">
                              {session.student.name}
                            </p>
                          </div>
                          <span className="text-sm text-gray-600 font-medium">
                            {formatDuration(session.duration)}
                          </span>
                        </div>

                        <button
                          onClick={() => setSelectedSession(session)}
                          className="w-full mb-3 bg-gray-100 text-gray-900 py-2 px-4 rounded-xl text-sm font-semibold hover:bg-gray-200 transition-all"
                        >
                          Listen to Recording
                        </button>

                        <div className="flex justify-between items-center">
                          <span className="text-xs text-gray-500">
                            {new Date(session.createdAt).toLocaleDateString()}
                          </span>
                          {session.analysis ? (
                            <button
                              onClick={() => setSelectedSession(session)}
                              className="px-4 py-2 bg-green-100 text-green-800 text-sm font-semibold rounded-xl hover:bg-green-200 transition-all"
                            >
                              View Analysis
                            </button>
                          ) : (
                            <button
                              onClick={() => handleAnalyze(session.id)}
                              disabled={analyzing === session.id}
                              className="px-4 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white text-sm font-semibold rounded-xl hover:from-indigo-700 hover:to-purple-700 disabled:opacity-50 transition-all shadow-lg shadow-indigo-500/25"
                            >
                              {analyzing === session.id ? 'Analyzing...' : 'Analyze'}
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Session Detail Modal */}
      {selectedSession && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white/95 backdrop-blur-md rounded-2xl max-w-2xl w-full p-8 max-h-[90vh] overflow-y-auto border border-gray-100 shadow-2xl">
            <div className="flex justify-between items-start mb-6">
              <h2 className="text-3xl font-bold bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 bg-clip-text text-transparent">
                {selectedSession.title}
              </h2>
              <button
                onClick={() => setSelectedSession(null)}
                className="text-gray-500 hover:text-gray-900 text-3xl font-light transition-colors"
              >
                ×
              </button>
            </div>

            <div className="mb-6 space-y-2">
              <p className="text-gray-700">
                <span className="font-semibold">Student:</span> {selectedSession.student.name}
              </p>
              <p className="text-gray-700">
                <span className="font-semibold">Duration:</span> {formatDuration(selectedSession.duration)}
              </p>
            </div>

            {/* Audio Player */}
            <div className="mb-6">
              <AudioPlayer
                audioUrl={`/api/practice/sessions/${selectedSession.id}/audio`}
                title="Practice Recording"
              />
            </div>

            {/* Analysis if available */}
            {selectedSession.analysis && (
              <div className="mt-6 space-y-6 pt-6 border-t border-gray-200">
                <div>
                  <h3 className="text-xl font-bold bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 bg-clip-text text-transparent mb-4">
                    AI Analysis
                  </h3>
                  {selectedSession.analysis.overallScore && (
                    <div className="text-5xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent mb-4">
                      {selectedSession.analysis.overallScore}/10
                    </div>
                  )}
                  <p className="text-gray-700 leading-relaxed mb-6">
                    {selectedSession.analysis.overallFeedback}
                  </p>
                </div>

                {selectedSession.analysis.strengths && JSON.parse(selectedSession.analysis.strengths).length > 0 && (
                  <div>
                    <h4 className="text-lg font-semibold text-gray-900 mb-3">Strengths</h4>
                    <ul className="list-disc list-inside space-y-2">
                      {JSON.parse(selectedSession.analysis.strengths).map((strength: string, i: number) => (
                        <li key={i} className="text-green-700">{strength}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {selectedSession.analysis.areasForImprovement && JSON.parse(selectedSession.analysis.areasForImprovement).length > 0 && (
                  <div>
                    <h4 className="text-lg font-semibold text-gray-900 mb-3">Areas for Improvement</h4>
                    <ul className="list-disc list-inside space-y-2">
                      {JSON.parse(selectedSession.analysis.areasForImprovement).map((area: string, i: number) => (
                        <li key={i} className="text-orange-700">{area}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}

            <button
              onClick={() => setSelectedSession(null)}
              className="mt-8 w-full bg-gray-200 text-gray-900 px-6 py-3 rounded-xl font-semibold hover:bg-gray-300 transition-all"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* Invite Modal */}
      {showInviteModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white/95 backdrop-blur-md rounded-2xl max-w-md w-full p-8 border border-gray-100 shadow-2xl">
            <h2 className="text-3xl font-bold bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 bg-clip-text text-transparent mb-6">
              Invite Student
            </h2>

            {inviteUrl ? (
              <div>
                <p className="mb-4 text-gray-700 font-medium">
                  Student invited successfully! Share this link:
                </p>
                <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 mb-6 text-sm text-gray-900 break-all font-mono">
                  {inviteUrl}
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(inviteUrl)
                      alert('Link copied to clipboard!')
                    }}
                    className="flex-1 bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-3 px-4 rounded-xl font-semibold hover:from-indigo-700 hover:to-purple-700 transition-all shadow-lg shadow-indigo-500/25"
                  >
                    Copy Link
                  </button>
                  <button
                    onClick={() => {
                      setShowInviteModal(false)
                      setInviteUrl('')
                    }}
                    className="flex-1 bg-gray-200 text-gray-900 py-3 px-4 rounded-xl font-semibold hover:bg-gray-300 transition-all"
                  >
                    Close
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleInviteStudent}>
                <div className="mb-6">
                  <label className="block text-sm font-semibold text-gray-900 mb-2">
                    Student Name
                  </label>
                  <input
                    type="text"
                    required
                    value={inviteFormData.name}
                    onChange={(e) => setInviteFormData({ ...inviteFormData, name: e.target.value })}
                    className="w-full px-4 py-3 bg-white/80 backdrop-blur-sm border border-gray-200 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all text-gray-900 placeholder-gray-400"
                  />
                </div>
                <div className="mb-6">
                  <label className="block text-sm font-semibold text-gray-900 mb-2">
                    Student Email
                  </label>
                  <input
                    type="email"
                    required
                    value={inviteFormData.email}
                    onChange={(e) => setInviteFormData({ ...inviteFormData, email: e.target.value })}
                    className="w-full px-4 py-3 bg-white/80 backdrop-blur-sm border border-gray-200 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all text-gray-900 placeholder-gray-400"
                  />
                </div>
                <div className="flex gap-3">
                  <button
                    type="submit"
                    className="flex-1 bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-3 px-4 rounded-xl font-semibold hover:from-indigo-700 hover:to-purple-700 transition-all shadow-lg shadow-indigo-500/25"
                  >
                    Send Invite
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowInviteModal(false)}
                    className="flex-1 bg-gray-200 text-gray-900 py-3 px-4 rounded-xl font-semibold hover:bg-gray-300 transition-all"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
