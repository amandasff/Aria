'use client'

import { useState } from 'react'
import AudioPlayer from '@/components/AudioPlayer'
import SegmentCard from './SegmentCard'

interface Segment {
  id: string
  title: string
  type: string
  notes?: string
  audioUrl: string
  duration: number
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

interface Session {
  id: string
  date: string
  totalDuration: number
  status: string
  createdAt: string
  segments: Segment[]
}

interface SessionCardProps {
  session: Session
  onAnalyzeSegment: (segmentId: string) => void
  analyzing: string | null
  onViewAnalysis: (segment: Segment) => void
}

export default function SessionCard({ session, onAnalyzeSegment, analyzing, onViewAnalysis }: SessionCardProps) {
  const [isExpanded, setIsExpanded] = useState(false)

  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600)
    const mins = Math.floor((seconds % 3600) / 60)
    const secs = seconds % 60
    if (hours > 0) {
      return `${hours}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
    }
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  return (
    <div className="bg-white/60 backdrop-blur-sm border border-gray-100 rounded-lg overflow-hidden hover:shadow-lg transition-all">
      <div
        className="p-4 cursor-pointer hover:bg-gray-50/50 transition-colors"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex justify-between items-start">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <h3 className="font-bold text-gray-900 text-base">
                Practice Session
              </h3>
              <span className="px-2 py-0.5 bg-indigo-100 text-indigo-800 text-xs font-semibold rounded">
                {session.segments.length} {session.segments.length === 1 ? 'segment' : 'segments'}
              </span>
            </div>
            <p className="text-xs text-gray-600">
              {new Date(session.date).toLocaleDateString()} • {formatDuration(session.totalDuration)}
            </p>
          </div>
          <div className="text-gray-400">
            {isExpanded ? '▼' : '▶'}
          </div>
        </div>
      </div>

      {isExpanded && (
        <div className="px-4 pb-4 space-y-3 border-t border-gray-100 pt-4">
          {session.segments.map((segment) => (
            <div key={segment.id} className="bg-white/80 backdrop-blur-sm border border-gray-200 rounded-lg p-3">
              <div className="flex justify-between items-start mb-2">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-gray-900 text-sm">{segment.title}</span>
                    <span className="px-2 py-0.5 bg-gray-100 text-gray-700 text-xs font-semibold rounded">
                      {segment.type}
                    </span>
                  </div>
                  <p className="text-xs text-gray-600 mt-1">
                    {formatDuration(segment.duration)} • {new Date(segment.recordedAt).toLocaleTimeString()}
                  </p>
                </div>
                <div className="flex gap-2">
                  {segment.analysis ? (
                    <button
                      onClick={() => onViewAnalysis(segment)}
                      className="px-2 py-1 bg-green-100 text-green-800 text-xs font-semibold rounded hover:bg-green-200 transition-all"
                    >
                      View Analysis
                    </button>
                  ) : (
                    <button
                      onClick={() => onAnalyzeSegment(segment.id)}
                      disabled={analyzing === segment.id}
                      className="px-2 py-1 bg-gradient-to-r from-indigo-600 to-purple-600 text-white text-xs font-semibold rounded hover:from-indigo-700 hover:to-purple-700 disabled:opacity-50 transition-all"
                    >
                      {analyzing === segment.id ? 'Analyzing...' : 'Analyze'}
                    </button>
                  )}
                </div>
              </div>
              <AudioPlayer audioUrl={segment.audioUrl} title={segment.title} />
              {(segment.teacherFeedbackText || segment.teacherFeedbackAudio) && (
                <div className="mt-2 p-2 bg-indigo-50 rounded border border-indigo-200">
                  <p className="text-xs font-semibold text-indigo-900 mb-1">💬 Teacher Feedback:</p>
                  {segment.teacherFeedbackText && (
                    <p className="text-xs text-gray-700 whitespace-pre-wrap">{segment.teacherFeedbackText}</p>
                  )}
                  {segment.teacherFeedbackAudio && (
                    <AudioPlayer
                      audioUrl={segment.teacherFeedbackAudio}
                      title="Teacher Feedback"
                    />
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

