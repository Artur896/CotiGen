'use client';

import { useEffect, useState } from 'react';
import { Download } from 'lucide-react';

export function InstallBanner() {
  const [prompt, setPrompt] = useState<any>(null);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      setPrompt(e);
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  if (!prompt || dismissed) return null;

  const handleInstall = async () => {
    prompt.prompt();
    const { outcome } = await prompt.userChoice;
    if (outcome === 'accepted') setPrompt(null);
    else setDismissed(true);
  };

  return (
    <div className="fixed top-0 left-0 right-0 z-50 bg-emerald-600 text-white px-4 py-3 flex items-center gap-3 shadow-lg"
         style={{ paddingTop: 'calc(0.75rem + env(safe-area-inset-top))' }}>
      <Download size={20} className="shrink-0" />
      <p className="flex-1 text-sm font-semibold">Instala CotiGen como app</p>
      <button
        onClick={handleInstall}
        className="bg-white text-emerald-700 font-bold text-xs px-3 py-1.5 rounded-lg btn-press"
      >
        Instalar
      </button>
      <button onClick={() => setDismissed(true)} className="text-white/70 text-xs btn-press">
        ✕
      </button>
    </div>
  );
}
