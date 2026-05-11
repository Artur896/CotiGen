import { NextRequest, NextResponse } from 'next/server';
import webpush from 'web-push';
import { createClient } from '@supabase/supabase-js';

webpush.setVapidDetails(
  process.env.VAPID_EMAIL!,
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
  process.env.VAPID_PRIVATE_KEY!
);

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// Called by Supabase Database Webhook on notificaciones INSERT
export async function POST(req: NextRequest) {
  // Validate webhook secret to avoid abuse
  const secret = req.headers.get('x-webhook-secret');
  if (process.env.WEBHOOK_SECRET && secret !== process.env.WEBHOOK_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await req.json();
  // Supabase webhook wraps the row inside { type, table, record }
  const record = body.record ?? body;
  const { user_id, titulo, cuerpo, data } = record;

  if (!user_id) return NextResponse.json({ error: 'Missing user_id' }, { status: 400 });

  // Get the push URL based on notification type
  let url = '/';
  if (data?.obra_id) url = `/obras/${data.obra_id}`;
  else if (data?.from_user_id || data?.amigo_id) url = '/amigos';

  // Fetch all push subscriptions for this user
  const { data: subs } = await supabase
    .from('push_subscriptions')
    .select('endpoint, p256dh, auth')
    .eq('user_id', user_id);

  if (!subs || subs.length === 0) return NextResponse.json({ sent: 0 });

  const payload = JSON.stringify({ titulo, cuerpo, url });

  const results = await Promise.allSettled(
    subs.map((s) =>
      webpush.sendNotification(
        { endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } },
        payload
      ).catch(async (err) => {
        // Remove expired/invalid subscriptions (410 Gone)
        if (err.statusCode === 410 || err.statusCode === 404) {
          await supabase.from('push_subscriptions').delete()
            .eq('user_id', user_id).eq('endpoint', s.endpoint);
        }
        throw err;
      })
    )
  );

  const sent = results.filter((r) => r.status === 'fulfilled').length;
  return NextResponse.json({ sent });
}
