'use client';

import { useState, useMemo } from 'react';
import { Expense, Job, Employee, Customer, ExpenseCategory } from '@/types';
import { adminAddExpense } from '@/actions/admin';
import { useRouter } from 'next/navigation';
import { formatKolkataDateTime } from '@/lib/dateUtils';
import { Search, Plus, X, Receipt, Filter, ChevronDown, CheckCircle2, AlertCircle, XCircle, Clock, Upload, IndianRupee, Briefcase, FileText } from 'lucide-react';
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
  const getJob = (id: string) => jobs.find(j => j.id === id);
  const getCustomer = (id: string) => customers.find(c => c.id === id);
  const getEmployeeName = (id: string) => employees.find(e => e.id === id)?.name || 'Unknown';
  const getCategoryName = (id: string) => categories.find(c => c.id === id)?.name || 'Unknown';

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setReceiptFile(e.target.files[0]);
    }
  };

  const toBase64 = (file: File): Promise<string> =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = error => reject(error);
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

      setExpenses(prev => [newExpense, ...prev]);
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

    return expenses.filter(exp => {
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
  }, [expenses, searchTerm, dateRange, customStartDate, customEndDate, customerFilter, employeeFilter, jobTypeFilter, categoryFilter, jobStatusFilter, chargeableFilter]);

  const totalAmount = useMemo(() => {
    return filteredExpenses.reduce((sum, exp) => sum + (exp.amount || 0), 0);
  }, [filteredExpenses]);

  const getStatusBadge = (status: string) => {
    switch(status) {
      case 'Approved':
        return <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800 border border-emerald-200"><CheckCircle2 className="w-3.5 h-3.5" /> Approved</span>;
      case 'Rejected':
        return <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800 border border-red-200"><XCircle className="w-3.5 h-3.5" /> Rejected</span>;
      case 'Pending':
      default:
        return <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-amber-100 text-amber-800 border border-amber-200"><Clock className="w-3.5 h-3.5" /> Pending</span>;
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Receipt className="w-6 h-6 text-blue-600" />
            Expenses Ledger
          </h1>
          <p className="text-sm text-slate-500 mt-1">Review and manage employee and company expenses.</p>
        </div>
        <div className="flex flex-col sm:flex-row items-center gap-3">
          <div className="bg-white px-5 py-2 rounded-xl border border-slate-200 shadow-sm flex items-center gap-3">
            <span className="text-sm text-slate-500 font-medium">Filtered Total:</span>
            <span className="text-lg font-bold text-slate-900">₹{totalAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
          </div>
          <button
            onClick={() => setIsModalOpen(true)}
            className="w-full sm:w-auto bg-blue-600 text-white px-5 py-2 rounded-xl hover:bg-blue-700 font-medium whitespace-nowrap shadow-sm transition-all focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 flex items-center justify-center gap-2 text-sm"
          >
            <Plus className="w-4 h-4" />
            New Expense
          </button>
        </div>
      </div>

      {/* Filters Area */}
      <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200 space-y-4">
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-4 w-4 text-slate-400" />
          </div>
          <input
            type="text"
            placeholder="Search by Expense ID, Job ID, Employee, Customer, or Description..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 border border-slate-300 rounded-xl text-sm text-slate-900 bg-slate-50 hover:bg-white focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
          />
        </div>
        
        <div className="flex flex-wrap gap-3 items-center">
          <div className="flex items-center gap-2 text-slate-500 font-medium text-sm shrink-0 mr-1">
            <Filter className="w-4 h-4" />
            Filters:
          </div>
          
          <div className="relative">
            <select value={dateRange} onChange={(e) => setDateRange(e.target.value)} className="pl-3 pr-8 py-2 border border-slate-300 rounded-xl text-sm text-slate-700 bg-slate-50 hover:bg-white focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors appearance-none">
              <option value="All">All Dates</option>
              <option value="Today">Today</option>
              <option value="This Week">This Week</option>
              <option value="This Month">This Month</option>
              <option value="Custom">Custom Range</option>
            </select>
            <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>
          
          {dateRange === 'Custom' && (
            <div className="flex items-center gap-2 bg-slate-50 p-1 rounded-xl border border-slate-200">
              <input type="date" value={customStartDate} onChange={(e) => setCustomStartDate(e.target.value)} className="px-3 py-1.5 bg-transparent text-sm text-slate-700 focus:outline-none" />
              <span className="text-slate-400 font-medium text-sm">to</span>
              <input type="date" value={customEndDate} onChange={(e) => setCustomEndDate(e.target.value)} className="px-3 py-1.5 bg-transparent text-sm text-slate-700 focus:outline-none" />
            </div>
          )}

          <div className="relative">
            <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)} className="pl-3 pr-8 py-2 border border-slate-300 rounded-xl text-sm text-slate-700 bg-slate-50 hover:bg-white focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors appearance-none min-w-[140px]">
              <option value="">All Categories</option>
              {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
            <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>

          <div className="relative">
            <select value={employeeFilter} onChange={(e) => setEmployeeFilter(e.target.value)} className="pl-3 pr-8 py-2 border border-slate-300 rounded-xl text-sm text-slate-700 bg-slate-50 hover:bg-white focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors appearance-none min-w-[140px]">
              <option value="">All Employees</option>
              {employees.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
            </select>
            <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>
          
          <div className="relative">
            <select value={customerFilter} onChange={(e) => setCustomerFilter(e.target.value)} className="pl-3 pr-8 py-2 border border-slate-300 rounded-xl text-sm text-slate-700 bg-slate-50 hover:bg-white focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors appearance-none min-w-[140px]">
              <option value="">All Customers</option>
              {customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
            <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>
          
          <div className="relative">
            <select value={chargeableFilter} onChange={(e) => setChargeableFilter(e.target.value)} className="pl-3 pr-8 py-2 border border-slate-300 rounded-xl text-sm text-slate-700 bg-slate-50 hover:bg-white focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors appearance-none min-w-[140px]">
              <option value="">All Types</option>
              <option value="Chargeable">Chargeable to Customer</option>
              <option value="Company">Paid by Company</option>
            </select>
            <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>

          {(dateRange !== 'All' || customerFilter || employeeFilter || jobTypeFilter || categoryFilter || jobStatusFilter || chargeableFilter || searchTerm) && (
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
                setSearchTerm('');
              }}
              className="px-4 py-2 text-sm text-blue-600 hover:bg-blue-50 rounded-xl font-medium transition-colors shrink-0 ml-auto"
            >
              Clear Filters
            </button>
          )}
        </div>
      </div>

      {/* Expenses Table */}
      {filteredExpenses.length === 0 ? (
        <div className="p-12 flex flex-col items-center justify-center text-center bg-white rounded-2xl border border-slate-200 shadow-sm">
          <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4">
            <Receipt className="w-8 h-8 text-slate-400" />
          </div>
          <h3 className="text-lg font-medium text-slate-900 mb-1">No expenses found</h3>
          <p className="text-sm text-slate-500 max-w-sm mb-6">
            We couldn&apos;t find any expenses matching your current filters or search criteria.
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="overflow-x-auto custom-scrollbar">
            <table className="w-full text-left border-collapse min-w-[1200px]">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200">
                  <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Expense Details</th>
                  <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Employee & Job</th>
                  <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Type & Billing</th>
                  <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider text-right">Amount</th>
                  <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Status & Receipt</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredExpenses.map(exp => {
                  const job = getJob(exp.jobId);
                  const customer = job ? getCustomer(job.customerId) : null;
                  const dateStr = formatKolkataDateTime(exp.dateTime);
                  
                  return (
                    <tr key={exp.id} className="hover:bg-slate-50/60 transition-colors group">
                      <td className="px-6 py-4">
                        <div className="flex flex-col">
                          <span className="text-sm font-semibold text-slate-900">{getCategoryName(exp.categoryId)}</span>
                          <span className="text-xs text-slate-500 mt-1">{dateStr}</span>
                          <span className="text-xs text-slate-400 font-mono mt-1">{exp.expenseId || 'No ID'}</span>
                          {exp.description && (
                            <div className="text-xs text-slate-500 mt-2 flex items-start gap-1">
                              <FileText className="w-3 h-3 shrink-0 mt-0.5" />
                              <span className="truncate max-w-[200px]" title={exp.description}>{exp.description}</span>
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="space-y-2">
                          <div className="text-sm font-medium text-slate-900">{getEmployeeName(exp.employeeId)}</div>
                          <div className="flex items-center gap-1.5 text-xs text-slate-600 bg-slate-100 px-2 py-1 rounded-md w-fit">
                            <Briefcase className="w-3.5 h-3.5 text-slate-400" />
                            <span className="font-mono">{job?.jobId || 'Unnamed Job'}</span>
                          </div>
                          {customer && (
                            <div className="text-xs text-slate-500 truncate max-w-[180px]">
                              {customer.name}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="space-y-2">
                          <div className="text-sm">
                            <span className="text-slate-500 mr-2 text-xs">Paid By:</span>
                            <span className={`font-medium ${exp.paidBy === 'Company' ? 'text-blue-700' : 'text-slate-700'}`}>{exp.paidBy}</span>
                          </div>
                          <div className="text-sm">
                            <span className="text-slate-500 mr-2 text-xs">Chargeable:</span>
                            {exp.customerChargeable === 'Yes' ? (
                              <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-emerald-100 text-emerald-800">YES</span>
                            ) : exp.customerChargeable === 'No' ? (
                               <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-slate-100 text-slate-600">NO</span>
                            ) : (
                               <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-yellow-100 text-yellow-800">UNKNOWN</span>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <span className="text-base font-bold text-slate-900">
                          ₹{exp.amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="space-y-3">
                          <div>
                            {getStatusBadge(exp.status || 'Pending')}
                          </div>
                          {exp.receiptUrl ? (
                            <a 
                              href={exp.receiptUrl} 
                              target="_blank" 
                              rel="noopener noreferrer" 
                              className="inline-flex items-center gap-1.5 text-xs font-medium text-blue-600 hover:text-blue-800 hover:underline bg-blue-50 px-2 py-1 rounded-md transition-colors w-fit"
                            >
                              <Receipt className="w-3.5 h-3.5" />
                              View Receipt
                            </a>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 text-xs text-slate-400 px-2 py-1 w-fit">
                              <Receipt className="w-3.5 h-3.5 opacity-50" />
                              No Receipt
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
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 sm:p-6 z-50 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl w-full max-w-2xl shadow-2xl flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200">
            <div className="px-6 py-5 border-b border-slate-100 flex justify-between items-center bg-white rounded-t-2xl shrink-0">
              <h2 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
                <Receipt className="w-5 h-5 text-blue-600" />
                Log New Expense
              </h2>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600 hover:bg-slate-100 p-1.5 rounded-lg transition-colors">
                <span className="sr-only">Close</span>
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto custom-scrollbar">
              <form id="new-expense-form" onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">Job <span className="text-red-500">*</span></label>
                    <div className="relative">
                      <select
                        required
                        value={formData.jobId}
                        onChange={(e) => setFormData({...formData, jobId: e.target.value})}
                        className="w-full pl-4 pr-10 py-2.5 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white shadow-sm text-sm transition-shadow appearance-none"
                      >
                        <option value="">Select a job...</option>
                        {jobs.map(j => {
                          const cName = getCustomer(j.customerId)?.name || 'Unknown';
                          return <option key={j.id} value={j.id}>{j.jobId || 'No ID'} - {cName}</option>
                        })}
                      </select>
                      <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">Employee <span className="text-red-500">*</span></label>
                    <div className="relative">
                      <select
                        required
                        value={formData.employeeId}
                        onChange={(e) => setFormData({...formData, employeeId: e.target.value})}
                        className="w-full pl-4 pr-10 py-2.5 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white shadow-sm text-sm transition-shadow appearance-none"
                      >
                        <option value="">Select an employee...</option>
                        {employees.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
                      </select>
                      <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                    </div>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">Category <span className="text-red-500">*</span></label>
                    <div className="relative">
                      <select
                        required
                        value={formData.categoryId}
                        onChange={(e) => setFormData({...formData, categoryId: e.target.value})}
                        className="w-full pl-4 pr-10 py-2.5 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white shadow-sm text-sm transition-shadow appearance-none"
                      >
                        <option value="">Select a category...</option>
                        {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                      </select>
                      <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">Amount (₹) <span className="text-red-500">*</span></label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <IndianRupee className="h-4 w-4 text-slate-400" />
                      </div>
                      <input
                        type="number"
                        step="0.01"
                        min="0.01"
                        required
                        placeholder="0.00"
                        value={formData.amount}
                        onChange={(e) => setFormData({...formData, amount: e.target.value})}
                        className="w-full pl-9 pr-4 py-2.5 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white shadow-sm text-sm transition-shadow"
                      />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 bg-slate-50 p-4 rounded-xl border border-slate-200">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">Who paid for this? <span className="text-red-500">*</span></label>
                    <div className="relative">
                      <select
                        required
                        value={formData.paidBy}
                        onChange={(e) => setFormData({...formData, paidBy: e.target.value as 'Employee' | 'Company'})}
                        className="w-full pl-4 pr-10 py-2.5 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white shadow-sm text-sm transition-shadow appearance-none"
                      >
                        <option value="Employee">Employee (Reimbursable)</option>
                        <option value="Company">Company (Corporate Card/Account)</option>
                      </select>
                      <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">Billable to Customer? <span className="text-red-500">*</span></label>
                    <div className="relative">
                      <select
                        required
                        value={formData.customerChargeable}
                        onChange={(e) => setFormData({...formData, customerChargeable: e.target.value as 'Yes' | 'No' | 'Unknown'})}
                        className="w-full pl-4 pr-10 py-2.5 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white shadow-sm text-sm transition-shadow appearance-none"
                      >
                        <option value="Unknown">Unknown (Decide later)</option>
                        <option value="Yes">Yes, add to invoice</option>
                        <option value="No">No, internal expense</option>
                      </select>
                      <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                    </div>
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Receipt / Attachment <span className="text-slate-400 font-normal">(Optional)</span></label>
                  <div className="flex items-center justify-center w-full">
                    <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-slate-300 border-dashed rounded-xl cursor-pointer bg-slate-50 hover:bg-slate-100 transition-colors">
                      <div className="flex flex-col items-center justify-center pt-5 pb-6">
                        <Upload className="w-8 h-8 text-slate-400 mb-2" />
                        <p className="mb-1 text-sm text-slate-600 font-medium">
                          {receiptFile ? receiptFile.name : 'Click to upload receipt'}
                        </p>
                        <p className="text-xs text-slate-500">PNG, JPG or PDF</p>
                      </div>
                      <input
                        type="file"
                        accept="image/*,.pdf"
                        onChange={handleFileChange}
                        className="hidden"
                      />
                    </label>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Description <span className="text-slate-400 font-normal">(Optional)</span></label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                    className="w-full p-3 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 min-h-[80px] bg-white shadow-sm text-sm transition-shadow resize-y"
                    placeholder="Provide details about what was purchased..."
                  />
                </div>
              </form>
            </div>
            
            <div className="px-6 py-4 border-t border-slate-100 bg-slate-50 rounded-b-2xl shrink-0 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                disabled={isSubmitting}
                className="px-4 py-2 text-sm text-slate-700 bg-white border border-slate-300 rounded-xl hover:bg-slate-50 transition-colors font-medium disabled:opacity-50 shadow-sm"
              >
                Cancel
              </button>
              <button
                form="new-expense-form"
                type="submit"
                disabled={isSubmitting}
                className="px-5 py-2 text-sm bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors font-medium disabled:opacity-50 flex items-center shadow-sm"
              >
                {isSubmitting ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                    Saving...
                  </>
                ) : 'Save Expense'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
