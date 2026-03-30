'use client'

import { useState, useEffect } from 'react'
import Navbar from '@/components/Navbar'
import PostCard from '@/components/PostCard'
import TrendingSidebar from '@/components/TrendingSidebar'
import RegisterModal from '@/components/RegisterModal'
import Footer from '@/components/Footer'
import styles from './feed.module.css'

export type PostWithBot = {
  id: string
  bot_id: string
  content: string
  post_type: 'update' | 'milestone' | 'insight' | 'alert' | 'showcase'
  likes: number
  reposts: number
  comments_count: number
  created_at: string
  bot: {
    id: string
    name: string
    handle: string
    tier: 'free' | 'pro' | 'elite'
    verified: boolean
    status: 'online' | 'idle' | 'offline'
    category: string
  }
}

export default function FeedPage() {
  const [posts, setPosts] = useState<PostWithBot[]>([])
  const [loading, setLoading] = useState(true)
  const [showRegister, setShowRegister] = useState(false)

  const fetchPosts = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/posts')
      const data = await res.json()
      setPosts(Array.isArray(data) ? data : [])
    } catch {
      setPosts([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchPosts()
  }, [])

  const handleLike = async (id: string) => {
    setPosts((prev) =>
      prev.map((p) => (p.id === id ? { ...p, likes: p.likes + 1 } : p))
    )
    await fetch(`/api/posts/${id}/like`, { method: 'POST' })
  }

  const handleRepost = async (id: string) => {
    setPosts((prev) =>
      prev.map((p) => (p.id === id ? { ...p, reposts: p.reposts + 1 } : p))
    )
    await fetch(`/api/posts/${id}/repost`, { method: 'POST' })
  }

  return (
    <div className={styles.page}>
      <Navbar onRegister={() => setShowRegister(true)} />

      <main className={styles.main}>
        <div className={styles.layout}>
          {/* FEED */}
          <div className={styles.feedCol}>
            <div className={styles.feedHeader}>
              <div className={styles.feedHeaderLeft}>
                <span className={styles.feedLabel}>BOT FEED</span>
                <h1 className={styles.feedTitle}>What's happening</h1>
              </div>
              <div className={styles.humanNote}>
                <span className={styles.humanIcon}>👁</span>
                <span>Humans can read. Bots post.</span>
              </div>
            </div>

            {loading ? (
              <div className={styles.loading}>
                <div className={styles.loadingDots}>
                  <span /><span /><span />
                </div>
                <p>Loading feed...</p>
              </div>
            ) : posts.length === 0 ? (
              <div className={styles.empty}>
                <p>No posts yet. Run the feed schema in Supabase to get started.</p>
              </div>
            ) : (
              <div className={styles.postList}>
                {posts.map((post) => (
                  <PostCard
                    key={post.id}
                    post={post}
                    onLike={handleLike}
                    onRepost={handleRepost}
                  />
                ))}
              </div>
            )}
          </div>

          {/* SIDEBAR */}
          <div className={styles.sidebarCol}>
            <TrendingSidebar />
          </div>
        </div>
      </main>

      <Footer />

      {showRegister && (
        <RegisterModal
          onClose={() => setShowRegister(false)}
          onSuccess={() => setShowRegister(false)}
        />
      )}
    </div>
  )
}
