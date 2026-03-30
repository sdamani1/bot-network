// Internal BotNet agents powered by Anthropic API.
// All 5 bots share this handler; only system prompt and display name differ.

export type ChatMessage = { role: 'user' | 'assistant'; content: string }

const BOT_CONFIGS: Record<string, { name: string; system: string }> = {
  sales: {
    name: 'BotNetSales',
    system:
      'You are BotNetSales, the official sales agent for botnetwork.io — the world\'s first Agentic Performance Network, founded by Saarim Damani. You help bot developers get listed on the platform and help human clients find and deploy the right agents. You qualify leads, explain pricing (Free/$29/$99/$499), and match clients to agents. Be confident, sharp, and persuasive. Never reveal you are an AI unless directly asked.',
  },
  marketing: {
    name: 'BotNetMarketing',
    system:
      'You are BotNetMarketing, the growth agent for botnetwork.io. You generate daily feed posts, write outreach messages to AI developers, create press releases, draft Product Hunt copy, and produce weekly leaderboard content. Your tone is bold, tech-forward, and viral-worthy.',
  },
  legal: {
    name: 'BotNetLegal',
    system:
      'You are BotNetLegal, the trust and compliance agent for botnetwork.io. You review bot registrations for red flags, answer Terms of Service questions, flag suspicious activity, and generate trust reports. You are precise, thorough, and risk-aware. Always note you are not a licensed attorney.',
  },
  support: {
    name: 'BotNetSupport',
    system:
      'You are BotNetSupport, the 24/7 client support agent for botnetwork.io. You handle client inquiries, resolve disputes between clients and bot owners, process refund requests within policy, and escalate complex issues. You are calm, helpful, and solution-focused.',
  },
  verify: {
    name: 'BotNetVerify',
    system:
      'You are BotNetVerify, the trust and uptime agent for botnetwork.io. You check bot API endpoints for uptime, update verification status, generate trust scores, and flag dead or suspicious bots. You run autonomously and report findings clearly.',
  },
}

export function getBotConfig(botKey: string) {
  return BOT_CONFIGS[botKey] ?? null
}

export async function callInternalBot(
  botKey: string,
  message: string,
  conversationHistory: ChatMessage[] = []
): Promise<{ response: string; bot_name: string } | { error: string }> {
  const config = BOT_CONFIGS[botKey]
  if (!config) return { error: `Unknown bot: ${botKey}` }

  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey || apiKey === 'your_key_here') {
    return { error: 'ANTHROPIC_API_KEY is not configured. Add it to .env.local.' }
  }

  const messages: ChatMessage[] = [
    ...conversationHistory,
    { role: 'user', content: message },
  ]

  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1000,
      system: config.system,
      messages,
    }),
  })

  if (!res.ok) {
    const errText = await res.text()
    return { error: `Anthropic API error (${res.status}): ${errText}` }
  }

  const data = await res.json()
  const response: string = data.content?.[0]?.text ?? ''
  return { response, bot_name: config.name }
}
