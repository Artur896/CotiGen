'use client';

import { useEffect, useRef, useState } from 'react';
import { X, Camera, AlertCircle } from 'lucide-react';

interface Props {
  onScan: (text: string) => void;
  onClose: () => void;
}

export function QRScanner({ onScan, onClose }: Props) {
  const [error, setError] = useState<string | null>(null);
  const [ready, setReady] = useState(false);
  const scannerRef = useRef<any>(null);
  const scannedRef = useRef(false); // prevent double-fire

  useEffect(() => {
    let cancelled = false;

    const start = async () => {
      try {
        const { Html5Qrcode } = await import('html5-qrcode');
        if (cancelled) return;

        const scanner = new Html5Qrcode('qr-reader-container');
        scannerRef.current = scanner;

        await scanner.start(
          { facingMode: 'environment' },
          {
            fps: 12,
            qrbox: { width: 240, height: 240 },
            aspectRatio: 1.0,
          },
          (decodedText: string) => {
            if (scannedRef.current) return;
            scannedRef.current = true;
            onScan(decodedText);
          },
          () => { /* ignore per-frame decode errors */ }
        );

        if (!cancelled) setReady(true);
      } catch {
        if (!cancelled) setError('No se pudo acceder a la cámara. Verifica los permisos.');
      }
    };

    start();

    return () => {
      cancelled = true;
      const sc = scannerRef.current;
      if (sc) {
        sc.isScanning
          ? sc.stop().then(() => sc.clear()).catch(() => {})
          : sc.clear?.();
      }
    };
  }, [onScan]);

  return (
    <div className="fixed inset-0 z-50 bg-black flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-4 pt-12 pb-4 shrink-0">
        <div className="flex items-center gap-2">
          <Camera size={20} className="text-white" />
          <p className="text-white font-bold text-lg">Escanear QR</p>
        </div>
        <button
          onClick={onClose}
          className="w-9 h-9 flex items-center justify-center rounded-full bg-white/10 text-white active:bg-white/20"
        >
          <X size={20} />
        </button>
      </div>

      {/* Camera area */}
      <div className="flex-1 flex flex-col items-center justify-center relative">
        {error ? (
          <div className="flex flex-col items-center gap-3 px-8 text-center">
            <div className="w-16 h-16 rounded-full bg-red-500/20 flex items-center justify-center">
              <AlertCircle size={28} className="text-red-400" />
            </div>
            <p className="text-white font-bold">{error}</p>
            <button
              onClick={onClose}
              className="mt-2 px-6 py-3 rounded-2xl bg-white text-slate-900 font-bold text-sm"
            >
              Cerrar
            </button>
          </div>
        ) : (
          <>
            {/* Scanner mount point — html5-qrcode renders into this div */}
            <div
              id="qr-reader-container"
              className="w-full max-w-sm"
              style={{ minHeight: 300 }}
            />

            {/* Overlay hint */}
            {!ready && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-8 h-8 border-2 border-white/40 border-t-white rounded-full animate-spin" />
              </div>
            )}

            {/* Corner guides */}
            {ready && (
              <div className="absolute pointer-events-none inset-0 flex items-center justify-center">
                <div className="relative w-60 h-60">
                  {/* TL */}
                  <span className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-violet-400 rounded-tl-lg" />
                  {/* TR */}
                  <span className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-violet-400 rounded-tr-lg" />
                  {/* BL */}
                  <span className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-violet-400 rounded-bl-lg" />
                  {/* BR */}
                  <span className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-violet-400 rounded-br-lg" />
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Footer hint */}
      <div className="px-6 pb-12 pt-4 text-center shrink-0">
        <p className="text-white/60 text-sm">
          Apunta la cámara al código QR de tu amigo
        </p>
      </div>
    </div>
  );
}
