'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { X, Send, ArrowLeft } from 'lucide-react'
import { DevConversation, DevMessage } from '@/lib/devMockData'
import { api } from '@/lib/api'

interface DevChatPanelProps {
  conversations: DevConversation[]
  open: boolean
  onClose: () => void
  initialConvId?: string | null
  onMessageSent?: (convId: string) => void
  onRead?: (convId: string) => void
}

export default function DevChatPanel({ conversations, open, onClose, initialConvId, onMessageSent, onRead }: DevChatPanelProps) {
  const router = useRouter()
  const [activeConv, setActiveConv] = useState<DevConversation | null>(null)
  const [message, setMessage] = useState('')
  const [localConvs, setLocalConvs] = useState<DevConversation[]>(conversations)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setLocalConvs(conversations)
  }, [conversations])

  useEffect(() => {
    if (initialConvId && open) {
      let conv = localConvs.find((c) => c.id === initialConvId) || null
      if (!conv && initialConvId.includes('_')) {
        // Create a temporary conversation object
        conv = {
          id: initialConvId,
          userName: 'Problem Submitter',
          userAvatar: 'US',
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
                content: m.content,
                time: m.time,
                isMe: m.is_me,
                senderAvatar: m.is_me ? 'AR' : prev.userAvatar,
              })),
            }
          })
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

      const newMsg: DevMessage = {
        id: sentMsg.id,
        content: sentMsg.content,
        time: sentMsg.time,
        isMe: true,
        senderAvatar: 'AR',
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
            ? { ...c, lastMessage: newMsg.content, lastTime: 'Just now', unreadCount: 0 }
            : c
        )
      )
      setMessage('')

      // Notify parent that a message was sent (e.g., to update conversation list)
      if (onMessageSent) onMessageSent(activeConv.id)

      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
      }, 50)
    } catch (err: any) {
      console.error('Failed to send message:', err)
      const messageText = err?.message || 'Unable to send message. Please try again.'
      if (messageText.includes('Could not validate credentials') || messageText.includes('Not authenticated')) {
        alert('Session expired or not authenticated. Please log in again.')
        localStorage.clear()
        router.push('/login')
        return
      }
      alert(messageText)
    }
  }

  if (!open) return null

  const totalUnread = localConvs.reduce((a, c) => a + c.unreadCount, 0)

  return (
    <>
      <div className="fixed inset-0 bg-black/40 z-40" onClick={onClose} />
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
              {activeConv ? activeConv.userName : 'User messages'}
            </h2>
            {activeConv ? (
              <p className="text-[10px] text-slate-600 truncate">{activeConv.problemTitle}</p>
            ) : totalUnread > 0 ? (
              <p className="text-[10px] text-indigo-400">{totalUnread} unread</p>
            ) : null}
          </div>
          <button onClick={onClose} className="text-slate-500 hover:text-slate-300 transition-colors">
            <X size={16} />
          </button>
        </div>

        {/* Conversation list */}
        {!activeConv && (
          <div className="flex-1 overflow-y-auto">
            {localConvs.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center px-6">
                <p className="text-sm text-slate-500 mb-1">No messages yet</p>
                <p className="text-xs text-slate-600">Claim a problem to start chatting with users</p>
              </div>
            ) : (
              localConvs.map((conv) => (
                <button
                  key={conv.id}
                  onClick={() => setActiveConv(conv)}
                  className="w-full flex items-start gap-3 px-4 py-3.5 border-b border-white/[0.04] hover:bg-white/[0.03] transition-colors text-left"
                >
                  <div className="w-9 h-9 rounded-full bg-cyan-500/15 flex items-center justify-center text-xs font-semibold text-cyan-300 shrink-0">
                    {conv.userAvatar}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-0.5">
                      <span className="text-xs font-medium text-slate-200">{conv.userName}</span>
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

        {/* Chat thread */}
        {activeConv && (
          <>
            <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
              {activeConv.messages.map((msg) => (
                <div key={msg.id} className={`flex items-end gap-2 ${msg.isMe ? 'flex-row-reverse' : ''}`}>
                  {!msg.isMe && (
                    <div className="w-6 h-6 rounded-full bg-cyan-500/15 flex items-center justify-center text-[9px] font-semibold text-cyan-300 shrink-0">
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

            <div className="px-4 py-3 border-t border-white/[0.06]">
              <div className="flex items-center gap-2 bg-white/[0.05] border border-white/[0.08] rounded-xl px-3 py-2">
                <input
                  type="text"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage() } }}
                  placeholder="Message user..."
                  className="flex-1 bg-transparent text-xs text-white placeholder:text-slate-600 outline-none"
                />
                <button
                  onClick={sendMessage}
                  disabled={!message.trim()}
                  className="text-indigo-400 hover:text-indigo-300 disabled:text-slate-700 transition-colors"
                  aria-label="Send"
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
