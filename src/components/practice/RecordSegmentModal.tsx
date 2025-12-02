'use client'

import { useState, useEffect } from 'react'
import AudioRecorder from '@/components/AudioRecorder'
import AudioPlayer from '@/components/AudioPlayer'

interface Piece {
  id: string
  name: string
  composer?: string
}

interface RecordSegmentModalProps {
  sessionId: string
  pieces: Piece[]
  onClose: () => void
  onSegmentAdded: () => void
}

export default function RecordSegmentModal({
  sessionId,
  pieces,
  onClose,
  onSegmentAdded,
}: RecordSegmentModalProps) {
  const [title, setTitle] = useState('')
  const [type, setType] = useState<'PIECE' | 'WARMUP' | 'TECHNIQUE' | 'SIGHTREADING' | 'OTHER'>('PIECE')
  const [selectedPieceId, setSelectedPieceId] = useState<string>('')
  const [notes, setNotes] = useState('')
  const [metronomeBPM, setMetronomeBPM] = useState<number | null>(null)
  const [isRecording, setIsRecording] = useState(false)
  const [recordedAudio, setRecordedAudio] = useState<{ blob: Blob; duration: number } | null>(null)
  const [saving, setSaving] = useState(false)

  const selectedPiece = pieces.find(p => p.id === selectedPieceId)

  const handleRecordingComplete = (blob: Blob, duration: number) => {
    setRecordedAudio({ blob, duration })
    setIsRecording(false)
  }

  const handleSave = async () => {
    if (!recordedAudio || !title.trim()) {
      alert('Please provide a title and record audio')
      return
    }

    setSaving(true)
    try {
      const token = localStorage.getItem('token')
      if (!token) {
        alert('Not authenticated. Please log in again.')
        return
      }

      // Convert blob to base64
      const audioData = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader()
        reader.onloadend = () => {
          if (reader.result && typeof reader.result === 'string') {
            resolve(reader.result)
          } else {
            reject(new Error('Failed to convert audio to base64'))
          }
        }
        reader.onerror = () => reject(new Error('Error reading audio file'))
        reader.readAsDataURL(recordedAudio.blob)
      })

      const response = await fetch(`/api/practice/session/${sessionId}/segment`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          title: title.trim(),
          type,
          pieceId: selectedPieceId || null,
          notes: notes.trim() || null,
          audioData,
          fileName: 'segment.webm',
          duration: recordedAudio.duration,
          metronomeBPM: metronomeBPM || null,
          referenceVideoUrl: null,
        }),
      })

      const data = await response.json()

      if (response.ok) {
        onSegmentAdded()
        onClose()
      } else {
        alert(data.error || 'Failed to save segment')
      }
    } catch (error) {
      console.error('Error saving segment:', error)
      alert(`Error saving segment: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setSaving(false)
    }
  }

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-white/95 backdrop-blur-md rounded-xl max-w-2xl w-full p-6 border border-gray-100 shadow-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-start mb-4">
          <h2 className="text-2xl font-bold bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 bg-clip-text text-transparent">
            Record Segment
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-900 text-2xl font-light transition-colors"
          >
            ×
          </button>
        </div>

        <div className="space-y-4">
          {/* Segment Type */}
          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-2">
              What are you practicing?
            </label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value as any)}
              className="w-full px-4 py-3 bg-white/80 backdrop-blur-sm border border-gray-200 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all text-gray-900"
            >
              <option value="WARMUP">Warm-up</option>
              <option value="TECHNIQUE">Technique</option>
              <option value="PIECE">Piece</option>
              <option value="SIGHTREADING">Sight-reading</option>
              <option value="OTHER">Other</option>
            </select>
          </div>

          {/* Piece Selection (if type is PIECE) */}
          {type === 'PIECE' && (
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-2">
                Select Piece
              </label>
              <select
                value={selectedPieceId}
                onChange={(e) => {
                  setSelectedPieceId(e.target.value)
                  if (e.target.value && pieces.find(p => p.id === e.target.value)) {
                    const piece = pieces.find(p => p.id === e.target.value)!
                    setTitle(piece.name)
                  }
                }}
                className="w-full px-4 py-3 bg-white/80 backdrop-blur-sm border border-gray-200 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all text-gray-900"
              >
                <option value="">Select a piece...</option>
                {pieces.map((piece) => (
                  <option key={piece.id} value={piece.id}>
                    {piece.name} {piece.composer ? `- ${piece.composer}` : ''}
                  </option>
                ))}
              </select>
              {selectedPiece && (
                <p className="text-xs text-gray-500 mt-1">
                  {selectedPiece.composer && `${selectedPiece.composer} • `}
                  {selectedPiece.targetBPM && `Target BPM: ${selectedPiece.targetBPM}`}
                </p>
              )}
            </div>
          )}

          {/* Title */}
          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-2">
              Title *
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={type === 'PIECE' ? 'Piece name' : 'e.g., Scales, Etude, etc.'}
              className="w-full px-4 py-3 bg-white/80 backdrop-blur-sm border border-gray-200 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all text-gray-900 placeholder-gray-400"
              required
            />
          </div>

          {/* Metronome BPM */}
          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-2">
              Metronome BPM (optional)
            </label>
            <input
              type="number"
              value={metronomeBPM || ''}
              onChange={(e) => setMetronomeBPM(e.target.value ? parseInt(e.target.value) : null)}
              placeholder="e.g., 120"
              className="w-full px-4 py-3 bg-white/80 backdrop-blur-sm border border-gray-200 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all text-gray-900 placeholder-gray-400"
            />
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-2">
              Notes (optional)
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              placeholder="Any notes about this segment..."
              className="w-full px-4 py-3 bg-white/80 backdrop-blur-sm border border-gray-200 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all text-gray-900 placeholder-gray-400"
            />
          </div>

          {/* Recording Interface */}
          {!isRecording && !recordedAudio && (
            <div>
              <button
                onClick={() => setIsRecording(true)}
                className="w-full px-4 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl font-semibold hover:from-indigo-700 hover:to-purple-700 transition-all shadow-lg shadow-indigo-500/25"
              >
                🎤 Start Recording
              </button>
            </div>
          )}

          {isRecording && (
            <div className="p-4 bg-white/80 backdrop-blur-sm border border-gray-200 rounded-xl">
              <AudioRecorder onRecordingComplete={handleRecordingComplete} />
              <button
                onClick={() => setIsRecording(false)}
                className="mt-4 w-full px-4 py-2 bg-gray-200 text-gray-900 rounded-xl font-semibold hover:bg-gray-300 transition-all"
              >
                Cancel Recording
              </button>
            </div>
          )}

          {recordedAudio && (
            <div className="p-4 bg-green-50 rounded-xl border border-green-200">
              <p className="text-sm font-semibold text-green-900 mb-2">
                Audio recorded ({formatDuration(recordedAudio.duration)})
              </p>
              <AudioPlayer
                audioUrl={URL.createObjectURL(recordedAudio.blob)}
                title="Recorded Audio"
              />
              <button
                onClick={() => {
                  setRecordedAudio(null)
                  setIsRecording(false)
                }}
                className="mt-2 px-4 py-2 bg-red-600 text-white rounded-xl font-semibold hover:bg-red-700 transition-all text-sm"
              >
                Re-record
              </button>
            </div>
          )}

          {/* Save Button */}
          {recordedAudio && (
            <div className="flex gap-3 pt-4 border-t border-gray-200">
              <button
                onClick={handleSave}
                disabled={saving || !title.trim()}
                className="flex-1 bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-3 px-4 rounded-xl font-semibold hover:from-indigo-700 hover:to-purple-700 disabled:opacity-50 transition-all shadow-lg shadow-indigo-500/25"
              >
                {saving ? 'Saving...' : 'Save Segment'}
              </button>
              <button
                onClick={onClose}
                className="flex-1 bg-gray-200 text-gray-900 py-3 px-4 rounded-xl font-semibold hover:bg-gray-300 transition-all"
              >
                Cancel
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

