'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Users, Briefcase, Receipt, PieChart } from 'lucide-react';
import AdminLogoutButton from './AdminLogoutButton';

export default function AdminNav() {
  const pathname = usePathname();

  const navItems = [
    { href: '/admin', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/admin/customers', label: 'Customers', icon: Users },
    { href: '/admin/jobs', label: 'Jobs', icon: Briefcase },
    { href: '/admin/expenses', label: 'Expenses', icon: Receipt },
    { href: '/admin/reports', label: 'Reports', icon: PieChart },
  ];

  return (
    <div className="flex items-center justify-end flex-1 min-w-0">
      <nav className="flex items-center space-x-1 overflow-x-auto no-scrollbar">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;
          return (
            <Link 
              key={item.href}
              href={item.href} 
              className={`flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-md transition-all duration-200 ${
                isActive 
                  ? 'bg-blue-50 text-blue-700 shadow-sm ring-1 ring-blue-600/20' 
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
              }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? 'text-blue-600' : 'text-slate-500'}`} /> 
              <span className="hidden sm:inline">{item.label}</span>
            </Link>
          );
        })}
      </nav>
      <div className="pl-2 ml-2 border-l border-slate-200 flex items-center shrink-0">
        <AdminLogoutButton />
      </div>
    </div>
  );
}
