'use client'

import { useState, useEffect } from 'react'

interface Piece {
  id: string
  name: string
  composer?: string
  difficulty?: string
  targetBPM?: number
  status: string
  dateStarted: string
  defaultReferenceVideoUrl?: string
  notes?: string
}

interface PieceManagerProps {
  onPieceSelect?: (pieceId: string) => void
}

export default function PieceManager({ onPieceSelect }: PieceManagerProps) {
  const [pieces, setPieces] = useState<Piece[]>([])
  const [showModal, setShowModal] = useState(false)
  const [editingPiece, setEditingPiece] = useState<Piece | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    composer: '',
    difficulty: '',
    targetBPM: '',
    defaultReferenceVideoUrl: '',
    notes: '',
  })
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    fetchPieces()
  }, [])

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

  const handleSave = async () => {
    if (!formData.name.trim()) {
      alert('Please enter a piece name')
      return
    }

    setSaving(true)
    try {
      const token = localStorage.getItem('token')
      const url = editingPiece ? `/api/pieces?id=${editingPiece.id}` : '/api/pieces'
      const method = editingPiece ? 'PATCH' : 'POST'

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: formData.name.trim(),
          composer: formData.composer.trim() || null,
          difficulty: formData.difficulty.trim() || null,
          targetBPM: formData.targetBPM ? parseInt(formData.targetBPM) : null,
          defaultReferenceVideoUrl: formData.defaultReferenceVideoUrl.trim() || null,
          notes: formData.notes.trim() || null,
        }),
      })

      const data = await response.json()

      if (response.ok) {
        setShowModal(false)
        setEditingPiece(null)
        setFormData({
          name: '',
          composer: '',
          difficulty: '',
          targetBPM: '',
          defaultReferenceVideoUrl: '',
          notes: '',
        })
        fetchPieces()
      } else {
        alert(data.error || 'Failed to save piece')
      }
    } catch (error) {
      console.error('Error saving piece:', error)
      alert('Error saving piece')
    } finally {
      setSaving(false)
    }
  }

  const handleEdit = (piece: Piece) => {
    setEditingPiece(piece)
    setFormData({
      name: piece.name,
      composer: piece.composer || '',
      difficulty: piece.difficulty || '',
      targetBPM: piece.targetBPM?.toString() || '',
      defaultReferenceVideoUrl: piece.defaultReferenceVideoUrl || '',
      notes: piece.notes || '',
    })
    setShowModal(true)
  }

  const handleDelete = async (pieceId: string) => {
    if (!confirm('Are you sure you want to delete this piece?')) {
      return
    }

    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`/api/pieces?id=${pieceId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      })

      const data = await response.json()

      if (response.ok) {
        fetchPieces()
      } else {
        alert(data.error || 'Failed to delete piece')
      }
    } catch (error) {
      console.error('Error deleting piece:', error)
      alert('Error deleting piece')
    }
  }

  return (
    <>
      <div className="mb-4">
        <button
          onClick={() => {
            setEditingPiece(null)
            setFormData({
              name: '',
              composer: '',
              difficulty: '',
              targetBPM: '',
              defaultReferenceVideoUrl: '',
              notes: '',
            })
            setShowModal(true)
          }}
          className="px-4 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white text-sm font-semibold rounded-lg hover:from-indigo-700 hover:to-purple-700 transition-all"
        >
          + Add Piece
        </button>
      </div>

      {pieces.length > 0 && (
        <div className="space-y-2">
          {pieces.map((piece) => (
            <div
              key={piece.id}
              className="p-3 bg-white/60 backdrop-blur-sm border border-gray-200 rounded-lg flex justify-between items-center hover:shadow-md transition-all"
            >
              <div className="flex-1">
                <div className="font-semibold text-gray-900">{piece.name}</div>
                {piece.composer && (
                  <div className="text-xs text-gray-600">{piece.composer}</div>
                )}
                {piece.targetBPM && (
                  <div className="text-xs text-gray-500">Target BPM: {piece.targetBPM}</div>
                )}
              </div>
              <div className="flex gap-2">
                {onPieceSelect && (
                  <button
                    onClick={() => onPieceSelect(piece.id)}
                    className="px-3 py-1 bg-indigo-100 text-indigo-800 text-xs font-semibold rounded hover:bg-indigo-200 transition-all"
                  >
                    Select
                  </button>
                )}
                <button
                  onClick={() => handleEdit(piece)}
                  className="px-3 py-1 bg-gray-100 text-gray-800 text-xs font-semibold rounded hover:bg-gray-200 transition-all"
                >
                  Edit
                </button>
                <button
                  onClick={() => handleDelete(piece.id)}
                  className="px-3 py-1 bg-red-100 text-red-800 text-xs font-semibold rounded hover:bg-red-200 transition-all"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white/95 backdrop-blur-md rounded-xl max-w-2xl w-full p-6 border border-gray-100 shadow-2xl">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              {editingPiece ? 'Edit Piece' : 'Add Piece'}
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">
                  Piece Name *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-3 bg-white/80 backdrop-blur-sm border border-gray-200 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all text-gray-900"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">
                  Composer
                </label>
                <input
                  type="text"
                  value={formData.composer}
                  onChange={(e) => setFormData({ ...formData, composer: e.target.value })}
                  className="w-full px-4 py-3 bg-white/80 backdrop-blur-sm border border-gray-200 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all text-gray-900"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">
                  Difficulty
                </label>
                <input
                  type="text"
                  value={formData.difficulty}
                  onChange={(e) => setFormData({ ...formData, difficulty: e.target.value })}
                  placeholder="e.g., Intermediate, Advanced"
                  className="w-full px-4 py-3 bg-white/80 backdrop-blur-sm border border-gray-200 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all text-gray-900"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">
                  Target BPM
                </label>
                <input
                  type="number"
                  value={formData.targetBPM}
                  onChange={(e) => setFormData({ ...formData, targetBPM: e.target.value })}
                  className="w-full px-4 py-3 bg-white/80 backdrop-blur-sm border border-gray-200 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all text-gray-900"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">
                  Reference Video URL
                </label>
                <input
                  type="url"
                  value={formData.defaultReferenceVideoUrl}
                  onChange={(e) => setFormData({ ...formData, defaultReferenceVideoUrl: e.target.value })}
                  className="w-full px-4 py-3 bg-white/80 backdrop-blur-sm border border-gray-200 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all text-gray-900"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">
                  Notes
                </label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  rows={3}
                  className="w-full px-4 py-3 bg-white/80 backdrop-blur-sm border border-gray-200 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all text-gray-900"
                />
              </div>
              <div className="flex gap-3 pt-4">
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="flex-1 bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-3 px-4 rounded-xl font-semibold hover:from-indigo-700 hover:to-purple-700 disabled:opacity-50 transition-all"
                >
                  {saving ? 'Saving...' : 'Save'}
                </button>
                <button
                  onClick={() => {
                    setShowModal(false)
                    setEditingPiece(null)
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
    </>
  )
}

