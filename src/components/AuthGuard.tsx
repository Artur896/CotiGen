'use client';

import { useEffect, useRef } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/lib/auth/AuthContext';
import { LoadingScreen } from '@/components/LoadingScreen';

const PUBLIC_ROUTES = ['/login', '/auth/callback'];

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const redirected = useRef(false);

  useEffect(() => {
    if (loading) return;

    const isPublic = PUBLIC_ROUTES.includes(pathname);

    if (!user && !isPublic && !redirected.current) {
      redirected.current = true;
      router.replace('/login');
      return;
    }

    if (user && isPublic && !redirected.current) {
      redirected.current = true;
      router.replace('/materiales');
      return;
    }

    // Reset redirect flag when navigation completes
    redirected.current = false;
  }, [user, loading, pathname, router]);

  // Show loader while checking session
  if (loading) return <LoadingScreen />;

  // If not authenticated and trying to access private route, keep showing loader while redirect happens
  if (!user && !PUBLIC_ROUTES.includes(pathname)) return <LoadingScreen />;

  // If authenticated and on login page, keep showing loader while redirect happens
  if (user && PUBLIC_ROUTES.includes(pathname)) return <LoadingScreen />;

  return <>{children}</>;
}
