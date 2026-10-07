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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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

      // Category and Chargeable filters don't strictly apply to Jobs. 
      // If they are active, should we only count jobs that HAVE such expenses? 
      // Yes, if filtering by "Spare Part", revenue should only be from jobs that used spare parts.
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
        (exp.description || "-").replace(/"/g, '""'), // escape quotes
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
        <div className="flex flex-col items-center justify-center py-10 text-slate-400">
          <Activity className="w-8 h-8 mb-3 opacity-20" />
          <span className="text-sm font-medium">No data found</span>
          <span className="text-xs mt-1 text-slate-400 text-center">Try changing or clearing<br/>one of the filters.</span>
        </div>
      );
    }

    const maxVal = Math.max(...entries.map(e => e[1]));

    return (
      <div className="space-y-5 mt-2">
        {entries.map(([label, amt]) => {
          const percentage = maxVal > 0 ? (amt / maxVal) * 100 : 0;
          const isRevenue = type === 'revenue';
          return (
            <div key={label} className="group cursor-default relative">
              <div className="flex justify-between items-center text-sm mb-1.5">
                <span className="text-slate-700 font-medium truncate pr-4">{label}</span>
                <span className="font-semibold text-slate-900 tabular-nums shrink-0">₹{amt.toLocaleString('en-IN')}</span>
              </div>
              <div className="w-full bg-slate-100/80 rounded-full h-1.5 overflow-hidden">
                <div 
                  className={`h-1.5 rounded-full transition-all duration-500 ease-out ${isRevenue ? 'bg-blue-500' : 'bg-slate-400'}`} 
                  style={{ width: `${percentage}%` }}
                ></div>
              </div>
              <div className="absolute inset-0 bg-slate-50/0 group-hover:bg-slate-50/50 transition-colors pointer-events-none rounded-md -mx-2 -my-1"></div>
            </div>
          )
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
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Financial Reports</h1>
          <p className="text-sm text-slate-500 mt-1.5">Track revenue, expenses, contribution, and operational performance.</p>
        </div>
        <button 
          onClick={exportCSV}
          disabled={filteredExpenses.length === 0}
          className="w-full sm:w-auto bg-white border border-slate-200 text-slate-700 px-4 py-2 rounded-lg hover:bg-slate-50 font-medium shadow-sm transition-all focus:ring-2 focus:ring-blue-500 focus:outline-none flex items-center justify-center gap-2 text-sm disabled:opacity-50"
        >
          <FileDown className="w-4 h-4 text-slate-500" />
          Export CSV
        </button>
      </div>

      {/* Filter Control Bar */}
      <Card className="border-slate-200 shadow-sm overflow-hidden">
        <div className="bg-slate-50/50 border-b border-slate-100 p-4 flex items-center justify-between">
          <div className="flex flex-col">
            <div className="flex items-center gap-2 text-slate-800 font-semibold text-sm">
              <Filter className="w-4 h-4 text-slate-500" />
              Filters
            </div>
            <span className="text-xs text-slate-500 mt-0.5">Refine the report by date, customer, employee, job, and expense criteria.</span>
          </div>
        </div>
        
        <div className="p-4 sm:p-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7 gap-4">
            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                <CalendarDays className="w-3 h-3" /> All Dates
              </label>
              <Select value={dateRange} onValueChange={(v) => setDateRange(v || 'All')}>
                <SelectTrigger className="h-9 w-full bg-white border-slate-200 shadow-sm rounded-md hover:bg-slate-50 transition-colors focus:ring-1 focus:ring-blue-500 text-sm">
                  <SelectValue placeholder="All Dates" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="All" label="All Dates">All Dates</SelectItem>
                  <SelectItem value="Today" label="Today">Today</SelectItem>
                  <SelectItem value="This Week" label="This Week">This Week</SelectItem>
                  <SelectItem value="This Month" label="This Month">This Month</SelectItem>
                  <SelectItem value="Custom" label="Custom Range">Custom Range</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                <Building2 className="w-3 h-3" /> Customer
              </label>
              <Select value={customerFilter || 'all'} onValueChange={(v) => setCustomerFilter(v === 'all' || !v ? '' : v)}>
                <SelectTrigger className="h-9 w-full bg-white border-slate-200 shadow-sm rounded-md hover:bg-slate-50 transition-colors focus:ring-1 focus:ring-blue-500 text-sm">
                  <SelectValue placeholder="All Customers" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all" label="All Customers">All Customers</SelectItem>
                  {customers.map(c => <SelectItem key={c.id} value={c.id} label={c.name}>{c.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                <UserRound className="w-3 h-3" /> Employee
              </label>
              <Select value={employeeFilter || 'all'} onValueChange={(v) => setEmployeeFilter(v === 'all' || !v ? '' : v)}>
                <SelectTrigger className="h-9 w-full bg-white border-slate-200 shadow-sm rounded-md hover:bg-slate-50 transition-colors focus:ring-1 focus:ring-blue-500 text-sm">
                  <SelectValue placeholder="All Employees" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all" label="All Employees">All Employees</SelectItem>
                  {employees.map(e => <SelectItem key={e.id} value={e.id} label={e.name}>{e.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                <BriefcaseBusiness className="w-3 h-3" /> Job Type
              </label>
              <Select value={jobTypeFilter || 'all'} onValueChange={(v) => setJobTypeFilter(v === 'all' || !v ? '' : v)}>
                <SelectTrigger className="h-9 w-full bg-white border-slate-200 shadow-sm rounded-md hover:bg-slate-50 transition-colors focus:ring-1 focus:ring-blue-500 text-sm">
                  <SelectValue placeholder="All Job Types" />
                </SelectTrigger>
                <SelectContent>
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
              <label className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                <Tags className="w-3 h-3" /> Category
              </label>
              <Select value={categoryFilter || 'all'} onValueChange={(v) => setCategoryFilter(v === 'all' || !v ? '' : v)}>
                <SelectTrigger className="h-9 w-full bg-white border-slate-200 shadow-sm rounded-md hover:bg-slate-50 transition-colors focus:ring-1 focus:ring-blue-500 text-sm">
                  <SelectValue placeholder="All Categories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all" label="All Categories">All Categories</SelectItem>
                  {categories.map(c => <SelectItem key={c.id} value={c.id} label={c.name}>{c.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                <CircleCheck className="w-3 h-3" /> Job Status
              </label>
              <Select value={jobStatusFilter || 'all'} onValueChange={(v) => setJobStatusFilter(v === 'all' || !v ? '' : v)}>
                <SelectTrigger className="h-9 w-full bg-white border-slate-200 shadow-sm rounded-md hover:bg-slate-50 transition-colors focus:ring-1 focus:ring-blue-500 text-sm">
                  <SelectValue placeholder="All Job Statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all" label="All Job Statuses">All Job Statuses</SelectItem>
                  <SelectItem value="Open" label="Open">Open</SelectItem>
                  <SelectItem value="In Progress" label="In Progress">In Progress</SelectItem>
                  <SelectItem value="Completed" label="Completed">Completed</SelectItem>
                  <SelectItem value="Cancelled" label="Cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                <Receipt className="w-3 h-3" /> Expenses
              </label>
              <Select value={chargeableFilter || 'all'} onValueChange={(v) => setChargeableFilter(v === 'all' || !v ? '' : v)}>
                <SelectTrigger className="h-9 w-full bg-white border-slate-200 shadow-sm rounded-md hover:bg-slate-50 transition-colors focus:ring-1 focus:ring-blue-500 text-sm">
                  <SelectValue placeholder="All Expenses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all" label="All Expenses">All Expenses</SelectItem>
                  <SelectItem value="Chargeable" label="Chargeable to Customer">Chargeable to Customer</SelectItem>
                  <SelectItem value="Company" label="Paid by Company">Paid by Company</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {dateRange === 'Custom' && (
            <div className="mt-4 flex items-center gap-3 bg-slate-50/80 p-2 rounded-md border border-slate-200 max-w-sm">
              <input 
                type="date" 
                value={customStartDate} 
                onChange={(e) => setCustomStartDate(e.target.value)} 
                className="px-2 py-1 bg-white border border-slate-200 rounded text-sm text-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-500 w-full" 
              />
              <span className="text-slate-400 font-medium text-xs uppercase tracking-wider">to</span>
              <input 
                type="date" 
                value={customEndDate} 
                onChange={(e) => setCustomEndDate(e.target.value)} 
                className="px-2 py-1 bg-white border border-slate-200 rounded text-sm text-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-500 w-full" 
              />
            </div>
          )}
        </div>
      </Card>

      {/* Active Filters State */}
      {hasActiveFilters && (
        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
          <span className="text-sm text-slate-500 font-medium shrink-0">Showing results for:</span>
          <div className="flex flex-wrap items-center gap-2">
            {dateRange !== 'All' && (
              <Badge variant="secondary" className="bg-white border-slate-200 text-slate-700 hover:bg-slate-50 font-normal px-2.5 py-1">
                {dateRange === 'Custom' ? `${customStartDate || '?'} to ${customEndDate || '?'}` : dateRange}
                <button onClick={() => { setDateRange('All'); setCustomStartDate(''); setCustomEndDate(''); }} className="ml-1.5 text-slate-400 hover:text-slate-700 focus:outline-none"><X className="w-3 h-3" /></button>
              </Badge>
            )}
            {customerFilter && (
              <Badge variant="secondary" className="bg-white border-slate-200 text-slate-700 hover:bg-slate-50 font-normal px-2.5 py-1">
                Customer: {getCustomer(customerFilter)?.name || 'Unknown'}
                <button onClick={() => setCustomerFilter('')} className="ml-1.5 text-slate-400 hover:text-slate-700 focus:outline-none"><X className="w-3 h-3" /></button>
              </Badge>
            )}
            {employeeFilter && (
              <Badge variant="secondary" className="bg-white border-slate-200 text-slate-700 hover:bg-slate-50 font-normal px-2.5 py-1">
                Employee: {getEmployeeName(employeeFilter)}
                <button onClick={() => setEmployeeFilter('')} className="ml-1.5 text-slate-400 hover:text-slate-700 focus:outline-none"><X className="w-3 h-3" /></button>
              </Badge>
            )}
            {jobTypeFilter && (
              <Badge variant="secondary" className="bg-white border-slate-200 text-slate-700 hover:bg-slate-50 font-normal px-2.5 py-1">
                Job: {jobTypeFilter}
                <button onClick={() => setJobTypeFilter('')} className="ml-1.5 text-slate-400 hover:text-slate-700 focus:outline-none"><X className="w-3 h-3" /></button>
              </Badge>
            )}
            {categoryFilter && (
              <Badge variant="secondary" className="bg-white border-slate-200 text-slate-700 hover:bg-slate-50 font-normal px-2.5 py-1">
                Category: {getCategoryName(categoryFilter)}
                <button onClick={() => setCategoryFilter('')} className="ml-1.5 text-slate-400 hover:text-slate-700 focus:outline-none"><X className="w-3 h-3" /></button>
              </Badge>
            )}
            {jobStatusFilter && (
              <Badge variant="secondary" className="bg-white border-slate-200 text-slate-700 hover:bg-slate-50 font-normal px-2.5 py-1">
                Status: {jobStatusFilter}
                <button onClick={() => setJobStatusFilter('')} className="ml-1.5 text-slate-400 hover:text-slate-700 focus:outline-none"><X className="w-3 h-3" /></button>
              </Badge>
            )}
            {chargeableFilter && (
              <Badge variant="secondary" className="bg-white border-slate-200 text-slate-700 hover:bg-slate-50 font-normal px-2.5 py-1">
                {chargeableFilter === 'Chargeable' ? 'Chargeable' : 'Company Paid'}
                <button onClick={() => setChargeableFilter('')} className="ml-1.5 text-slate-400 hover:text-slate-700 focus:outline-none"><X className="w-3 h-3" /></button>
              </Badge>
            )}
            
            <button 
              onClick={clearAllFilters} 
              className="text-[13px] text-blue-600 hover:text-blue-800 font-medium transition-colors ml-1 px-2 py-1 rounded hover:bg-blue-50"
            >
              Clear filters
            </button>
          </div>
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Revenue */}
        <Card className="hover:border-slate-300 hover:shadow-md transition-all border-slate-200 rounded-xl overflow-hidden group">
          <CardContent className="p-6">
            <div className="flex justify-between items-start mb-4">
              <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-blue-500" />
                Revenue
              </h3>
            </div>
            <div className="flex flex-col">
              <span className="text-3xl font-bold text-slate-900 tabular-nums">
                ₹{totalRevenue.toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
              </span>
              <span className="text-sm text-slate-500 mt-1 font-medium">{filteredJobs.length} {filteredJobs.length === 1 ? 'job' : 'jobs'}</span>
            </div>
          </CardContent>
        </Card>

        {/* Expenses */}
        <Card className="hover:border-slate-300 hover:shadow-md transition-all border-slate-200 rounded-xl overflow-hidden group">
          <CardContent className="p-6">
            <div className="flex justify-between items-start mb-4">
              <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2">
                <TrendingDown className="w-4 h-4 text-slate-400" />
                Expenses
              </h3>
            </div>
            <div className="flex flex-col">
              <span className="text-3xl font-bold text-slate-900 tabular-nums">
                ₹{totalExpenses.toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
              </span>
              <span className="text-sm text-slate-500 mt-1 font-medium">{filteredExpenses.length} expense {filteredExpenses.length === 1 ? 'record' : 'records'}</span>
            </div>
          </CardContent>
        </Card>

        {/* Estimated Contribution */}
        <Card className="border-blue-200/60 bg-gradient-to-br from-blue-50/50 to-white shadow-sm hover:shadow-md transition-all rounded-xl relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 rounded-full blur-3xl -mr-10 -mt-10 pointer-events-none transition-transform group-hover:scale-110 duration-700"></div>
          <CardContent className="p-6 relative z-10">
            <div className="flex justify-between items-start mb-4">
              <h3 className="text-xs font-bold text-blue-800 uppercase tracking-wider flex items-center gap-2">
                <WalletCards className="w-4 h-4 text-blue-600" />
                Estimated Contribution
              </h3>
            </div>
            <div className="flex flex-col">
              <span className="text-3xl font-bold text-blue-900 tabular-nums">
                ₹{estimatedContribution.toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
              </span>
              <span className="text-sm text-blue-700/80 mt-1 font-medium">Revenue − Expenses</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Financial Overview (Visualization) */}
      {(totalRevenue > 0 || totalExpenses > 0) && (
        <Card className="border-slate-200 shadow-sm rounded-xl overflow-hidden">
          <div className="p-5 border-b border-slate-100 bg-slate-50/50">
            <h2 className="text-base font-semibold text-slate-900 flex items-center gap-2">
              <Activity className="w-4 h-4 text-slate-500" />
              Financial Overview
            </h2>
          </div>
          <div className="p-6 sm:p-8">
            <div className="max-w-4xl mx-auto space-y-7">
              {/* Revenue */}
              <div>
                <div className="flex justify-between items-end mb-2.5">
                  <span className="text-sm font-semibold text-slate-700 uppercase tracking-wider">Revenue</span>
                  <span className="text-xl font-bold text-slate-900 tabular-nums">₹{totalRevenue.toLocaleString('en-IN')}</span>
                </div>
                <div className="w-full bg-slate-100 h-3.5 rounded-full overflow-hidden">
                  <div className="bg-blue-500 h-full rounded-full transition-all duration-1000 ease-out" style={{ width: `${revenuePct}%` }}></div>
                </div>
              </div>
              
              {/* Expenses */}
              <div>
                <div className="flex justify-between items-end mb-2.5">
                  <span className="text-sm font-semibold text-slate-700 uppercase tracking-wider">Expenses</span>
                  <span className="text-xl font-bold text-slate-900 tabular-nums">₹{totalExpenses.toLocaleString('en-IN')}</span>
                </div>
                <div className="w-full bg-slate-100 h-3.5 rounded-full overflow-hidden">
                  <div className="bg-slate-400 h-full rounded-full transition-all duration-1000 ease-out" style={{ width: `${expensesPct}%` }}></div>
                </div>
              </div>

              {/* Contribution */}
              <div>
                <div className="flex justify-between items-end mb-2.5">
                  <span className="text-sm font-semibold text-blue-800 uppercase tracking-wider">Contribution</span>
                  <span className={`text-xl font-bold tabular-nums ${estimatedContribution >= 0 ? 'text-blue-700' : 'text-red-600'}`}>
                    ₹{estimatedContribution.toLocaleString('en-IN')}
                  </span>
                </div>
                <div className="w-full bg-slate-100 h-3.5 rounded-full overflow-hidden">
                  <div className={`h-full rounded-full transition-all duration-1000 ease-out ${estimatedContribution >= 0 ? 'bg-blue-600' : 'bg-red-500'}`} style={{ width: `${contributionPct}%` }}></div>
                </div>
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* Breakdowns */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="border-slate-200 shadow-sm rounded-xl">
          <CardHeader className="pb-3 border-b border-slate-100">
            <CardTitle className="text-[15px] font-semibold text-slate-900 flex items-center gap-2">
              <BriefcaseBusiness className="w-4 h-4 text-slate-500" />
              Revenue by Job Type
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4 px-5">
            {renderBreakdown(revenueByJobType, 'revenue')}
          </CardContent>
        </Card>

        <Card className="border-slate-200 shadow-sm rounded-xl">
          <CardHeader className="pb-3 border-b border-slate-100">
            <CardTitle className="text-[15px] font-semibold text-slate-900 flex items-center gap-2">
              <Tags className="w-4 h-4 text-slate-500" />
              Expenses by Category
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4 px-5">
            {renderBreakdown(expensesByCategory, 'expense')}
          </CardContent>
        </Card>

        <Card className="border-slate-200 shadow-sm rounded-xl">
          <CardHeader className="pb-3 border-b border-slate-100">
            <CardTitle className="text-[15px] font-semibold text-slate-900 flex items-center gap-2">
              <UserRound className="w-4 h-4 text-slate-500" />
              Expenses by Employee
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4 px-5">
            {renderBreakdown(expensesByEmployee, 'expense')}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

