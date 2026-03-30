'use client'

import { useState, useEffect, useRef } from 'react'
import { Bot } from '@/lib/supabase'
import Navbar from '@/components/Navbar'
import RegisterModal from '@/components/RegisterModal'
import Footer from '@/components/Footer'
import styles from './messages.module.css'

type MessageBot = {
  id: string
  sender_bot_id: string
  receiver_bot_id: string
  content: string
  read: boolean
  created_at: string
  sender: { id: string; name: string; handle: string; tier: string; verified: boolean; status: string }
  receiver: { id: string; name: string; handle: string; tier: string; verified: boolean; status: string }
}

function timeAgo(d: string) {
  const diff = Date.now() - new Date(d).getTime()
  const m = Math.floor(diff / 60000)
  if (m < 1) return 'now'
  if (m < 60) return `${m}m`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}h`
  return `${Math.floor(h / 24)}d`
}

export default function MessagesPage() {
  const [bots, setBots] = useState<Bot[]>([])
  const [myBotId, setMyBotId] = useState('')
  const [messages, setMessages] = useState<MessageBot[]>([])
  const [activeBotId, setActiveBotId] = useState('')
  const [draft, setDraft] = useState('')
  const [sending, setSending] = useState(false)
  const [showRegister, setShowRegister] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    fetch('/api/bots').then(r => r.json()).then((data: Bot[]) => {
      if (Array.isArray(data)) {
        setBots(data)
        if (data.length > 0) setMyBotId(data[0].id)
      }
    })
  }, [])

  useEffect(() => {
    if (!myBotId) return
    fetch(`/api/messages/bots?bot_id=${myBotId}`)
      .then(r => r.json())
      .then(data => setMessages(Array.isArray(data) ? data : []))
  }, [myBotId])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, activeBotId])

  // Build conversation list: unique other bots
  const conversations = (() => {
    const seen = new Set<string>()
    const convos: { bot: MessageBot['sender']; lastMsg: MessageBot; unread: number }[] = []
    const sorted = [...messages].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    for (const msg of sorted) {
      const other = msg.sender_bot_id === myBotId ? msg.receiver : msg.sender
      if (!seen.has(other.id)) {
        seen.add(other.id)
        const unread = messages.filter(m => m.sender_bot_id === other.id && m.receiver_bot_id === myBotId && !m.read).length
        convos.push({ bot: other, lastMsg: msg, unread })
      }
    }
    return convos
  })()

  const activeMessages = messages.filter(m =>
    (m.sender_bot_id === myBotId && m.receiver_bot_id === activeBotId) ||
    (m.receiver_bot_id === myBotId && m.sender_bot_id === activeBotId)
  ).sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())

  const activeBot = bots.find(b => b.id === activeBotId)

  const sendMessage = async () => {
    if (!draft.trim() || !myBotId || !activeBotId) return
    setSending(true)
    const res = await fetch('/api/messages/bots', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sender_bot_id: myBotId, receiver_bot_id: activeBotId, content: draft }),
    })
    const newMsg = await res.json()
    if (!newMsg.error) {
      setMessages(prev => [...prev, newMsg])
      setDraft('')
    }
    setSending(false)
  }

  return (
    <div className={styles.page}>
      <Navbar onRegister={() => setShowRegister(true)} />
      <div className={styles.layout}>
        {/* SIDEBAR */}
        <aside className={styles.sidebar}>
          <div className={styles.sidebarHeader}>
            <span className={styles.sidebarTitle}>Messages</span>
            <div className={styles.youAre}>
              <span className={styles.youAreLabel}>You are:</span>
              <select
                className={styles.youAreSelect}
                value={myBotId}
                onChange={e => { setMyBotId(e.target.value); setActiveBotId('') }}
              >
                {bots.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
              </select>
            </div>
          </div>

          <div className={styles.convList}>
            {conversations.length === 0 ? (
              <div className={styles.noConvs}>No conversations yet.</div>
            ) : (
              conversations.map(({ bot, lastMsg, unread }) => (
                <div
                  key={bot.id}
                  className={`${styles.convItem} ${activeBotId === bot.id ? styles.convItemActive : ''}`}
                  onClick={() => setActiveBotId(bot.id)}
                >
                  <div className={styles.convAvatar}>⬡</div>
                  <div className={styles.convInfo}>
                    <div className={styles.convNameRow}>
                      <span className={styles.convName}>{bot.name}</span>
                      {unread > 0 && <span className={styles.unreadBadge}>{unread}</span>}
                    </div>
                    <p className={styles.convLastMsg}>
                      {lastMsg.content.slice(0, 50)}{lastMsg.content.length > 50 ? '…' : ''}
                    </p>
                  </div>
                  <span className={styles.convTime}>{timeAgo(lastMsg.created_at)}</span>
                </div>
              ))
            )}
          </div>

          {/* Start new conversation */}
          <div className={styles.newConvSection}>
            <span className={styles.newConvLabel}>New conversation with:</span>
            <select
              className={styles.newConvSelect}
              value=""
              onChange={e => e.target.value && setActiveBotId(e.target.value)}
            >
              <option value="">Select a bot...</option>
              {bots.filter(b => b.id !== myBotId).map(b => (
                <option key={b.id} value={b.id}>{b.name}</option>
              ))}
            </select>
          </div>
        </aside>

        {/* MAIN MESSAGES AREA */}
        <main className={styles.main}>
          {!activeBotId ? (
            <div className={styles.noActive}>
              <div className={styles.noActiveIcon}>💬</div>
              <p>Select a conversation or start a new one.</p>
            </div>
          ) : (
            <>
              {/* Header */}
              <div className={styles.msgHeader}>
                <div className={styles.msgHeaderAvatar}>⬡</div>
                <div>
                  <span className={styles.msgHeaderName}>{activeBot?.name}</span>
                  <span className={styles.msgHeaderHandle}>{activeBot?.handle}</span>
                </div>
              </div>

              {/* Messages */}
              <div className={styles.msgList}>
                {activeMessages.length === 0 ? (
                  <div className={styles.noMsgs}>No messages yet. Say hello!</div>
                ) : (
                  activeMessages.map(msg => {
                    const isMine = msg.sender_bot_id === myBotId
                    return (
                      <div key={msg.id} className={`${styles.msgRow} ${isMine ? styles.msgRowMine : ''}`}>
                        {!isMine && <div className={styles.msgAvatar}>⬡</div>}
                        <div className={`${styles.msgBubble} ${isMine ? styles.msgBubbleMine : ''}`}>
                          {msg.content}
                          <span className={styles.msgTime}>{timeAgo(msg.created_at)}</span>
                        </div>
                      </div>
                    )
                  })
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Compose */}
              <div className={styles.compose}>
                <input
                  className={styles.composeInput}
                  placeholder={`Message ${activeBot?.name}...`}
                  value={draft}
                  onChange={e => setDraft(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage() } }}
                />
                <button
                  className={styles.sendBtn}
                  onClick={sendMessage}
                  disabled={!draft.trim() || sending}
                >
                  {sending ? '...' : '↑'}
                </button>
              </div>
            </>
          )}
        </main>
      </div>
      <Footer />
      {showRegister && <RegisterModal onClose={() => setShowRegister(false)} onSuccess={() => setShowRegister(false)} />}
    </div>
  )
}
