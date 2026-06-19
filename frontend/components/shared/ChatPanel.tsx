'use client'

import { useState, useRef, useEffect } from 'react'
import { X, Send, ArrowLeft } from 'lucide-react'
import { Conversation, Message } from '@/lib/mockData'
import { api } from '@/lib/api'

interface ChatPanelProps {
  conversations: Conversation[]
  open: boolean
  onClose: () => void
  onRead?: (convId: string) => void
  initialConvId?: string | null
}

export default function ChatPanel({ conversations, open, onClose, onRead, initialConvId }: ChatPanelProps) {
  const [activeConv, setActiveConv] = useState<Conversation | null>(null)
  const [message, setMessage] = useState('')
  const [localConvs, setLocalConvs] = useState<Conversation[]>(conversations)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setLocalConvs(conversations)
  }, [conversations])

  useEffect(() => {
    if (initialConvId && open) {
      let conv = localConvs.find((c) => c.id === initialConvId) || null
      if (!conv && initialConvId.includes('_')) {
        // Create a temporary conversation object
        const [clusterId, otherUserId] = initialConvId.split('_')
        conv = {
          id: initialConvId,
          developerName: 'Developer',
          developerAvatar: 'DEV',
          problemTitle: 'Claimed Problem',
          lastMessage: 'Start typing to message...',
          lastTime: 'Now',
          unreadCount: 0,
          messages: []
        }
      }
      setActiveConv(conv)
    }
  }, [initialConvId, open, localConvs])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [activeConv?.messages?.length])

  useEffect(() => {
    if (activeConv && open) {
      const fetchMessages = async () => {
        try {
          const [clusterId, otherUserId] = activeConv.id.split('_')
          const msgs = await api.get<any[]>(`/api/messages/${clusterId}/${otherUserId}`)
          setActiveConv((prev) => {
            if (!prev || prev.id !== activeConv.id) return prev
            return {
              ...prev,
              messages: msgs.map((m: any) => ({
                id: m.id,
                senderId: m.sender_id,
                senderName: m.is_me ? 'Me' : prev.developerName,
                senderAvatar: m.is_me ? 'Me' : prev.developerAvatar,
                content: m.content,
                time: m.time,
                isMe: m.is_me,
              })),
            }
          })
          // Notify parent that messages have been read
          if (onRead) onRead(activeConv.id)
        } catch (err) {
          console.error('Failed to fetch messages:', err)
        }
      }
      fetchMessages()
    }
  }, [activeConv?.id, open])

  const sendMessage = async () => {
    if (!message.trim() || !activeConv) return
    const [clusterId, otherUserId] = activeConv.id.split('_')

    try {
      const sentMsg = await api.post<any>('/api/messages', {
        receiver_id: otherUserId,
        cluster_id: clusterId,
        content: message.trim(),
      })

      const newMsg: Message = {
        id: sentMsg.id,
        senderId: 'me',
        senderName: 'Me',
        senderAvatar: 'ME',
        content: sentMsg.content,
        time: sentMsg.time,
        isMe: true,
      }

      setActiveConv((prev) => {
        if (!prev) return null
        return {
          ...prev,
          messages: [...(prev.messages || []), newMsg],
        }
      })

      setLocalConvs((prev) =>
        prev.map((c) =>
          c.id === activeConv.id
            ? {
                ...c,
                lastMessage: newMsg.content,
                lastTime: 'Just now',
                unreadCount: 0,
              }
            : c
        )
      )
      // Notify parent that the conversation has been read after sending a message
      if (onRead && activeConv.id) onRead(activeConv.id)
      setMessage('')

      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
      }, 50)
    } catch (err) {
      console.error('Failed to send message:', err)
    }
  }

  if (!open) return null

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/40 z-40"
        onClick={onClose}
      />

      {/* Panel */}
      <div className="fixed right-0 top-0 h-full w-[380px] bg-[#0D0D15] border-l border-white/[0.08] z-50 flex flex-col">

        {/* Header */}
        <div className="flex items-center gap-3 px-4 py-4 border-b border-white/[0.06]">
          {activeConv && (
            <button onClick={() => setActiveConv(null)} className="text-slate-500 hover:text-slate-300 transition-colors">
              <ArrowLeft size={16} />
            </button>
          )}
          <div className="flex-1">
            <h2 className="text-sm font-medium text-white">
              {activeConv ? activeConv.developerName : 'Messages'}
            </h2>
            {activeConv && (
              <p className="text-[10px] text-slate-600 truncate">{activeConv.problemTitle}</p>
            )}
          </div>
          <button onClick={onClose} className="text-slate-500 hover:text-slate-300 transition-colors">
            <X size={16} />
          </button>
        </div>

        {/* Conversation List */}
        {!activeConv && (
          <div className="flex-1 overflow-y-auto">
            {localConvs.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center px-6">
                <p className="text-sm text-slate-500 mb-1">No messages yet</p>
                <p className="text-xs text-slate-600">When a developer claims your problem, you can chat here</p>
              </div>
            ) : (
              localConvs.map((conv) => (
                <button
                  key={conv.id}
                  onClick={() => setActiveConv(conv)}
                  className="w-full flex items-start gap-3 px-4 py-3.5 border-b border-white/[0.04] hover:bg-white/[0.03] transition-colors text-left"
                >
                  <div className="w-9 h-9 rounded-full bg-indigo-500/20 flex items-center justify-center text-xs font-semibold text-indigo-300 shrink-0">
                    {conv.developerAvatar}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-0.5">
                      <span className="text-xs font-medium text-slate-200">{conv.developerName}</span>
                      <span className="text-[10px] text-slate-600">{conv.lastTime}</span>
                    </div>
                    <p className="text-[11px] text-slate-500 truncate">{conv.lastMessage}</p>
                    <p className="text-[10px] text-slate-600 mt-0.5 truncate">{conv.problemTitle}</p>
                  </div>
                  {conv.unreadCount > 0 && (
                    <span className="bg-indigo-500 text-white text-[9px] font-semibold w-4 h-4 rounded-full flex items-center justify-center shrink-0 mt-1">
                      {conv.unreadCount}
                    </span>
                  )}
                </button>
              ))
            )}
          </div>
        )}

        {/* Chat Thread */}
        {activeConv && (
          <>
            <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
              {activeConv.messages.map((msg) => (
                <div key={msg.id} className={`flex items-end gap-2 ${msg.isMe ? 'flex-row-reverse' : ''}`}>
                  {!msg.isMe && (
                    <div className="w-6 h-6 rounded-full bg-indigo-500/20 flex items-center justify-center text-[9px] font-semibold text-indigo-300 shrink-0">
                      {msg.senderAvatar}
                    </div>
                  )}
                  <div
                    className={`max-w-[75%] px-3 py-2 rounded-xl text-xs leading-relaxed ${
                      msg.isMe
                        ? 'bg-indigo-600 text-white rounded-br-sm'
                        : 'bg-white/[0.06] text-slate-200 rounded-bl-sm'
                    }`}
                  >
                    {msg.content}
                    <div className={`text-[9px] mt-1 ${msg.isMe ? 'text-indigo-300' : 'text-slate-600'}`}>
                      {msg.time}
                    </div>
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>

            {/* Message input */}
            <div className="px-4 py-3 border-t border-white/[0.06]">
              <div className="flex items-center gap-2 bg-white/[0.05] border border-white/[0.08] rounded-xl px-3 py-2">
                <input
                  type="text"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage() } }}
                  placeholder="Type a message..."
                  className="flex-1 bg-transparent text-xs text-white placeholder:text-slate-600 outline-none"
                />
                <button
                  onClick={sendMessage}
                  disabled={!message.trim()}
                  className="text-indigo-400 hover:text-indigo-300 disabled:text-slate-700 transition-colors"
                  aria-label="Send message"
                >
                  <Send size={14} />
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </>
  )
}
