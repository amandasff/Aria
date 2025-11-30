'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
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
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-xl text-gray-600">Loading...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation */}
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <div className="flex items-center gap-8">
              <span className="text-2xl font-bold text-indigo-600">MusicPractice</span>
              <span className="text-gray-600">Student Dashboard</span>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-gray-700">{user?.name}</span>
              <button
                onClick={handleLogout}
                className="text-gray-600 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-3xl font-bold text-indigo-600">{sessions.length}</div>
            <div className="text-gray-600">Total Sessions</div>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-3xl font-bold text-indigo-600">
              {Math.floor(sessions.reduce((acc, s) => acc + s.duration, 0) / 60)}
            </div>
            <div className="text-gray-600">Total Minutes</div>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-3xl font-bold text-indigo-600">
              {sessions.filter(s => s.analysis).length}
            </div>
            <div className="text-gray-600">Analyzed Sessions</div>
          </div>
        </div>

        {/* Record Practice Button */}
        {!showRecorder && (
          <div className="mb-8 text-center">
            <button
              onClick={() => setShowRecorder(true)}
              className="bg-indigo-600 text-white px-8 py-4 rounded-lg text-lg font-semibold hover:bg-indigo-700 shadow-lg"
            >
              🎵 Start New Practice Session
            </button>
          </div>
        )}

        {/* Recording Interface */}
        {showRecorder && (
          <div className="mb-8 bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Record Practice Session</h2>

            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Session Title *
                </label>
                <input
                  type="text"
                  required
                  value={sessionTitle}
                  onChange={(e) => setSessionTitle(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  placeholder="e.g., Bach Prelude Practice"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description (optional)
                </label>
                <textarea
                  value={sessionDescription}
                  onChange={(e) => setSessionDescription(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  rows={3}
                  placeholder="Notes about this practice session..."
                />
              </div>
            </div>

            <AudioRecorder onRecordingComplete={handleRecordingComplete} />

            {recordedAudio && (
              <div className="mt-6 bg-green-50 border border-green-200 rounded-lg p-4">
                <p className="text-green-800 font-medium mb-2">
                  Recording complete! Duration: {formatDuration(recordedAudio.duration)}
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={handleSaveSession}
                    disabled={uploading}
                    className="bg-indigo-600 text-white px-6 py-2 rounded-md hover:bg-indigo-700 disabled:opacity-50"
                  >
                    {uploading ? 'Saving...' : 'Save Session'}
                  </button>
                  <button
                    onClick={() => setRecordedAudio(null)}
                    className="bg-gray-300 text-gray-700 px-6 py-2 rounded-md hover:bg-gray-400"
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
                    className="bg-red-600 text-white px-6 py-2 rounded-md hover:bg-red-700"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Practice History */}
        <div className="bg-white rounded-lg shadow">
          <div className="p-6 border-b">
            <h2 className="text-xl font-bold text-gray-900">Practice History</h2>
          </div>
          <div className="p-6">
            {sessions.length === 0 ? (
              <p className="text-gray-500 text-center py-8">
                No practice sessions yet. Start your first session above!
              </p>
            ) : (
              <div className="space-y-4">
                {sessions.map((session) => (
                  <div key={session.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h3 className="font-semibold text-gray-900 text-lg">{session.title}</h3>
                        <p className="text-sm text-gray-500">
                          {new Date(session.createdAt).toLocaleDateString()} • {formatDuration(session.duration)}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        {session.analysis ? (
                          <button
                            onClick={() => setSelectedSession(session)}
                            className="px-3 py-1 bg-green-100 text-green-800 text-sm rounded hover:bg-green-200"
                          >
                            View Analysis
                          </button>
                        ) : (
                          <button
                            onClick={() => handleAnalyzeSession(session.id)}
                            disabled={analyzing === session.id}
                            className="px-3 py-1 bg-indigo-100 text-indigo-800 text-sm rounded hover:bg-indigo-200 disabled:opacity-50"
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

      {/* Analysis Modal */}
      {selectedSession && selectedSession.analysis && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-lg max-w-3xl w-full p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-start mb-4">
              <h2 className="text-2xl font-bold">AI Practice Analysis</h2>
              <button
                onClick={() => setSelectedSession(null)}
                className="text-gray-500 hover:text-gray-700 text-2xl"
              >
                ×
              </button>
            </div>

            <div className="space-y-6">
              <div>
                <h3 className="text-xl font-semibold mb-2">Overall Score</h3>
                <div className="text-4xl font-bold text-indigo-600">
                  {selectedSession.analysis.overallScore}/10
                </div>
              </div>

              <div>
                <h3 className="text-xl font-semibold mb-2">Overall Feedback</h3>
                <p className="text-gray-700">{selectedSession.analysis.overallFeedback}</p>
              </div>

              {selectedSession.analysis.strengths && Array.isArray(selectedSession.analysis.strengths) && (
                <div>
                  <h3 className="text-xl font-semibold mb-2">Strengths</h3>
                  <ul className="list-disc list-inside space-y-1">
                    {selectedSession.analysis.strengths.map((strength: string, i: number) => (
                      <li key={i} className="text-green-700">{strength}</li>
                    ))}
                  </ul>
                </div>
              )}

              {selectedSession.analysis.areasForImprovement && Array.isArray(selectedSession.analysis.areasForImprovement) && (
                <div>
                  <h3 className="text-xl font-semibold mb-2">Areas for Improvement</h3>
                  <ul className="list-disc list-inside space-y-1">
                    {selectedSession.analysis.areasForImprovement.map((area: string, i: number) => (
                      <li key={i} className="text-orange-700">{area}</li>
                    ))}
                  </ul>
                </div>
              )}

              {selectedSession.analysis.suggestions && Array.isArray(selectedSession.analysis.suggestions) && (
                <div>
                  <h3 className="text-xl font-semibold mb-2">Suggestions</h3>
                  <div className="space-y-2">
                    {selectedSession.analysis.suggestions.map((suggestion: any, i: number) => (
                      <div key={i} className="border-l-4 border-indigo-600 pl-4 py-2">
                        <p className="font-medium">{suggestion.issue}</p>
                        <p className="text-gray-700">{suggestion.suggestion}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <button
              onClick={() => setSelectedSession(null)}
              className="mt-6 w-full bg-gray-300 text-gray-700 px-4 py-2 rounded hover:bg-gray-400"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
