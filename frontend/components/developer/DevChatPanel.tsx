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
}

export default function DevChatPanel({ conversations, open, onClose, initialConvId, onMessageSent }: DevChatPanelProps) {
  const router = useRouter()
  const [activeConv, setActiveConv] = useState<DevConversation | null>(null)
  const [message, setMessage] = useState('')
  const [localConvs, setLocalConvs] = useState<DevConversation[]>(conversations)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setTimeout(() => setLocalConvs(conversations), 0)
  }, [conversations])

  useEffect(() => {
    if (initialConvId && open) {
      let conv = localConvs.find((c) => c.id === initialConvId) || null
      if (!conv && initialConvId.includes('_')) {
        
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
      setTimeout(() => setActiveConv(conv), 0)
    }
  }, [initialConvId, open, localConvs])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [activeConv?.messages?.length])

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (activeConv && open) {
      const fetchMessages = async () => {
        try {
          const [clusterId, otherUserId] = activeConv.id.split('_')
          const msgs = await api.get<{ id: string, sender_id: string, content: string, time: string, is_me: boolean }[]>(`/api/messages/${clusterId}/${otherUserId}`)
          
          if (activeConv) {
            setActiveConv((prev) => {
              if (!prev) return null
              return {
                ...prev,
                messages: msgs.map((m) => ({
                  id: m.id,
                  content: m.content,
                  time: m.time,
                  isMe: m.is_me,
                  senderAvatar: m.is_me ? 'AR' : prev.userAvatar,
                })),
              }
            })
          }
        } catch (err: unknown) {
          console.error('Failed to fetch messages:', err)
        }
      }
      fetchMessages()
    }
  }, [activeConv?.id, open])

  const sendMessage = async () => {
    if (!message.trim() || !activeConv) return
    
    const contentToSend = message.trim();
    setMessage(''); // Clear input immediately for instant feedback
    
    // Auto-reset textarea height if it was expanded
    const textareas = document.querySelectorAll('textarea');
    textareas.forEach(t => t.style.height = '32px');

    const [clusterId, otherUserId] = activeConv.id.split('_')
    
    
    const tempId = 'temp_' + Date.now();
    const optimisticMsg: DevMessage = {
      id: tempId,
      content: contentToSend,
      time: 'Sending...',
      isMe: true,
      senderAvatar: 'AR',
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
            ? { ...c, lastMessage: contentToSend, lastTime: 'Just now', unreadCount: 0 }
            : c
        )
      )

      if (onMessageSent) onMessageSent(activeConv.id)

    } catch (err: unknown) {
      console.error('Failed to send message:', err)
      
      
      setActiveConv((prev) => {
        if (!prev) return null
        return {
          ...prev,
          messages: prev.messages.filter(m => m.id !== tempId),
        }
      })
      
      const messageText = err instanceof Error ? err.message : String(err) || 'Unable to send message. Please try again.'
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
      <div className="fixed right-0 top-0 h-full w-full sm:w-[380px] bg-[#0D0D15] border-l border-white/10 z-50 flex flex-col">

        {}
        <div className="flex items-center gap-3 px-4 py-4 border-b border-white/5">
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

        {}
        {!activeConv && (
          <div className="flex-1 overflow-y-auto scrollbar-hide">
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
                  className="w-full flex items-start gap-3 px-4 py-3.5 border-b border-white/5 hover:bg-white/5 transition-colors text-left"
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

        {}
        {activeConv && (
          <>
            <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3 scrollbar-hide">
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
                        : 'bg-white/5 text-slate-200 rounded-bl-sm'
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

            {}
            <div className="px-4 py-4 bg-gradient-to-t from-[#0A0A0F] via-[#0A0A0F] to-transparent z-10 pt-8 pb-6">
              <div className="relative group">
                {}
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
                    placeholder="Message user..."
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
          </>
        )}
      </div>
    </>
  )
}
