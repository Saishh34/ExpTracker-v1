'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Briefcase, ReceiptText } from 'lucide-react';
import ThemeToggle from '@/components/ThemeToggle';

export default function EmployeeNav() {
  const pathname = usePathname();

  const navItems = [
    { href: '/employee', label: 'Jobs & Dashboard', icon: Briefcase },
    { href: '/employee/expenses', label: 'My Expenses', icon: ReceiptText },
  ];

  return (
    <div className="flex items-center gap-2 sm:gap-4">
      <nav className="flex items-center gap-1">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`inline-flex items-center gap-1.5 px-3 py-2 text-xs sm:text-sm font-medium rounded-lg transition-all duration-150 ${
                isActive
                  ? 'bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 shadow-2xs font-semibold'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-100/70 dark:hover:bg-slate-800/70'
              }`}
            >
              <Icon
                className={`w-4 h-4 ${
                  isActive ? 'text-blue-600 dark:text-blue-400' : 'text-slate-500 dark:text-slate-400'
                }`}
                aria-hidden="true"
              />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>
      <div className="pl-2 border-l border-slate-200 dark:border-slate-800 flex items-center">
        <ThemeToggle />
      </div>
    </div>
  );
}
