'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { adminLogoutAction } from '@/actions/adminAuth';
import { LogOut, Loader2 } from 'lucide-react';

export default function AdminLogoutButton() {
  const router = useRouter();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleLogout = async () => {
    try {
      setIsLoggingOut(true);
      await adminLogoutAction();
      router.push('/admin-login');
    } catch {
      setIsLoggingOut(false);
    }
  };

  return (
    <button
      onClick={handleLogout}
      disabled={isLoggingOut}
      title="Logout"
      aria-label="Logout of admin portal"
      className="inline-flex items-center gap-1.5 px-2.5 py-1.5 sm:px-3 sm:py-2 text-xs sm:text-sm font-medium rounded-lg text-slate-600 dark:text-slate-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors focus:outline-none focus:ring-2 focus:ring-red-500/40 disabled:opacity-50"
    >
      {isLoggingOut ? (
        <Loader2 className="w-4 h-4 animate-spin text-red-500" aria-hidden="true" />
      ) : (
        <LogOut className="w-4 h-4" aria-hidden="true" />
      )}
      <span className="hidden sm:inline">Logout</span>
    </button>
  );
}
