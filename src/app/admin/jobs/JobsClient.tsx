'use client';

import { useState } from 'react';
import { Job, Customer, Employee } from '@/types';
import { adminAddJob } from '@/actions/admin';
import { formatKolkataDate } from '@/lib/dateUtils';
import { useRouter } from 'next/navigation';
import {
  Plus,
  X,
  Briefcase,
  Filter,
  Calendar,
  Users,
  IndianRupee,
  FileText,
  CheckCircle2,
  AlertCircle,
  Clock,
  XCircle,
  ChevronDown,
  Wrench,
  Loader2
} from 'lucide-react';
import { toast } from 'sonner';

export default function JobsClient({
  initialJobs,
  customers,
  employees,
}: {
  initialJobs: Job[];
  customers: Customer[];
  employees: Employee[];
}) {
  const router = useRouter();
  const [jobs, setJobs] = useState<Job[]>(initialJobs);

  // Filters
  const [customerFilter, setCustomerFilter] = useState('');
  const [employeeFilter, setEmployeeFilter] = useState('');
  const [jobTypeFilter, setJobTypeFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [dateFilter, setDateFilter] = useState('');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // New Job Form State
  const [formData, setFormData] = useState({
    customerId: '',
    jobType: 'Repair' as Job['jobType'],
    visitDate: '',
    employeeIds: [] as string[],
    quotedAmount: '' as string | number,
    finalBilledAmount: '' as string | number,
    customerNotes: '',
  });

  const getCustomerName = (id: string) => customers.find((c) => c.id === id)?.name || 'Unknown Customer';
  const getEmployeeName = (id: string) => employees.find((e) => e.id === id)?.name || 'Unknown Employee';

  const filteredJobs = jobs.filter((j) => {
    if (customerFilter && j.customerId !== customerFilter) return false;
    if (employeeFilter && !j.assignedEmployeeIds.includes(employeeFilter)) return false;
    if (jobTypeFilter && j.jobType !== jobTypeFilter) return false;
    if (statusFilter && j.status !== statusFilter) return false;
    if (dateFilter && j.visitDate !== dateFilter) return false;
    return true;
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.customerId) {
      toast.error('Customer is required');
      return;
    }
    if (formData.employeeIds.length === 0) {
      toast.error('At least one employee must be assigned');
      return;
    }

    setIsSubmitting(true);

    try {
      const parsedQuoted = formData.quotedAmount === '' ? undefined : Number(formData.quotedAmount);
      const parsedFinal = formData.finalBilledAmount === '' ? undefined : Number(formData.finalBilledAmount);

      if (parsedQuoted !== undefined && (isNaN(parsedQuoted) || parsedQuoted < 0)) {
        toast.error('Quoted Amount must be a valid positive number');
        setIsSubmitting(false);
        return;
      }
      if (parsedFinal !== undefined && (isNaN(parsedFinal) || parsedFinal < 0)) {
        toast.error('Final Billed Amount must be a valid positive number');
        setIsSubmitting(false);
        return;
      }

      const newJob = await adminAddJob({
        ...formData,
        quotedAmount: parsedQuoted,
        finalBilledAmount: parsedFinal,
      });
      setJobs((prev) => [newJob, ...prev]);
      setIsModalOpen(false);
      setFormData({
        customerId: '',
        jobType: 'Repair',
        visitDate: '',
        employeeIds: [],
        quotedAmount: '',
        finalBilledAmount: '',
        customerNotes: '',
      });
      toast.success('Job created successfully');
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to add job');
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleEmployee = (empId: string) => {
    setFormData((prev) => ({
      ...prev,
      employeeIds: prev.employeeIds.includes(empId)
        ? prev.employeeIds.filter((id) => id !== empId)
        : [...prev.employeeIds, empId],
    }));
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Completed':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200/60 dark:border-emerald-800/60">
            <CheckCircle2 className="w-3.5 h-3.5" aria-hidden="true" />
            <span>Completed</span>
          </span>
        );
      case 'In Progress':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200/60 dark:border-blue-800/60">
            <Clock className="w-3.5 h-3.5" aria-hidden="true" />
            <span>In Progress</span>
          </span>
        );
      case 'Cancelled':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border border-rose-200/60 dark:border-rose-800/60">
            <XCircle className="w-3.5 h-3.5" aria-hidden="true" />
            <span>Cancelled</span>
          </span>
        );
      case 'Open':
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200/60 dark:border-amber-800/60">
            <AlertCircle className="w-3.5 h-3.5" aria-hidden="true" />
            <span>Open</span>
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
              <Briefcase className="w-4 h-4" aria-hidden="true" />
            </div>
            <span>Jobs Management</span>
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Track and assign operational jobs, field visits, and billable services.
          </p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="min-h-10 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl font-semibold shadow-xs transition-all focus:ring-2 focus:ring-blue-500 flex items-center justify-center gap-2 text-sm self-start sm:self-auto shrink-0"
        >
          <Plus className="w-4 h-4" aria-hidden="true" />
          <span>New Job</span>
        </button>
      </div>

      {/* Filters Bar */}
      <div className="glass-card p-4 rounded-2xl border border-slate-200/90 dark:border-slate-800/90 shadow-2xs space-y-3">
        <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400 font-semibold text-xs uppercase tracking-wider">
          <Filter className="w-3.5 h-3.5" aria-hidden="true" />
          <span>Filter Records:</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {/* Customer Filter */}
          <div className="relative">
            <select
              value={customerFilter}
              onChange={(e) => setCustomerFilter(e.target.value)}
              aria-label="Filter by Customer"
              className="w-full pl-3 pr-8 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-xs sm:text-sm text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors appearance-none shadow-2xs"
            >
              <option value="">All Customers</option>
              {customers.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
            <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" aria-hidden="true" />
          </div>

          {/* Employee Filter */}
          <div className="relative">
            <select
              value={employeeFilter}
              onChange={(e) => setEmployeeFilter(e.target.value)}
              aria-label="Filter by Employee"
              className="w-full pl-3 pr-8 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-xs sm:text-sm text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors appearance-none shadow-2xs"
            >
              <option value="">All Employees</option>
              {employees.map((e) => (
                <option key={e.id} value={e.id}>
                  {e.name}
                </option>
              ))}
            </select>
            <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" aria-hidden="true" />
          </div>

          {/* Job Type Filter */}
          <div className="relative">
            <select
              value={jobTypeFilter}
              onChange={(e) => setJobTypeFilter(e.target.value)}
              aria-label="Filter by Job Type"
              className="w-full pl-3 pr-8 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-xs sm:text-sm text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors appearance-none shadow-2xs"
            >
              <option value="">All Job Types</option>
              <option value="Repair">Repair</option>
              <option value="Installation">Installation</option>
              <option value="Maintenance">Maintenance</option>
              <option value="Inspection">Inspection</option>
              <option value="Other">Other</option>
            </select>
            <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" aria-hidden="true" />
          </div>

          {/* Status Filter */}
          <div className="relative">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              aria-label="Filter by Status"
              className="w-full pl-3 pr-8 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-xs sm:text-sm text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors appearance-none shadow-2xs"
            >
              <option value="">All Statuses</option>
              <option value="Open">Open</option>
              <option value="In Progress">In Progress</option>
              <option value="Completed">Completed</option>
              <option value="Cancelled">Cancelled</option>
            </select>
            <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" aria-hidden="true" />
          </div>

          {/* Date Filter */}
          <div className="relative flex items-center gap-2">
            <input
              type="date"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              aria-label="Filter by Date"
              className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-xs sm:text-sm text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors shadow-2xs"
            />
            {(customerFilter || employeeFilter || jobTypeFilter || statusFilter || dateFilter) && (
              <button 
                type="button"
                onClick={() => {
                  setCustomerFilter('');
                  setEmployeeFilter('');
                  setJobTypeFilter('');
                  setStatusFilter('');
                  setDateFilter('');
                }}
                className="px-2.5 py-2 text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline shrink-0"
              >
                Clear
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Jobs Table */}
      {filteredJobs.length === 0 ? (
        <div className="glass-card p-12 flex flex-col items-center justify-center text-center rounded-2xl border border-slate-200/90 dark:border-slate-800/90 shadow-2xs">
          <div className="w-16 h-16 bg-blue-50 dark:bg-blue-950/60 rounded-2xl flex items-center justify-center text-blue-600 dark:text-blue-400 mb-4 border border-blue-200/60 dark:border-blue-800/60">
            <Briefcase className="w-8 h-8" aria-hidden="true" />
          </div>
          <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 mb-1">No jobs found</h3>
          <p className="text-sm text-slate-500 dark:text-slate-400 max-w-sm mb-6">
            {(customerFilter || employeeFilter || jobTypeFilter || statusFilter || dateFilter) 
              ? 'No jobs match your current filter selections. Try clearing your filters.' 
              : 'Get started by creating your first field job order.'}
          </p>
          {(customerFilter || employeeFilter || jobTypeFilter || statusFilter || dateFilter) ? (
            <button 
              onClick={() => {
                setCustomerFilter('');
                setEmployeeFilter('');
                setJobTypeFilter('');
                setStatusFilter('');
                setDateFilter('');
              }}
              className="text-blue-600 dark:text-blue-400 font-semibold text-sm hover:underline"
            >
              Clear all filters
            </button>
          ) : (
            <button
              onClick={() => setIsModalOpen(true)}
              className="bg-blue-600 text-white px-4 py-2 rounded-xl text-sm font-semibold hover:bg-blue-700 transition-colors shadow-2xs"
            >
              Create First Job
            </button>
          )}
        </div>
      ) : (
        <div className="glass-card rounded-2xl shadow-2xs border border-slate-200/90 dark:border-slate-800/90 overflow-hidden">
          <div className="overflow-x-auto custom-scrollbar">
            <table className="w-full text-left border-collapse min-w-[920px]">
              <thead>
                <tr className="bg-slate-50/80 dark:bg-slate-850/80 border-b border-slate-200/80 dark:border-slate-800/80">
                  <th className="px-5 py-3.5 text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                    Job Details
                  </th>
                  <th className="px-5 py-3.5 text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                    Customer
                  </th>
                  <th className="px-5 py-3.5 text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-5 py-3.5 text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                    Schedule &amp; Assignees
                  </th>
                  <th className="px-5 py-3.5 text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider text-right">
                    Financials
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                {filteredJobs.map((job) => (
                  <tr
                    key={job.id}
                    className="hover:bg-slate-50/60 dark:hover:bg-slate-850/40 transition-colors group"
                  >
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0 border border-blue-200/60 dark:border-blue-800/60">
                          <Wrench className="w-4 h-4" aria-hidden="true" />
                        </div>
                        <div>
                          <div className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                            {job.jobType}
                          </div>
                          <div className="text-xs text-slate-400 dark:text-slate-500 font-mono mt-0.5">
                            {job.jobId || 'No ID'}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <div className="text-sm font-semibold text-slate-900 dark:text-slate-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                        {getCustomerName(job.customerId)}
                      </div>
                      {job.customerNotes && (
                        <div className="text-xs text-slate-500 dark:text-slate-400 mt-1 flex items-start gap-1">
                          <FileText className="w-3.5 h-3.5 shrink-0 mt-0.5 text-slate-400" aria-hidden="true" />
                          <span className="truncate max-w-[200px]" title={job.customerNotes}>
                            {job.customerNotes}
                          </span>
                        </div>
                      )}
                    </td>
                    <td className="px-5 py-4">
                      {getStatusBadge(job.status || 'Open')}
                    </td>
                    <td className="px-5 py-4">
                      <div className="space-y-1.5">
                        <div className="flex items-center gap-2 text-xs text-slate-700 dark:text-slate-300">
                          <Calendar className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500 shrink-0" aria-hidden="true" />
                          <span>
                            {job.visitDate ? (
                              formatKolkataDate(job.visitDate)
                            ) : (
                              <span className="italic text-slate-400">Unscheduled</span>
                            )}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-slate-700 dark:text-slate-300">
                          <Users className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500 shrink-0" aria-hidden="true" />
                          <span className="truncate max-w-[180px]">
                            {job.assignedEmployeeIds && job.assignedEmployeeIds.length > 0 ? (
                              job.assignedEmployeeIds.map((id) => getEmployeeName(id)).join(', ')
                            ) : (
                              <span className="italic text-slate-400">Unassigned</span>
                            )}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4 text-right space-y-1">
                      <div className="text-sm">
                        <span className="text-slate-500 dark:text-slate-400 mr-2 text-xs">Final:</span>
                        <span className="font-bold text-slate-900 dark:text-slate-100">
                          {job.finalBilledAmount != null
                            ? `₹${Number(job.finalBilledAmount).toLocaleString('en-IN')}`
                            : '-'}
                        </span>
                      </div>
                      <div className="text-xs">
                        <span className="text-slate-400 dark:text-slate-500 mr-2">Quote:</span>
                        <span className="text-slate-600 dark:text-slate-400 font-medium">
                          {job.quotedAmount != null
                            ? `₹${Number(job.quotedAmount).toLocaleString('en-IN')}`
                            : '-'}
                        </span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* New Job Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in duration-150">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-2xl shadow-2xl flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-slate-200/80 dark:border-slate-800/80 flex justify-between items-center shrink-0">
              <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <Briefcase className="w-5 h-5 text-blue-600 dark:text-blue-400" aria-hidden="true" />
                <span>Create New Job Order</span>
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
              <form id="new-job-form" onSubmit={handleSubmit} className="space-y-5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="job-customer" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                      Customer <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <select
                        id="job-customer"
                        required
                        value={formData.customerId}
                        onChange={(e) => setFormData({ ...formData, customerId: e.target.value })}
                        className="w-full pl-4 pr-10 py-2.5 bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm shadow-2xs appearance-none"
                      >
                        <option value="">Select a customer...</option>
                        {customers.map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.name} {c.company ? `(${c.company})` : ''}
                          </option>
                        ))}
                      </select>
                      <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" aria-hidden="true" />
                    </div>
                  </div>

                  <div>
                    <label htmlFor="job-type" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                      Job Type <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <select
                        id="job-type"
                        required
                        value={formData.jobType}
                        onChange={(e) => setFormData({ ...formData, jobType: e.target.value as Job['jobType'] })}
                        className="w-full pl-4 pr-10 py-2.5 bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm shadow-2xs appearance-none"
                      >
                        <option value="Repair">Repair</option>
                        <option value="Installation">Installation</option>
                        <option value="Maintenance">Maintenance</option>
                        <option value="Inspection">Inspection</option>
                        <option value="Other">Other</option>
                      </select>
                      <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" aria-hidden="true" />
                    </div>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="job-date" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                      Visit Date
                    </label>
                    <input
                      id="job-date"
                      type="date"
                      value={formData.visitDate}
                      onChange={(e) => setFormData({ ...formData, visitDate: e.target.value })}
                      className="w-full px-4 py-2.5 bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm shadow-2xs"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                      Assign Employees <span className="text-red-500">*</span>
                    </label>
                    <div className="border border-slate-300 dark:border-slate-700 rounded-xl p-2.5 max-h-[140px] overflow-y-auto space-y-1.5 bg-slate-50 dark:bg-slate-950 shadow-2xs custom-scrollbar">
                      {employees.map((emp) => (
                        <label
                          key={emp.id}
                          className="flex items-center space-x-2.5 p-1.5 hover:bg-white dark:hover:bg-slate-900 rounded-lg cursor-pointer transition-colors"
                        >
                          <input 
                            type="checkbox" 
                            checked={formData.employeeIds.includes(emp.id)}
                            onChange={() => toggleEmployee(emp.id)}
                            className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 border-slate-300 dark:border-slate-700"
                          />
                          <span className="text-xs sm:text-sm font-medium text-slate-800 dark:text-slate-200">
                            {emp.name}
                          </span>
                        </label>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="job-quoted" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                      Quoted Amount (₹)
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                        <IndianRupee className="h-4 w-4" aria-hidden="true" />
                      </div>
                      <input
                        id="job-quoted"
                        type="number"
                        min="0"
                        step="any"
                        placeholder="0.00"
                        value={formData.quotedAmount}
                        onChange={(e) => setFormData({ ...formData, quotedAmount: e.target.value })}
                        className="w-full pl-9 pr-4 py-2.5 bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm shadow-2xs"
                      />
                    </div>
                  </div>

                  <div>
                    <label htmlFor="job-final" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                      Final Billed Amount (₹)
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                        <IndianRupee className="h-4 w-4" aria-hidden="true" />
                      </div>
                      <input
                        id="job-final"
                        type="number"
                        min="0"
                        step="any"
                        placeholder="0.00"
                        value={formData.finalBilledAmount}
                        onChange={(e) => setFormData({ ...formData, finalBilledAmount: e.target.value })}
                        className="w-full pl-9 pr-4 py-2.5 bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm shadow-2xs"
                      />
                    </div>
                  </div>
                </div>
                
                <div>
                  <label htmlFor="job-notes" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                    Customer Notes
                  </label>
                  <textarea
                    id="job-notes"
                    value={formData.customerNotes}
                    onChange={(e) => setFormData({ ...formData, customerNotes: e.target.value })}
                    className="w-full p-3 bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[75px] text-sm shadow-2xs resize-y"
                    placeholder="Enter any work specifications or special instructions..."
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
                form="new-job-form"
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
                  <span>Save Job</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
