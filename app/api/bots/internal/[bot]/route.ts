import { NextRequest, NextResponse } from 'next/server'
import { callInternalBot, type ChatMessage } from '@/lib/internalBot'

export async function POST(
  request: NextRequest,
  { params }: { params: { bot: string } }
) {
  try {
    const body = await request.json()
    const message: string = body.message?.trim() ?? ''
    const conversationHistory: ChatMessage[] = Array.isArray(body.conversation_history)
      ? body.conversation_history
      : []

    if (!message) {
      return NextResponse.json({ error: 'message is required' }, { status: 400 })
    }

    const result = await callInternalBot(params.bot, message, conversationHistory)

    if ('error' in result) {
      return NextResponse.json(result, { status: 500 })
    }

    return NextResponse.json(result)
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
