'use client'

import { useState } from 'react'
import AudioPlayer from '@/components/AudioPlayer'

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

interface SegmentCardProps {
  segment: Segment
  onUpdate: () => void
}

export default function SegmentCard({ segment, onUpdate }: SegmentCardProps) {
  const [isExpanded, setIsExpanded] = useState(false)

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const getTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      PIECE: 'Piece',
      WARMUP: 'Warm-up',
      TECHNIQUE: 'Technique',
      SIGHTREADING: 'Sight-reading',
      OTHER: 'Other',
    }
    return labels[type] || type
  }

  const getTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      PIECE: 'bg-indigo-100 text-indigo-800',
      WARMUP: 'bg-orange-100 text-orange-800',
      TECHNIQUE: 'bg-purple-100 text-purple-800',
      SIGHTREADING: 'bg-blue-100 text-blue-800',
      OTHER: 'bg-gray-100 text-gray-800',
    }
    return colors[type] || 'bg-gray-100 text-gray-800'
  }

  return (
    <div className="bg-white/80 backdrop-blur-md rounded-xl border border-gray-100/50 shadow-lg overflow-hidden">
      <div
        className="p-4 cursor-pointer hover:bg-gray-50/50 transition-colors"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex justify-between items-start">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <h3 className="font-bold text-gray-900 text-base">{segment.title}</h3>
              <span className={`px-2 py-0.5 rounded text-xs font-semibold ${getTypeColor(segment.type)}`}>
                {getTypeLabel(segment.type)}
              </span>
            </div>
            <div className="flex items-center gap-4 text-xs text-gray-600">
              <span>{formatDuration(segment.duration)}</span>
              {segment.metronomeBPM && <span>BPM: {segment.metronomeBPM}</span>}
              {segment.piece && (
                <span className="text-indigo-600">
                  {segment.piece.name} {segment.piece.composer && `- ${segment.piece.composer}`}
                </span>
              )}
              <span>{new Date(segment.recordedAt).toLocaleTimeString()}</span>
            </div>
          </div>
          <div className="text-gray-400">
            {isExpanded ? '▼' : '▶'}
          </div>
        </div>
      </div>

      {isExpanded && (
        <div className="px-4 pb-4 space-y-4 border-t border-gray-100 pt-4">
          {/* Audio Player */}
          <div>
            <AudioPlayer audioUrl={segment.audioUrl} title={segment.title} />
          </div>

          {/* Notes */}
          {segment.notes && (
            <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
              <p className="text-xs font-semibold text-blue-900 mb-1">Notes:</p>
              <p className="text-sm text-gray-700 whitespace-pre-wrap">{segment.notes}</p>
            </div>
          )}

          {/* Analysis */}
          {segment.analysis && (
            <div className="p-3 bg-green-50 rounded-lg border border-green-200">
              <p className="text-xs font-semibold text-green-900 mb-2">AI Analysis:</p>
              {segment.analysis.overallScore && (
                <div className="text-lg font-bold text-green-800 mb-2">
                  Score: {segment.analysis.overallScore}/10
                </div>
              )}
              <p className="text-sm text-gray-700">{segment.analysis.overallFeedback}</p>
            </div>
          )}

          {/* Teacher Feedback */}
          {(segment.teacherFeedbackText || segment.teacherFeedbackAudio) && (
            <div className="p-3 bg-indigo-50 rounded-lg border border-indigo-200">
              <p className="text-xs font-semibold text-indigo-900 mb-2">💬 Teacher Feedback:</p>
              {segment.teacherFeedbackText && (
                <p className="text-sm text-gray-700 whitespace-pre-wrap mb-2">
                  {segment.teacherFeedbackText}
                </p>
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
      )}
    </div>
  )
}

