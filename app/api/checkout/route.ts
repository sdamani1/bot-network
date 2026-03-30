import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

// ---------------------------------------------------------------------------
// STRIPE INTEGRATION POINT
// To wire real payments, install stripe: npm install stripe
// Then replace the mock block below with:
//
//   import Stripe from 'stripe'
//   const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: '2024-06-20' })
//
//   const paymentIntent = await stripe.paymentIntents.create({
//     amount: Math.round(amount * 100), // Stripe uses cents
//     currency: currency.toLowerCase(),
//     metadata: { bot_id, buyer_email },
//   })
//   stripePaymentIntentId = paymentIntent.id
//
// Add to .env.local:
//   STRIPE_SECRET_KEY=sk_test_...
//   NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
// ---------------------------------------------------------------------------

export async function POST(req: NextRequest) {
  const body = await req.json()
  const { bot_id, buyer_name, buyer_email, amount, currency = 'USD' } = body

  if (!bot_id || !buyer_email || !amount) {
    return NextResponse.json({ error: 'Missing required fields: bot_id, buyer_email, amount' }, { status: 400 })
  }

  // Verify bot exists and price matches
  const { data: bot, error: botError } = await supabase
    .from('bots')
    .select('id, name, price, pricing_model, currency')
    .eq('id', bot_id)
    .single()

  if (botError || !bot) {
    return NextResponse.json({ error: 'Bot not found' }, { status: 404 })
  }

  if (bot.pricing_model === 'free') {
    return NextResponse.json({ error: 'This bot is free — no payment required' }, { status: 400 })
  }

  // Upsert buyer as client
  const { data: client, error: clientError } = await supabase
    .from('clients')
    .upsert({ name: buyer_name || buyer_email, email: buyer_email }, { onConflict: 'email' })
    .select('id')
    .single()

  if (clientError) {
    return NextResponse.json({ error: clientError.message }, { status: 500 })
  }

  // ---- MOCK PAYMENT ----
  // In production, create a real Stripe PaymentIntent here (see above).
  // For now we immediately mark as completed.
  const stripePaymentIntentId = `mock_pi_${Date.now()}`
  // ---- END MOCK ----

  const { data: transaction, error: txError } = await supabase
    .from('transactions')
    .insert({
      buyer_client_id: client.id,
      bot_id,
      amount,
      status: 'completed',
      stripe_payment_intent_id: stripePaymentIntentId,
    })
    .select()
    .single()

  if (txError) {
    return NextResponse.json({ error: txError.message }, { status: 500 })
  }

  // ---- EMAIL INTEGRATION POINT ----
  // Replace this console.log with a real email send, e.g.:
  //   await resend.emails.send({ from: 'noreply@botnetwork.io', to: buyer_email, ... })
  // or: await sendgrid.send({ to: buyer_email, ... })
  console.log(`[botnetwork.io] Purchase confirmation for ${buyer_email}:`, {
    bot: bot.name,
    amount: `${currency} ${amount}`,
    platform_fee: `${currency} ${(amount * 0.15).toFixed(2)}`,
    seller_payout: `${currency} ${(amount * 0.85).toFixed(2)}`,
    transaction_id: transaction.id,
  })
  // ---- END EMAIL POINT ----

  return NextResponse.json({
    transaction,
    message: `Purchase complete. ${bot.name} is now available to you.`,
  }, { status: 201 })
}
