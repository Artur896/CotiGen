'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/lib/auth/AuthContext';
import { FileText, Eye, EyeOff } from 'lucide-react';

function GoogleIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
    </svg>
  );
}

type Mode = 'login' | 'register';

export default function LoginPage() {
  const { signIn, signUp, signInWithGoogle } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const urlError = searchParams.get('error');
    if (urlError) setError(decodeURIComponent(urlError));
  }, [searchParams]);

  const [mode, setMode] = useState<Mode>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [nombre, setNombre] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadingGoogle, setLoadingGoogle] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async () => {
    if (!email.trim() || !password.trim()) { setError('Completa todos los campos.'); return; }
    if (mode === 'register' && !nombre.trim()) { setError('Escribe tu nombre.'); return; }
    if (password.length < 6) { setError('La contraseña debe tener al menos 6 caracteres.'); return; }

    setLoading(true);
    setError('');

    const result = mode === 'login'
      ? await signIn(email.trim(), password)
      : await signUp(email.trim(), password, nombre.trim());

    setLoading(false);

    if (result.error) {
      setError(result.error);
    } else {
      router.replace('/');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center px-5"
         style={{ paddingTop: 'env(safe-area-inset-top)', paddingBottom: 'env(safe-area-inset-bottom)' }}>
      <div className="w-full max-w-sm space-y-6">

        {/* Logo */}
        <div className="text-center mb-2">
          <div className="w-20 h-20 bg-emerald-600 rounded-3xl flex items-center justify-center mx-auto mb-5 shadow-xl shadow-emerald-200">
            <FileText size={36} className="text-white" />
          </div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">CotiGen</h1>
          <p className="text-slate-400 text-sm mt-1">
            {mode === 'login' ? 'Inicia sesión para continuar' : 'Crea tu cuenta'}
          </p>
        </div>

        {/* Google button */}
        <button
          onClick={async () => {
            setLoadingGoogle(true);
            setError('');
            const result = await signInWithGoogle();
            if (result.error) setError(result.error);
            setLoadingGoogle(false);
          }}
          disabled={loadingGoogle}
          className="w-full flex items-center justify-center gap-3 bg-white border-2 border-slate-200 active:border-slate-300 rounded-2xl py-3.5 font-bold text-slate-700 btn-press disabled:opacity-60 shadow-sm"
        >
          {loadingGoogle ? (
            <span className="w-5 h-5 border-2 border-slate-300 border-t-slate-600 rounded-full animate-spin" />
          ) : (
            <GoogleIcon />
          )}
          Continuar con Google
        </button>

        {/* Divider */}
        <div className="flex items-center gap-3">
          <div className="flex-1 h-px bg-slate-200" />
          <span className="text-xs text-slate-400 font-medium">o con correo</span>
          <div className="flex-1 h-px bg-slate-200" />
        </div>

        {/* Form */}
        <div className="bg-white rounded-3xl border border-slate-100 p-6 space-y-4 shadow-sm">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 text-sm px-4 py-3 rounded-xl">
              {error}
            </div>
          )}

          {mode === 'register' && (
            <label className="block">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wide mb-1.5 block">Nombre</span>
              <input
                type="text"
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                placeholder="Tu nombre"
                className="input"
                autoComplete="name"
              />
            </label>
          )}

          <label className="block">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wide mb-1.5 block">Correo</span>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="tu@correo.com"
              className="input"
              autoComplete="email"
              onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
            />
          </label>

          <label className="block">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wide mb-1.5 block">Contraseña</span>
            <div className="relative">
              <input
                type={showPass ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="input pr-12"
                autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
              />
              <button
                onClick={() => setShowPass(!showPass)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 btn-press p-1"
              >
                {showPass ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </label>

          <button
            onClick={handleSubmit}
            disabled={loading}
            className="w-full py-4 rounded-2xl font-bold text-white bg-emerald-600 active:bg-emerald-700 btn-press disabled:opacity-60 text-base mt-2"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                {mode === 'login' ? 'Entrando...' : 'Creando cuenta...'}
              </span>
            ) : (
              mode === 'login' ? 'Iniciar sesión' : 'Crear cuenta'
            )}
          </button>
        </div>

        {/* Toggle */}
        <p className="text-center text-sm text-slate-500">
          {mode === 'login' ? '¿No tienes cuenta?' : '¿Ya tienes cuenta?'}{' '}
          <button
            onClick={() => { setMode(mode === 'login' ? 'register' : 'login'); setError(''); }}
            className="text-emerald-600 font-bold btn-press"
          >
            {mode === 'login' ? 'Crear cuenta' : 'Iniciar sesión'}
          </button>
        </p>
      </div>
    </div>
  );
}
