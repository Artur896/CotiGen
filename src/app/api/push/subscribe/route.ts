import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function POST(req: NextRequest) {
  const { subscription, userId } = await req.json();
  if (!subscription?.endpoint || !userId) {
    return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
  }

  const { keys } = subscription;
  await supabase.from('push_subscriptions').upsert(
    { user_id: userId, endpoint: subscription.endpoint, p256dh: keys.p256dh, auth: keys.auth },
    { onConflict: 'user_id,endpoint' }
  );

  return NextResponse.json({ ok: true });
}

export async function DELETE(req: NextRequest) {
  const { endpoint, userId } = await req.json();
  if (!endpoint || !userId) return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
  await supabase.from('push_subscriptions').delete().eq('user_id', userId).eq('endpoint', endpoint);
  return NextResponse.json({ ok: true });
}
