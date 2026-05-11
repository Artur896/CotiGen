import Link from 'next/link';
import { FileText, HardHat, ChevronRight, Users } from 'lucide-react';

const CARDS = [
  {
    href: '/obras',
    icon: HardHat,
    iconBg: 'bg-emerald-100',
    iconColor: 'text-emerald-600',
    border: 'active:border-emerald-400',
    title: 'Mis Obras',
    desc: 'Organiza listas de materiales por obra',
  },
  {
    href: '/amigos',
    icon: Users,
    iconBg: 'bg-violet-100',
    iconColor: 'text-violet-600',
    border: 'active:border-violet-400',
    title: 'Amigos',
    desc: 'Agrega colaboradores y comparte obras',
  },
  {
    href: '/editor',
    icon: FileText,
    iconBg: 'bg-indigo-100',
    iconColor: 'text-indigo-600',
    border: 'active:border-indigo-400',
    title: 'Cotizaciones',
    desc: 'Genera cotizaciones profesionales en PDF',
  },
];

export default function Home() {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <div className="pt-16 pb-10 px-6 text-center">
        <div className="w-16 h-16 bg-emerald-600 rounded-2xl flex items-center justify-center text-white mx-auto mb-4 shadow-lg shadow-emerald-200">
          <FileText size={30} />
        </div>
        <h1 className="text-2xl font-extrabold text-slate-900">CotiGen</h1>
        <p className="text-slate-500 text-sm mt-1">¿Qué quieres hacer hoy?</p>
      </div>

      <main className="flex-1 px-5 space-y-3 pb-safe">
        {CARDS.map(({ href, icon: Icon, iconBg, iconColor, border, title, desc }) => (
          <Link
            key={href}
            href={href}
            className={`flex items-center gap-4 bg-white border-2 border-slate-100 ${border} rounded-2xl p-5 btn-press`}
          >
            <div className={`w-14 h-14 ${iconBg} rounded-xl flex items-center justify-center shrink-0`}>
              <Icon size={28} className={iconColor} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-bold text-slate-900 text-lg">{title}</p>
              <p className="text-sm text-slate-500 mt-0.5">{desc}</p>
            </div>
            <ChevronRight size={20} className="text-slate-300 shrink-0" />
          </Link>
        ))}
      </main>

      <footer className="py-4 text-center text-xs text-slate-300">CotiGen · 2026</footer>
    </div>
  );
}
