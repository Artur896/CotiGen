'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, HardHat, FileText, Users } from 'lucide-react';
import { useNotificaciones } from '@/lib/notificaciones/NotificacionesContext';

const TABS = [
  { href: '/',       icon: Home,     label: 'Inicio',  active: 'text-slate-700',   dot: 'bg-slate-700'   },
  { href: '/obras',  icon: HardHat,  label: 'Obras',   active: 'text-emerald-600', dot: 'bg-emerald-600' },
  { href: '/amigos', icon: Users,    label: 'Amigos',  active: 'text-violet-600',  dot: 'bg-violet-600'  },
  { href: '/editor', icon: FileText, label: 'Cotizar', active: 'text-indigo-600',  dot: 'bg-indigo-600'  },
];

export function BottomNav() {
  const pathname = usePathname();
  const { unreadCount } = useNotificaciones();

  return (
    <>
      {/* ── DESKTOP SIDEBAR ────────────────────────────────── */}
      <aside className="hidden md:flex flex-col fixed left-0 top-0 h-full w-56 bg-white border-r border-slate-100 z-30">
        {/* Brand */}
        <div className="px-5 h-14 flex items-center gap-2 border-b border-slate-100 shrink-0">
          <div className="w-7 h-7 rounded-lg bg-emerald-600 flex items-center justify-center">
            <FileText size={14} className="text-white" />
          </div>
          <span className="font-extrabold text-slate-900 text-base tracking-tight">CotiGen</span>
        </div>

        {/* Nav items */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {TABS.map(({ href, icon: Icon, label, active }) => {
            const isActive = pathname === href || (href !== '/' && pathname.startsWith(href));
            const showBadge = href === '/amigos' && unreadCount > 0;
            return (
              <Link
                key={href}
                href={href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl font-semibold text-sm transition-colors btn-press ${
                  isActive
                    ? `${active} bg-slate-50`
                    : 'text-slate-500 hover:bg-slate-50 hover:text-slate-700'
                }`}
              >
                <div className="relative shrink-0">
                  <Icon size={19} strokeWidth={isActive ? 2.5 : 1.8} />
                  {showBadge && (
                    <span className="absolute -top-1 -right-1.5 w-4 h-4 rounded-full bg-red-500 text-white text-[9px] font-bold flex items-center justify-center">
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                  )}
                </div>
                <span>{label}</span>
              </Link>
            );
          })}
        </nav>
      </aside>

      {/* ── MOBILE BOTTOM NAV ──────────────────────────────── */}
      <nav
        className="md:hidden fixed bottom-0 left-0 right-0 z-30 bg-white/95 backdrop-blur-md border-t border-slate-100"
        style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
      >
        <div className="flex h-14">
          {TABS.map(({ href, icon: Icon, label, active, dot }) => {
            const isActive = pathname === href || (href !== '/' && pathname.startsWith(href));
            const showBadge = href === '/amigos' && unreadCount > 0;
            return (
              <Link
                key={href}
                href={href}
                className={`flex-1 flex flex-col items-center justify-center gap-0.5 btn-press relative ${isActive ? active : 'text-slate-400'}`}
              >
                <div className="relative">
                  <Icon size={22} strokeWidth={isActive ? 2.5 : 1.8} />
                  {showBadge && (
                    <span className="absolute -top-1 -right-1.5 w-4 h-4 rounded-full bg-red-500 text-white text-[9px] font-bold flex items-center justify-center leading-none">
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                  )}
                </div>
                <span className="text-[10px] font-bold tracking-wide">{label}</span>
                {isActive && (
                  <span className={`absolute bottom-[calc(env(safe-area-inset-bottom)+2px)] w-8 h-0.5 rounded-full ${dot}`} />
                )}
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
}
