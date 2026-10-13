import Link from 'next/link';
import { Zap } from 'lucide-react';
import EmployeeNav from './EmployeeNav';

export default function EmployeeLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-col min-h-screen">
      <header className="glass-panel sticky top-0 z-20 border-b border-slate-200/80 dark:border-slate-800/80">
        <div className="max-w-3xl mx-auto px-4 h-16 flex items-center justify-between gap-2">
          <Link href="/employee" className="flex items-center gap-2 group">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white shadow-2xs ring-1 ring-blue-700/20 group-hover:bg-blue-700 transition-colors">
              <Zap className="w-4 h-4" aria-hidden="true" />
            </div>
            <div className="flex items-baseline gap-1.5">
              <span className="font-bold text-base sm:text-lg text-slate-900 dark:text-slate-100 tracking-tight">
                PriorityPower
              </span>
              <span className="text-[10px] font-semibold tracking-wider uppercase px-1.5 py-0.5 rounded-md bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200/60 dark:border-blue-800/60">
                Field
              </span>
            </div>
          </Link>
          <EmployeeNav />
        </div>
      </header>
      <main className="flex-1 w-full max-w-3xl mx-auto p-4 sm:p-6">
        {children}
      </main>
      <footer className="max-w-3xl w-full mx-auto py-4 px-4 text-center text-xs text-slate-500 dark:text-slate-500 border-t border-slate-200/60 dark:border-slate-800/60 mt-auto">
        PriorityPower Field Operations &copy; {new Date().getFullYear()}
      </footer>
    </div>
  );
}
