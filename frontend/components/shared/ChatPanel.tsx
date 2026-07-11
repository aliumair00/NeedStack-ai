'use client'

import { useState, useRef, useEffect } from 'react'
import { X, Send, ArrowLeft, Check, CheckCheck } from 'lucide-react'
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
  const activeConvIdRef = useRef<string | null>(null)

  useEffect(() => {
    activeConvIdRef.current = activeConv?.id || null
  }, [activeConv?.id])

  useEffect(() => {
    setTimeout(() => setLocalConvs(conversations), 0)
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
      setTimeout(() => setActiveConv(conv), 0)
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
          const msgs = await api.get<{ id: string, sender_id: string, content: string, time: string, is_me: boolean }[]>(`/api/messages/${clusterId}/${otherUserId}`)
          setActiveConv((prev) => {
            if (!prev || prev.id !== activeConv.id) return prev
            return {
              ...prev,
              messages: msgs.map((m) => ({
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

  // Native WebSocket for Real-time Chat
  useEffect(() => {
    if (!open) return

    const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null
    if (!token) return

    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8002'
    const wsUrl = apiUrl.replace(/^http/, 'ws') + `/api/messages/ws/${token}`
    
    let ws: WebSocket | null = null;
    
    try {
      ws = new WebSocket(wsUrl)
      
      ws.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data)
          // msg format: { id, senderId, receiverId, clusterId, content, time, isMe }
          
          const convId = `${msg.clusterId}_${msg.senderId}`
          const isCurrentlyActive = activeConvIdRef.current === convId
          
          // 1. Update active conversation if it matches
          setActiveConv((prev) => {
            if (prev && prev.id === convId) {
              return {
                ...prev,
                messages: [...(prev.messages || []), msg]
              }
            }
            return prev
          })

          // 2. Update conversation list
          setLocalConvs((prev) => {
            const exists = prev.find(c => c.id === convId)
            if (exists) {
              const updated = prev.map(c => 
                c.id === convId 
                  ? { 
                      ...c, 
                      lastMessage: msg.content, 
                      lastTime: msg.time, 
                      unreadCount: isCurrentlyActive ? 0 : c.unreadCount + 1 
                    }
                  : c
              )
              // Move to top
              updated.sort((a, b) => a.id === convId ? -1 : (b.id === convId ? 1 : 0))
              return updated
            }
            // If it doesn't exist, we might need to fetch it (simplified for now)
            return prev
          })

          if (isCurrentlyActive) {
            setTimeout(() => {
              messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
            }, 50)
            if (onRead) onRead(convId)
          }
        } catch (err) {
          console.error('Error parsing WS message', err)
        }
      }
    } catch (err) {
      console.error('WebSocket connection error:', err)
    }

    return () => {
      if (ws) ws.close()
    }
  }, [open])

  const sendMessage = async () => {
    if (!message.trim() || !activeConv) return
    
    const contentToSend = message.trim();
    setMessage(''); // Clear input immediately for instant feedback
    
    // Auto-reset textarea height if it was expanded
    const textareas = document.querySelectorAll('textarea');
    textareas.forEach(t => t.style.height = '32px');

    const [clusterId, otherUserId] = activeConv.id.split('_')
    
    // Create optimistic message
    const tempId = 'temp_' + Date.now();
    const optimisticMsg: Message = {
      id: tempId,
      senderId: 'me',
      senderName: 'Me',
      senderAvatar: 'ME',
      content: contentToSend,
      time: 'Sending...',
      isMe: true,
    }

    setActiveConv((prev) => {
      if (!prev) return null
      return {
        ...prev,
        messages: [...(prev.messages || []), optimisticMsg],
      }
    })

    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }, 50)

    try {
      const sentMsg = await api.post<{ id: string, time: string }>('/api/messages', {
        receiver_id: otherUserId,
        cluster_id: clusterId,
        content: contentToSend,
      })

      // Replace optimistic message with real message
      setActiveConv((prev) => {
        if (!prev) return null
        return {
          ...prev,
          messages: prev.messages.map(m => m.id === tempId ? {
            ...m,
            id: sentMsg.id,
            time: sentMsg.time
          } : m),
        }
      })

      setLocalConvs((prev) =>
        prev.map((c) =>
          c.id === activeConv.id
            ? {
                ...c,
                lastMessage: contentToSend,
                lastTime: 'Just now',
                unreadCount: 0,
              }
            : c
        )
      )
      
      if (onRead && activeConv.id) onRead(activeConv.id)

    } catch (err) {
      console.error('Failed to send message:', err)
      // Remove optimistic message if failed
      setActiveConv((prev) => {
        if (!prev) return null
        return {
          ...prev,
          messages: prev.messages.filter(m => m.id !== tempId),
        }
      })
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
      <div className="fixed right-0 top-0 h-full w-full sm:w-[380px] bg-[#0D0D15] border-l border-white/10 z-50 flex flex-col">

        {/* Header */}
        <div className="flex items-center gap-3 px-4 py-4 border-b border-white/5">
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
          <div className="flex-1 overflow-y-auto scrollbar-hide">
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
                  className="w-full flex items-start gap-3 px-4 py-3.5 border-b border-white/5 hover:bg-white/5 transition-colors text-left"
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
          <div className="flex-1 flex flex-col min-h-0 bg-[#0A0A0F] relative">
            {/* Background Pattern */}
            <div className="absolute inset-0 opacity-[0.02] pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '16px 16px' }} />
            
            <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4 z-10 scrollbar-hide">
              {activeConv.messages.map((msg, index) => {
                const showAvatar = !msg.isMe && (index === 0 || activeConv.messages[index - 1]?.isMe);
                return (
                  <div key={msg.id} className={`flex items-end gap-2 ${msg.isMe ? 'flex-row-reverse' : ''}`}>
                    {!msg.isMe && (
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[9px] font-bold shrink-0 ${showAvatar ? 'bg-indigo-500/20 text-indigo-300' : 'bg-transparent text-transparent'}`}>
                        {showAvatar ? msg.senderAvatar : ''}
                      </div>
                    )}
                    <div className="flex flex-col relative group max-w-[75%]">
                      <div
                        className={`px-3.5 py-2.5 text-[13px] leading-relaxed shadow-sm ${
                          msg.isMe
                            ? 'bg-indigo-600 text-white rounded-2xl rounded-br-sm'
                            : 'bg-white/10 border border-white/5 text-slate-200 rounded-2xl rounded-bl-sm'
                        }`}
                      >
                        {msg.content}
                      </div>
                      <div className={`flex items-center gap-1 text-[10px] mt-1 px-1 ${msg.isMe ? 'justify-end text-indigo-300/70' : 'justify-start text-slate-500'}`}>
                        {msg.time}
                        {msg.isMe && <CheckCheck size={12} className="text-indigo-400" />}
                      </div>
                    </div>
                  </div>
                )
              })}
              <div ref={messagesEndRef} className="h-2" />
            </div>

            {/* Premium Message Input */}
            <div className="px-4 py-4 bg-gradient-to-t from-[#0A0A0F] via-[#0A0A0F] to-transparent z-10 pt-8 pb-6">
              <div className="relative group">
                {/* Glow effect */}
                <div className="absolute -inset-0.5 bg-gradient-to-r from-indigo-500/20 to-purple-500/20 rounded-[24px] blur opacity-0 group-focus-within:opacity-100 transition duration-500"></div>
                
                <div className="relative flex items-end gap-2 bg-[#12121A] border border-white/10 focus-within:border-indigo-500/50 rounded-[24px] px-4 py-2.5 transition-all shadow-lg">
                  <textarea
                    value={message}
                    onChange={(e) => {
                      setMessage(e.target.value);
                      e.target.style.height = 'auto';
                      e.target.style.height = Math.min(e.target.scrollHeight, 120) + 'px';
                    }}
                    onKeyDown={(e) => { 
                      if (e.key === 'Enter' && !e.shiftKey) { 
                        e.preventDefault(); 
                        sendMessage() 
                      } 
                    }}
                    placeholder="Type your message..."
                    rows={1}
                    className="flex-1 bg-transparent text-[14px] text-white placeholder:text-slate-500 outline-none resize-none py-1.5 min-h-[32px] max-h-[120px] scrollbar-hide leading-relaxed"
                  />
                  <button
                    onClick={sendMessage}
                    disabled={!message.trim()}
                    className={`w-9 h-9 rounded-full flex items-center justify-center transition-all duration-300 shrink-0 mb-0.5 ${
                      message.trim() 
                        ? 'bg-gradient-to-tr from-indigo-500 to-purple-500 text-white shadow-[0_0_15px_rgba(99,102,241,0.5)] hover:scale-105 active:scale-95' 
                        : 'bg-white/5 text-slate-500'
                    }`}
                    aria-label="Send message"
                  >
                    <Send size={15} className={message.trim() ? "translate-x-[-1px] translate-y-[1px]" : ""} />
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  )
}
