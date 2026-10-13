import Link from 'next/link';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { Zap } from 'lucide-react';
import AdminNav from './AdminNav';

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const cookieStore = await cookies();
  if (cookieStore.get('employeeId')?.value) {
    redirect('/employee');
  }

  if (cookieStore.get('adminSession')?.value !== 'true') {
    redirect('/admin-login');
  }

  return (
    <div className="flex flex-col min-h-screen bg-slate-50/50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors">
      <header className="glass-panel sticky top-0 z-20 border-b border-slate-200/80 dark:border-slate-800/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
          <Link href="/admin" className="flex items-center gap-2.5 group shrink-0">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white shadow-2xs ring-1 ring-blue-700/20 group-hover:bg-blue-700 transition-colors">
              <Zap className="w-4 h-4" aria-hidden="true" />
            </div>
            <div className="flex items-baseline gap-1.5">
              <span className="font-bold text-base sm:text-lg text-slate-900 dark:text-slate-100 tracking-tight">
                PriorityPower
              </span>
              <span className="text-[10px] font-semibold tracking-wider uppercase px-1.5 py-0.5 rounded-md bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200/60 dark:border-blue-800/60">
                Ops
              </span>
            </div>
          </Link>
          <AdminNav />
        </div>
      </header>

      <main className="flex-1 w-full max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
        {children}
      </main>

      <footer className="max-w-7xl w-full mx-auto py-4 px-4 sm:px-6 lg:px-8 text-center text-xs text-slate-500 dark:text-slate-500 border-t border-slate-200/60 dark:border-slate-800/60 mt-auto">
        PriorityPower Operations &amp; Financial Management &copy; {new Date().getFullYear()}
      </footer>
    </div>
  );
}
