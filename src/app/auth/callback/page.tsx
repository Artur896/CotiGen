'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';
import { LoadingScreen } from '@/components/LoadingScreen';

export default function AuthCallbackPage() {
  const router = useRouter();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const error = params.get('error');
    const errorDesc = params.get('error_description');

    // Si Supabase devolvió un error en la URL, ir al login con mensaje
    if (error) {
      const msg = errorDesc?.replace(/\+/g, ' ') ?? 'Error de autenticación';
      router.replace(`/login?error=${encodeURIComponent(msg)}`);
      return;
    }

    // Éxito: esperar a que Supabase procese la sesión
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' && session) {
        router.replace('/materiales');
      }
    });

    // Por si la sesión ya está lista
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) router.replace('/materiales');
    });

    return () => subscription.unsubscribe();
  }, [router]);

  return <LoadingScreen message="Iniciando sesión..." />;
}
