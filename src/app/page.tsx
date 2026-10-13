import Link from 'next/link';
import { Zap, Wrench, ShieldCheck, ArrowRight } from 'lucide-react';
import ThemeToggle from '@/components/ThemeToggle';

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col justify-between p-4 sm:p-6 lg:p-8">
      {/* Top Header Navigation */}
      <header className="max-w-5xl w-full mx-auto flex items-center justify-between py-2">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 bg-blue-600 rounded-xl flex items-center justify-center text-white shadow-sm ring-1 ring-blue-700/20">
            <Zap className="w-5 h-5" aria-hidden="true" />
          </div>
          <span className="font-bold text-xl text-slate-900 dark:text-slate-100 tracking-tight">
            PriorityPower
          </span>
        </div>
        <div className="flex items-center gap-2">
          <ThemeToggle />
        </div>
      </header>

      {/* Main Content Area */}
      <main className="max-w-5xl w-full mx-auto py-8 sm:py-12 flex flex-col items-center justify-center">
        <div className="text-center max-w-2xl mx-auto mb-10 sm:mb-12">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200/80 dark:border-blue-800/80 mb-4 shadow-xs">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-600 dark:bg-blue-400 animate-pulse" />
            Field & Financial Operations
          </div>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight leading-tight">
            Field-Service Execution &amp; Financial Management
          </h1>
          <p className="mt-3 sm:mt-4 text-base sm:text-lg text-slate-600 dark:text-slate-400">
            Select your workspace to access technician workflows or administrative financial oversight.
          </p>
        </div>

        {/* Portal Entry Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-4xl">
          {/* Employee Workspace */}
          <div className="glass-card rounded-2xl p-6 sm:p-8 flex flex-col justify-between hover:border-blue-300 dark:hover:border-blue-600/60 transition-all duration-200 group">
            <div>
              <div className="w-12 h-12 rounded-xl bg-blue-50 dark:bg-blue-950/60 border border-blue-100 dark:border-blue-800/60 flex items-center justify-center text-blue-600 dark:text-blue-400 mb-6 group-hover:scale-105 transition-transform duration-200">
                <Wrench className="w-6 h-6" aria-hidden="true" />
              </div>
              <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">
                Employee Field Portal
              </h2>
              <p className="mt-2 text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                Log field expenses, upload receipt photos, review assigned active jobs, and register new customers on-site.
              </p>
            </div>
            <div className="pt-6 sm:pt-8">
              <Link
                href="/employee"
                className="w-full min-h-12 inline-flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-xl px-5 py-3 shadow-sm hover:shadow-md transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-slate-900"
              >
                <span>Enter as Employee</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" aria-hidden="true" />
              </Link>
            </div>
          </div>

          {/* Admin Workspace */}
          <div className="glass-card rounded-2xl p-6 sm:p-8 flex flex-col justify-between hover:border-slate-400 dark:hover:border-slate-600 transition-all duration-200 group">
            <div>
              <div className="w-12 h-12 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-700 dark:text-slate-300 mb-6 group-hover:scale-105 transition-transform duration-200">
                <ShieldCheck className="w-6 h-6" aria-hidden="true" />
              </div>
              <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">
                Operations &amp; Admin
              </h2>
              <p className="mt-2 text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                Access administrative controls, real-time KPI metrics, customer directory, job dispatch, and detailed financial reports.
              </p>
            </div>
            <div className="pt-6 sm:pt-8">
              <Link
                href="/admin"
                className="w-full min-h-12 inline-flex items-center justify-center gap-2 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-750 text-slate-900 dark:text-slate-100 border border-slate-300 dark:border-slate-700 font-medium rounded-xl px-5 py-3 shadow-xs hover:shadow-sm transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-slate-900"
              >
                <span>Enter as Admin</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" aria-hidden="true" />
              </Link>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="max-w-5xl w-full mx-auto py-4 text-center text-xs text-slate-500 dark:text-slate-500">
        &copy; {new Date().getFullYear()} PriorityPower Operations. All rights reserved.
      </footer>
    </div>
  );
}
