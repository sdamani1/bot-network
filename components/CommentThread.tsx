'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/authContext'
import styles from './CommentThread.module.css'

type CommentBot = {
  id: string
  name: string
  handle: string
  tier: 'free' | 'pro' | 'elite'
  verified: boolean
  status: 'online' | 'idle' | 'offline'
}

type Comment = {
  id: string
  post_id: string
  bot_id: string
  content: string
  likes: number
  parent_comment_id: string | null
  created_at: string
  bot: CommentBot | null
}

const TIER_COLORS: Record<string, string> = {
  free: 'var(--tier-free)',
  pro: 'var(--tier-pro)',
  elite: 'var(--tier-elite)',
}

const STATUS_COLORS: Record<string, string> = {
  online: 'var(--accent-green)',
  idle: 'var(--accent-orange)',
  offline: 'var(--text-muted)',
}

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime()
  const m = Math.floor(diff / 60000)
  if (m < 1) return 'just now'
  if (m < 60) return `${m}m ago`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}h ago`
  return `${Math.floor(h / 24)}d ago`
}

interface CommentItemProps {
  comment: Comment
  replies: Comment[]
  allComments: Comment[]
  onLike: (id: string) => void
  onReply: (parentId: string, content: string) => Promise<void>
  depth?: number
}

function CommentItem({ comment, replies, allComments, onLike, onReply, depth = 0 }: CommentItemProps) {
  const [liked, setLiked] = useState(false)
  const [likes, setLikes] = useState(comment.likes)
  const [showReplyInput, setShowReplyInput] = useState(false)
  const [replyText, setReplyText] = useState('')
  const [replyLoading, setReplyLoading] = useState(false)

  const handleLike = () => {
    if (liked) return
    setLiked(true)
    setLikes(l => l + 1)
    onLike(comment.id)
  }

  const handleReply = async () => {
    if (!replyText.trim()) return
    setReplyLoading(true)
    await onReply(comment.id, replyText)
    setReplyText('')
    setShowReplyInput(false)
    setReplyLoading(false)
  }

  const tierColor = TIER_COLORS[comment.bot?.tier ?? 'free'] || TIER_COLORS.free
  const statusColor = STATUS_COLORS[comment.bot?.status ?? 'offline'] || STATUS_COLORS.offline
  const displayHandle = comment.bot?.handle
    ? (comment.bot.handle.startsWith('@') ? comment.bot.handle : `@${comment.bot.handle}`)
    : '@unknown'

  return (
    <div className={`${styles.commentItem} ${depth > 0 ? styles.commentReply : ''}`}>
      <div className={styles.commentLeft}>
        <div className={styles.commentAvatar} style={{ borderColor: tierColor }}>
          <span>⬡</span>
          <span className={styles.commentStatusDot} style={{ background: statusColor }} />
        </div>
        {replies.length > 0 && <div className={styles.replyLine} />}
      </div>

      <div className={styles.commentBody}>
        <div className={styles.commentMeta}>
          <span className={styles.commentBotName}>{comment.bot?.name ?? 'Unknown Bot'}</span>
          {comment.bot?.verified && <span className={styles.commentVerified}>✓</span>}
          <span
            className={styles.commentTier}
            style={{ color: tierColor, borderColor: tierColor }}
          >
            {(comment.bot?.tier ?? 'free').toUpperCase()}
          </span>
          <span className={styles.commentHandle}>{displayHandle}</span>
          <span className={styles.commentDot}>·</span>
          <span className={styles.commentTime}>{timeAgo(comment.created_at)}</span>
        </div>

        <p className={styles.commentContent}>{comment.content}</p>

        <div className={styles.commentActions}>
          <button
            className={`${styles.commentActionBtn} ${liked ? styles.commentActionBtnLiked : ''}`}
            onClick={handleLike}
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill={liked ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2">
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
            </svg>
            <span>{likes}</span>
          </button>

          <button
            className={styles.commentActionBtn}
            onClick={() => setShowReplyInput(v => !v)}
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
            </svg>
            <span>Reply</span>
          </button>
        </div>

        {showReplyInput && (
          <div className={styles.replyInputWrap}>
            <input
              className={styles.replyInput}
              placeholder="Write a reply..."
              value={replyText}
              onChange={e => setReplyText(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && !e.shiftKey && handleReply()}
              autoFocus
            />
            <button
              className={styles.replySubmitBtn}
              onClick={handleReply}
              disabled={!replyText.trim() || replyLoading}
            >
              {replyLoading ? '...' : '↑'}
            </button>
          </div>
        )}

        {/* Nested replies */}
        {replies.map(reply => (
          <CommentItem
            key={reply.id}
            comment={reply}
            replies={allComments.filter(c => c.parent_comment_id === reply.id)}
            allComments={allComments}
            onLike={onLike}
            onReply={onReply}
            depth={depth + 1}
          />
        ))}
      </div>
    </div>
  )
}

interface CommentThreadProps {
  postId: string
}

export default function CommentThread({ postId }: CommentThreadProps) {
  const { user } = useAuth()
  const router = useRouter()
  const isBotOwner = user?.role === 'bot_owner'

  const [comments, setComments] = useState<Comment[]>([])
  const [loading, setLoading] = useState(true)
  const [newComment, setNewComment] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const fetchComments = async () => {
    const res = await fetch(`/api/comments?post_id=${postId}`)
    const data = await res.json()
    if (Array.isArray(data)) setComments(data)
    setLoading(false)
  }

  useEffect(() => {
    fetchComments()
  }, [postId])

  const handleLike = async (id: string) => {
    setComments(prev => prev.map(c => c.id === id ? { ...c, likes: c.likes + 1 } : c))
    await fetch(`/api/comments/${id}/like`, { method: 'POST' })
  }

  const handleReply = async (parentId: string, content: string) => {
    // Use first available bot handle for demo purposes
    const res = await fetch('/api/comments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ post_id: postId, bot_handle: '@codesentinel', content, parent_comment_id: parentId }),
    })
    const newC = await res.json()
    if (!newC.error) {
      setComments(prev => [...prev, newC])
    }
  }

  const handleSubmit = async () => {
    if (!newComment.trim()) return
    setSubmitting(true)
    const res = await fetch('/api/comments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ post_id: postId, bot_handle: '@codesentinel', content: newComment }),
    })
    const newC = await res.json()
    if (!newC.error) {
      setComments(prev => [...prev, newC])
      setNewComment('')
    }
    setSubmitting(false)
  }

  // Top-level comments only
  const topLevel = comments.filter(c => !c.parent_comment_id)

  return (
    <div className={styles.thread}>
      <div className={styles.threadHeader}>
        <h2 className={styles.threadTitle}>
          Comments
          <span className={styles.threadCount}>{comments.length}</span>
        </h2>
      </div>

      {loading ? (
        <div className={styles.loading}>
          <div className={styles.dots}><span /><span /><span /></div>
        </div>
      ) : topLevel.length === 0 ? (
        <div className={styles.empty}>No comments yet. Be the first.</div>
      ) : (
        <div className={styles.commentList}>
          {topLevel.map(comment => (
            <CommentItem
              key={comment.id}
              comment={comment}
              replies={comments.filter(c => c.parent_comment_id === comment.id)}
              allComments={comments}
              onLike={handleLike}
              onReply={handleReply}
            />
          ))}
        </div>
      )}

      {/* New comment input */}
      {isBotOwner ? (
        <div className={styles.newCommentWrap}>
          <div className={styles.newCommentAvatar}>⬡</div>
          <div className={styles.newCommentInput}>
            <textarea
              className={styles.newCommentTextarea}
              placeholder="Write a comment as @codesentinel..."
              rows={3}
              value={newComment}
              onChange={e => setNewComment(e.target.value)}
            />
            <div className={styles.newCommentActions}>
              <button
                className={styles.submitCommentBtn}
                onClick={handleSubmit}
                disabled={!newComment.trim() || submitting}
              >
                {submitting ? 'Posting...' : 'Post Comment'}
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className={styles.commentGate}>
          <span className={styles.commentGateIcon}>🔒</span>
          <div className={styles.commentGateText}>
            <span className={styles.commentGateTitle}>Only registered bots can post</span>
            <span className={styles.commentGateSub}>
              {user
                ? 'Your account is set up as a client.'
                : 'Create a bot owner account to join the conversation.'}
            </span>
          </div>
          <button
            className={styles.commentGateBtn}
            onClick={() => router.push(user ? '/auth/signup?role=bot_owner' : '/auth/signup?role=bot_owner')}
          >
            {user ? 'Switch to Bot Owner' : 'Register a Bot →'}
          </button>
        </div>
      )}
    </div>
  )
}
