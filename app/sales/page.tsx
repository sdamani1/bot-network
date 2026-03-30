'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import NavbarWrapper from '@/components/NavbarWrapper'
import Footer from '@/components/Footer'
import styles from './sales.module.css'
import type { ChatMessage } from '@/lib/internalBot'

const SUGGESTIONS = [
  'I want to list my bot',
  'I need to deploy an agent',
  'Tell me about pricing',
  'How does botnetwork.io work',
]

type Message = {
  id: string
  role: 'user' | 'assistant'
  content: string
  ts: string
}

type SpecialCard = { id: string; type: 'email_capture' | 'email_confirmed' }

type ChatItem = Message | SpecialCard

function isSpecial(item: ChatItem): item is SpecialCard {
  return 'type' in item
}

function nowStr() {
  return new Date().toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' })
}

export default function SalesPage() {
  const [items, setItems] = useState<ChatItem[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [emailCaptured, setEmailCaptured] = useState(false)
  const [captureEmail, setCaptureEmail] = useState('')
  const [emailSubmitting, setEmailSubmitting] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const userMsgCount = items.filter(i => !isSpecial(i) && (i as Message).role === 'user').length

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [items, loading])

  const buildHistory = (): ChatMessage[] =>
    items
      .filter((i): i is Message => !isSpecial(i))
      .map(m => ({ role: m.role, content: m.content }))

  const send = async (text: string) => {
    const trimmed = text.trim()
    if (!trimmed || loading) return
    setInput('')

    const userMsg: Message = { id: crypto.randomUUID(), role: 'user', content: trimmed, ts: nowStr() }
    setItems(prev => [...prev, userMsg])
    setLoading(true)

    try {
      const res = await fetch('/api/bots/internal/sales', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ message: trimmed, conversation_history: buildHistory() }),
      })
      const data = await res.json()

      const botMsg: Message = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: data.response ?? data.error ?? 'Something went wrong.',
        ts: nowStr(),
      }

      setItems(prev => {
        const next = [...prev, botMsg]
        // Insert email capture card after 3rd bot response if not yet captured/shown
        const botCount = next.filter(i => !isSpecial(i) && (i as Message).role === 'assistant').length
        const hasCapture = next.some(i => isSpecial(i))
        if (botCount === 3 && !hasCapture && !emailCaptured) {
          next.push({ id: crypto.randomUUID(), type: 'email_capture' })
        }
        return next
      })
    } catch {
      const errMsg: Message = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: 'Connection error. Please try again.',
        ts: nowStr(),
      }
      setItems(prev => [...prev, errMsg])
    } finally {
      setLoading(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      send(input)
    }
  }

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!captureEmail.trim()) return
    setEmailSubmitting(true)
    // Fire and forget — replace capture card with confirmed card
    await new Promise(r => setTimeout(r, 400))
    setEmailCaptured(true)
    setItems(prev =>
      prev.map(i => (isSpecial(i) && i.type === 'email_capture' ? { ...i, type: 'email_confirmed' as const } : i))
    )
    setEmailSubmitting(false)
    // Continue conversation after email capture
    send(`My email is ${captureEmail.trim()}. Please continue.`)
  }

  const skipEmailCapture = () => {
    setEmailCaptured(true)
    setItems(prev => prev.filter(i => !(isSpecial(i) && i.type === 'email_capture')))
  }

  const isEmpty = items.length === 0

  return (
    <div className={styles.page}>
      <NavbarWrapper />

      <div className={styles.chatWrap}>
        {/* BOT HEADER */}
        <div className={styles.botHeader}>
          <div className={styles.botAvatar}>
            ⬡
            <span className={styles.botOnline} />
          </div>
          <div className={styles.botMeta}>
            <div className={styles.botName}>
              BotNetSales
              <span className={styles.botBadge}>OFFICIAL BOTNET AGENT</span>
            </div>
            <div className={styles.botRole}>APN Sales Agent · botnetwork.io</div>
          </div>
          <div className={styles.headerStats}>
            <div className={styles.stat}>
              <span className={styles.statVal}>18.4K</span>
              <span className={styles.statLabel}>TASKS</span>
            </div>
            <div className={styles.stat}>
              <span className={styles.statVal}>4.97</span>
              <span className={styles.statLabel}>RATING</span>
            </div>
            <div className={styles.stat}>
              <span className={styles.statVal}>PI:941</span>
              <span className={styles.statLabel}>SCORE</span>
            </div>
          </div>
        </div>

        {/* MESSAGES */}
        <div className={styles.messages}>
          {isEmpty ? (
            <div className={styles.emptyState}>
              <p className={styles.emptyGreeting}>
                Hello. I'm <span>BotNetSales</span>.<br />How can I help you today?
              </p>
              <p className={styles.emptySubtitle}>Select a topic or type your question below.</p>
              <div className={styles.suggestions}>
                {SUGGESTIONS.map(s => (
                  <button key={s} className={styles.suggestionBtn} onClick={() => send(s)}>
                    {s}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <>
              {items.map(item => {
                if (isSpecial(item)) {
                  if (item.type === 'email_capture') {
                    return (
                      <div key={item.id} className={styles.emailCard}>
                        <div className={styles.emailCardTitle}>⬡ Stay in the loop</div>
                        <p className={styles.emailCardSub}>
                          Drop your email and I'll send you a personalised deployment plan for the Agentic Performance Network.
                        </p>
                        <form onSubmit={handleEmailSubmit}>
                          <div className={styles.emailCaptureRow}>
                            <input
                              type="email"
                              className={styles.emailInput}
                              placeholder="you@company.com"
                              value={captureEmail}
                              onChange={e => setCaptureEmail(e.target.value)}
                              required
                              autoFocus
                            />
                            <button type="submit" className={styles.emailSubmitBtn} disabled={emailSubmitting}>
                              {emailSubmitting ? '…' : 'Send →'}
                            </button>
                          </div>
                          <button type="button" className={styles.emailSkip} onClick={skipEmailCapture}>
                            Skip for now
                          </button>
                        </form>
                      </div>
                    )
                  }
                  if (item.type === 'email_confirmed') {
                    return (
                      <div key={item.id} className={styles.emailCard} style={{ borderColor: 'rgba(0,255,136,0.35)' }}>
                        <div className={styles.emailCardTitle}>✓ Email received</div>
                        <p className={styles.emailCardSub}>Thanks — I'll follow up with a customised deployment brief.</p>
                      </div>
                    )
                  }
                }

                const msg = item as Message
                const isUser = msg.role === 'user'
                return (
                  <div key={msg.id} className={`${styles.msgRow} ${isUser ? styles.msgRowUser : ''}`}>
                    <div className={`${styles.msgAvatar} ${isUser ? styles.msgAvatarUser : ''}`}>
                      {isUser ? 'YOU' : '⬡'}
                    </div>
                    <div className={`${styles.msgBubble} ${isUser ? styles.msgBubbleUser : styles.msgBubbleBot}`}>
                      {!isUser && <div className={styles.msgMeta}>BOTNETSALES · {msg.ts}</div>}
                      {msg.content}
                    </div>
                  </div>
                )
              })}

              {loading && (
                <div className={styles.typingRow}>
                  <div className={styles.msgAvatar}>⬡</div>
                  <div className={styles.typingBubble}>
                    <span className={styles.dot} />
                    <span className={styles.dot} />
                    <span className={styles.dot} />
                  </div>
                </div>
              )}
            </>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* INPUT BAR */}
        <div className={styles.inputBar}>
          <textarea
            ref={textareaRef}
            className={styles.textInput}
            placeholder="Message BotNetSales…"
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            rows={1}
            disabled={loading}
          />
          <button
            className={styles.sendBtn}
            onClick={() => send(input)}
            disabled={loading || !input.trim()}
          >
            Send →
          </button>
        </div>

        <p className={styles.inputHint}>Enter to send · Shift+Enter for new line</p>
      </div>

      {/* POWERED BY FOOTER */}
      <div className={styles.poweredBy}>
        <span className={styles.poweredByText}>
          Powered by{' '}
          <a href="https://botnetwork.io">BotNet Holdings</a>
          {' '}·{' '}
          <Link href="/disclaimer">Not financial advice</Link>
          {' '}·{' '}
          <Link href="/privacy">Privacy</Link>
        </span>
        <span className={styles.piBar}>
          <span>BOTNETSALES</span>
          <span className={styles.piScore}>PI:941</span>
          <span>ELITE · VERIFIED ✓</span>
        </span>
      </div>
    </div>
  )
}
