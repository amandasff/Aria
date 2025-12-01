'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import AudioRecorder from '@/components/AudioRecorder'
import AudioPlayer from '@/components/AudioPlayer'

interface Session {
  id: string
  title: string
  duration: number
  createdAt: string
  status: string
  analysis: any
}

export default function StudentDashboard() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [sessions, setSessions] = useState<Session[]>([])
  const [loading, setLoading] = useState(true)
  const [showRecorder, setShowRecorder] = useState(false)
  const [sessionTitle, setSessionTitle] = useState('')
  const [sessionDescription, setSessionDescription] = useState('')
  const [recordedAudio, setRecordedAudio] = useState<{blob: Blob, duration: number} | null>(null)
  const [uploading, setUploading] = useState(false)
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

      // Fetch user data
      const userRes = await fetch('/api/auth/me', {
        headers: { Authorization: `Bearer ${token}` },
      })
      const userData = await userRes.json()

      if (!userRes.ok || userData.data.role !== 'STUDENT') {
        router.push('/login')
        return
      }

      setUser(userData.data)

      // Fetch sessions
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

  const handleRecordingComplete = (blob: Blob, duration: number) => {
    setRecordedAudio({ blob, duration })
  }

  const handleSaveSession = async () => {
    if (!recordedAudio || !sessionTitle) {
      alert('Please provide a title and record audio')
      return
    }

    setUploading(true)

    try {
      const token = localStorage.getItem('token')

      // Convert blob to base64
      const reader = new FileReader()
      reader.readAsDataURL(recordedAudio.blob)
      reader.onloadend = async () => {
        const base64Audio = reader.result as string

        const response = await fetch('/api/practice/sessions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            title: sessionTitle,
            description: sessionDescription,
            duration: recordedAudio.duration,
            audioData: base64Audio,
            fileName: 'recording.webm',
          }),
        })

        const data = await response.json()

        if (response.ok) {
          alert('Practice session saved successfully!')
          setShowRecorder(false)
          setSessionTitle('')
          setSessionDescription('')
          setRecordedAudio(null)
          fetchData()
        } else {
          alert(data.error || 'Failed to save session')
        }

        setUploading(false)
      }
    } catch (error) {
      alert('Error saving session')
      setUploading(false)
    }
  }

  const handleAnalyzeSession = async (sessionId: string) => {
    setAnalyzing(sessionId)

    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`/api/analysis/${sessionId}`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      })

      if (response.ok) {
        alert('Analysis complete!')
        fetchData()
      } else {
        alert('Failed to analyze session')
      }
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
              <span className="text-sm text-gray-600 font-medium">Student Dashboard</span>
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
                {sessions.length}
              </div>
              <div className="text-gray-600 font-medium">Total Sessions</div>
            </div>
            <div className="bg-white/80 backdrop-blur-md rounded-2xl border border-gray-100/50 shadow-lg p-8 hover:shadow-xl transition-shadow">
              <div className="text-5xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent mb-2">
                {Math.floor(sessions.reduce((acc, s) => acc + s.duration, 0) / 60)}
              </div>
              <div className="text-gray-600 font-medium">Total Minutes</div>
            </div>
            <div className="bg-white/80 backdrop-blur-md rounded-2xl border border-gray-100/50 shadow-lg p-8 hover:shadow-xl transition-shadow">
              <div className="text-5xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent mb-2">
                {sessions.filter(s => s.analysis).length}
              </div>
              <div className="text-gray-600 font-medium">Analyzed Sessions</div>
            </div>
          </div>

          {/* Record Practice Button */}
          {!showRecorder && (
            <div className="mb-12 text-center">
              <button
                onClick={() => setShowRecorder(true)}
                className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-10 py-5 rounded-2xl text-lg font-semibold hover:from-indigo-700 hover:to-purple-700 shadow-lg shadow-indigo-500/25 hover:shadow-xl hover:shadow-indigo-500/30 hover:scale-[1.02] transition-all"
              >
                🎵 Start New Practice Session
              </button>
            </div>
          )}

          {/* Recording Interface */}
          {showRecorder && (
            <div className="mb-12 bg-white/80 backdrop-blur-md rounded-2xl border border-gray-100/50 shadow-xl p-8">
              <h2 className="text-3xl font-bold bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 bg-clip-text text-transparent mb-8">
                Record Practice Session
              </h2>

              <div className="space-y-6 mb-8">
                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-2">
                    Session Title *
                  </label>
                  <input
                    type="text"
                    required
                    value={sessionTitle}
                    onChange={(e) => setSessionTitle(e.target.value)}
                    className="w-full px-4 py-3 bg-white/80 backdrop-blur-sm border border-gray-200 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all text-gray-900 placeholder-gray-400"
                    placeholder="e.g., Bach Prelude Practice"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-2">
                    Description (optional)
                  </label>
                  <textarea
                    value={sessionDescription}
                    onChange={(e) => setSessionDescription(e.target.value)}
                    className="w-full px-4 py-3 bg-white/80 backdrop-blur-sm border border-gray-200 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all text-gray-900 placeholder-gray-400"
                    rows={3}
                    placeholder="Notes about this practice session..."
                  />
                </div>
              </div>

              <AudioRecorder onRecordingComplete={handleRecordingComplete} />

              {recordedAudio && (
                <div className="mt-8 bg-green-50/80 backdrop-blur-sm border border-green-200 rounded-xl p-6">
                  <p className="text-green-800 font-semibold mb-4">
                    Recording complete! Duration: {formatDuration(recordedAudio.duration)}
                  </p>
                  <div className="flex gap-3">
                    <button
                      onClick={handleSaveSession}
                      disabled={uploading}
                      className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-6 py-3 rounded-xl font-semibold hover:from-indigo-700 hover:to-purple-700 disabled:opacity-50 transition-all shadow-lg shadow-indigo-500/25"
                    >
                      {uploading ? 'Saving...' : 'Save Session'}
                    </button>
                    <button
                      onClick={() => setRecordedAudio(null)}
                      className="bg-gray-200 text-gray-900 px-6 py-3 rounded-xl font-semibold hover:bg-gray-300 transition-all"
                    >
                      Re-record
                    </button>
                    <button
                      onClick={() => {
                        setShowRecorder(false)
                        setRecordedAudio(null)
                        setSessionTitle('')
                        setSessionDescription('')
                      }}
                      className="bg-red-600 text-white px-6 py-3 rounded-xl font-semibold hover:bg-red-700 transition-all"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Practice History */}
          <div className="bg-white/80 backdrop-blur-md rounded-2xl border border-gray-100/50 shadow-xl overflow-hidden">
            <div className="p-8 border-b border-gray-100">
              <h2 className="text-2xl font-bold bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 bg-clip-text text-transparent">
                Practice History
              </h2>
            </div>
            <div className="p-8">
              {sessions.length === 0 ? (
                <p className="text-gray-500 text-center py-12 font-medium">
                  No practice sessions yet. Start your first session above!
                </p>
              ) : (
                <div className="space-y-4">
                  {sessions.map((session) => (
                    <div key={session.id} className="bg-white/60 backdrop-blur-sm border border-gray-100 rounded-xl p-6 hover:shadow-lg transition-all">
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <h3 className="font-bold text-gray-900 text-xl mb-1">{session.title}</h3>
                          <p className="text-sm text-gray-600">
                            {new Date(session.createdAt).toLocaleDateString()} • {formatDuration(session.duration)}
                          </p>
                        </div>
                        <div className="flex gap-2">
                          {session.analysis ? (
                            <button
                              onClick={() => setSelectedSession(session)}
                              className="px-4 py-2 bg-green-100 text-green-800 text-sm font-semibold rounded-xl hover:bg-green-200 transition-all"
                            >
                              View Analysis
                            </button>
                          ) : (
                            <button
                              onClick={() => handleAnalyzeSession(session.id)}
                              disabled={analyzing === session.id}
                              className="px-4 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white text-sm font-semibold rounded-xl hover:from-indigo-700 hover:to-purple-700 disabled:opacity-50 transition-all shadow-lg shadow-indigo-500/25"
                            >
                              {analyzing === session.id ? 'Analyzing...' : 'Get AI Feedback'}
                            </button>
                          )}
                        </div>
                      </div>

                      <AudioPlayer audioUrl={`/api/practice/sessions/${session.id}/audio`} />
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Analysis Modal */}
      {selectedSession && selectedSession.analysis && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white/95 backdrop-blur-md rounded-2xl max-w-3xl w-full p-8 max-h-[90vh] overflow-y-auto border border-gray-100 shadow-2xl">
            <div className="flex justify-between items-start mb-6">
              <h2 className="text-3xl font-bold bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 bg-clip-text text-transparent">
                AI Practice Analysis
              </h2>
              <button
                onClick={() => setSelectedSession(null)}
                className="text-gray-500 hover:text-gray-900 text-3xl font-light transition-colors"
              >
                ×
              </button>
            </div>

            <div className="space-y-8">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Overall Score</h3>
                <div className="text-6xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                  {selectedSession.analysis.overallScore}/10
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Overall Feedback</h3>
                <p className="text-gray-700 leading-relaxed">{selectedSession.analysis.overallFeedback}</p>
              </div>

              {selectedSession.analysis.strengths && Array.isArray(selectedSession.analysis.strengths) && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Strengths</h3>
                  <ul className="list-disc list-inside space-y-2">
                    {selectedSession.analysis.strengths.map((strength: string, i: number) => (
                      <li key={i} className="text-green-700">{strength}</li>
                    ))}
                  </ul>
                </div>
              )}

              {selectedSession.analysis.areasForImprovement && Array.isArray(selectedSession.analysis.areasForImprovement) && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Areas for Improvement</h3>
                  <ul className="list-disc list-inside space-y-2">
                    {selectedSession.analysis.areasForImprovement.map((area: string, i: number) => (
                      <li key={i} className="text-orange-700">{area}</li>
                    ))}
                  </ul>
                </div>
              )}

              {selectedSession.analysis.suggestions && Array.isArray(selectedSession.analysis.suggestions) && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Suggestions</h3>
                  <div className="space-y-3">
                    {selectedSession.analysis.suggestions.map((suggestion: any, i: number) => (
                      <div key={i} className="border-l-4 border-indigo-600 pl-4 py-2 bg-indigo-50/50 rounded-r-lg">
                        <p className="font-semibold text-gray-900">{suggestion.issue}</p>
                        <p className="text-gray-700">{suggestion.suggestion}</p>
                      </div>
                    ))}
                  </div>
                </div>
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
    </div>
  )
}
