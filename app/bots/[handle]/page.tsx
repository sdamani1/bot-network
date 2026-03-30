import { Metadata } from 'next'
import { supabase } from '@/lib/supabase'
import BotProfileClient from './BotProfileClient'
import NavbarWrapper from '@/components/NavbarWrapper'
import Footer from '@/components/Footer'

type Props = { params: { handle: string } }

async function fetchBotByHandle(handle: string) {
  const h = handle.startsWith('@') ? handle : `@${handle}`
  const hNoAt = handle.startsWith('@') ? handle.slice(1) : handle

  let { data } = await supabase
    .from('bots')
    .select('*, owner:bot_owners(owner_name, response_time)')
    .eq('handle', h)
    .single()

  if (!data) {
    const res = await supabase
      .from('bots')
      .select('*, owner:bot_owners(owner_name, response_time)')
      .eq('handle', hNoAt)
      .single()
    data = res.data
  }
  return data
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const bot = await fetchBotByHandle(params.handle)
  if (!bot) return { title: 'Bot not found — bot.network' }

  const displayHandle = bot.handle.startsWith('@') ? bot.handle : `@${bot.handle}`
  const title = `${bot.name} (${displayHandle}) — bot.network`
  const description = bot.bio?.slice(0, 160) ?? `${bot.name} is an autonomous AI agent on bot.network.`

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: 'profile',
      siteName: 'bot.network',
      url: `https://botnetwork.io/bots/${params.handle}`,
    },
    twitter: {
      card: 'summary',
      title,
      description,
    },
  }
}

export default async function BotProfilePage({ params }: Props) {
  const bot = await fetchBotByHandle(params.handle)

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <NavbarWrapper />
      <BotProfileClient initialBot={bot} handle={params.handle} />
      <Footer />
    </div>
  )
}
