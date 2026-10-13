'use client';

import { useState, useMemo, useCallback } from 'react';
import { Expense, Job, Employee, Customer, ExpenseCategory } from '@/types';
import { formatKolkataDateTime } from '@/lib/dateUtils';
import { 
  FileDown, 
  Filter, 
  TrendingUp, 
  TrendingDown, 
  Activity, 
  BriefcaseBusiness,
  CalendarDays,
  Building2,
  UserRound,
  Tags,
  CircleCheck,
  Receipt,
  WalletCards,
  X
} from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";

export default function ReportsClient({
  jobs,
  expenses,
  employees,
  categories,
  customers,
}: {
  jobs: Job[];
  expenses: Expense[];
  employees: Employee[];
  categories: ExpenseCategory[];
  customers: Customer[];
}) {
  // Filters
  const [dateRange, setDateRange] = useState('All'); // All, Today, This Week, This Month, Custom
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');
  const [customerFilter, setCustomerFilter] = useState('');
  const [employeeFilter, setEmployeeFilter] = useState('');
  const [jobTypeFilter, setJobTypeFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [jobStatusFilter, setJobStatusFilter] = useState('');
  const [chargeableFilter, setChargeableFilter] = useState('');

  // Helpers
  const getJob = useCallback((id: string) => jobs.find(j => j.id === id), [jobs]);
  const getCustomer = useCallback((id: string) => customers.find(c => c.id === id), [customers]);
  const getEmployeeName = useCallback((id: string) => employees.find(e => e.id === id)?.name || 'Unknown', [employees]);
  const getCategoryName = useCallback((id: string) => categories.find(c => c.id === id)?.name || 'Unknown', [categories]);

  // Filtered Expenses
  const filteredExpenses = useMemo(() => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    const thisWeekStart = new Date(today);
    thisWeekStart.setDate(today.getDate() - today.getDay());
    
    const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    return expenses.filter(exp => {
      const job = getJob(exp.jobId);
      const customer = job ? getCustomer(job.customerId) : null;

      // Date Range
      if (exp.dateTime && dateRange !== 'All') {
        const expDate = new Date(exp.dateTime);
        if (dateRange === 'Today' && expDate < today) return false;
        if (dateRange === 'This Week' && expDate < thisWeekStart) return false;
        if (dateRange === 'This Month' && expDate < thisMonthStart) return false;
        if (dateRange === 'Custom') {
          if (customStartDate && expDate < new Date(customStartDate)) return false;
          if (customEndDate) {
            const end = new Date(customEndDate);
            end.setHours(23, 59, 59, 999);
            if (expDate > end) return false;
          }
        }
      }

      if (customerFilter && customer?.id !== customerFilter) return false;
      if (employeeFilter && exp.employeeId !== employeeFilter) return false;
      if (jobTypeFilter && job?.jobType !== jobTypeFilter) return false;
      if (categoryFilter && exp.categoryId !== categoryFilter) return false;
      if (jobStatusFilter && job?.status !== jobStatusFilter) return false;
      if (chargeableFilter) {
        if (chargeableFilter === 'Chargeable' && exp.customerChargeable !== 'Yes') return false;
        if (chargeableFilter === 'Company' && exp.paidBy !== 'Company') return false;
      }

      return true;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [expenses, dateRange, customStartDate, customEndDate, customerFilter, employeeFilter, jobTypeFilter, categoryFilter, jobStatusFilter, chargeableFilter]);

  // Derived Job filtering based on filtered expenses
  const filteredJobs = useMemo(() => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    const thisWeekStart = new Date(today);
    thisWeekStart.setDate(today.getDate() - today.getDay());
    
    const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    return jobs.filter(job => {
      // Date Range (using Visit Date)
      if (job.visitDate && dateRange !== 'All') {
        const jobDate = new Date(job.visitDate);
        if (dateRange === 'Today' && jobDate < today) return false;
        if (dateRange === 'This Week' && jobDate < thisWeekStart) return false;
        if (dateRange === 'This Month' && jobDate < thisMonthStart) return false;
        if (dateRange === 'Custom') {
          if (customStartDate && jobDate < new Date(customStartDate)) return false;
          if (customEndDate) {
            const end = new Date(customEndDate);
            end.setHours(23, 59, 59, 999);
            if (jobDate > end) return false;
          }
        }
      }

      if (customerFilter && job.customerId !== customerFilter) return false;
      if (jobTypeFilter && job.jobType !== jobTypeFilter) return false;
      if (jobStatusFilter && job.status !== jobStatusFilter) return false;
      
      // If employee filter is active, job must have this employee assigned
      if (employeeFilter && !job.assignedEmployeeIds?.includes(employeeFilter)) return false;

      // Category and Chargeable filters
      if (categoryFilter || chargeableFilter) {
        const hasMatchingExpense = expenses.some(exp => 
          exp.jobId === job.id && 
          (!categoryFilter || exp.categoryId === categoryFilter) &&
          (!chargeableFilter || (chargeableFilter === 'Chargeable' && exp.customerChargeable === 'Yes') || (chargeableFilter === 'Company' && exp.paidBy === 'Company'))
        );
        if (!hasMatchingExpense) return false;
      }

      return true;
    });
  }, [jobs, expenses, dateRange, customStartDate, customEndDate, customerFilter, employeeFilter, jobTypeFilter, jobStatusFilter, categoryFilter, chargeableFilter]);

  // Summaries
  const totalRevenue = filteredJobs.reduce((sum, job) => sum + (job.finalBilledAmount || job.quotedAmount || 0), 0);
  const totalExpenses = filteredExpenses.reduce((sum, exp) => sum + (exp.amount || 0), 0);
  const estimatedContribution = totalRevenue - totalExpenses;

  // Breakdowns
  const expensesByCategory = filteredExpenses.reduce((acc, exp) => {
    const catName = getCategoryName(exp.categoryId);
    acc[catName] = (acc[catName] || 0) + (exp.amount || 0);
    return acc;
  }, {} as Record<string, number>);

  const expensesByEmployee = filteredExpenses.reduce((acc, exp) => {
    const empName = getEmployeeName(exp.employeeId);
    acc[empName] = (acc[empName] || 0) + (exp.amount || 0);
    return acc;
  }, {} as Record<string, number>);

  const revenueByJobType = filteredJobs.reduce((acc, job) => {
    const type = job.jobType || 'Other';
    acc[type] = (acc[type] || 0) + (job.finalBilledAmount || job.quotedAmount || 0);
    return acc;
  }, {} as Record<string, number>);

  const exportCSV = () => {
    if (filteredExpenses.length === 0) {
      alert("No expenses to export for the selected filters.");
      return;
    }

    const headers = [
      "Expense ID", "Job", "Customer", "Employee", "Job Type", "Job Status",
      "Category", "Amount", "Paid By", "Customer Chargeable", "Description",
      "Date/Time", "Expense Status"
    ];

    const rows = filteredExpenses.map(exp => {
      const job = getJob(exp.jobId);
      const customer = job ? getCustomer(job.customerId) : null;
      
      const row = [
        exp.expenseId || "No ID",
        job?.jobId || "Unnamed Job",
        customer?.name || "-",
        getEmployeeName(exp.employeeId),
        job?.jobType || "-",
        job?.status || "-",
        getCategoryName(exp.categoryId),
        exp.amount || 0,
        exp.paidBy || "-",
        exp.customerChargeable || "-",
        (exp.description || "-").replace(/"/g, '""'),
        exp.dateTime ? formatKolkataDateTime(exp.dateTime) : "-",
        exp.status || "-"
      ];
      return `"${row.join('","')}"`;
    });

    const csvContent = [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    
    let dateStr = dateRange;
    if (dateRange === 'Custom') dateStr = `${customStartDate}_to_${customEndDate}`;
    
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `expenses_report_${dateStr.replace(/ /g, '_').toLowerCase()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const clearAllFilters = () => {
    setDateRange('All');
    setCustomStartDate('');
    setCustomEndDate('');
    setCustomerFilter('');
    setEmployeeFilter('');
    setJobTypeFilter('');
    setCategoryFilter('');
    setJobStatusFilter('');
    setChargeableFilter('');
  };

  const hasActiveFilters = dateRange !== 'All' || customerFilter || employeeFilter || jobTypeFilter || categoryFilter || jobStatusFilter || chargeableFilter;

  const renderBreakdown = (data: Record<string, number>, type: 'revenue' | 'expense') => {
    const entries = Object.entries(data).sort((a, b) => b[1] - a[1]);
    
    if (entries.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center py-10 text-slate-400 dark:text-slate-500">
          <Activity className="w-8 h-8 mb-3 opacity-20" />
          <span className="text-sm font-medium text-slate-600 dark:text-slate-400">No data found</span>
          <span className="text-xs mt-1 text-slate-400 dark:text-slate-500 text-center">Try changing or clearing<br/>one of the filters.</span>
        </div>
      );
    }

    const maxVal = Math.max(...entries.map(e => e[1]));

    return (
      <div className="space-y-4 mt-2">
        {entries.map(([label, amt]) => {
          const percentage = maxVal > 0 ? (amt / maxVal) * 100 : 0;
          const isRevenue = type === 'revenue';
          return (
            <div key={label} className="group cursor-default relative p-2 -mx-2 rounded-lg hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors">
              <div className="flex justify-between items-center text-sm mb-1.5 gap-2">
                <span className="text-slate-700 dark:text-slate-300 font-medium truncate">{label}</span>
                <span className="font-semibold text-slate-900 dark:text-slate-100 tabular-nums shrink-0">₹{amt.toLocaleString('en-IN')}</span>
              </div>
              <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-1.5 overflow-hidden">
                <div 
                  className={`h-1.5 rounded-full transition-all duration-500 ease-out ${isRevenue ? 'bg-blue-500 dark:bg-blue-400' : 'bg-slate-400 dark:bg-slate-500'}`} 
                  style={{ width: `${percentage}%` }}
                ></div>
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  // Precompute financial overview maximums
  const maxOverview = Math.max(totalRevenue, totalExpenses, Math.abs(estimatedContribution), 1);
  const revenuePct = (totalRevenue / maxOverview) * 100;
  const expensesPct = (totalExpenses / maxOverview) * 100;
  const contributionPct = (Math.abs(estimatedContribution) / maxOverview) * 100;

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-12">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">Financial Reports</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Track revenue, expenses, contribution, and operational performance.</p>
        </div>
        <button 
          onClick={exportCSV}
          disabled={filteredExpenses.length === 0}
          className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium rounded-xl border border-slate-200/80 dark:border-slate-800/80 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 shadow-2xs transition-all focus:outline-none focus:ring-2 focus:ring-blue-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <FileDown className="w-4 h-4 text-slate-500 dark:text-slate-400" />
          Export CSV
        </button>
      </div>

      {/* Filter Control Bar */}
      <div className="glass-card border border-slate-200/80 dark:border-slate-800/80 rounded-2xl overflow-hidden shadow-2xs">
        <div className="bg-slate-50/70 dark:bg-slate-900/70 border-b border-slate-200/60 dark:border-slate-800/60 p-4 sm:px-5 flex items-center justify-between">
          <div className="flex flex-col">
            <div className="flex items-center gap-2 text-slate-900 dark:text-slate-100 font-semibold text-sm">
              <Filter className="w-4 h-4 text-slate-500 dark:text-slate-400" />
              Report Filters
            </div>
            <span className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Refine report calculations by date range, customer, employee, and expense category.</span>
          </div>
        </div>
        
        <div className="p-4 sm:p-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7 gap-3.5">
            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <CalendarDays className="w-3 h-3 text-slate-400" /> Date Range
              </label>
              <Select value={dateRange} onValueChange={(v) => setDateRange(v || 'All')}>
                <SelectTrigger className="h-9 w-full bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-900 transition-colors focus:ring-2 focus:ring-blue-500/20 text-sm">
                  <SelectValue placeholder="All Dates" />
                </SelectTrigger>
                <SelectContent className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100">
                  <SelectItem value="All" label="All Dates">All Dates</SelectItem>
                  <SelectItem value="Today" label="Today">Today</SelectItem>
                  <SelectItem value="This Week" label="This Week">This Week</SelectItem>
                  <SelectItem value="This Month" label="This Month">This Month</SelectItem>
                  <SelectItem value="Custom" label="Custom Range">Custom Range</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <Building2 className="w-3 h-3 text-slate-400" /> Customer
              </label>
              <Select value={customerFilter || 'all'} onValueChange={(v) => setCustomerFilter(v === 'all' || !v ? '' : v)}>
                <SelectTrigger className="h-9 w-full bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-900 transition-colors focus:ring-2 focus:ring-blue-500/20 text-sm">
                  <SelectValue placeholder="All Customers" />
                </SelectTrigger>
                <SelectContent className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100">
                  <SelectItem value="all" label="All Customers">All Customers</SelectItem>
                  {customers.map(c => <SelectItem key={c.id} value={c.id} label={c.name}>{c.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <UserRound className="w-3 h-3 text-slate-400" /> Employee
              </label>
              <Select value={employeeFilter || 'all'} onValueChange={(v) => setEmployeeFilter(v === 'all' || !v ? '' : v)}>
                <SelectTrigger className="h-9 w-full bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-900 transition-colors focus:ring-2 focus:ring-blue-500/20 text-sm">
                  <SelectValue placeholder="All Employees" />
                </SelectTrigger>
                <SelectContent className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100">
                  <SelectItem value="all" label="All Employees">All Employees</SelectItem>
                  {employees.map(e => <SelectItem key={e.id} value={e.id} label={e.name}>{e.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <BriefcaseBusiness className="w-3 h-3 text-slate-400" /> Job Type
              </label>
              <Select value={jobTypeFilter || 'all'} onValueChange={(v) => setJobTypeFilter(v === 'all' || !v ? '' : v)}>
                <SelectTrigger className="h-9 w-full bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-900 transition-colors focus:ring-2 focus:ring-blue-500/20 text-sm">
                  <SelectValue placeholder="All Job Types" />
                </SelectTrigger>
                <SelectContent className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100">
                  <SelectItem value="all" label="All Job Types">All Job Types</SelectItem>
                  <SelectItem value="Repair" label="Repair">Repair</SelectItem>
                  <SelectItem value="Installation" label="Installation">Installation</SelectItem>
                  <SelectItem value="Maintenance" label="Maintenance">Maintenance</SelectItem>
                  <SelectItem value="Inspection" label="Inspection">Inspection</SelectItem>
                  <SelectItem value="Other" label="Other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <Tags className="w-3 h-3 text-slate-400" /> Category
              </label>
              <Select value={categoryFilter || 'all'} onValueChange={(v) => setCategoryFilter(v === 'all' || !v ? '' : v)}>
                <SelectTrigger className="h-9 w-full bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-900 transition-colors focus:ring-2 focus:ring-blue-500/20 text-sm">
                  <SelectValue placeholder="All Categories" />
                </SelectTrigger>
                <SelectContent className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100">
                  <SelectItem value="all" label="All Categories">All Categories</SelectItem>
                  {categories.map(c => <SelectItem key={c.id} value={c.id} label={c.name}>{c.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <CircleCheck className="w-3 h-3 text-slate-400" /> Job Status
              </label>
              <Select value={jobStatusFilter || 'all'} onValueChange={(v) => setJobStatusFilter(v === 'all' || !v ? '' : v)}>
                <SelectTrigger className="h-9 w-full bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-900 transition-colors focus:ring-2 focus:ring-blue-500/20 text-sm">
                  <SelectValue placeholder="All Job Statuses" />
                </SelectTrigger>
                <SelectContent className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100">
                  <SelectItem value="all" label="All Job Statuses">All Job Statuses</SelectItem>
                  <SelectItem value="Open" label="Open">Open</SelectItem>
                  <SelectItem value="In Progress" label="In Progress">In Progress</SelectItem>
                  <SelectItem value="Completed" label="Completed">Completed</SelectItem>
                  <SelectItem value="Cancelled" label="Cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <Receipt className="w-3 h-3 text-slate-400" /> Expenses
              </label>
              <Select value={chargeableFilter || 'all'} onValueChange={(v) => setChargeableFilter(v === 'all' || !v ? '' : v)}>
                <SelectTrigger className="h-9 w-full bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-900 transition-colors focus:ring-2 focus:ring-blue-500/20 text-sm">
                  <SelectValue placeholder="All Expenses" />
                </SelectTrigger>
                <SelectContent className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100">
                  <SelectItem value="all" label="All Expenses">All Expenses</SelectItem>
                  <SelectItem value="Chargeable" label="Chargeable to Customer">Chargeable to Customer</SelectItem>
                  <SelectItem value="Company" label="Paid by Company">Paid by Company</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {dateRange === 'Custom' && (
            <div className="mt-4 flex items-center gap-3 bg-slate-50/80 dark:bg-slate-900/80 p-2.5 rounded-xl border border-slate-200/80 dark:border-slate-800/80 max-w-sm">
              <input 
                type="date" 
                value={customStartDate} 
                onChange={(e) => setCustomStartDate(e.target.value)} 
                className="px-2.5 py-1.5 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500/20 w-full" 
              />
              <span className="text-slate-400 font-medium text-xs uppercase tracking-wider">to</span>
              <input 
                type="date" 
                value={customEndDate} 
                onChange={(e) => setCustomEndDate(e.target.value)} 
                className="px-2.5 py-1.5 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500/20 w-full" 
              />
            </div>
          )}
        </div>
      </div>

      {/* Active Filters State */}
      {hasActiveFilters && (
        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
          <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider shrink-0">Filtered by:</span>
          <div className="flex flex-wrap items-center gap-2">
            {dateRange !== 'All' && (
              <Badge variant="secondary" className="bg-white dark:bg-slate-900 border-slate-200/80 dark:border-slate-800/80 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 font-normal px-2.5 py-1 text-xs rounded-lg shadow-2xs">
                {dateRange === 'Custom' ? `${customStartDate || '?'} to ${customEndDate || '?'}` : dateRange}
                <button onClick={() => { setDateRange('All'); setCustomStartDate(''); setCustomEndDate(''); }} className="ml-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 focus:outline-none"><X className="w-3 h-3" /></button>
              </Badge>
            )}
            {customerFilter && (
              <Badge variant="secondary" className="bg-white dark:bg-slate-900 border-slate-200/80 dark:border-slate-800/80 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 font-normal px-2.5 py-1 text-xs rounded-lg shadow-2xs">
                Customer: {getCustomer(customerFilter)?.name || 'Unknown'}
                <button onClick={() => setCustomerFilter('')} className="ml-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 focus:outline-none"><X className="w-3 h-3" /></button>
              </Badge>
            )}
            {employeeFilter && (
              <Badge variant="secondary" className="bg-white dark:bg-slate-900 border-slate-200/80 dark:border-slate-800/80 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 font-normal px-2.5 py-1 text-xs rounded-lg shadow-2xs">
                Employee: {getEmployeeName(employeeFilter)}
                <button onClick={() => setEmployeeFilter('')} className="ml-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 focus:outline-none"><X className="w-3 h-3" /></button>
              </Badge>
            )}
            {jobTypeFilter && (
              <Badge variant="secondary" className="bg-white dark:bg-slate-900 border-slate-200/80 dark:border-slate-800/80 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 font-normal px-2.5 py-1 text-xs rounded-lg shadow-2xs">
                Job: {jobTypeFilter}
                <button onClick={() => setJobTypeFilter('')} className="ml-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 focus:outline-none"><X className="w-3 h-3" /></button>
              </Badge>
            )}
            {categoryFilter && (
              <Badge variant="secondary" className="bg-white dark:bg-slate-900 border-slate-200/80 dark:border-slate-800/80 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 font-normal px-2.5 py-1 text-xs rounded-lg shadow-2xs">
                Category: {getCategoryName(categoryFilter)}
                <button onClick={() => setCategoryFilter('')} className="ml-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 focus:outline-none"><X className="w-3 h-3" /></button>
              </Badge>
            )}
            {jobStatusFilter && (
              <Badge variant="secondary" className="bg-white dark:bg-slate-900 border-slate-200/80 dark:border-slate-800/80 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 font-normal px-2.5 py-1 text-xs rounded-lg shadow-2xs">
                Status: {jobStatusFilter}
                <button onClick={() => setJobStatusFilter('')} className="ml-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 focus:outline-none"><X className="w-3 h-3" /></button>
              </Badge>
            )}
            {chargeableFilter && (
              <Badge variant="secondary" className="bg-white dark:bg-slate-900 border-slate-200/80 dark:border-slate-800/80 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 font-normal px-2.5 py-1 text-xs rounded-lg shadow-2xs">
                {chargeableFilter === 'Chargeable' ? 'Chargeable' : 'Company Paid'}
                <button onClick={() => setChargeableFilter('')} className="ml-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 focus:outline-none"><X className="w-3 h-3" /></button>
              </Badge>
            )}
            <button 
              onClick={clearAllFilters} 
              className="text-xs text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium px-2 py-1 rounded-md hover:bg-blue-50 dark:hover:bg-blue-950/50 transition-colors"
            >
              Clear all
            </button>
          </div>
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* Revenue */}
        <div className="glass-card border border-slate-200/80 dark:border-slate-800/80 rounded-2xl p-5 sm:p-6 shadow-2xs hover:shadow-xs transition-all">
          <div className="flex justify-between items-start mb-4">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Revenue
            </span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 flex items-center justify-center border border-emerald-200/60 dark:border-emerald-800/60 shadow-2xs">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="flex flex-col">
            <span className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-slate-100 tabular-nums tracking-tight">
              ₹{totalRevenue.toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
            </span>
            <span className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-medium">
              {filteredJobs.length} {filteredJobs.length === 1 ? 'job order' : 'job orders'}
            </span>
          </div>
        </div>

        {/* Expenses */}
        <div className="glass-card border border-slate-200/80 dark:border-slate-800/80 rounded-2xl p-5 sm:p-6 shadow-2xs hover:shadow-xs transition-all">
          <div className="flex justify-between items-start mb-4">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Expenses
            </span>
            <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 flex items-center justify-center border border-slate-200/60 dark:border-slate-700/60 shadow-2xs">
              <TrendingDown className="w-4 h-4" />
            </div>
          </div>
          <div className="flex flex-col">
            <span className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-slate-100 tabular-nums tracking-tight">
              ₹{totalExpenses.toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
            </span>
            <span className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-medium">
              {filteredExpenses.length} expense {filteredExpenses.length === 1 ? 'record' : 'records'}
            </span>
          </div>
        </div>

        {/* Estimated Contribution */}
        <div className="glass-card border border-blue-200/80 dark:border-blue-900/60 bg-gradient-to-br from-blue-50/70 via-white to-white dark:from-blue-950/40 dark:via-slate-900/90 dark:to-slate-900/90 rounded-2xl p-5 sm:p-6 shadow-2xs hover:shadow-xs transition-all relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 dark:bg-blue-500/5 rounded-full blur-2xl -mr-8 -mt-8 pointer-events-none"></div>
          <div className="flex justify-between items-start mb-4 relative z-10">
            <span className="text-xs font-bold text-blue-800 dark:text-blue-300 uppercase tracking-wider">
              Estimated Contribution
            </span>
            <div className="w-8 h-8 rounded-lg bg-blue-100/80 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 flex items-center justify-center border border-blue-200/60 dark:border-blue-800/60 shadow-2xs">
              <WalletCards className="w-4 h-4" />
            </div>
          </div>
          <div className="flex flex-col relative z-10">
            <span className="text-2xl sm:text-3xl font-bold text-blue-950 dark:text-blue-50 tabular-nums tracking-tight">
              ₹{estimatedContribution.toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
            </span>
            <span className="text-xs text-blue-700/80 dark:text-blue-300/80 mt-1 font-medium">
              Net Operating Profit (Revenue − Expenses)
            </span>
          </div>
        </div>
      </div>

      {/* Financial Overview (Visualization) */}
      {(totalRevenue > 0 || totalExpenses > 0) && (
        <div className="glass-card border border-slate-200/80 dark:border-slate-800/80 rounded-2xl overflow-hidden shadow-2xs">
          <div className="p-4 sm:p-5 border-b border-slate-200/60 dark:border-slate-800/60 bg-slate-50/70 dark:bg-slate-900/70">
            <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <Activity className="w-4 h-4 text-slate-500 dark:text-slate-400" />
              Financial Ratio &amp; Margin Overview
            </h2>
          </div>
          <div className="p-5 sm:p-8">
            <div className="max-w-4xl mx-auto space-y-6">
              {/* Revenue */}
              <div>
                <div className="flex justify-between items-end mb-2">
                  <span className="text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider">Gross Revenue</span>
                  <span className="text-lg font-bold text-slate-900 dark:text-slate-100 tabular-nums">₹{totalRevenue.toLocaleString('en-IN')}</span>
                </div>
                <div className="w-full bg-slate-100 dark:bg-slate-800 h-3 rounded-full overflow-hidden">
                  <div className="bg-emerald-500 dark:bg-emerald-400 h-full rounded-full transition-all duration-1000 ease-out" style={{ width: `${revenuePct}%` }}></div>
                </div>
              </div>
              
              {/* Expenses */}
              <div>
                <div className="flex justify-between items-end mb-2">
                  <span className="text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider">Total Expenses</span>
                  <span className="text-lg font-bold text-slate-900 dark:text-slate-100 tabular-nums">₹{totalExpenses.toLocaleString('en-IN')}</span>
                </div>
                <div className="w-full bg-slate-100 dark:bg-slate-800 h-3 rounded-full overflow-hidden">
                  <div className="bg-slate-400 dark:bg-slate-500 h-full rounded-full transition-all duration-1000 ease-out" style={{ width: `${expensesPct}%` }}></div>
                </div>
              </div>

              {/* Contribution */}
              <div>
                <div className="flex justify-between items-end mb-2">
                  <span className="text-xs font-semibold text-blue-800 dark:text-blue-300 uppercase tracking-wider">Estimated Contribution Margin</span>
                  <span className={`text-lg font-bold tabular-nums ${estimatedContribution >= 0 ? 'text-blue-600 dark:text-blue-400' : 'text-rose-600 dark:text-rose-400'}`}>
                    ₹{estimatedContribution.toLocaleString('en-IN')}
                  </span>
                </div>
                <div className="w-full bg-slate-100 dark:bg-slate-800 h-3 rounded-full overflow-hidden">
                  <div className={`h-full rounded-full transition-all duration-1000 ease-out ${estimatedContribution >= 0 ? 'bg-blue-600 dark:bg-blue-500' : 'bg-rose-500 dark:bg-rose-400'}`} style={{ width: `${contributionPct}%` }}></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Breakdowns */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="glass-card border border-slate-200/80 dark:border-slate-800/80 rounded-2xl overflow-hidden shadow-2xs">
          <div className="p-4 sm:p-5 border-b border-slate-200/60 dark:border-slate-800/60 bg-slate-50/50 dark:bg-slate-900/50">
            <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <BriefcaseBusiness className="w-4 h-4 text-slate-500 dark:text-slate-400" />
              Revenue by Job Type
            </h3>
          </div>
          <div className="p-5">
            {renderBreakdown(revenueByJobType, 'revenue')}
          </div>
        </div>

        <div className="glass-card border border-slate-200/80 dark:border-slate-800/80 rounded-2xl overflow-hidden shadow-2xs">
          <div className="p-4 sm:p-5 border-b border-slate-200/60 dark:border-slate-800/60 bg-slate-50/50 dark:bg-slate-900/50">
            <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <Tags className="w-4 h-4 text-slate-500 dark:text-slate-400" />
              Expenses by Category
            </h3>
          </div>
          <div className="p-5">
            {renderBreakdown(expensesByCategory, 'expense')}
          </div>
        </div>

        <div className="glass-card border border-slate-200/80 dark:border-slate-800/80 rounded-2xl overflow-hidden shadow-2xs">
          <div className="p-4 sm:p-5 border-b border-slate-200/60 dark:border-slate-800/60 bg-slate-50/50 dark:bg-slate-900/50">
            <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <UserRound className="w-4 h-4 text-slate-500 dark:text-slate-400" />
              Expenses by Employee
            </h3>
          </div>
          <div className="p-5">
            {renderBreakdown(expensesByEmployee, 'expense')}
          </div>
        </div>
      </div>
    </div>
  );
}
