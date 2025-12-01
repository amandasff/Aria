'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import AudioPlayer from '@/components/AudioPlayer'
import AudioRecorder from '@/components/AudioRecorder'

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
  description?: string
  duration: number
  createdAt: string
  status: string
  student: {
    id: string
    name: string
    email: string
  }
  analysis: any
  teacherFeedback?: string
  teacherFeedbackAudio?: string
  teacherFeedbackAt?: string
}

interface StudentStats {
  student: {
    id: string
    name: string
    email: string
    createdAt: string
  }
  stats: {
    totalSessions: number
    totalPracticeTime: number
    totalMinutes: number
    analyzedSessions: number
    averageSessionDuration: number
    sessionsThisWeek: number
    streak: number
  }
  sessions: Session[]
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
  const [selectedStudent, setSelectedStudent] = useState<StudentStats | null>(null)
  const [loadingStudentStats, setLoadingStudentStats] = useState(false)
  const [deletingStudent, setDeletingStudent] = useState<string | null>(null)
  const [analyzing, setAnalyzing] = useState<string | null>(null)
  const [showFeedbackModal, setShowFeedbackModal] = useState(false)
  const [feedbackText, setFeedbackText] = useState('')
  const [feedbackAudio, setFeedbackAudio] = useState<{blob: Blob, duration: number} | null>(null)
  const [recordingFeedback, setRecordingFeedback] = useState(false)
  const [savingFeedback, setSavingFeedback] = useState(false)

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

  const handleViewStudent = async (studentId: string) => {
    setLoadingStudentStats(true)
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`/api/students/${studentId}/stats`, {
        headers: { Authorization: `Bearer ${token}` },
      })

      const data = await response.json()

