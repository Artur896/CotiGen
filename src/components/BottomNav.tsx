'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, HardHat, FileText } from 'lucide-react';

const TABS = [
  { href: '/',       icon: Home,     label: 'Inicio',  active: 'text-slate-700',   dot: 'bg-slate-700'   },
  { href: '/obras',  icon: HardHat,  label: 'Obras',   active: 'text-emerald-600', dot: 'bg-emerald-600' },
  { href: '/editor', icon: FileText, label: 'Cotizar', active: 'text-indigo-600',  dot: 'bg-indigo-600'  },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-30 bg-white/95 backdrop-blur-md border-t border-slate-100"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      <div className="flex h-14">
        {TABS.map(({ href, icon: Icon, label, active, dot }) => {
          const isActive = pathname === href || pathname.startsWith(href + '/');
          return (
            <Link
              key={href}
              href={href}
              className={`flex-1 flex flex-col items-center justify-center gap-0.5 btn-press ${isActive ? active : 'text-slate-400'}`}
            >
              <Icon size={22} strokeWidth={isActive ? 2.5 : 1.8} />
              <span className="text-[10px] font-bold tracking-wide">{label}</span>
              {isActive && (
                <span className={`absolute bottom-[calc(env(safe-area-inset-bottom)+2px)] w-8 h-0.5 rounded-full ${dot}`} />
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
