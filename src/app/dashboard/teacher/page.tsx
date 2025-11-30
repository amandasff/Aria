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
      <div className="min-h-screen flex items-center justify-center" style={{background: 'linear-gradient(135deg, #FAF9F6 0%, #F5E6D3 100%)'}}>
        <div className="text-2xl" style={{fontFamily: 'Playfair Display, serif', color: '#1C1917'}}>Loading...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen" style={{background: 'linear-gradient(135deg, #FAF9F6 0%, #F5E6D3 100%)'}}>
      {/* Luxury Navigation */}
      <nav style={{background: '#FEFDFB', borderBottom: '2px solid #D4AF37', boxShadow: '0 4px 20px rgba(28, 25, 23, 0.08)'}}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-20 items-center">
            <div className="flex items-center gap-12">
              <span style={{fontSize: '2rem', fontFamily: 'Playfair Display, serif', fontWeight: '700', background: 'linear-gradient(135deg, #D4AF37 0%, #B8941E 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent'}}>
                MusicPractice
              </span>
              <span style={{fontFamily: 'Cormorant Garamond, serif', color: '#78716C', fontSize: '1.1rem', letterSpacing: '0.5px'}}>
                Teacher's Studio
              </span>
            </div>
            <div className="flex items-center gap-6">
              <span style={{fontFamily: 'Cormorant Garamond, serif', color: '#1C1917', fontSize: '1.1rem'}}>{user?.name}</span>
              <button
                onClick={handleLogout}
                style={{color: '#78716C', fontFamily: 'Playfair Display, serif', padding: '0.5rem 1rem', transition: 'color 0.3s'}}
                className="hover:text-gray-900"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Luxury Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
          <div className="luxury-card p-8 rounded-lg" style={{background: '#FEFDFB', border: '1px solid #E7E5E4'}}>
            <div style={{fontSize: '3.5rem', fontFamily: 'Playfair Display, serif', fontWeight: '700', background: 'linear-gradient(135deg, #D4AF37 0%, #B8941E 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent'}}>
              {students.length}
            </div>
            <div style={{fontFamily: 'Cormorant Garamond, serif', color: '#78716C', fontSize: '1.1rem', marginTop: '0.5rem'}}>Total Students</div>
          </div>
          <div className="luxury-card p-8 rounded-lg" style={{background: '#FEFDFB', border: '1px solid #E7E5E4'}}>
            <div style={{fontSize: '3.5rem', fontFamily: 'Playfair Display, serif', fontWeight: '700', background: 'linear-gradient(135deg, #D4AF37 0%, #B8941E 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent'}}>
              {sessions.length}
            </div>
            <div style={{fontFamily: 'Cormorant Garamond, serif', color: '#78716C', fontSize: '1.1rem', marginTop: '0.5rem'}}>Total Sessions</div>
          </div>
          <div className="luxury-card p-8 rounded-lg" style={{background: '#FEFDFB', border: '1px solid #E7E5E4'}}>
            <div style={{fontSize: '3.5rem', fontFamily: 'Playfair Display, serif', fontWeight: '700', background: 'linear-gradient(135deg, #D4AF37 0%, #B8941E 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent'}}>
              {Math.floor(sessions.reduce((acc, s) => acc + s.duration, 0) / 60)}
            </div>
            <div style={{fontFamily: 'Cormorant Garamond, serif', color: '#78716C', fontSize: '1.1rem', marginTop: '0.5rem'}}>Minutes Practiced</div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
          {/* Students Section */}
          <div className="luxury-card rounded-lg" style={{background: '#FEFDFB', border: '1px solid #E7E5E4'}}>
            <div className="p-8 flex justify-between items-center" style={{borderBottom: '1px solid #E7E5E4'}}>
              <h2 style={{fontSize: '1.75rem', fontFamily: 'Playfair Display, serif', fontWeight: '600', color: '#1C1917'}}>Students</h2>
              <button
                onClick={() => setShowInviteModal(true)}
                className="luxury-button px-6 py-3 rounded-lg text-sm"
              >
                Invite Student
              </button>
            </div>
            <div className="p-8">
              {students.length === 0 ? (
                <p style={{fontFamily: 'Cormorant Garamond, serif', color: '#78716C', textAlign: 'center', padding: '2rem'}}>
                  No students yet. Invite your first student!
                </p>
              ) : (
                <div className="space-y-6">
                  {students.map((student) => (
                    <div key={student.id} className="luxury-card p-6 rounded-lg" style={{background: '#FAF9F6', border: '1px solid #E7E5E4'}}>
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 style={{fontFamily: 'Playfair Display, serif', fontSize: '1.25rem', fontWeight: '600', color: '#1C1917'}}>
                            {student.name}
                          </h3>
                          <p style={{fontFamily: 'Cormorant Garamond, serif', fontSize: '1rem', color: '#78716C', marginTop: '0.25rem'}}>
                            {student.email}
                          </p>
                          {student.inviteToken && (
                            <span style={{display: 'inline-block', marginTop: '0.5rem', padding: '0.25rem 0.75rem', background: '#F5E6D3', color: '#B8941E', fontSize: '0.875rem', borderRadius: '0.25rem', fontFamily: 'Cormorant Garamond, serif'}}>
                              Pending Invitation
                            </span>
                          )}
                        </div>
                        <div style={{textAlign: 'right'}}>
                          <div style={{fontSize: '2.5rem', fontFamily: 'Playfair Display, serif', fontWeight: '700', background: 'linear-gradient(135deg, #D4AF37 0%, #B8941E 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent'}}>
                            {student._count.practiceSessions}
                          </div>
                          <div style={{fontSize: '0.875rem', fontFamily: 'Cormorant Garamond, serif', color: '#78716C'}}>sessions</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Recent Sessions with Audio Playback */}
          <div className="luxury-card rounded-lg" style={{background: '#FEFDFB', border: '1px solid #E7E5E4'}}>
            <div className="p-8" style={{borderBottom: '1px solid #E7E5E4'}}>
              <h2 style={{fontSize: '1.75rem', fontFamily: 'Playfair Display, serif', fontWeight: '600', color: '#1C1917'}}>
                Recent Practice Sessions
              </h2>
            </div>
            <div className="p-8">
              {sessions.length === 0 ? (
                <p style={{fontFamily: 'Cormorant Garamond, serif', color: '#78716C', textAlign: 'center', padding: '2rem'}}>
                  No practice sessions yet
                </p>
              ) : (
                <div className="space-y-6">
                  {sessions.slice(0, 10).map((session) => (
                    <div key={session.id} className="luxury-card p-6 rounded-lg" style={{background: '#FAF9F6', border: '1px solid #E7E5E4'}}>
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <h3 style={{fontFamily: 'Playfair Display, serif', fontSize: '1.1rem', fontWeight: '600', color: '#1C1917'}}>
                            {session.title}
                          </h3>
                          <p style={{fontFamily: 'Cormorant Garamond, serif', fontSize: '0.95rem', color: '#78716C', marginTop: '0.25rem'}}>
                            {session.student.name}
                          </p>
                        </div>
                        <span style={{fontFamily: 'Cormorant Garamond, serif', fontSize: '0.9rem', color: '#78716C'}}>
                          {formatDuration(session.duration)}
                        </span>
                      </div>

                      <button
                        onClick={() => setSelectedSession(session)}
                        className="luxury-button-secondary w-full py-2 px-4 rounded-lg text-sm mb-3"
                      >
                        Listen to Recording
                      </button>

                      <div className="flex justify-between items-center">
                        <span style={{fontSize: '0.875rem', fontFamily: 'Cormorant Garamond, serif', color: '#78716C'}}>
                          {new Date(session.createdAt).toLocaleDateString()}
                        </span>
                        {session.analysis ? (
                          <button
                            onClick={() => setSelectedSession(session)}
                            style={{padding: '0.375rem 0.75rem', background: 'linear-gradient(135deg, #D4AF37 0%, #B8941E 100%)', color: '#1C1917', fontSize: '0.875rem', borderRadius: '0.375rem', fontFamily: 'Playfair Display, serif'}}
                          >
                            View Analysis
                          </button>
                        ) : (
                          <button
                            onClick={() => handleAnalyze(session.id)}
                            disabled={analyzing === session.id}
                            className="luxury-button-secondary py-1 px-3 rounded text-xs"
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

      {/* Session Detail Modal with Audio Player */}
      {selectedSession && (
        <div className="fixed inset-0 flex items-center justify-center p-4 z-50" style={{background: 'rgba(28, 25, 23, 0.7)', backdropFilter: 'blur(4px)'}}>
          <div className="luxury-card rounded-lg max-w-2xl w-full p-8" style={{background: '#FEFDFB', border: '2px solid #D4AF37', maxHeight: '90vh', overflowY: 'auto'}}>
            <div className="flex justify-between items-start mb-6">
              <h2 style={{fontSize: '2rem', fontFamily: 'Playfair Display, serif', fontWeight: '600', color: '#1C1917'}}>
                {selectedSession.title}
              </h2>
              <button
                onClick={() => setSelectedSession(null)}
                style={{fontSize: '2rem', color: '#78716C', fontWeight: '300'}}
                className="hover:text-gray-900"
              >
                ×
              </button>
            </div>

            <div className="mb-6">
              <p style={{fontFamily: 'Cormorant Garamond, serif', fontSize: '1.1rem', color: '#78716C', marginBottom: '0.5rem'}}>
                Student: <span style={{color: '#1C1917', fontWeight: '600'}}>{selectedSession.student.name}</span>
              </p>
              <p style={{fontFamily: 'Cormorant Garamond, serif', fontSize: '1.1rem', color: '#78716C'}}>
                Duration: <span style={{color: '#1C1917', fontWeight: '600'}}>{formatDuration(selectedSession.duration)}</span>
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
              <div className="mt-6 space-y-6">
                <div style={{height: '1px', background: 'linear-gradient(90deg, transparent 0%, #D4AF37 50%, transparent 100%)'}}></div>

                <div>
                  <h3 style={{fontSize: '1.5rem', fontFamily: 'Playfair Display, serif', fontWeight: '600', color: '#1C1917', marginBottom: '1rem'}}>
                    AI Analysis
                  </h3>
                  {selectedSession.analysis.overallScore && (
                    <div style={{fontSize: '3rem', fontFamily: 'Playfair Display, serif', fontWeight: '700', background: 'linear-gradient(135deg, #D4AF37 0%, #B8941E 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', marginBottom: '1rem'}}>
                      {selectedSession.analysis.overallScore}/10
                    </div>
                  )}
                  <p style={{fontFamily: 'Cormorant Garamond, serif', fontSize: '1.1rem', color: '#1C1917', lineHeight: '1.8'}}>
                    {selectedSession.analysis.overallFeedback}
                  </p>
                </div>

                {selectedSession.analysis.strengths && JSON.parse(selectedSession.analysis.strengths).length > 0 && (
                  <div>
                    <h4 style={{fontSize: '1.25rem', fontFamily: 'Playfair Display, serif', fontWeight: '600', color: '#1C1917', marginBottom: '0.75rem'}}>
                      Strengths
                    </h4>
                    <ul style={{listStyleType: 'disc', paddingLeft: '1.5rem', fontFamily: 'Cormorant Garamond, serif', fontSize: '1.05rem', lineHeight: '1.8', color: '#1C1917'}}>
                      {JSON.parse(selectedSession.analysis.strengths).map((strength: string, i: number) => (
                        <li key={i} style={{marginBottom: '0.5rem'}}>{strength}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {selectedSession.analysis.areasForImprovement && JSON.parse(selectedSession.analysis.areasForImprovement).length > 0 && (
                  <div>
                    <h4 style={{fontSize: '1.25rem', fontFamily: 'Playfair Display, serif', fontWeight: '600', color: '#1C1917', marginBottom: '0.75rem'}}>
                      Areas for Improvement
                    </h4>
                    <ul style={{listStyleType: 'disc', paddingLeft: '1.5rem', fontFamily: 'Cormorant Garamond, serif', fontSize: '1.05rem', lineHeight: '1.8', color: '#78716C'}}>
                      {JSON.parse(selectedSession.analysis.areasForImprovement).map((area: string, i: number) => (
                        <li key={i} style={{marginBottom: '0.5rem'}}>{area}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}

            <button
              onClick={() => setSelectedSession(null)}
              className="luxury-button-secondary w-full py-3 px-4 rounded-lg mt-6"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* Luxury Invite Modal */}
      {showInviteModal && (
        <div className="fixed inset-0 flex items-center justify-center p-4 z-50" style={{background: 'rgba(28, 25, 23, 0.7)', backdropFilter: 'blur(4px)'}}>
          <div className="luxury-card rounded-lg max-w-md w-full p-8" style={{background: '#FEFDFB', border: '2px solid #D4AF37'}}>
            <h2 style={{fontSize: '2rem', fontFamily: 'Playfair Display, serif', fontWeight: '600', color: '#1C1917', marginBottom: '1.5rem'}}>
              Invite Student
            </h2>

            {inviteUrl ? (
              <div>
                <p style={{marginBottom: '1.5rem', fontFamily: 'Cormorant Garamond, serif', fontSize: '1.1rem', color: '#78716C'}}>
                  Student invited successfully! Share this link:
                </p>
                <div style={{background: '#FAF9F6', padding: '1rem', borderRadius: '0.5rem', marginBottom: '1.5rem', fontFamily: 'Cormorant Garamond, serif', fontSize: '0.95rem', wordBreak: 'break-all', border: '1px solid #E7E5E4'}}>
                  {inviteUrl}
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(inviteUrl)
                      alert('Link copied to clipboard!')
                    }}
                    className="luxury-button flex-1 py-3 px-4 rounded-lg"
                  >
                    Copy Link
                  </button>
                  <button
                    onClick={() => {
                      setShowInviteModal(false)
                      setInviteUrl('')
                    }}
                    className="luxury-button-secondary flex-1 py-3 px-4 rounded-lg"
                  >
                    Close
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleInviteStudent}>
                <div className="mb-6">
                  <label style={{display: 'block', fontSize: '1rem', fontFamily: 'Playfair Display, serif', fontWeight: '500', color: '#1C1917', marginBottom: '0.5rem'}}>
                    Student Name
                  </label>
                  <input
                    type="text"
                    required
                    value={inviteFormData.name}
                    onChange={(e) => setInviteFormData({ ...inviteFormData, name: e.target.value })}
                    className="w-full px-4 py-3 rounded-lg"
                  />
                </div>
                <div className="mb-6">
                  <label style={{display: 'block', fontSize: '1rem', fontFamily: 'Playfair Display, serif', fontWeight: '500', color: '#1C1917', marginBottom: '0.5rem'}}>
                    Student Email
                  </label>
                  <input
                    type="email"
                    required
                    value={inviteFormData.email}
                    onChange={(e) => setInviteFormData({ ...inviteFormData, email: e.target.value })}
                    className="w-full px-4 py-3 rounded-lg"
                  />
                </div>
                <div className="flex gap-3">
                  <button
                    type="submit"
                    className="luxury-button flex-1 py-3 px-4 rounded-lg"
                  >
                    Send Invite
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowInviteModal(false)}
                    className="luxury-button-secondary flex-1 py-3 px-4 rounded-lg"
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
