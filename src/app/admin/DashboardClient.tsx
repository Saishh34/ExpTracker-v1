"use client";

import { useState, useMemo } from 'react';
import { Job, Expense, Customer, Employee, ExpenseCategory } from '@/types';
import { formatKolkataDateTime } from '@/lib/dateUtils';
import { Calendar, IndianRupee, TrendingDown, Wallet, Briefcase, Activity, Clock, FileText, ArrowUpRight, ArrowDownRight, Users, CheckCircle2 } from 'lucide-react';

type DateFilter = 'Today' | 'This Week' | 'This Month' | 'Custom';

export default function DashboardClient({ jobs, expenses, customers, employees, categories }: {
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
      end = new Date(customEnd).getTime() + 86400000; // end of the selected day
    }

    const parseDate = (d?: string) => d ? new Date(d).getTime() : 0;
    
    const fJobs = jobs.filter(j => {
      const t = parseDate(j.visitDate);
      return t >= start && t < end;
    });

    const fExpenses = expenses.filter(e => {
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
    const cat = categories.find(c => c.id === e.categoryId)?.name || 'Unknown';
    acc[cat] = (acc[cat] || 0) + (e.amount || 0);
    return acc;
  }, {} as Record<string, number>);

  const topCustomers = filteredJobs.reduce((acc, j) => {
    const cName = customers.find(c => c.id === j.customerId)?.name || 'Unknown';
    acc[cName] = (acc[cName] || 0) + (j.finalBilledAmount || 0);
    return acc;
  }, {} as Record<string, number>);
  const sortedCustomers = Object.entries(topCustomers).sort((a,b) => b[1] - a[1]).slice(0,5);

  const empActivity = filteredJobs.reduce((acc, j) => {
    if (j.assignedEmployeeIds && Array.isArray(j.assignedEmployeeIds)) {
      j.assignedEmployeeIds.forEach(eid => {
        const eName = employees.find(e => e.id === eid)?.name || 'Unknown';
        acc[eName] = (acc[eName] || 0) + 1;
      });
    }
    return acc;
  }, {} as Record<string, number>);

  const recentActivity = [
    ...filteredJobs.map(j => ({ 
      type: 'Job', 
      date: j.visitDate || '', 
      title: `${j.jobType} Job - ${customers.find(c=>c.id===j.customerId)?.name || 'Unknown'}`, 
      amount: j.finalBilledAmount || 0 
    })),
    ...filteredExpenses.map(e => ({ 
      type: 'Expense', 
      date: e.dateTime, 
      title: `Expense: ${e.description || categories.find(c=>c.id===e.categoryId)?.name || 'Unknown'}`, 
      amount: e.amount || 0 
    }))
  ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 10);

  const formatINR = (val: number) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(val);
  const formatDate = (dateStr: string) => formatKolkataDateTime(dateStr);

  return (
    <div className="space-y-6 text-slate-900 max-w-7xl mx-auto">
      {/* Header & Filters */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Dashboard Overview</h1>
          <p className="text-sm text-slate-500 mt-1">Track your operational performance and financial metrics.</p>
        </div>
        <div className="flex flex-wrap items-center gap-3 bg-white p-2 rounded-xl shadow-sm border border-slate-200">
          <div className="flex items-center pl-2 text-slate-400">
            <Calendar className="w-4 h-4" />
          </div>
          <select 
            className="pl-1 pr-8 py-1.5 text-sm font-medium border-0 text-slate-700 bg-transparent focus:ring-0 cursor-pointer appearance-none outline-none" 
            value={dateFilter} 
            onChange={e => setDateFilter(e.target.value as DateFilter)}
          >
            <option>Today</option>
            <option>This Week</option>
            <option>This Month</option>
            <option>Custom</option>
          </select>
          {dateFilter === 'Custom' && (
            <div className="flex items-center gap-2 pr-2 border-l border-slate-200 pl-3">
              <input type="date" className="px-2 py-1 text-sm border-0 text-slate-600 bg-slate-50 rounded focus:ring-1 focus:ring-blue-500 outline-none" value={customStart} onChange={e => setCustomStart(e.target.value)} />
              <span className="text-slate-400 text-xs">to</span>
              <input type="date" className="px-2 py-1 text-sm border-0 text-slate-600 bg-slate-50 rounded focus:ring-1 focus:ring-blue-500 outline-none" value={customEnd} onChange={e => setCustomEnd(e.target.value)} />
            </div>
          )}
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <IndianRupee className="w-12 h-12 text-blue-600" />
          </div>
          <div className="flex items-center gap-2 text-sm font-medium text-slate-500 mb-3">
            <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600">
              <IndianRupee className="w-4 h-4" />
            </div>
            Total Revenue
          </div>
          <div className="text-3xl font-bold text-slate-900">{formatINR(revenue)}</div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <TrendingDown className="w-12 h-12 text-red-600" />
          </div>
          <div className="flex items-center gap-2 text-sm font-medium text-slate-500 mb-3">
            <div className="w-8 h-8 rounded-lg bg-red-50 flex items-center justify-center text-red-600">
              <TrendingDown className="w-4 h-4" />
            </div>
            Total Expenses
          </div>
          <div className="text-3xl font-bold text-slate-900">{formatINR(totalExpenses)}</div>
        </div>

        <div className="bg-gradient-to-br from-slate-900 to-slate-800 p-5 rounded-2xl shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <Wallet className="w-12 h-12 text-white" />
          </div>
          <div className="flex items-center gap-2 text-sm font-medium text-slate-300 mb-3">
            <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center text-white">
              <Wallet className="w-4 h-4" />
            </div>
            Est. Contribution
          </div>
          <div className="text-3xl font-bold text-white">{formatINR(contribution)}</div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <Briefcase className="w-12 h-12 text-emerald-600" />
          </div>
          <div className="flex items-center gap-2 text-sm font-medium text-slate-500 mb-3">
            <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-600">
              <Briefcase className="w-4 h-4" />
            </div>
            Completed Jobs
          </div>
          <div className="text-3xl font-bold text-slate-900">{numJobs}</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Left Column (2/3 width) */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col h-full max-h-[500px]">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <h2 className="font-semibold text-slate-800 flex items-center gap-2">
                <Activity className="w-4 h-4 text-slate-500" />
                Recent Activity
              </h2>
            </div>
            <div className="p-0 overflow-y-auto custom-scrollbar flex-1">
              <ul className="divide-y divide-slate-100">
                {recentActivity.map((act, i) => (
                  <li key={i} className="p-4 hover:bg-slate-50 transition-colors flex items-center justify-between group">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${act.type === 'Job' ? 'bg-emerald-100 text-emerald-600' : 'bg-red-100 text-red-600'}`}>
                        {act.type === 'Job' ? <ArrowUpRight className="w-5 h-5" /> : <ArrowDownRight className="w-5 h-5" />}
                      </div>
                      <div>
                        <div className="font-medium text-slate-900 text-sm group-hover:text-blue-600 transition-colors line-clamp-1">{act.title}</div>
                        <div className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                          <Clock className="w-3 h-3" />
                          {formatDate(act.date)}
                        </div>
                      </div>
                    </div>
                    <div className={`font-semibold shrink-0 text-right ${act.type === 'Job' ? 'text-emerald-600' : 'text-slate-900'}`}>
                      {act.type === 'Job' ? '+' : '-'}{formatINR(act.amount)}
                    </div>
                  </li>
                ))}
                {recentActivity.length === 0 && (
                  <div className="p-8 text-center text-slate-500 flex flex-col items-center justify-center">
                    <div className="w-12 h-12 bg-slate-50 rounded-full flex items-center justify-center mb-3">
                      <FileText className="w-6 h-6 text-slate-400" />
                    </div>
                    <p className="text-sm font-medium text-slate-600">No recent activity</p>
                    <p className="text-xs text-slate-400 mt-1">There are no records for the selected period.</p>
                  </div>
                )}
              </ul>
            </div>
          </div>
        </div>

        {/* Right Column (1/3 width) */}
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-5 border-b border-slate-100">
              <h2 className="font-semibold text-slate-800 flex items-center gap-2 text-sm">
                <Users className="w-4 h-4 text-slate-500" />
                Top Customers
              </h2>
            </div>
            <div className="p-2">
              {sortedCustomers.map(([name, val], i) => (
                <div key={name} className="flex items-center justify-between p-3 rounded-lg hover:bg-slate-50 transition-colors">
                  <div className="flex items-center gap-3 overflow-hidden">
                    <div className="w-8 h-8 rounded bg-slate-100 text-slate-600 flex items-center justify-center text-xs font-bold shrink-0">
                      {i + 1}
                    </div>
                    <span className="text-sm font-medium text-slate-700 truncate">{name}</span>
                  </div>
                  <span className="text-sm font-semibold text-slate-900 shrink-0">{formatINR(val)}</span>
                </div>
              ))}
              {sortedCustomers.length === 0 && (
                <div className="p-4 text-center text-sm text-slate-500">No customer data available</div>
              )}
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-5 border-b border-slate-100">
              <h2 className="font-semibold text-slate-800 flex items-center gap-2 text-sm">
                <CheckCircle2 className="w-4 h-4 text-slate-500" />
                Job Types Mix
              </h2>
            </div>
            <div className="p-4 space-y-4">
              {Object.entries(revenueMix).map(([type, val]) => {
                const percentage = revenue > 0 ? (val / revenue) * 100 : 0;
                return (
                  <div key={type}>
                    <div className="flex justify-between items-center text-xs font-medium mb-1.5">
                      <span className="text-slate-700">{type}</span>
                      <span className="text-slate-900">{formatINR(val)} ({percentage.toFixed(1)}%)</span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                      <div className="bg-blue-500 h-1.5 rounded-full" style={{ width: `${percentage}%` }}></div>
                    </div>
                  </div>
                );
              })}
              {Object.keys(revenueMix).length === 0 && (
                <div className="text-center text-sm text-slate-500">No revenue data available</div>
              )}
            </div>
          </div>
        </div>
      </div>
      
      {/* Footer Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-5 border-b border-slate-100">
            <h2 className="font-semibold text-slate-800 text-sm">Expense Categories Breakdown</h2>
          </div>
          <div className="p-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
            {Object.entries(expenseMix).map(([cat, val]) => (
              <div key={cat} className="flex flex-col p-3 rounded-xl bg-slate-50 border border-slate-100">
                <span className="text-xs text-slate-500 font-medium mb-1">{cat}</span>
                <span className="font-semibold text-slate-900">{formatINR(val)}</span>
              </div>
            ))}
            {Object.keys(expenseMix).length === 0 && (
              <div className="col-span-full p-4 text-center text-sm text-slate-500">No expense data available</div>
            )}
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-5 border-b border-slate-100">
            <h2 className="font-semibold text-slate-800 text-sm">Employee Job Assignments</h2>
          </div>
          <div className="p-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
            {Object.entries(empActivity).map(([name, val]) => (
              <div key={name} className="flex items-center gap-3 p-3 rounded-xl border border-slate-100 hover:border-blue-200 transition-colors">
                <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-xs font-bold shrink-0">
                  {name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <div className="text-sm font-medium text-slate-900 truncate">{name}</div>
                  <div className="text-xs text-slate-500">{val} Job{val > 1 ? 's' : ''}</div>
                </div>
              </div>
            ))}
            {Object.keys(empActivity).length === 0 && (
              <div className="col-span-full p-4 text-center text-sm text-slate-500">No employee activity available</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
