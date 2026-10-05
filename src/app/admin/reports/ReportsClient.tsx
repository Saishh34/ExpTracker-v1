'use client';

  import { useState, useMemo, useCallback } from 'react';
  import { Expense, Job, Employee, Customer, ExpenseCategory } from '@/types';
  import { formatKolkataDateTime } from '@/lib/dateUtils';
  import { Download, Filter, TrendingUp, TrendingDown, Activity, PieChart, Users, Briefcase } from 'lucide-react';
  import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
  
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

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <PieChart className="w-6 h-6 text-blue-600" />
            Financial Reports
          </h1>
          <p className="text-sm text-slate-500 mt-1">Analyze revenue, expenses, and overall profitability.</p>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={exportCSV}
            disabled={filteredExpenses.length === 0}
            className="w-full sm:w-auto bg-white border border-slate-200 text-slate-700 px-5 py-2 rounded-xl hover:bg-slate-50 font-medium whitespace-nowrap shadow-sm transition-all focus:ring-2 focus:ring-blue-500 flex items-center justify-center gap-2 text-sm disabled:opacity-50"
          >
            <Download className="w-4 h-4" />
            Export CSV
          </button>
        </div>
      </div>

      {/* Filters Area */}
      <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200 space-y-4">
        <div className="flex flex-wrap gap-3 items-center">
          <div className="flex items-center gap-2 text-slate-500 font-medium text-sm shrink-0 mr-1">
            <Filter className="w-4 h-4" />
            Filters:
          </div>
          
          <Select value={dateRange} onValueChange={(v) => setDateRange(v || 'All')}>
            <SelectTrigger className="w-[140px] bg-white border-slate-200 shadow-sm rounded-xl hover:bg-slate-50 transition-colors">
              <SelectValue placeholder="All Dates" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="All">All Dates</SelectItem>
              <SelectItem value="Today">Today</SelectItem>
              <SelectItem value="This Week">This Week</SelectItem>
              <SelectItem value="This Month">This Month</SelectItem>
              <SelectItem value="Custom">Custom Range</SelectItem>
            </SelectContent>
          </Select>
          
          {dateRange === 'Custom' && (
            <div className="flex items-center gap-2 bg-slate-50 p-1 rounded-xl border border-slate-200">
              <input type="date" value={customStartDate} onChange={(e) => setCustomStartDate(e.target.value)} className="px-3 py-1.5 bg-transparent text-sm text-slate-700 focus:outline-none" />
              <span className="text-slate-400 font-medium text-sm">to</span>
              <input type="date" value={customEndDate} onChange={(e) => setCustomEndDate(e.target.value)} className="px-3 py-1.5 bg-transparent text-sm text-slate-700 focus:outline-none" />
            </div>
          )}

          <Select value={customerFilter || 'all'} onValueChange={(v) => setCustomerFilter(v === 'all' || !v ? '' : v)}>
            <SelectTrigger className="w-[160px] bg-white border-slate-200 shadow-sm rounded-xl hover:bg-slate-50 transition-colors">
              <SelectValue placeholder="All Customers" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Customers</SelectItem>
              {customers.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
            </SelectContent>
          </Select>
          
          <Select value={employeeFilter || 'all'} onValueChange={(v) => setEmployeeFilter(v === 'all' || !v ? '' : v)}>
            <SelectTrigger className="w-[160px] bg-white border-slate-200 shadow-sm rounded-xl hover:bg-slate-50 transition-colors">
              <SelectValue placeholder="All Employees" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Employees</SelectItem>
              {employees.map(e => <SelectItem key={e.id} value={e.id}>{e.name}</SelectItem>)}
            </SelectContent>
          </Select>
          
          <Select value={jobTypeFilter || 'all'} onValueChange={(v) => setJobTypeFilter(v === 'all' || !v ? '' : v)}>
            <SelectTrigger className="w-[150px] bg-white border-slate-200 shadow-sm rounded-xl hover:bg-slate-50 transition-colors">
              <SelectValue placeholder="All Job Types" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Job Types</SelectItem>
              <SelectItem value="Repair">Repair</SelectItem>
              <SelectItem value="Installation">Installation</SelectItem>
              <SelectItem value="Maintenance">Maintenance</SelectItem>
              <SelectItem value="Inspection">Inspection</SelectItem>
              <SelectItem value="Other">Other</SelectItem>
            </SelectContent>
          </Select>
          
          <Select value={categoryFilter || 'all'} onValueChange={(v) => setCategoryFilter(v === 'all' || !v ? '' : v)}>
            <SelectTrigger className="w-[150px] bg-white border-slate-200 shadow-sm rounded-xl hover:bg-slate-50 transition-colors">
              <SelectValue placeholder="All Categories" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {categories.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
            </SelectContent>
          </Select>
          
          <Select value={jobStatusFilter || 'all'} onValueChange={(v) => setJobStatusFilter(v === 'all' || !v ? '' : v)}>
            <SelectTrigger className="w-[160px] bg-white border-slate-200 shadow-sm rounded-xl hover:bg-slate-50 transition-colors">
              <SelectValue placeholder="All Job Statuses" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Job Statuses</SelectItem>
              <SelectItem value="Open">Open</SelectItem>
              <SelectItem value="In Progress">In Progress</SelectItem>
              <SelectItem value="Completed">Completed</SelectItem>
              <SelectItem value="Cancelled">Cancelled</SelectItem>
            </SelectContent>
          </Select>
          
          <Select value={chargeableFilter || 'all'} onValueChange={(v) => setChargeableFilter(v === 'all' || !v ? '' : v)}>
            <SelectTrigger className="w-[190px] bg-white border-slate-200 shadow-sm rounded-xl hover:bg-slate-50 transition-colors">
              <SelectValue placeholder="All Expense Types" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Expense Types</SelectItem>
              <SelectItem value="Chargeable">Chargeable to Customer</SelectItem>
              <SelectItem value="Company">Paid by Company</SelectItem>
            </SelectContent>
          </Select>
          
          {(dateRange !== 'All' || customerFilter || employeeFilter || jobTypeFilter || categoryFilter || jobStatusFilter || chargeableFilter) && (
            <button 
              onClick={() => {
                setDateRange('All');
                setCustomStartDate('');
                setCustomEndDate('');
                setCustomerFilter('');
                setEmployeeFilter('');
                setJobTypeFilter('');
                setCategoryFilter('');
                setJobStatusFilter('');
                setChargeableFilter('');
              }}
              className="px-4 py-2 text-sm text-blue-600 hover:bg-blue-50 rounded-xl font-medium transition-colors shrink-0 ml-auto"
            >
              Clear Filters
            </button>
          )}
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <TrendingUp className="w-16 h-16 text-emerald-600" />
          </div>
          <h3 className="text-sm font-medium text-slate-500 mb-1 flex items-center gap-2">
            Total Revenue
          </h3>
          <p className="text-3xl font-bold text-slate-900 mt-2">₹{totalRevenue.toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}</p>
          <div className="flex items-center gap-2 mt-4 text-sm text-slate-500">
            <Briefcase className="w-4 h-4" />
            From {filteredJobs.length} Jobs
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <TrendingDown className="w-16 h-16 text-red-600" />
          </div>
          <h3 className="text-sm font-medium text-slate-500 mb-1 flex items-center gap-2">
            Total Expenses
          </h3>
          <p className="text-3xl font-bold text-red-600 mt-2">₹{totalExpenses.toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}</p>
          <div className="flex items-center gap-2 mt-4 text-sm text-slate-500">
            <Activity className="w-4 h-4" />
            From {filteredExpenses.length} Records
          </div>
        </div>
        
        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-6 rounded-2xl border border-blue-100 shadow-sm relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full blur-3xl -mr-10 -mt-10"></div>
          <h3 className="text-sm font-medium text-blue-700 mb-1 flex items-center gap-2 relative z-10">
            Estimated Contribution
          </h3>
          <p className="text-3xl font-bold text-blue-700 mt-2 relative z-10">₹{estimatedContribution.toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}</p>
          <p className="text-xs text-blue-600/70 mt-4 relative z-10 font-medium">Net = Revenue - Expenses</p>
        </div>
      </div>

      {/* Breakdowns */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
          <div className="flex items-center gap-2 mb-6">
            <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-600">
              <Briefcase className="w-4 h-4" />
            </div>
            <h3 className="font-semibold text-slate-900">Revenue by Job Type</h3>
          </div>
          {Object.keys(revenueByJobType).length > 0 ? (
            <div className="space-y-4">
              {Object.entries(revenueByJobType).sort((a,b)=>b[1]-a[1]).map(([type, amt]) => {
                const percentage = (amt / totalRevenue) * 100;
                return (
                  <div key={type}>
                    <div className="flex justify-between items-center text-sm mb-1">
                      <span className="text-slate-700 font-medium">{type}</span>
                      <span className="font-semibold text-slate-900">₹{amt.toLocaleString('en-IN')}</span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                      <div className="bg-emerald-500 h-2 rounded-full" style={{ width: `${percentage}%` }}></div>
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            <div className="py-8 text-center text-slate-500 text-sm">No revenue data available</div>
          )}
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
          <div className="flex items-center gap-2 mb-6">
            <div className="w-8 h-8 rounded-lg bg-red-50 flex items-center justify-center text-red-600">
              <PieChart className="w-4 h-4" />
            </div>
            <h3 className="font-semibold text-slate-900">Expenses by Category</h3>
          </div>
          {Object.keys(expensesByCategory).length > 0 ? (
            <div className="space-y-4">
              {Object.entries(expensesByCategory).sort((a,b)=>b[1]-a[1]).map(([cat, amt]) => {
                const percentage = (amt / totalExpenses) * 100;
                return (
                  <div key={cat}>
                    <div className="flex justify-between items-center text-sm mb-1">
                      <span className="text-slate-700 font-medium">{cat}</span>
                      <span className="font-semibold text-red-600">₹{amt.toLocaleString('en-IN')}</span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                      <div className="bg-red-500 h-2 rounded-full" style={{ width: `${percentage}%` }}></div>
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            <div className="py-8 text-center text-slate-500 text-sm">No expense data available</div>
          )}
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
          <div className="flex items-center gap-2 mb-6">
            <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600">
              <Users className="w-4 h-4" />
            </div>
            <h3 className="font-semibold text-slate-900">Expenses by Employee</h3>
          </div>
          {Object.keys(expensesByEmployee).length > 0 ? (
            <div className="space-y-4">
              {Object.entries(expensesByEmployee).sort((a,b)=>b[1]-a[1]).map(([emp, amt]) => {
                const percentage = (amt / totalExpenses) * 100;
                return (
                  <div key={emp}>
                    <div className="flex justify-between items-center text-sm mb-1">
                      <span className="text-slate-700 font-medium truncate pr-4">{emp}</span>
                      <span className="font-semibold text-red-600 shrink-0">₹{amt.toLocaleString('en-IN')}</span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                      <div className="bg-blue-500 h-2 rounded-full" style={{ width: `${percentage}%` }}></div>
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            <div className="py-8 text-center text-slate-500 text-sm">No expense data available</div>
          )}
        </div>
      </div>
    </div>
  );
}
