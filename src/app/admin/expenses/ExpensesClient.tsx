'use client';

import { useState, useMemo } from 'react';
import { Expense, Job, Employee, Customer, ExpenseCategory } from '@/types';
import { adminAddExpense } from '@/actions/admin';
import { useRouter } from 'next/navigation';
import { formatKolkataDateTime } from '@/lib/dateUtils';
import {
  Search,
  Plus,
  X,
  Receipt,
  Filter,
  ChevronDown,
  CheckCircle2,
  Clock,
  XCircle,
  Upload,
  IndianRupee,
  Briefcase,
  FileText,
  Loader2,
  ExternalLink
} from 'lucide-react';
import { toast } from 'sonner';

export default function ExpensesClient({
  initialExpenses,
  jobs,
  employees,
  categories,
  customers,
}: {
  initialExpenses: Expense[];
  jobs: Job[];
  employees: Employee[];
  categories: ExpenseCategory[];
  customers: Customer[];
}) {
  const router = useRouter();
  const [expenses, setExpenses] = useState<Expense[]>(initialExpenses);

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [dateRange, setDateRange] = useState('All'); // All, Today, This Week, This Month, Custom
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');
  const [customerFilter, setCustomerFilter] = useState('');
  const [employeeFilter, setEmployeeFilter] = useState('');
  const [jobTypeFilter, setJobTypeFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [jobStatusFilter, setJobStatusFilter] = useState('');
  const [chargeableFilter, setChargeableFilter] = useState('');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // New Expense Form State
  const [formData, setFormData] = useState({
    jobId: '',
    employeeId: '',
    categoryId: '',
    amount: '',
    description: '',
    paidBy: 'Employee' as 'Employee' | 'Company',
    customerChargeable: 'Unknown' as 'Yes' | 'No' | 'Unknown',
  });
  const [receiptFile, setReceiptFile] = useState<File | null>(null);

  // Helpers
  const getJob = (id: string) => jobs.find((j) => j.id === id);
  const getCustomer = (id: string) => customers.find((c) => c.id === id);
  const getEmployeeName = (id: string) => employees.find((e) => e.id === id)?.name || 'Unknown';
  const getCategoryName = (id: string) => categories.find((c) => c.id === id)?.name || 'Unknown';

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.size > 5 * 1024 * 1024) {
        toast.error('Receipt must be under 5 MB');
        return;
      }
      setReceiptFile(file);
    }
  };

  const toBase64 = (file: File): Promise<string> =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = (error) => reject(error);
    });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.jobId || !formData.employeeId || !formData.categoryId) {
      toast.error('Job, Employee, and Category are required');
      return;
    }
    const amt = parseFloat(formData.amount);
    if (isNaN(amt) || amt <= 0) {
      toast.error('Amount must be a positive number');
      return;
    }

    setIsSubmitting(true);

    try {
      let receiptBase64 = undefined;
      let receiptFileName = undefined;
      
      if (receiptFile) {
        receiptBase64 = await toBase64(receiptFile);
        receiptFileName = receiptFile.name;
      }

      const newExpense = await adminAddExpense({
        jobId: formData.jobId,
        employeeId: formData.employeeId,
        categoryId: formData.categoryId,
        amount: amt,
        description: formData.description,
        paidBy: formData.paidBy,
        customerChargeable: formData.customerChargeable,
        dateTime: new Date().toISOString(),
        receiptBase64,
        receiptFileName,
      });

      setExpenses((prev) => [newExpense, ...prev]);
      setIsModalOpen(false);
      setFormData({
        jobId: '',
        employeeId: '',
        categoryId: '',
        amount: '',
        description: '',
        paidBy: 'Employee',
        customerChargeable: 'Unknown',
      });
      setReceiptFile(null);
      toast.success('Expense added successfully');
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to add expense');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Filter Logic
  const filteredExpenses = useMemo(() => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    // start of week (Sunday)
    const thisWeekStart = new Date(today);
    thisWeekStart.setDate(today.getDate() - today.getDay());
    
    // start of month
    const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    return expenses.filter((exp) => {
      const job = getJob(exp.jobId);
      const customer = job ? getCustomer(job.customerId) : null;

      // 1. Search Term (Expense ID, Job ID, Employee Name, Description, Customer Name)
      if (searchTerm) {
        const search = searchTerm.toLowerCase();
        const matches = 
          (exp.expenseId || '').toLowerCase().includes(search) ||
          (job?.jobId || '').toLowerCase().includes(search) ||
          getEmployeeName(exp.employeeId).toLowerCase().includes(search) ||
          (exp.description || '').toLowerCase().includes(search) ||
          (customer?.name || '').toLowerCase().includes(search);
        
        if (!matches) return false;
      }

      // 2. Date Range
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

      // 3. Customer Filter
      if (customerFilter && customer?.id !== customerFilter) return false;

      // 4. Employee Filter
      if (employeeFilter && exp.employeeId !== employeeFilter) return false;

      // 5. Job Type Filter
      if (jobTypeFilter && job?.jobType !== jobTypeFilter) return false;

      // 6. Expense Category Filter
      if (categoryFilter && exp.categoryId !== categoryFilter) return false;

      // 7. Job Status Filter
      if (jobStatusFilter && job?.status !== jobStatusFilter) return false;

      // 8. Chargeable vs Company
      if (chargeableFilter) {
        if (chargeableFilter === 'Chargeable' && exp.customerChargeable !== 'Yes') return false;
        if (chargeableFilter === 'Company' && exp.paidBy !== 'Company') return false;
      }

      return true;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    expenses,
    searchTerm,
    dateRange,
    customStartDate,
    customEndDate,
    customerFilter,
    employeeFilter,
    jobTypeFilter,
    categoryFilter,
    jobStatusFilter,
    chargeableFilter,
  ]);

  const totalAmount = useMemo(() => {
    return filteredExpenses.reduce((sum, exp) => sum + (exp.amount || 0), 0);
  }, [filteredExpenses]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Approved':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200/60 dark:border-emerald-800/60">
            <CheckCircle2 className="w-3.5 h-3.5" aria-hidden="true" />
            <span>Approved</span>
          </span>
        );
      case 'Rejected':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border border-rose-200/60 dark:border-rose-800/60">
            <XCircle className="w-3.5 h-3.5" aria-hidden="true" />
            <span>Rejected</span>
          </span>
        );
      case 'Pending':
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200/60 dark:border-amber-800/60">
            <Clock className="w-3.5 h-3.5" aria-hidden="true" />
            <span>Pending</span>
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-slate-100 tracking-tight flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center border border-blue-200/60 dark:border-blue-800/60 shrink-0">
              <Receipt className="w-4 h-4" aria-hidden="true" />
            </div>
            <span>Expenses Ledger</span>
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Review, audit, and reconcile field work-order expenditures and claims.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          {/* Summary Metric Card */}
          <div className="glass-card px-4 py-2 rounded-xl border border-slate-200/90 dark:border-slate-800/90 shadow-2xs flex items-center justify-between sm:justify-start gap-3">
            <span className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 font-medium">Filtered Total:</span>
            <span className="text-base sm:text-lg font-bold text-slate-900 dark:text-slate-100">
              ₹{totalAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
            </span>
          </div>
          {/* New Expense Button */}
          <button
            onClick={() => setIsModalOpen(true)}
            className="min-h-10 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl font-semibold shadow-xs transition-all focus:ring-2 focus:ring-blue-500 flex items-center justify-center gap-2 text-sm shrink-0"
          >
            <Plus className="w-4 h-4" aria-hidden="true" />
            <span>New Expense</span>
          </button>
        </div>
      </div>

      {/* Filters Area */}
      <div className="glass-card p-4 rounded-2xl border border-slate-200/90 dark:border-slate-800/90 shadow-2xs space-y-3">
        {/* Search input */}
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400 dark:text-slate-500">
            <Search className="h-4 w-4" aria-hidden="true" />
          </div>
          <input
            type="text"
            placeholder="Search by Expense ID, Job ID, Employee, Customer, or Description..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors shadow-2xs"
          />
        </div>
        
        {/* Dropdown Filters Row */}
        <div className="flex flex-wrap gap-2.5 items-center">
          <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-400 font-semibold text-xs uppercase tracking-wider mr-1">
            <Filter className="w-3.5 h-3.5" aria-hidden="true" />
            <span>Filters:</span>
          </div>
          
          {/* Date Range Preset */}
          <div className="relative">
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              aria-label="Filter by Date Range"
              className="pl-3 pr-8 py-1.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-xs sm:text-sm text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors appearance-none shadow-2xs"
            >
              <option value="All">All Dates</option>
              <option value="Today">Today</option>
              <option value="This Week">This Week</option>
              <option value="This Month">This Month</option>
              <option value="Custom">Custom Range</option>
            </select>
            <ChevronDown className="w-4 h-4 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" aria-hidden="true" />
          </div>
          
          {/* Custom Date Pickers */}
          {dateRange === 'Custom' && (
            <div className="flex items-center gap-2 bg-white dark:bg-slate-900 px-2 py-1 rounded-xl border border-slate-300 dark:border-slate-700 shadow-2xs">
              <input
                type="date"
                value={customStartDate}
                onChange={(e) => setCustomStartDate(e.target.value)}
                aria-label="Start Date"
                className="bg-transparent text-xs sm:text-sm text-slate-800 dark:text-slate-200 focus:outline-none"
              />
              <span className="text-slate-400 text-xs">to</span>
              <input
                type="date"
                value={customEndDate}
                onChange={(e) => setCustomEndDate(e.target.value)}
                aria-label="End Date"
                className="bg-transparent text-xs sm:text-sm text-slate-800 dark:text-slate-200 focus:outline-none"
              />
            </div>
          )}

          {/* Category Filter */}
          <div className="relative">
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              aria-label="Filter by Category"
              className="pl-3 pr-8 py-1.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-xs sm:text-sm text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors appearance-none shadow-2xs min-w-[130px]"
            >
              <option value="">All Categories</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
            <ChevronDown className="w-4 h-4 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" aria-hidden="true" />
          </div>

          {/* Employee Filter */}
          <div className="relative">
            <select
              value={employeeFilter}
              onChange={(e) => setEmployeeFilter(e.target.value)}
              aria-label="Filter by Employee"
              className="pl-3 pr-8 py-1.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-xs sm:text-sm text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors appearance-none shadow-2xs min-w-[130px]"
            >
              <option value="">All Employees</option>
              {employees.map((e) => (
                <option key={e.id} value={e.id}>
                  {e.name}
                </option>
              ))}
            </select>
            <ChevronDown className="w-4 h-4 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" aria-hidden="true" />
          </div>
          
          {/* Customer Filter */}
          <div className="relative">
            <select
              value={customerFilter}
              onChange={(e) => setCustomerFilter(e.target.value)}
              aria-label="Filter by Customer"
              className="pl-3 pr-8 py-1.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-xs sm:text-sm text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors appearance-none shadow-2xs min-w-[130px]"
            >
              <option value="">All Customers</option>
              {customers.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
            <ChevronDown className="w-4 h-4 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" aria-hidden="true" />
          </div>
          
          {/* Chargeable / PaidBy Filter */}
          <div className="relative">
            <select
              value={chargeableFilter}
              onChange={(e) => setChargeableFilter(e.target.value)}
              aria-label="Filter by Payment/Chargeability"
              className="pl-3 pr-8 py-1.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-xs sm:text-sm text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors appearance-none shadow-2xs min-w-[130px]"
            >
              <option value="">All Types</option>
              <option value="Chargeable">Chargeable to Customer</option>
              <option value="Company">Paid by Company</option>
            </select>
            <ChevronDown className="w-4 h-4 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" aria-hidden="true" />
          </div>

          {/* Clear Filters Button */}
          {(dateRange !== 'All' ||
            customerFilter ||
            employeeFilter ||
            jobTypeFilter ||
            categoryFilter ||
            jobStatusFilter ||
            chargeableFilter ||
            searchTerm) && (
            <button 
              type="button"
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
                setSearchTerm('');
              }}
              className="px-3 py-1.5 text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline shrink-0"
            >
              Clear Filters
            </button>
          )}
        </div>
      </div>

      {/* Expenses Table */}
      {filteredExpenses.length === 0 ? (
        <div className="glass-card p-12 flex flex-col items-center justify-center text-center rounded-2xl border border-slate-200/90 dark:border-slate-800/90 shadow-2xs">
          <div className="w-16 h-16 bg-blue-50 dark:bg-blue-950/60 rounded-2xl flex items-center justify-center text-blue-600 dark:text-blue-400 mb-4 border border-blue-200/60 dark:border-blue-800/60">
            <Receipt className="w-8 h-8" aria-hidden="true" />
          </div>
          <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 mb-1">No expenses found</h3>
          <p className="text-sm text-slate-500 dark:text-slate-400 max-w-sm mb-6">
            We couldn&apos;t find any expenses matching your current filters or search criteria.
          </p>
        </div>
      ) : (
        <div className="glass-card rounded-2xl shadow-2xs border border-slate-200/90 dark:border-slate-800/90 overflow-hidden">
          <div className="overflow-x-auto custom-scrollbar">
            <table className="w-full text-left border-collapse min-w-[1050px]">
              <thead>
                <tr className="bg-slate-50/80 dark:bg-slate-850/80 border-b border-slate-200/80 dark:border-slate-800/80">
                  <th className="px-5 py-3.5 text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                    Expense Details
                  </th>
                  <th className="px-5 py-3.5 text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                    Employee &amp; Job
                  </th>
                  <th className="px-5 py-3.5 text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                    Type &amp; Billing
                  </th>
                  <th className="px-5 py-3.5 text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider text-right">
                    Amount
                  </th>
                  <th className="px-5 py-3.5 text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                    Status &amp; Receipt
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                {filteredExpenses.map((exp) => {
                  const job = getJob(exp.jobId);
                  const customer = job ? getCustomer(job.customerId) : null;
                  const dateStr = formatKolkataDateTime(exp.dateTime);
                  
                  return (
                    <tr
                      key={exp.id}
                      className="hover:bg-slate-50/60 dark:hover:bg-slate-850/40 transition-colors group"
                    >
                      <td className="px-5 py-4">
                        <div className="flex flex-col">
                          <span className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                            {getCategoryName(exp.categoryId)}
                          </span>
                          <span className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                            {dateStr}
                          </span>
                          <span className="text-xs text-slate-400 dark:text-slate-500 font-mono mt-0.5">
                            {exp.expenseId || 'No ID'}
                          </span>
                          {exp.description && (
                            <div className="text-xs text-slate-600 dark:text-slate-400 mt-1.5 flex items-start gap-1">
                              <FileText className="w-3.5 h-3.5 shrink-0 mt-0.5 text-slate-400" aria-hidden="true" />
                              <span className="truncate max-w-[220px]" title={exp.description}>
                                {exp.description}
                              </span>
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <div className="space-y-1.5">
                          <div className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                            {getEmployeeName(exp.employeeId)}
                          </div>
                          <div className="flex items-center gap-1.5 text-xs text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-md w-fit border border-slate-200/60 dark:border-slate-750">
                            <Briefcase className="w-3.5 h-3.5 text-slate-400" aria-hidden="true" />
                            <span className="font-mono">{job?.jobId || 'Unnamed Job'}</span>
                          </div>
                          {customer && (
                            <div className="text-xs text-slate-500 dark:text-slate-400 truncate max-w-[180px]">
                              {customer.name}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <div className="space-y-1.5">
                          <div className="text-xs text-slate-700 dark:text-slate-300">
                            <span className="text-slate-500 dark:text-slate-400 mr-1.5">Paid By:</span>
                            <span className={`font-semibold ${exp.paidBy === 'Company' ? 'text-blue-600 dark:text-blue-400' : 'text-slate-800 dark:text-slate-200'}`}>
                              {exp.paidBy}
                            </span>
                          </div>
                          <div className="text-xs text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                            <span className="text-slate-500 dark:text-slate-400">Chargeable:</span>
                            {exp.customerChargeable === 'Yes' ? (
                              <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200/60 dark:border-emerald-800/60">
                                YES
                              </span>
                            ) : exp.customerChargeable === 'No' ? (
                              <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
                                NO
                              </span>
                            ) : (
                              <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200/60 dark:border-amber-800/60">
                                UNKNOWN
                              </span>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-4 text-right">
                        <span className="text-sm sm:text-base font-bold text-slate-900 dark:text-slate-100">
                          ₹{exp.amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <div className="space-y-2">
                          <div>
                            {getStatusBadge(exp.status || 'Pending')}
                          </div>
                          {exp.receiptUrl ? (
                            <a 
                              href={exp.receiptUrl} 
                              target="_blank" 
                              rel="noopener noreferrer" 
                              className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline bg-blue-50 dark:bg-blue-950/60 px-2 py-1 rounded-md border border-blue-200/60 dark:border-blue-800/60 transition-colors w-fit"
                            >
                              <Receipt className="w-3.5 h-3.5" aria-hidden="true" />
                              <span>View Receipt</span>
                              <ExternalLink className="w-3 h-3 opacity-60" aria-hidden="true" />
                            </a>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-xs text-slate-400 dark:text-slate-500 px-1 py-0.5 w-fit">
                              <Receipt className="w-3.5 h-3.5 opacity-40" aria-hidden="true" />
                              <span>No Receipt</span>
                            </span>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* New Expense Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in duration-150">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-2xl shadow-2xl flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-slate-200/80 dark:border-slate-800/80 flex justify-between items-center shrink-0">
              <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <Receipt className="w-5 h-5 text-blue-600 dark:text-blue-400" aria-hidden="true" />
                <span>Log New Expense</span>
              </h2>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                aria-label="Close dialog"
              >
                <X className="w-5 h-5" aria-hidden="true" />
              </button>
            </div>
            
            {/* Modal Body */}
            <div className="p-6 overflow-y-auto custom-scrollbar">
              <form id="new-expense-form" onSubmit={handleSubmit} className="space-y-5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="expense-job" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                      Job <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <select
                        id="expense-job"
                        required
                        value={formData.jobId}
                        onChange={(e) => setFormData({ ...formData, jobId: e.target.value })}
                        className="w-full pl-4 pr-10 py-2.5 bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm shadow-2xs appearance-none"
                      >
                        <option value="">Select a job...</option>
                        {jobs.map((j) => {
                          const cName = getCustomer(j.customerId)?.name || 'Unknown';
                          return (
                            <option key={j.id} value={j.id}>
                              {j.jobId || 'No ID'} - {cName}
                            </option>
                          );
                        })}
                      </select>
                      <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" aria-hidden="true" />
                    </div>
                  </div>

                  <div>
                    <label htmlFor="expense-employee" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                      Employee <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <select
                        id="expense-employee"
                        required
                        value={formData.employeeId}
                        onChange={(e) => setFormData({ ...formData, employeeId: e.target.value })}
                        className="w-full pl-4 pr-10 py-2.5 bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm shadow-2xs appearance-none"
                      >
                        <option value="">Select an employee...</option>
                        {employees.map((e) => (
                          <option key={e.id} value={e.id}>
                            {e.name}
                          </option>
                        ))}
                      </select>
                      <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" aria-hidden="true" />
                    </div>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="expense-category" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                      Category <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <select
                        id="expense-category"
                        required
                        value={formData.categoryId}
                        onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
                        className="w-full pl-4 pr-10 py-2.5 bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm shadow-2xs appearance-none"
                      >
                        <option value="">Select a category...</option>
                        {categories.map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.name}
                          </option>
                        ))}
                      </select>
                      <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" aria-hidden="true" />
                    </div>
                  </div>
                  
                  <div>
                    <label htmlFor="expense-amount" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                      Amount (₹) <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                        <IndianRupee className="h-4 w-4" aria-hidden="true" />
                      </div>
                      <input
                        id="expense-amount"
                        type="number"
                        step="0.01"
                        min="0.01"
                        required
                        placeholder="0.00"
                        value={formData.amount}
                        onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                        className="w-full pl-9 pr-4 py-2.5 bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm shadow-2xs"
                      />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-50 dark:bg-slate-950 p-4 rounded-xl border border-slate-200 dark:border-slate-800">
                  <div>
                    <label htmlFor="expense-paidby" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                      Who paid for this? <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <select
                        id="expense-paidby"
                        required
                        value={formData.paidBy}
                        onChange={(e) => setFormData({ ...formData, paidBy: e.target.value as 'Employee' | 'Company' })}
                        className="w-full pl-4 pr-10 py-2.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm shadow-2xs appearance-none"
                      >
                        <option value="Employee">Employee (Reimbursable)</option>
                        <option value="Company">Company (Corporate Account)</option>
                      </select>
                      <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" aria-hidden="true" />
                    </div>
                  </div>

                  <div>
                    <label htmlFor="expense-chargeable" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                      Billable to Customer? <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <select
                        id="expense-chargeable"
                        required
                        value={formData.customerChargeable}
                        onChange={(e) => setFormData({ ...formData, customerChargeable: e.target.value as 'Yes' | 'No' | 'Unknown' })}
                        className="w-full pl-4 pr-10 py-2.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm shadow-2xs appearance-none"
                      >
                        <option value="Unknown">Unknown (Decide later)</option>
                        <option value="Yes">Yes, add to invoice</option>
                        <option value="No">No, internal expense</option>
                      </select>
                      <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" aria-hidden="true" />
                    </div>
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                    Receipt Attachment <span className="text-slate-400 font-normal">(Optional, max 5MB)</span>
                  </label>
                  <label className="flex flex-col items-center justify-center w-full h-28 border-2 border-slate-300 dark:border-slate-700 border-dashed rounded-xl cursor-pointer bg-slate-50 dark:bg-slate-950 hover:bg-slate-100 dark:hover:bg-slate-850 transition-colors">
                    <div className="flex flex-col items-center justify-center p-4">
                      <Upload className="w-6 h-6 text-slate-400 mb-1.5" aria-hidden="true" />
                      <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 font-semibold truncate max-w-xs">
                        {receiptFile ? receiptFile.name : 'Click to upload receipt'}
                      </p>
                      <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5">PNG, JPG or PDF up to 5 MB</p>
                    </div>
                    <input
                      type="file"
                      accept="image/*,.pdf"
                      onChange={handleFileChange}
                      className="hidden"
                    />
                  </label>
                </div>

                <div>
                  <label htmlFor="expense-desc" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                    Description <span className="text-slate-400 font-normal">(Optional)</span>
                  </label>
                  <textarea
                    id="expense-desc"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full p-3 bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[75px] text-sm shadow-2xs resize-y"
                    placeholder="Provide details about what was purchased..."
                  />
                </div>
              </form>
            </div>
            
            {/* Modal Footer */}
            <div className="px-6 py-4 border-t border-slate-200/80 dark:border-slate-800/80 bg-slate-50/80 dark:bg-slate-850/80 rounded-b-2xl shrink-0 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                disabled={isSubmitting}
                className="px-4 py-2 text-sm text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-750 transition-colors font-medium disabled:opacity-50 shadow-2xs"
              >
                Cancel
              </button>
              <button
                form="new-expense-form"
                type="submit"
                disabled={isSubmitting}
                className="px-5 py-2 text-sm bg-blue-600 hover:bg-blue-700 text-white rounded-xl transition-colors font-semibold disabled:opacity-50 flex items-center gap-2 shadow-xs"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
                    <span>Saving...</span>
                  </>
                ) : (
                  <span>Save Expense</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
