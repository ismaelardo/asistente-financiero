'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  ArrowLeftRight,
  TrendingDown,
  BookOpen,
  TrendingUp,
  Target,
  Bot,
} from 'lucide-react';
import ApiUsageTracker from './ApiUsageTracker';

const navItems = [
  { href: '/',             label: 'Panorama',      icon: LayoutDashboard },
  { href: '/transactions', label: 'Transacciones', icon: ArrowLeftRight },
  { href: '/debts',        label: 'Deudas',        icon: TrendingDown },
  { href: '/classes',      label: 'Clases',        icon: BookOpen },
  { href: '/projections',  label: 'Proyecciones',  icon: TrendingUp },
  { href: '/goals',        label: 'Metas',         icon: Target },
  { href: '/advisor',      label: 'Asesor IA',     icon: Bot },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-56 flex-shrink-0 flex flex-col border-r border-gray-200 bg-white h-screen sticky top-0">
      {/* Logo */}
      <div className="px-5 py-6 border-b border-gray-100">
        <p className="text-sm font-semibold text-gray-900 tracking-tight">Finanzas Personales</p>
        <p className="text-xs text-gray-400 mt-0.5">CLP · Dashboard</p>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        {navItems.map(({ href, label, icon: Icon }) => {
          const active = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${
                active
                  ? 'bg-blue-50 text-blue-700 font-medium'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              }`}
            >
              <Icon size={16} strokeWidth={active ? 2.5 : 1.8} />
              {label}
            </Link>
          );
        })}
      </nav>

      {/* API tracker pinned at bottom */}
      <div className="border-t border-gray-100 p-4">
        <ApiUsageTracker />
      </div>
    </aside>
  );
}
