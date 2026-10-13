import Link from 'next/link';
import { ReceiptText, ArrowLeft, ShieldCheck } from 'lucide-react';

export default function EmployeeExpensesPage() {
  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="glass-card rounded-2xl p-6 sm:p-8 space-y-6">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-xl bg-blue-50 dark:bg-blue-950/60 border border-blue-100 dark:border-blue-800/60 flex items-center justify-center text-blue-600 dark:text-blue-400 shrink-0">
            <ReceiptText className="w-6 h-6" aria-hidden="true" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">
              Field Expense Tracking
            </h1>
            <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
              Guidance for logging field receipts and work-order expenses.
            </p>
          </div>
        </div>

        {/* Informational Callout */}
        <div className="p-4 sm:p-5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 space-y-3">
          <div className="flex items-center gap-2 text-sm font-semibold text-slate-800 dark:text-slate-200">
            <ShieldCheck className="w-4 h-4 text-blue-600 dark:text-blue-400" aria-hidden="true" />
            <span>Centralized Financial Processing</span>
          </div>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
            Historical transaction audits, expense approvals, and payment reconciliation are centralized in the Operations Management portal. To maintain accounting integrity, field expenses are submitted directly against active job work orders.
          </p>
        </div>

        {/* Workflow Steps */}
        <div className="space-y-3 pt-2">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            Submission Workflow
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-1.5 shadow-2xs">
              <div className="text-xs font-bold text-blue-600 dark:text-blue-400">Step 1</div>
              <div className="text-sm font-semibold text-slate-900 dark:text-slate-100">Select Job</div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Open your active jobs on the technician dashboard.
              </p>
            </div>
            <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-1.5 shadow-2xs">
              <div className="text-xs font-bold text-blue-600 dark:text-blue-400">Step 2</div>
              <div className="text-sm font-semibold text-slate-900 dark:text-slate-100">Log Expense</div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Tap &ldquo;Log Expense&rdquo; on the relevant customer job card.
              </p>
            </div>
            <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-1.5 shadow-2xs">
              <div className="text-xs font-bold text-blue-600 dark:text-blue-400">Step 3</div>
              <div className="text-sm font-semibold text-slate-900 dark:text-slate-100">Attach Receipt</div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Enter amount, select category, and attach receipt photo (max 5MB).
              </p>
            </div>
          </div>
        </div>

        {/* Primary Navigation Action */}
        <div className="pt-4 border-t border-slate-200/80 dark:border-slate-800/80">
          <Link
            href="/employee"
            className="w-full sm:w-auto min-h-11 inline-flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-xl px-5 py-2.5 shadow-sm transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-slate-900"
          >
            <ArrowLeft className="w-4 h-4" aria-hidden="true" />
            <span>Go to Active Jobs Dashboard</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
