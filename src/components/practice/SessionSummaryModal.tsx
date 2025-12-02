'use client'

interface Segment {
  id: string
  title: string
  type: string
  duration: number
  piece?: {
    name: string
    composer?: string
  }
}

interface PracticeSession {
  id: string
  totalDuration: number
  segments: Segment[]
}

interface SessionSummaryModalProps {
  session: PracticeSession
  onClose: () => void
}

export default function SessionSummaryModal({ session, onClose }: SessionSummaryModalProps) {
  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600)
    const mins = Math.floor((seconds % 3600) / 60)
    const secs = seconds % 60
    if (hours > 0) {
      return `${hours}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
    }
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const piecesPracticed = new Set(
    session.segments
      .filter(seg => seg.piece)
      .map(seg => seg.piece!.name)
  )

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-white/95 backdrop-blur-md rounded-xl max-w-2xl w-full p-6 border border-gray-100 shadow-2xl">
        <div className="flex justify-between items-start mb-4">
          <h2 className="text-2xl font-bold bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 bg-clip-text text-transparent">
            Practice Session Complete!
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-900 text-2xl font-light transition-colors"
          >
            ×
          </button>
        </div>

        <div className="space-y-6">
          {/* Summary Stats */}
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 bg-indigo-50 rounded-xl border border-indigo-200">
              <div className="text-3xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent mb-1">
                {formatDuration(session.totalDuration)}
              </div>
              <div className="text-sm text-gray-600 font-medium">Total Time</div>
            </div>
            <div className="p-4 bg-green-50 rounded-xl border border-green-200">
              <div className="text-3xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent mb-1">
                {session.segments.length}
              </div>
              <div className="text-sm text-gray-600 font-medium">Segments</div>
            </div>
          </div>

          {/* Pieces Practiced */}
          {piecesPracticed.size > 0 && (
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Pieces Practiced</h3>
              <div className="space-y-2">
                {Array.from(piecesPracticed).map((pieceName) => (
                  <div
                    key={pieceName}
                    className="p-3 bg-white/60 backdrop-blur-sm border border-gray-200 rounded-lg"
                  >
                    <span className="text-sm font-medium text-gray-900">{pieceName}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Segments List */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Segments</h3>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {session.segments.map((segment) => (
                <div
                  key={segment.id}
                  className="p-3 bg-white/60 backdrop-blur-sm border border-gray-200 rounded-lg flex justify-between items-center"
                >
                  <div>
                    <span className="text-sm font-medium text-gray-900">{segment.title}</span>
                    {segment.piece && (
                      <span className="text-xs text-gray-500 ml-2">
                        ({segment.piece.name})
                      </span>
                    )}
                  </div>
                  <span className="text-xs text-gray-600">
                    {formatDuration(segment.duration)}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Close Button */}
          <button
            onClick={onClose}
            className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-3 px-4 rounded-xl font-semibold hover:from-indigo-700 hover:to-purple-700 transition-all shadow-lg shadow-indigo-500/25"
          >
            Return to Dashboard
          </button>
        </div>
      </div>
    </div>
  )
}

