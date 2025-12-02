'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import AudioRecorder from '@/components/AudioRecorder'
import AudioPlayer from '@/components/AudioPlayer'
import RecordSegmentModal from '@/components/practice/RecordSegmentModal'
import SessionSummaryModal from '@/components/practice/SessionSummaryModal'
import SegmentCard from '@/components/practice/SegmentCard'

interface Piece {
  id: string
  name: string
  composer?: string
  difficulty?: string
  targetBPM?: number
  status: string
}

interface Segment {
  id: string
  title: string
  type: string
  notes?: string
  audioUrl: string
  duration: number
  metronomeBPM?: number
  recordedAt: string
  piece?: {
    id: string
    name: string
    composer?: string
  }
  analysis?: any
  teacherFeedbackText?: string
  teacherFeedbackAudio?: string
}

interface PracticeSession {
  id: string
  date: string
  totalDuration: number
  status: string
  segments: Segment[]
}

export default function ActiveSessionView() {
  const router = useRouter()
  const params = useParams()
  const sessionId = params.sessionId as string

  const [session, setSession] = useState<PracticeSession | null>(null)
  const [pieces, setPieces] = useState<Piece[]>([])
  const [loading, setLoading] = useState(true)
  const [showRecordModal, setShowRecordModal] = useState(false)
  const [showSummaryModal, setShowSummaryModal] = useState(false)
  const [sessionTimer, setSessionTimer] = useState(0)
  const [timerInterval, setTimerInterval] = useState<NodeJS.Timeout | null>(null)

  useEffect(() => {
    fetchSession()
    fetchPieces()
    
    // Start session timer
    const interval = setInterval(() => {
      setSessionTimer(prev => prev + 1)
    }, 1000)
    setTimerInterval(interval)

    return () => {
      if (interval) clearInterval(interval)
    }
  }, [sessionId])

  const fetchSession = async () => {
    try {
      const token = localStorage.getItem('token')
      if (!token) {
        router.push('/login')
        return
      }

      const response = await fetch(`/api/practice/session/${sessionId}`, {
        headers: { Authorization: `Bearer ${token}` },
      })

      const data = await response.json()

      if (response.ok && data.data) {
        setSession(data.data.session)
        // Calculate elapsed time from segments
        const elapsed = data.data.segments.reduce((acc: number, seg: Segment) => acc + seg.duration, 0)
        setSessionTimer(elapsed)
      } else {
        alert('Failed to load session')
        router.push('/dashboard/student')
      }
    } catch (error) {
      console.error('Error fetching session:', error)
      alert('Error loading session')
      router.push('/dashboard/student')
    } finally {
      setLoading(false)
    }
  }

  const fetchPieces = async () => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch('/api/pieces', {
        headers: { Authorization: `Bearer ${token}` },
      })
      const data = await response.json()
      if (response.ok && data.data) {
        setPieces(data.data)
      }
    } catch (error) {
      console.error('Error fetching pieces:', error)
    }
  }

  const handleEndSession = async () => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`/api/practice/session/${sessionId}/end`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}` },
      })

      const data = await response.json()

      if (response.ok) {
        setShowSummaryModal(true)
        if (timerInterval) clearInterval(timerInterval)
      } else {
        alert(data.error || 'Failed to end session')
      }
    } catch (error) {
      console.error('Error ending session:', error)
      alert('Error ending session')
    }
  }

  const handleSegmentAdded = () => {
    fetchSession()
  }

  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600)
    const mins = Math.floor((seconds % 3600) / 60)
    const secs = seconds % 60
    if (hours > 0) {
      return `${hours}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
    }
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center">
        <div className="text-xl font-semibold text-gray-900">Loading session...</div>
      </div>
    )
  }

  if (!session) {
    return null
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-40 bg-white/80 backdrop-blur-md border-b border-gray-100/50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-14 items-center">
            <div className="flex items-center gap-8">
              <Link href="/dashboard/student" className="text-xl font-semibold text-gray-900 tracking-tight">
                MusicPractice
              </Link>
              <span className="text-sm text-gray-600 font-medium">Active Practice Session</span>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-sm font-semibold text-gray-900">
                {formatDuration(sessionTimer)}
              </div>
              <button
                onClick={handleEndSession}
                className="px-4 py-2 bg-gray-200 text-gray-900 rounded-lg text-sm font-semibold hover:bg-gray-300 transition-all"
              >
                End Session
              </button>
            </div>
          </div>
        </div>
      </nav>

      <div className="pt-16 pb-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Session Header */}
          <div className="bg-white/80 backdrop-blur-md rounded-xl border border-gray-100/50 shadow-lg p-6 mb-6">
            <div className="flex justify-between items-center">
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 bg-clip-text text-transparent mb-2">
                  Practice Session
                </h1>
                <p className="text-sm text-gray-600">
                  Started {new Date(session.date).toLocaleString()}
                </p>
              </div>
              <div className="text-right">
                <div className="text-3xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                  {formatDuration(sessionTimer)}
                </div>
                <div className="text-xs text-gray-600 font-medium">Total Time</div>
              </div>
            </div>
          </div>

          {/* Record Segment Button */}
          <div className="mb-6 text-center">
            <button
              onClick={() => setShowRecordModal(true)}
              className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-8 py-4 rounded-xl text-lg font-semibold hover:from-indigo-700 hover:to-purple-700 shadow-lg shadow-indigo-500/25 hover:shadow-xl hover:shadow-indigo-500/30 hover:scale-[1.01] transition-all"
            >
              🎵 Record Segment
            </button>
          </div>

          {/* Segments List */}
          <div className="space-y-4">
            {session.segments.length === 0 ? (
              <div className="bg-white/80 backdrop-blur-md rounded-xl border border-gray-100/50 shadow-lg p-12 text-center">
                <p className="text-gray-500 font-medium mb-4">No segments recorded yet</p>
                <p className="text-sm text-gray-400">Click "Record Segment" to start practicing</p>
              </div>
            ) : (
              session.segments.map((segment) => (
                <SegmentCard
                  key={segment.id}
                  segment={segment}
                  onUpdate={fetchSession}
                />
              ))
            )}
          </div>
        </div>
      </div>

      {/* Record Segment Modal */}
      {showRecordModal && (
        <RecordSegmentModal
          sessionId={sessionId}
          pieces={pieces}
          onClose={() => setShowRecordModal(false)}
          onSegmentAdded={handleSegmentAdded}
        />
      )}

      {/* Session Summary Modal */}
      {showSummaryModal && session && (
        <SessionSummaryModal
          session={session}
          onClose={() => {
            setShowSummaryModal(false)
            router.push('/dashboard/student')
          }}
        />
      )}
    </div>
  )
}

