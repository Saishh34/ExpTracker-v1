"use client";

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { Job, Expense, Customer, Employee, ExpenseCategory } from '@/types';
import { formatKolkataDateTime } from '@/lib/dateUtils';
import {
  Calendar,
  IndianRupee,
  TrendingDown,
  Wallet,
  Briefcase,
  Activity,
  Clock,
  FileText,
  ArrowUpRight,
  ArrowDownRight,
  Users,
  CheckCircle2,
  ChevronRight,
  Layers,
  ArrowRight
} from 'lucide-react';

type DateFilter = 'Today' | 'This Week' | 'This Month' | 'Custom';

export default function DashboardClient({
  jobs,
  expenses,
  customers,
  employees,
  categories,
}: {
  jobs: Job[];
  expenses: Expense[];
  customers: Customer[];
  employees: Employee[];
  categories: ExpenseCategory[];
}) {
  const [dateFilter, setDateFilter] = useState<DateFilter>('This Month');
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');

  const { filteredJobs, filteredExpenses } = useMemo(() => {
    const tzDateStr = new Date().toLocaleString("en-US", { timeZone: "Asia/Kolkata" });
    const tzDate = new Date(tzDateStr);
    tzDate.setHours(0, 0, 0, 0);
    const todayStart = tzDate.getTime();
    
    let start = 0;
    let end = Infinity;

    if (dateFilter === 'Today') {
      start = todayStart;
      end = start + 86400000;
    } else if (dateFilter === 'This Week') {
      const day = tzDate.getDay() || 7; 
      start = todayStart - (day - 1) * 86400000; // Monday start
      end = start + 7 * 86400000;
    } else if (dateFilter === 'This Month') {
      const firstDay = new Date(tzDate.getFullYear(), tzDate.getMonth(), 1);
      start = firstDay.getTime();
      const nextMonth = new Date(tzDate.getFullYear(), tzDate.getMonth() + 1, 1);
      end = nextMonth.getTime();
    } else if (dateFilter === 'Custom' && customStart && customEnd) {
      start = new Date(customStart).getTime();
      end = new Date(customEnd).getTime() + 86400000; // end of selected day
    }

    const parseDate = (d?: string) => (d ? new Date(d).getTime() : 0);
    
    const fJobs = jobs.filter((j) => {
      const t = parseDate(j.visitDate);
      return t >= start && t < end;
    });

    const fExpenses = expenses.filter((e) => {
      const t = parseDate(e.dateTime);
      return t >= start && t < end;
    });

    return { filteredJobs: fJobs, filteredExpenses: fExpenses };
  }, [jobs, expenses, dateFilter, customStart, customEnd]);

  // KPIs
  const revenue = filteredJobs.reduce((sum, j) => sum + (j.finalBilledAmount || 0), 0);
  const totalExpenses = filteredExpenses.reduce((sum, e) => sum + (e.amount || 0), 0);
  const contribution = revenue - totalExpenses;
  const numJobs = filteredJobs.length;

  // Mixes
  const revenueMix = filteredJobs.reduce((acc, j) => {
    const type = j.jobType || 'Unknown';
    acc[type] = (acc[type] || 0) + (j.finalBilledAmount || 0);
    return acc;
  }, {} as Record<string, number>);

  const expenseMix = filteredExpenses.reduce((acc, e) => {
    const cat = categories.find((c) => c.id === e.categoryId)?.name || 'Unknown';
    acc[cat] = (acc[cat] || 0) + (e.amount || 0);
    return acc;
  }, {} as Record<string, number>);

  const topCustomers = filteredJobs.reduce((acc, j) => {
    const cName = customers.find((c) => c.id === j.customerId)?.name || 'Unknown';
    acc[cName] = (acc[cName] || 0) + (j.finalBilledAmount || 0);
    return acc;
  }, {} as Record<string, number>);
  const sortedCustomers = Object.entries(topCustomers).sort((a, b) => b[1] - a[1]).slice(0, 5);

  const empActivity = filteredJobs.reduce((acc, j) => {
    if (j.assignedEmployeeIds && Array.isArray(j.assignedEmployeeIds)) {
      j.assignedEmployeeIds.forEach((eid) => {
        const eName = employees.find((e) => e.id === eid)?.name || 'Unknown';
        acc[eName] = (acc[eName] || 0) + 1;
      });
    }
    return acc;
  }, {} as Record<string, number>);

  const recentActivity = [
    ...filteredJobs.map((j) => ({ 
      type: 'Job', 
      date: j.visitDate || '', 
      title: `${j.jobType} Job - ${customers.find((c) => c.id === j.customerId)?.name || 'Unknown'}`, 
      amount: j.finalBilledAmount || 0 
    })),
    ...filteredExpenses.map((e) => ({ 
      type: 'Expense', 
      date: e.dateTime, 
      title: `Expense: ${e.description || categories.find((c) => c.id === e.categoryId)?.name || 'Unknown'}`, 
      amount: e.amount || 0 
    }))
  ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 10);

  const formatINR = (val: number) =>
    new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(val);
  const formatDate = (dateStr: string) => formatKolkataDateTime(dateStr);

  const dateFilterOptions: DateFilter[] = ['Today', 'This Week', 'This Month', 'Custom'];

  return (
    <div className="space-y-6">
      {/* Page Header & Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">
            Operations Dashboard
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Real-time operational pipeline, financial performance, and field activity.
          </p>
        </div>

        {/* Date Filter Bar */}
        <div className="glass-card rounded-2xl p-1.5 sm:p-2 border border-slate-200/90 dark:border-slate-800/90 flex flex-wrap items-center gap-1.5 shadow-2xs self-start md:self-auto">
          <div className="hidden sm:flex items-center pl-2 pr-1 text-slate-400 dark:text-slate-500" aria-hidden="true">
            <Calendar className="w-4 h-4" />
          </div>
          <div className="flex items-center gap-1 p-0.5 bg-slate-100/70 dark:bg-slate-800/70 rounded-xl">
            {dateFilterOptions.map((opt) => (
              <button
                key={opt}
                type="button"
                onClick={() => setDateFilter(opt)}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                  dateFilter === opt
                    ? 'bg-white dark:bg-slate-900 text-blue-700 dark:text-blue-300 shadow-2xs font-bold'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
              >
                {opt}
              </button>
            ))}
          </div>

          {dateFilter === 'Custom' && (
            <div className="flex items-center gap-2 px-2 py-1 bg-slate-50 dark:bg-slate-900/60 rounded-xl border border-slate-200/80 dark:border-slate-800/80">
              <input
                type="date"
                aria-label="Start date"
                className="px-2 py-1 text-xs bg-transparent text-slate-800 dark:text-slate-200 rounded outline-none focus:ring-1 focus:ring-blue-500"
                value={customStart}
                onChange={(e) => setCustomStart(e.target.value)}
              />
              <span className="text-slate-400 text-xs">to</span>
              <input
                type="date"
                aria-label="End date"
                className="px-2 py-1 text-xs bg-transparent text-slate-800 dark:text-slate-200 rounded outline-none focus:ring-1 focus:ring-blue-500"
                value={customEnd}
                onChange={(e) => setCustomEnd(e.target.value)}
              />
            </div>
          )}
        </div>
      </div>

      {/* Quick Operations Links */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Link
          href="/admin/jobs"
          className="glass-card hover:bg-slate-100/60 dark:hover:bg-slate-850/60 p-3 sm:p-3.5 rounded-xl border border-slate-200/80 dark:border-slate-800/80 flex items-center justify-between text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 transition-all shadow-2xs group"
        >
          <div className="flex items-center gap-2 min-w-0">
            <Briefcase className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0" aria-hidden="true" />
            <span className="truncate">Job Orders</span>
          </div>
          <ChevronRight className="w-4 h-4 text-slate-400 group-hover:translate-x-0.5 transition-transform shrink-0" aria-hidden="true" />
        </Link>
        <Link
          href="/admin/expenses"
          className="glass-card hover:bg-slate-100/60 dark:hover:bg-slate-850/60 p-3 sm:p-3.5 rounded-xl border border-slate-200/80 dark:border-slate-800/80 flex items-center justify-between text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 transition-all shadow-2xs group"
        >
          <div className="flex items-center gap-2 min-w-0">
            <TrendingDown className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0" aria-hidden="true" />
            <span className="truncate">Expenses</span>
          </div>
          <ChevronRight className="w-4 h-4 text-slate-400 group-hover:translate-x-0.5 transition-transform shrink-0" aria-hidden="true" />
        </Link>
        <Link
          href="/admin/customers"
          className="glass-card hover:bg-slate-100/60 dark:hover:bg-slate-850/60 p-3 sm:p-3.5 rounded-xl border border-slate-200/80 dark:border-slate-800/80 flex items-center justify-between text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 transition-all shadow-2xs group"
        >
          <div className="flex items-center gap-2 min-w-0">
            <Users className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" aria-hidden="true" />
            <span className="truncate">Customers</span>
          </div>
          <ChevronRight className="w-4 h-4 text-slate-400 group-hover:translate-x-0.5 transition-transform shrink-0" aria-hidden="true" />
        </Link>
        <Link
          href="/admin/reports"
          className="glass-card hover:bg-slate-100/60 dark:hover:bg-slate-850/60 p-3 sm:p-3.5 rounded-xl border border-slate-200/80 dark:border-slate-800/80 flex items-center justify-between text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 transition-all shadow-2xs group"
        >
          <div className="flex items-center gap-2 min-w-0">
            <Layers className="w-4 h-4 text-purple-600 dark:text-purple-400 shrink-0" aria-hidden="true" />
            <span className="truncate">Reports</span>
          </div>
          <ChevronRight className="w-4 h-4 text-slate-400 group-hover:translate-x-0.5 transition-transform shrink-0" aria-hidden="true" />
        </Link>
      </div>

      {/* KPI Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Revenue */}
        <div className="glass-card p-5 sm:p-6 rounded-2xl border border-slate-200/90 dark:border-slate-800/90 shadow-2xs relative overflow-hidden group hover:border-blue-500/30 transition-all">
          <div className="absolute top-0 right-0 p-5 opacity-5 dark:opacity-10 group-hover:opacity-15 transition-opacity" aria-hidden="true">
            <IndianRupee className="w-14 h-14 text-blue-600" />
          </div>
          <div className="flex items-center gap-2.5 text-xs sm:text-sm font-medium text-slate-600 dark:text-slate-400 mb-3">
            <div className="w-8 h-8 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center border border-blue-200/60 dark:border-blue-800/60">
              <IndianRupee className="w-4 h-4" aria-hidden="true" />
            </div>
            <span>Total Revenue</span>
          </div>
          <div className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">
            {formatINR(revenue)}
          </div>
          <div className="text-xs text-slate-500 dark:text-slate-400 mt-1.5 flex items-center gap-1">
            <span>{filteredJobs.length} active job{filteredJobs.length === 1 ? '' : 's'} in period</span>
          </div>
        </div>

        {/* Total Expenses */}
        <div className="glass-card p-5 sm:p-6 rounded-2xl border border-slate-200/90 dark:border-slate-800/90 shadow-2xs relative overflow-hidden group hover:border-rose-500/30 transition-all">
          <div className="absolute top-0 right-0 p-5 opacity-5 dark:opacity-10 group-hover:opacity-15 transition-opacity" aria-hidden="true">
            <TrendingDown className="w-14 h-14 text-rose-600" />
          </div>
          <div className="flex items-center gap-2.5 text-xs sm:text-sm font-medium text-slate-600 dark:text-slate-400 mb-3">
            <div className="w-8 h-8 rounded-xl bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center border border-rose-200/60 dark:border-rose-800/60">
              <TrendingDown className="w-4 h-4" aria-hidden="true" />
            </div>
            <span>Total Expenses</span>
          </div>
          <div className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">
            {formatINR(totalExpenses)}
          </div>
          <div className="text-xs text-slate-500 dark:text-slate-400 mt-1.5 flex items-center gap-1">
            <span>{filteredExpenses.length} logged receipt{filteredExpenses.length === 1 ? '' : 's'} in period</span>
          </div>
        </div>

        {/* Net Contribution */}
        <div className="bg-gradient-to-br from-slate-900 to-slate-800 dark:from-slate-850 dark:to-slate-900 p-5 sm:p-6 rounded-2xl border border-slate-700/60 dark:border-slate-800 text-white shadow-2xs relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-5 opacity-10 group-hover:opacity-20 transition-opacity" aria-hidden="true">
            <Wallet className="w-14 h-14 text-white" />
          </div>
          <div className="flex items-center gap-2.5 text-xs sm:text-sm font-medium text-slate-300 mb-3">
            <div className="w-8 h-8 rounded-xl bg-white/10 text-white flex items-center justify-center border border-white/20">
              <Wallet className="w-4 h-4" aria-hidden="true" />
            </div>
            <span>Est. Contribution</span>
          </div>
          <div className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
            {formatINR(contribution)}
          </div>
          <div className="text-xs text-slate-300/80 mt-1.5 flex items-center gap-1">
            <span>
              {revenue > 0 ? `${((contribution / revenue) * 100).toFixed(1)}% operating margin` : 'Revenue balance'}
            </span>
          </div>
        </div>

        {/* Completed Jobs */}
        <div className="glass-card p-5 sm:p-6 rounded-2xl border border-slate-200/90 dark:border-slate-800/90 shadow-2xs relative overflow-hidden group hover:border-emerald-500/30 transition-all">
          <div className="absolute top-0 right-0 p-5 opacity-5 dark:opacity-10 group-hover:opacity-15 transition-opacity" aria-hidden="true">
            <Briefcase className="w-14 h-14 text-emerald-600" />
          </div>
          <div className="flex items-center gap-2.5 text-xs sm:text-sm font-medium text-slate-600 dark:text-slate-400 mb-3">
            <div className="w-8 h-8 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center border border-emerald-200/60 dark:border-emerald-800/60">
              <Briefcase className="w-4 h-4" aria-hidden="true" />
            </div>
            <span>Completed Jobs</span>
          </div>
          <div className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">
            {numJobs}
          </div>
          <div className="text-xs text-slate-500 dark:text-slate-400 mt-1.5 flex items-center gap-1">
            <span>Field work orders</span>
          </div>
        </div>
      </div>

      {/* Main Grid: Activity Feed & Sidebar Summaries */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Recent Activity (2/3 width) */}
        <div className="lg:col-span-2 space-y-6">
          <div className="glass-card rounded-2xl border border-slate-200/90 dark:border-slate-800/90 shadow-2xs overflow-hidden flex flex-col h-full max-h-[580px]">
            <div className="p-4 sm:p-5 border-b border-slate-200/80 dark:border-slate-800/80 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                  <Activity className="w-4 h-4" aria-hidden="true" />
                </div>
                <h2 className="font-bold text-base sm:text-lg text-slate-900 dark:text-slate-100">
                  Recent Operations Activity
                </h2>
              </div>
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                {recentActivity.length} events
              </span>
            </div>

            <div className="p-0 overflow-y-auto custom-scrollbar flex-1">
              <ul className="divide-y divide-slate-100 dark:divide-slate-800/80">
                {recentActivity.map((act, i) => (
                  <li
                    key={i}
                    className="p-3.5 sm:p-4 hover:bg-slate-50/70 dark:hover:bg-slate-850/50 transition-colors flex items-center justify-between gap-3 group"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div
                        className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border ${
                          act.type === 'Job'
                            ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 border-emerald-200/60 dark:border-emerald-800/60'
                            : 'bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 border-rose-200/60 dark:border-rose-800/60'
                        }`}
                      >
                        {act.type === 'Job' ? (
                          <ArrowUpRight className="w-4 h-4" aria-hidden="true" />
                        ) : (
                          <ArrowDownRight className="w-4 h-4" aria-hidden="true" />
                        )}
                      </div>
                      <div className="min-w-0">
                        <div className="font-semibold text-slate-900 dark:text-slate-100 text-xs sm:text-sm truncate group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                          {act.title}
                        </div>
                        <div className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1 mt-0.5">
                          <Clock className="w-3 h-3 text-slate-400" aria-hidden="true" />
                          <span>{formatDate(act.date)}</span>
                        </div>
                      </div>
                    </div>
                    <div
                      className={`font-bold text-xs sm:text-sm shrink-0 text-right ${
                        act.type === 'Job'
                          ? 'text-emerald-600 dark:text-emerald-400'
                          : 'text-slate-900 dark:text-slate-100'
                      }`}
                    >
                      {act.type === 'Job' ? '+' : '-'}{formatINR(act.amount)}
                    </div>
                  </li>
                ))}

                {recentActivity.length === 0 && (
                  <div className="p-8 text-center text-slate-500 dark:text-slate-400 flex flex-col items-center justify-center">
                    <div className="w-12 h-12 bg-slate-100 dark:bg-slate-800 rounded-2xl flex items-center justify-center mb-3">
                      <FileText className="w-6 h-6 text-slate-400" aria-hidden="true" />
                    </div>
                    <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">No activity recorded</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-xs">
                      There are no job or expense records within the selected date timeframe.
                    </p>
                  </div>
                )}
              </ul>
            </div>
          </div>
        </div>

        {/* Right Column: Top Customers & Job Types Mix (1/3 width) */}
        <div className="space-y-6">
          {/* Top Customers */}
          <div className="glass-card rounded-2xl border border-slate-200/90 dark:border-slate-800/90 shadow-2xs overflow-hidden">
            <div className="p-4 sm:p-5 border-b border-slate-200/80 dark:border-slate-800/80 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-blue-600 dark:text-blue-400" aria-hidden="true" />
                <h2 className="font-bold text-sm text-slate-900 dark:text-slate-100">Top Customers</h2>
              </div>
              <Link
                href="/admin/customers"
                className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-0.5"
              >
                <span>View All</span>
                <ArrowRight className="w-3 h-3" aria-hidden="true" />
              </Link>
            </div>
            <div className="p-2 divide-y divide-slate-100 dark:divide-slate-800/60">
              {sortedCustomers.map(([name, val], i) => (
                <div
                  key={name}
                  className="flex items-center justify-between p-2.5 rounded-xl hover:bg-slate-50/70 dark:hover:bg-slate-850/50 transition-colors"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-6 h-6 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 flex items-center justify-center text-xs font-bold shrink-0 border border-blue-200/50 dark:border-blue-800/50">
                      {i + 1}
                    </div>
                    <span className="text-xs sm:text-sm font-semibold text-slate-800 dark:text-slate-200 truncate">
                      {name}
                    </span>
                  </div>
                  <span className="text-xs sm:text-sm font-bold text-slate-900 dark:text-slate-100 shrink-0 ml-2">
                    {formatINR(val)}
                  </span>
                </div>
              ))}
              {sortedCustomers.length === 0 && (
                <div className="p-6 text-center text-xs text-slate-500 dark:text-slate-400">
                  No customer volume for this period
                </div>
              )}
            </div>
          </div>

          {/* Job Types Mix */}
          <div className="glass-card rounded-2xl border border-slate-200/90 dark:border-slate-800/90 shadow-2xs overflow-hidden">
            <div className="p-4 sm:p-5 border-b border-slate-200/80 dark:border-slate-800/80 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" aria-hidden="true" />
              <h2 className="font-bold text-sm text-slate-900 dark:text-slate-100">Job Types Distribution</h2>
            </div>
            <div className="p-4 space-y-3.5">
              {Object.entries(revenueMix).map(([type, val]) => {
                const percentage = revenue > 0 ? (val / revenue) * 100 : 0;
                return (
                  <div key={type}>
                    <div className="flex justify-between items-center text-xs font-medium mb-1">
                      <span className="font-semibold text-slate-800 dark:text-slate-200">{type}</span>
                      <span className="text-slate-600 dark:text-slate-400">
                        {formatINR(val)} ({percentage.toFixed(0)}%)
                      </span>
                    </div>
                    <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2 overflow-hidden">
                      <div
                        className="bg-blue-600 dark:bg-blue-500 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                );
              })}
              {Object.keys(revenueMix).length === 0 && (
                <div className="text-center text-xs text-slate-500 dark:text-slate-400 py-4">
                  No revenue data available
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Row: Expense Categories & Technician Assignments */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Expense Categories Breakdown */}
        <div className="glass-card rounded-2xl border border-slate-200/90 dark:border-slate-800/90 shadow-2xs overflow-hidden">
          <div className="p-4 sm:p-5 border-b border-slate-200/80 dark:border-slate-800/80 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <TrendingDown className="w-4 h-4 text-rose-600 dark:text-rose-400" aria-hidden="true" />
              <h2 className="font-bold text-sm text-slate-900 dark:text-slate-100">
                Expense Categories Breakdown
              </h2>
            </div>
            <Link
              href="/admin/expenses"
              className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-0.5"
            >
              <span>View All</span>
              <ArrowRight className="w-3 h-3" aria-hidden="true" />
            </Link>
          </div>
          <div className="p-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
            {Object.entries(expenseMix).map(([cat, val]) => (
              <div
                key={cat}
                className="p-3 rounded-xl bg-slate-50/70 dark:bg-slate-850/50 border border-slate-200/60 dark:border-slate-800/60 flex flex-col justify-between"
              >
                <span className="text-xs text-slate-600 dark:text-slate-400 font-medium mb-1 truncate">
                  {cat}
                </span>
                <span className="font-bold text-sm sm:text-base text-slate-900 dark:text-slate-100">
                  {formatINR(val)}
                </span>
              </div>
            ))}
            {Object.keys(expenseMix).length === 0 && (
              <div className="col-span-full p-6 text-center text-xs text-slate-500 dark:text-slate-400">
                No expense records recorded in period
              </div>
            )}
          </div>
        </div>

        {/* Employee Field Assignments */}
        <div className="glass-card rounded-2xl border border-slate-200/90 dark:border-slate-800/90 shadow-2xs overflow-hidden">
          <div className="p-4 sm:p-5 border-b border-slate-200/80 dark:border-slate-800/80 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Briefcase className="w-4 h-4 text-blue-600 dark:text-blue-400" aria-hidden="true" />
              <h2 className="font-bold text-sm text-slate-900 dark:text-slate-100">
                Technician Work Assignments
              </h2>
            </div>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
              {Object.keys(empActivity).length} Active Staff
            </span>
          </div>
          <div className="p-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
            {Object.entries(empActivity).map(([name, val]) => (
              <div
                key={name}
                className="flex items-center gap-3 p-3 rounded-xl bg-slate-50/70 dark:bg-slate-850/50 border border-slate-200/60 dark:border-slate-800/60"
              >
                <div className="w-9 h-9 rounded-xl bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 flex items-center justify-center text-xs font-bold shrink-0 ring-1 ring-blue-600/20">
                  {name.charAt(0).toUpperCase()}
                </div>
                <div className="min-w-0">
                  <div className="text-xs sm:text-sm font-semibold text-slate-900 dark:text-slate-100 truncate">
                    {name}
                  </div>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400">
                    {val} Job{val > 1 ? 's' : ''} assigned
                  </div>
                </div>
              </div>
            ))}
            {Object.keys(empActivity).length === 0 && (
              <div className="col-span-full p-6 text-center text-xs text-slate-500 dark:text-slate-400">
                No active employee assignments in period
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