      if (response.ok) {
        setSelectedStudent(data.data)
      } else {
        alert(data.error || 'Failed to load student stats')
      }
    } catch (error) {
      alert('Error loading student stats')
    } finally {
      setLoadingStudentStats(false)
    }
  }

  const handleDeleteStudent = async (studentId: string, studentName: string) => {
    if (!confirm(`Are you sure you want to delete ${studentName}? This will permanently delete all their practice sessions and cannot be undone.`)) {
      return
    }

    setDeletingStudent(studentId)
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`/api/students?id=${studentId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      })

      const data = await response.json()

      if (response.ok) {
        fetchData()
        if (selectedStudent?.student.id === studentId) {
          setSelectedStudent(null)
        }
      } else {
        alert(data.error || 'Failed to delete student')
      }
    } catch (error) {
      alert('Error deleting student')
    } finally {
      setDeletingStudent(null)
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
      // Refresh student stats if viewing a student
      if (selectedStudent) {
        handleViewStudent(selectedStudent.student.id)
      }
    } catch (error) {
      alert('Error analyzing session')
    } finally {
      setAnalyzing(null)
    }
  }

  const handleFeedbackRecordingComplete = (blob: Blob, duration: number) => {
    setFeedbackAudio({ blob, duration })
    setRecordingFeedback(false)
  }

  const handleSaveFeedback = async () => {
    if (!selectedSession) return
    if (!feedbackText.trim() && !feedbackAudio) {
      alert('Please provide text feedback or record audio feedback')
      return
    }

    setSavingFeedback(true)
    try {
      const token = localStorage.getItem('token')
      let audioData = null

      if (feedbackAudio) {
        // Convert blob to base64
        audioData = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader()
          reader.onloadend = () => {
            if (reader.result && typeof reader.result === 'string') {
              resolve(reader.result)
            } else {
              reject(new Error('Failed to convert audio to base64'))
            }
          }
          reader.onerror = () => {
            reject(new Error('Error reading audio file'))
          }
          reader.readAsDataURL(feedbackAudio.blob)
        })
      }

      const response = await fetch(`/api/practice/sessions/${selectedSession.id}/feedback`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          feedback: feedbackText.trim() || null,
          audioData: audioData,
          fileName: feedbackAudio ? 'teacher-feedback.webm' : null,
        }),
      })

      const data = await response.json()

      if (response.ok) {
        alert('Feedback saved successfully!')
        setShowFeedbackModal(false)
        setFeedbackText('')
        setFeedbackAudio(null)
        
        // Update the selected session with the new feedback data
        if (data.data) {
          setSelectedSession({
            ...selectedSession,
            teacherFeedback: data.data.teacherFeedback || null,
            teacherFeedbackAudio: data.data.teacherFeedbackAudio || null,
            teacherFeedbackAt: data.data.teacherFeedbackAt || null,
          })
        }
        
        // Refresh all data
        await fetchData()
        
        // Refresh student stats if viewing a student
        if (selectedStudent) {
          await handleViewStudent(selectedStudent.student.id)
        }
      } else {
        alert(data.error || 'Failed to save feedback')
      }
    } catch (error) {
      console.error('Error saving feedback:', error)
      alert(`Error saving feedback: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setSavingFeedback(false)
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
                          <div className="flex-1">
                            <button
                              onClick={() => handleViewStudent(student.id)}
                              className="text-left w-full"
                            >
                              <h3 className="font-bold text-gray-900 text-lg mb-1 hover:text-indigo-600 transition-colors">
                                {student.name}
                              </h3>
                              <p className="text-sm text-gray-600 mb-2">
                                {student.email}
                              </p>
                            </button>
                            {student.inviteToken && (
                              <span className="inline-block px-3 py-1 bg-yellow-100 text-yellow-800 text-xs font-semibold rounded-lg">
                                Pending Invitation
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-3">
                            <div className="text-right">
                              <div className="text-3xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                                {student._count.practiceSessions}
                              </div>
                              <div className="text-xs text-gray-600 font-medium">sessions</div>
                            </div>
                            <button
                              onClick={() => handleDeleteStudent(student.id, student.name)}
                              disabled={deletingStudent === student.id}
                              className="text-red-600 hover:text-red-700 p-2 hover:bg-red-50 rounded-lg transition-all disabled:opacity-50"
                              title="Delete student"
                            >
                              {deletingStudent === student.id ? (
                                <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                              ) : (
                                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                              )}
                            </button>
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
                          <div className="flex-1">
                            <h3 className="font-bold text-gray-900 text-lg mb-1">
                              {session.title}
                            </h3>
                            <p className="text-sm text-gray-600">
                              {session.student.name}
                            </p>
                            {session.description && (
                              <p className="text-xs text-gray-500 mt-2 italic line-clamp-2">{session.description}</p>
                            )}
                          </div>
                          <span className="text-sm text-gray-600 font-medium ml-2">
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

      {/* Student Detail Modal */}
      {selectedStudent && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white/95 backdrop-blur-md rounded-2xl max-w-4xl w-full p-8 my-8 border border-gray-100 shadow-2xl">
            <div className="flex justify-between items-start mb-6">
              <div>
                <h2 className="text-3xl font-bold bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 bg-clip-text text-transparent mb-2">
                  {selectedStudent.student.name}
                </h2>
                <p className="text-gray-600">{selectedStudent.student.email}</p>
                <p className="text-sm text-gray-500 mt-1">
                  Joined {new Date(selectedStudent.student.createdAt).toLocaleDateString()}
                </p>
              </div>
              <button
                onClick={() => setSelectedStudent(null)}
                className="text-gray-500 hover:text-gray-900 text-3xl font-light transition-colors"
              >
                ×
              </button>
            </div>

            {/* Student Stats */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
              <div className="bg-white/60 backdrop-blur-sm border border-gray-100 rounded-xl p-4">
                <div className="text-2xl font-bold bg-gradient-to-r from-orange-500 to-red-500 bg-clip-text text-transparent">
                  {selectedStudent.stats.streak || 0}
                </div>
                <div className="text-xs text-gray-600 font-medium">Day Streak 🔥</div>
              </div>
              <div className="bg-white/60 backdrop-blur-sm border border-gray-100 rounded-xl p-4">
                <div className="text-2xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                  {selectedStudent.stats.totalSessions}
                </div>
                <div className="text-xs text-gray-600 font-medium">Total Sessions</div>
              </div>
              <div className="bg-white/60 backdrop-blur-sm border border-gray-100 rounded-xl p-4">
                <div className="text-2xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                  {selectedStudent.stats.totalMinutes}
                </div>
                <div className="text-xs text-gray-600 font-medium">Total Minutes</div>
              </div>
              <div className="bg-white/60 backdrop-blur-sm border border-gray-100 rounded-xl p-4">
                <div className="text-2xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                  {selectedStudent.stats.analyzedSessions}
                </div>
                <div className="text-xs text-gray-600 font-medium">Analyzed</div>
              </div>
              <div className="bg-white/60 backdrop-blur-sm border border-gray-100 rounded-xl p-4">
                <div className="text-2xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                  {selectedStudent.stats.sessionsThisWeek}
                </div>
                <div className="text-xs text-gray-600 font-medium">This Week</div>
              </div>
            </div>

            {/* Practice Sessions */}
            <div className="border-t border-gray-200 pt-6">
              <h3 className="text-xl font-bold text-gray-900 mb-4">Practice Sessions</h3>
              {selectedStudent.sessions.length === 0 ? (
                <p className="text-gray-500 text-center py-8">No practice sessions yet</p>
              ) : (
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {selectedStudent.sessions.map((session) => (
                    <div key={session.id} className="bg-white/60 backdrop-blur-sm border border-gray-100 rounded-xl p-4 hover:shadow-lg transition-all">
                      <div className="flex justify-between items-start mb-3">
                        <div className="flex-1">
                          <h4 className="font-bold text-gray-900">{session.title}</h4>
                          <p className="text-sm text-gray-600">
                            {new Date(session.createdAt).toLocaleDateString()} • {formatDuration(session.duration)}
                          </p>
                          {session.description && (
                            <p className="text-xs text-gray-500 mt-2 italic line-clamp-2">{session.description}</p>
                          )}
                        </div>
                        {session.analysis ? (
                          <span className="px-3 py-1 bg-green-100 text-green-800 text-xs font-semibold rounded-lg ml-2">
                            Analyzed
                          </span>
                        ) : (
                          <button
                            onClick={() => handleAnalyze(session.id)}
                            disabled={analyzing === session.id}
                            className="px-3 py-1 bg-gradient-to-r from-indigo-600 to-purple-600 text-white text-xs font-semibold rounded-lg hover:from-indigo-700 hover:to-purple-700 disabled:opacity-50 transition-all ml-2"
                          >
                            {analyzing === session.id ? 'Analyzing...' : 'Analyze'}
                          </button>
                        )}
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => {
                            setSelectedSession(session)
                            setSelectedStudent(null)
                          }}
                          className="flex-1 bg-gray-100 text-gray-900 py-2 px-4 rounded-lg text-sm font-semibold hover:bg-gray-200 transition-all"
                        >
                          Listen to Recording
                        </button>
                        <button
                          onClick={() => {
                            setSelectedSession(session)
                            setFeedbackText(session.teacherFeedback || '')
                            setFeedbackAudio(null)
                            setShowFeedbackModal(true)
                          }}
                          className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                            session.teacherFeedback || session.teacherFeedbackAudio
                              ? 'bg-indigo-100 text-indigo-800 hover:bg-indigo-200'
                              : 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white hover:from-indigo-700 hover:to-purple-700 shadow-lg shadow-indigo-500/25'
                          }`}
                        >
                          {session.teacherFeedback || session.teacherFeedbackAudio ? '💬 Edit Feedback' : '💬 Give Feedback'}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <button
              onClick={() => setSelectedStudent(null)}
              className="mt-6 w-full bg-gray-200 text-gray-900 px-6 py-3 rounded-xl font-semibold hover:bg-gray-300 transition-all"
            >
              Close
            </button>
          </div>
        </div>
      )}

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
              {selectedSession.description && (
                <div className="mt-4 p-4 bg-blue-50 rounded-xl border border-blue-200">
                  <p className="text-sm font-semibold text-blue-900 mb-2">Student Notes:</p>
                  <p className="text-gray-700 whitespace-pre-wrap">{selectedSession.description}</p>
                </div>
              )}
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

            {/* Teacher Feedback Section */}
            <div className="mt-6 space-y-4 pt-6 border-t border-gray-200">
              <div className="flex justify-between items-center">
                <h3 className="text-xl font-bold bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 bg-clip-text text-transparent">
                  Your Feedback
                </h3>
                <button
                  onClick={() => {
                    setFeedbackText(selectedSession.teacherFeedback || '')
                    setFeedbackAudio(null)
                    setShowFeedbackModal(true)
                  }}
                  className="px-4 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white text-sm font-semibold rounded-xl hover:from-indigo-700 hover:to-purple-700 transition-all shadow-lg shadow-indigo-500/25"
                >
                  {selectedSession.teacherFeedback || selectedSession.teacherFeedbackAudio ? 'Edit Feedback' : 'Add Feedback'}
                </button>
              </div>

              {selectedSession.teacherFeedback && (
                <div className="p-4 bg-green-50 rounded-xl border border-green-200">
                  <p className="text-sm font-semibold text-green-900 mb-2">Your Text Feedback:</p>
                  <p className="text-gray-700 whitespace-pre-wrap">{selectedSession.teacherFeedback}</p>
                  {selectedSession.teacherFeedbackAt && (
                    <p className="text-xs text-gray-500 mt-2">
                      {new Date(selectedSession.teacherFeedbackAt).toLocaleString()}
                    </p>
                  )}
                </div>
              )}

              {selectedSession.teacherFeedbackAudio && (
                <div className="p-4 bg-green-50 rounded-xl border border-green-200">
                  <p className="text-sm font-semibold text-green-900 mb-2">Your Audio Feedback:</p>
                  <AudioPlayer
                    audioUrl={selectedSession.teacherFeedbackAudio}
                    title="Teacher Feedback"
                  />
                </div>
              )}

              {!selectedSession.teacherFeedback && !selectedSession.teacherFeedbackAudio && (
                <p className="text-gray-500 text-sm italic">No feedback provided yet</p>
              )}
            </div>

            <button
              onClick={() => setSelectedSession(null)}
              className="mt-8 w-full bg-gray-200 text-gray-900 px-6 py-3 rounded-xl font-semibold hover:bg-gray-300 transition-all"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* Feedback Modal */}
      {showFeedbackModal && selectedSession && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white/95 backdrop-blur-md rounded-2xl max-w-2xl w-full p-8 border border-gray-100 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-start mb-6">
              <h2 className="text-3xl font-bold bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 bg-clip-text text-transparent">
                Provide Feedback
              </h2>
              <button
                onClick={() => {
                  setShowFeedbackModal(false)
                  setFeedbackText('')
                  setFeedbackAudio(null)
                }}
                className="text-gray-500 hover:text-gray-900 text-3xl font-light transition-colors"
              >
                ×
              </button>
            </div>

            <div className="space-y-6">
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">
                  Text Feedback
                </label>
                <textarea
                  value={feedbackText}
                  onChange={(e) => setFeedbackText(e.target.value)}
                  className="w-full px-4 py-3 bg-white/80 backdrop-blur-sm border border-gray-200 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all text-gray-900 placeholder-gray-400"
                  rows={6}
                  placeholder="Write your feedback for the student..."
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">
                  Audio Feedback (Optional)
                </label>
                {!recordingFeedback && !feedbackAudio && (
                  <button
                    onClick={() => setRecordingFeedback(true)}
                    className="w-full px-4 py-3 bg-gray-100 text-gray-900 rounded-xl font-semibold hover:bg-gray-200 transition-all"
                  >
                    🎤 Record Audio Feedback
                  </button>
                )}
                {recordingFeedback && (
                  <div className="p-4 bg-white/80 backdrop-blur-sm border border-gray-200 rounded-xl">
                    <AudioRecorder onRecordingComplete={handleFeedbackRecordingComplete} />
                    <button
                      onClick={() => setRecordingFeedback(false)}
                      className="mt-4 w-full px-4 py-2 bg-gray-200 text-gray-900 rounded-xl font-semibold hover:bg-gray-300 transition-all"
                    >
                      Cancel Recording
                    </button>
                  </div>
                )}
                {feedbackAudio && (
                  <div className="p-4 bg-green-50 rounded-xl border border-green-200">
                    <p className="text-sm font-semibold text-green-900 mb-2">
                      Audio recorded ({formatDuration(feedbackAudio.duration)})
                    </p>
                    <button
                      onClick={() => setFeedbackAudio(null)}
                      className="px-4 py-2 bg-red-600 text-white rounded-xl font-semibold hover:bg-red-700 transition-all text-sm"
                    >
                      Re-record
                    </button>
                  </div>
                )}
              </div>

              <div className="flex gap-3">
                <button
                  onClick={handleSaveFeedback}
                  disabled={savingFeedback || (!feedbackText.trim() && !feedbackAudio)}
                  className="flex-1 bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-3 px-4 rounded-xl font-semibold hover:from-indigo-700 hover:to-purple-700 disabled:opacity-50 transition-all shadow-lg shadow-indigo-500/25"
                >
                  {savingFeedback ? 'Saving...' : 'Save Feedback'}
                </button>
                <button
                  onClick={() => {
                    setShowFeedbackModal(false)
                    setFeedbackText('')
                    setFeedbackAudio(null)
                  }}
                  className="flex-1 bg-gray-200 text-gray-900 py-3 px-4 rounded-xl font-semibold hover:bg-gray-300 transition-all"
                >
                  Cancel
                </button>
              </div>
            </div>
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
