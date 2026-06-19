'use client'

import { useState } from 'react'
import { X, Loader2 } from 'lucide-react'
import { ProblemCard } from '@/lib/devMockData'
import { CATEGORY_COLORS, CATEGORY_BG } from '@/lib/mockData'

interface ClaimModalProps {
  card: ProblemCard
  onConfirm: (note: string) => void
  onClose: () => void
}

export default function ClaimModal({ card, onConfirm, onClose }: ClaimModalProps) {
  const [note, setNote] = useState('')
  const [loading, setLoading] = useState(false)

  const handleConfirm = async () => {
    setLoading(true)
    await new Promise((r) => setTimeout(r, 900))
    onConfirm(note)
    setLoading(false)
  }

  return (
    <div
      className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center px-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div className="w-full max-w-md bg-[#111118] border border-white/[0.1] rounded-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/[0.06]">
          <h2 className="text-sm font-semibold text-white">Claim this problem</h2>
          <button onClick={onClose} className="text-slate-500 hover:text-slate-300 transition-colors">
            <X size={16} />
          </button>
        </div>

        <div className="px-5 py-5">
          {/* Problem summary */}
          <div className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-4 mb-5">
            <div className="flex items-center gap-2 mb-2">
              <span
                className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium border"
                style={{
                  color: CATEGORY_COLORS[card.category],
                  background: CATEGORY_BG[card.category],
                  borderColor: `${CATEGORY_COLORS[card.category]}30`,
                }}
              >
                {card.category}
              </span>
              <span className="text-xs text-indigo-400 font-semibold">{card.reportCount} reports</span>
            </div>
            <p className="text-sm text-slate-200 font-medium">{card.title}</p>
            <div className="flex flex-wrap gap-1.5 mt-2">
              {card.keywords.map((kw) => (
                <span key={kw} className="bg-white/[0.05] border border-white/[0.08] rounded px-1.5 py-0.5 text-[10px] text-slate-500 font-mono">
                  {kw}
                </span>
              ))}
            </div>
          </div>

          {/* Note input */}
          <div className="mb-5">
            <label className="block text-xs text-slate-400 mb-1.5">
              What are you planning to build? <span className="text-slate-600">(optional)</span>
            </label>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="e.g. A lightweight PWA that fixes the network switching issue with auto-reconnect logic..."
              rows={3}
              maxLength={300}
              className="w-full bg-white/[0.04] border border-white/[0.08] rounded-lg px-3 py-2.5 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-indigo-500/50 transition-colors resize-none"
            />
            <div className="text-right text-[10px] text-slate-600 mt-1">{note.length}/300</div>
          </div>

          {/* Info box */}
          <div className="bg-indigo-500/[0.06] border border-indigo-500/20 rounded-xl p-3 mb-5">
            <p className="text-[11px] text-indigo-300 leading-relaxed">
              Claiming this problem lets you message the {card.userCount} users who reported it. Their contact details will appear in "My Claims".
            </p>
          </div>

          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="flex-1 border border-white/10 hover:border-white/20 text-slate-400 text-sm rounded-lg py-2.5 transition-all"
            >
              Cancel
            </button>
            <button
              onClick={handleConfirm}
              disabled={loading}
              className="flex-1 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-medium text-sm rounded-lg py-2.5 transition-colors flex items-center justify-center gap-2"
            >
              {loading ? (
                <><Loader2 size={14} className="animate-spin" /> Claiming...</>
              ) : (
                'Confirm claim →'
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
