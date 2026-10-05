'use client';

import { useState } from 'react';
import { Job, Customer, Employee } from '@/types';
import { adminAddJob } from '@/actions/admin';
import { formatKolkataDate } from '@/lib/dateUtils';
import { useRouter } from 'next/navigation';
import { Plus, X, Briefcase, Filter, Calendar, Users, IndianRupee, FileText, CheckCircle2, AlertCircle, Clock, XCircle, Search, ChevronDown, Wrench } from 'lucide-react';
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

  const getCustomerName = (id: string) => customers.find(c => c.id === id)?.name || 'Unknown Customer';
  const getEmployeeName = (id: string) => employees.find(e => e.id === id)?.name || 'Unknown Employee';

  const filteredJobs = jobs.filter(j => {
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
      setJobs(prev => [newJob, ...prev]);
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
    setFormData(prev => ({
      ...prev,
      employeeIds: prev.employeeIds.includes(empId)
        ? prev.employeeIds.filter(id => id !== empId)
        : [...prev.employeeIds, empId]
    }));
  };

  const getStatusBadge = (status: string) => {
    switch(status) {
      case 'Completed':
        return <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800 border border-emerald-200"><CheckCircle2 className="w-3.5 h-3.5" /> Completed</span>;
      case 'In Progress':
        return <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 border border-blue-200"><Clock className="w-3.5 h-3.5" /> In Progress</span>;
      case 'Cancelled':
        return <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800 border border-red-200"><XCircle className="w-3.5 h-3.5" /> Cancelled</span>;
      case 'Open':
      default:
        return <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-amber-100 text-amber-800 border border-amber-200"><AlertCircle className="w-3.5 h-3.5" /> Open</span>;
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Briefcase className="w-6 h-6 text-blue-600" />
            Jobs Management
          </h1>
          <p className="text-sm text-slate-500 mt-1">Track and assign operational jobs and services.</p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-xl hover:bg-blue-700 font-medium whitespace-nowrap shadow-sm transition-all focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 flex items-center justify-center gap-2 text-sm"
        >
          <Plus className="w-4 h-4" />
          New Job
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200 flex flex-col md:flex-row gap-4 items-center">
        <div className="flex items-center gap-2 text-slate-500 font-medium text-sm shrink-0">
          <Filter className="w-4 h-4" />
          Filters:
        </div>
        <div className="flex flex-wrap gap-3 flex-1 w-full">
          <div className="relative flex-1 min-w-[140px]">
            <select
              value={customerFilter}
              onChange={(e) => setCustomerFilter(e.target.value)}
              className="w-full pl-3 pr-8 py-2 border border-slate-300 rounded-xl text-sm text-slate-700 bg-slate-50 hover:bg-white focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors appearance-none"
            >
              <option value="">All Customers</option>
              {customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
            <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>
          <div className="relative flex-1 min-w-[140px]">
            <select
              value={employeeFilter}
              onChange={(e) => setEmployeeFilter(e.target.value)}
              className="w-full pl-3 pr-8 py-2 border border-slate-300 rounded-xl text-sm text-slate-700 bg-slate-50 hover:bg-white focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors appearance-none"
            >
              <option value="">All Employees</option>
              {employees.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
            </select>
            <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>
          <div className="relative flex-1 min-w-[140px]">
            <select
              value={jobTypeFilter}
              onChange={(e) => setJobTypeFilter(e.target.value)}
              className="w-full pl-3 pr-8 py-2 border border-slate-300 rounded-xl text-sm text-slate-700 bg-slate-50 hover:bg-white focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors appearance-none"
            >
              <option value="">All Job Types</option>
              <option value="Repair">Repair</option>
              <option value="Installation">Installation</option>
              <option value="Maintenance">Maintenance</option>
              <option value="Inspection">Inspection</option>
              <option value="Other">Other</option>
            </select>
            <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>
          <div className="relative flex-1 min-w-[140px]">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full pl-3 pr-8 py-2 border border-slate-300 rounded-xl text-sm text-slate-700 bg-slate-50 hover:bg-white focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors appearance-none"
            >
              <option value="">All Statuses</option>
              <option value="Open">Open</option>
              <option value="In Progress">In Progress</option>
              <option value="Completed">Completed</option>
              <option value="Cancelled">Cancelled</option>
            </select>
            <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>
          <div className="relative flex-1 min-w-[140px]">
            <input
              type="date"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm text-slate-700 bg-slate-50 hover:bg-white focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
            />
          </div>
          {(customerFilter || employeeFilter || jobTypeFilter || statusFilter || dateFilter) && (
            <button 
              onClick={() => {
                setCustomerFilter('');
                setEmployeeFilter('');
                setJobTypeFilter('');
                setStatusFilter('');
                setDateFilter('');
              }}
              className="px-4 py-2 text-sm text-blue-600 hover:bg-blue-50 rounded-xl font-medium transition-colors shrink-0"
            >
              Clear All
            </button>
          )}
        </div>
      </div>

      {/* Jobs Table */}
      {filteredJobs.length === 0 ? (
        <div className="p-12 flex flex-col items-center justify-center text-center bg-white rounded-2xl border border-slate-200 shadow-sm">
          <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4">
            <Briefcase className="w-8 h-8 text-slate-400" />
          </div>
          <h3 className="text-lg font-medium text-slate-900 mb-1">No jobs found</h3>
          <p className="text-sm text-slate-500 max-w-sm mb-6">
            {(customerFilter || employeeFilter || jobTypeFilter || statusFilter || dateFilter) 
              ? 'No jobs match your current filter criteria.' 
              : 'Get started by creating your first job.'}
          </p>
          {(customerFilter || employeeFilter || jobTypeFilter || statusFilter || dateFilter) && (
            <button 
              onClick={() => {
                setCustomerFilter('');
                setEmployeeFilter('');
                setJobTypeFilter('');
                setStatusFilter('');
                setDateFilter('');
              }}
              className="text-blue-600 font-medium text-sm hover:underline"
            >
              Clear filters
            </button>
          )}
        </div>
      ) : (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="overflow-x-auto custom-scrollbar">
            <table className="w-full text-left border-collapse min-w-[1000px]">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200">
                  <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Job Details</th>
                  <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Customer</th>
                  <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Schedule & Assignees</th>
                  <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider text-right">Financials</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredJobs.map(job => (
                  <tr key={job.id} className="hover:bg-slate-50/60 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-600 flex items-center justify-center shrink-0 border border-slate-200">
                          <Wrench className="w-5 h-5" />
                        </div>
                        <div>
                          <div className="text-sm font-semibold text-slate-900">{job.jobType}</div>
                          <div className="text-xs text-slate-500 font-mono mt-0.5">{job.jobId || 'No ID'}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-slate-900 group-hover:text-blue-600 transition-colors">
                        {getCustomerName(job.customerId)}
                      </div>
                      {job.customerNotes && (
                        <div className="text-xs text-slate-500 mt-1 flex items-start gap-1">
                          <FileText className="w-3 h-3 shrink-0 mt-0.5" />
                          <span className="truncate max-w-[180px]" title={job.customerNotes}>{job.customerNotes}</span>
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      {getStatusBadge(job.status || 'Open')}
                    </td>
                    <td className="px-6 py-4">
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-sm text-slate-700">
                          <Calendar className="w-4 h-4 text-slate-400 shrink-0" />
                          <span>{job.visitDate ? formatKolkataDate(job.visitDate) : <span className="italic text-slate-400">Unscheduled</span>}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-slate-700">
                          <Users className="w-4 h-4 text-slate-400 shrink-0" />
                          <span className="truncate max-w-[180px]">
                            {job.assignedEmployeeIds && job.assignedEmployeeIds.length > 0 
                              ? job.assignedEmployeeIds.map(id => getEmployeeName(id)).join(', ')
                              : <span className="italic text-slate-400">Unassigned</span>}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right space-y-1">
                      <div className="text-sm">
                        <span className="text-slate-500 mr-2 text-xs">Final:</span>
                        <span className="font-semibold text-slate-900">
                          {job.finalBilledAmount != null ? `₹${Number(job.finalBilledAmount).toLocaleString('en-IN')}` : '-'}
                        </span>
                      </div>
                      <div className="text-xs">
                        <span className="text-slate-400 mr-2">Quote:</span>
                        <span className="text-slate-600">
                          {job.quotedAmount != null ? `₹${Number(job.quotedAmount).toLocaleString('en-IN')}` : '-'}
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
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 sm:p-6 z-50 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl w-full max-w-2xl shadow-2xl flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200">
            <div className="px-6 py-5 border-b border-slate-100 flex justify-between items-center bg-white rounded-t-2xl shrink-0">
              <h2 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
                <Briefcase className="w-5 h-5 text-blue-600" />
                Create New Job
              </h2>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600 hover:bg-slate-100 p-1.5 rounded-lg transition-colors">
                <span className="sr-only">Close</span>
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto custom-scrollbar">
              <form id="new-job-form" onSubmit={handleSubmit} className="space-y-6">
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">Customer <span className="text-red-500">*</span></label>
                    <div className="relative">
                      <select
                        required
                        value={formData.customerId}
                        onChange={(e) => setFormData({...formData, customerId: e.target.value})}
                        className="w-full pl-4 pr-10 py-2.5 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white shadow-sm text-sm transition-shadow appearance-none"
                      >
                        <option value="">Select a customer...</option>
                        {customers.map(c => (
                          <option key={c.id} value={c.id}>{c.name} {c.company ? `(${c.company})` : ''}</option>
                        ))}
                      </select>
                      <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">Job Type <span className="text-red-500">*</span></label>
                    <div className="relative">
                      <select
                        required
                        value={formData.jobType}
                        onChange={(e) => setFormData({...formData, jobType: e.target.value as Job['jobType']})}
                        className="w-full pl-4 pr-10 py-2.5 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white shadow-sm text-sm transition-shadow appearance-none"
                      >
                        <option value="Repair">Repair</option>
                        <option value="Installation">Installation</option>
                        <option value="Maintenance">Maintenance</option>
                        <option value="Inspection">Inspection</option>
                        <option value="Other">Other</option>
                      </select>
                      <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                    </div>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">Visit Date</label>
                    <input
                      type="date"
                      value={formData.visitDate}
                      onChange={(e) => setFormData({...formData, visitDate: e.target.value})}
                      className="w-full px-4 py-2.5 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white shadow-sm text-sm transition-shadow"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">Assign Employees <span className="text-red-500">*</span></label>
                    <div className="border border-slate-300 rounded-xl p-3 max-h-[140px] overflow-y-auto space-y-2 bg-slate-50 shadow-sm custom-scrollbar">
                      {employees.map(emp => (
                        <label key={emp.id} className="flex items-center space-x-3 p-2 hover:bg-white rounded-lg cursor-pointer transition-colors border border-transparent hover:border-slate-200">
                          <input 
                            type="checkbox" 
                            checked={formData.employeeIds.includes(emp.id)}
                            onChange={() => toggleEmployee(emp.id)}
                            className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 border-slate-300"
                          />
                          <span className="text-sm font-medium text-slate-700">{emp.name}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">Quoted Amount</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <IndianRupee className="h-4 w-4 text-slate-400" />
                      </div>
                      <input
                        type="number"
                        min="0"
                        step="any"
                        placeholder="0.00"
                        value={formData.quotedAmount}
                        onChange={(e) => setFormData({...formData, quotedAmount: e.target.value})}
                        className="w-full pl-9 pr-4 py-2.5 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white shadow-sm text-sm transition-shadow"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">Final Billed Amount</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <IndianRupee className="h-4 w-4 text-slate-400" />
                      </div>
                      <input
                        type="number"
                        min="0"
                        step="any"
                        placeholder="0.00"
                        value={formData.finalBilledAmount}
                        onChange={(e) => setFormData({...formData, finalBilledAmount: e.target.value})}
                        className="w-full pl-9 pr-4 py-2.5 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white shadow-sm text-sm transition-shadow"
                      />
                    </div>
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Customer Notes</label>
                  <textarea
                    value={formData.customerNotes}
                    onChange={(e) => setFormData({...formData, customerNotes: e.target.value})}
                    className="w-full p-3 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 min-h-[80px] bg-white shadow-sm text-sm transition-shadow resize-y"
                    placeholder="Enter any specific instructions or requirements..."
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
                form="new-job-form"
                type="submit"
                disabled={isSubmitting}
                className="px-5 py-2 text-sm bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors font-medium disabled:opacity-50 flex items-center shadow-sm"
              >
                {isSubmitting ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                    Saving...
                  </>
                ) : 'Save Job'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
