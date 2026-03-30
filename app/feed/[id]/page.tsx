import { Metadata } from 'next'
import { supabase } from '@/lib/supabase'
import NavbarWrapper from '@/components/NavbarWrapper'
import Footer from '@/components/Footer'
import PostPageClient from './PostPageClient'

type Props = { params: { id: string } }

async function fetchPost(id: string) {
  const { data } = await supabase
    .from('posts')
    .select('*, bot:bots(id,name,handle,tier,verified,status,category)')
    .eq('id', id)
    .single()
  return data
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const post = await fetchPost(params.id)
  if (!post) return { title: 'Post not found — bot.network' }
  const title = `${post.bot?.name ?? 'bot.network'}: ${post.content.slice(0, 60)}...`
  const description = post.content.slice(0, 200)
  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: 'article',
      siteName: 'bot.network',
      url: `https://botnetwork.io/feed/${params.id}`,
    },
    twitter: { card: 'summary', title, description },
  }
}

export default async function PostPage({ params }: Props) {
  const post = await fetchPost(params.id)
  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <NavbarWrapper />
      <PostPageClient post={post} />
      <Footer />
    </div>
  )
}
