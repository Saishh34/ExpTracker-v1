/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { useState } from 'react';
import { login, logout, addCustomer, addJob, submitExpense } from '@/actions/employee';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { toast } from 'sonner';
import { Zap, Plus, UserPlus, Briefcase, LogOut, Loader2 } from 'lucide-react';

const fieldClass =
  'w-full min-h-11 px-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 shadow-2xs text-sm transition-all focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50';
const labelClass = 'block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5';

function CreateCustomer({ onSave, onCancel }: any) {
  const [name, setName] = useState('');
  const [company, setCompany] = useState('');
  const [phone, setPhone] = useState('');
  const [formError, setFormError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setFormError('Please enter the customer name');
      return;
    }
    setFormError('');
    setIsSubmitting(true);
    try {
      await onSave({ name, company, phone });
    } catch (err: any) {
      setFormError(err.message || 'Failed to save customer');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 space-y-5">
      <div className="border-b border-slate-200 dark:border-slate-800 pb-3 mb-1">
        <p className="text-xs font-semibold text-blue-600 dark:text-blue-400 tracking-wide">PriorityPower</p>
        <h3 className="font-bold text-lg text-slate-900 dark:text-slate-100">Register Customer</h3>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Enter contact information for on-site billing and job assignments.</p>
      </div>

      {formError && (
        <p role="alert" aria-live="polite" className="text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/50 border border-red-200/80 dark:border-red-900/60 rounded-xl px-4 py-2.5">
          {formError}
        </p>
      )}

      <div>
        <label htmlFor="customer-name" className={labelClass}>Customer Name *</label>
        <input
          id="customer-name"
          placeholder="e.g. John Doe"
          className={fieldClass}
          value={name}
          onChange={e => { setName(e.target.value); setFormError(''); }}
          required
        />
      </div>

      <div>
        <label htmlFor="customer-company" className={labelClass}>Company Name</label>
        <input
          id="customer-company"
          placeholder="e.g. Acme Corp"
          className={fieldClass}
          value={company}
          onChange={e => setCompany(e.target.value)}
        />
      </div>

      <div>
        <label htmlFor="customer-phone" className={labelClass}>Phone Number</label>
        <input
          id="customer-phone"
          type="tel"
          placeholder="e.g. +91 98765 43210"
          className={fieldClass}
          value={phone}
          onChange={e => setPhone(e.target.value)}
        />
      </div>

      <div className="flex gap-3 pt-2">
        <button
          type="submit"
          disabled={isSubmitting}
          className="min-h-11 flex-1 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-xl px-5 py-2.5 shadow-sm transition-all focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
        >
          {isSubmitting ? 'Saving Customer...' : 'Save Customer'}
        </button>
        <button
          type="button"
          onClick={onCancel}
          disabled={isSubmitting}
          className="min-h-11 px-5 py-2.5 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors disabled:opacity-50"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}

function CreateJob({ customers, employee, onSave, onCancel }: any) {
  const [custId, setCustId] = useState('');
  const [jobType, setJobType] = useState('Repair');
  const [quotedAmount, setQuotedAmount] = useState('');
  const [finalBilledAmount, setFinalBilledAmount] = useState('');
  const [formError, setFormError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!custId) {
      setFormError('Please select a customer');
      return;
    }

    const parsedQuoted = quotedAmount === '' ? undefined : Number(quotedAmount);
    const parsedFinal = finalBilledAmount === '' ? undefined : Number(finalBilledAmount);

    if (parsedQuoted !== undefined && (isNaN(parsedQuoted) || parsedQuoted < 0)) {
      setFormError('Quoted Amount must be a valid positive number');
      return;
    }
    if (parsedFinal !== undefined && (isNaN(parsedFinal) || parsedFinal < 0)) {
      setFormError('Final Billed Amount must be a valid positive number');
      return;
    }

    setFormError('');
    setIsSubmitting(true);
    try {
      await onSave({
        customerId: custId,
        jobType,
        employeeIds: [employee.id],
        visitDate: new Date().toISOString().split('T')[0],
        quotedAmount: parsedQuoted,
        finalBilledAmount: parsedFinal,
      });
    } catch (err: any) {
      setFormError(err.message || 'Failed to create job');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 space-y-5">
      <div className="border-b border-slate-200 dark:border-slate-800 pb-3 mb-1">
        <p className="text-xs font-semibold text-blue-600 dark:text-blue-400 tracking-wide">PriorityPower</p>
        <h3 className="font-bold text-lg text-slate-900 dark:text-slate-100">Create Field Job</h3>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Assign a service task, customer account, and quote figures.</p>
      </div>

      {formError && (
        <p role="alert" aria-live="polite" className="text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/50 border border-red-200/80 dark:border-red-900/60 rounded-xl px-4 py-2.5">
          {formError}
        </p>
      )}

      <div>
        <label htmlFor="job-customer" className={labelClass}>Customer *</label>
        <select
          id="job-customer"
          required
          className={fieldClass}
          value={custId}
          onChange={e => { setCustId(e.target.value); setFormError(''); }}
        >
          <option value="">Select Customer</option>
          {customers.map((c: any) => (
            <option key={c.id} value={c.id}>{c.company || c.name}</option>
          ))}
        </select>
      </div>

      <div>
        <label htmlFor="job-type" className={labelClass}>Job Type</label>
        <select
          id="job-type"
          className={fieldClass}
          value={jobType}
          onChange={e => setJobType(e.target.value)}
        >
          <option value="Repair">Repair</option>
          <option value="Installation">Installation</option>
          <option value="Maintenance">Maintenance</option>
          <option value="Inspection">Inspection</option>
          <option value="Other">Other</option>
        </select>
      </div>

      <div>
        <label htmlFor="job-quoted" className={labelClass}>Quoted / Agreed Amount (₹)</label>
        <div className="relative">
          <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-500 dark:text-slate-400 text-sm pointer-events-none">₹</span>
          <input
            id="job-quoted"
            type="number"
            min="0"
            step="any"
            placeholder="0.00"
            className={`${fieldClass} pl-8`}
            value={quotedAmount}
            onChange={e => setQuotedAmount(e.target.value)}
          />
        </div>
      </div>

      <div>
        <label htmlFor="job-final" className={labelClass}>Final Billed Amount (₹)</label>
        <div className="relative">
          <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-500 dark:text-slate-400 text-sm pointer-events-none">₹</span>
          <input
            id="job-final"
            type="number"
            min="0"
            step="any"
            placeholder="0.00"
            className={`${fieldClass} pl-8`}
            value={finalBilledAmount}
            onChange={e => setFinalBilledAmount(e.target.value)}
          />
        </div>
      </div>

      <div className="flex gap-3 pt-2">
        <button
          type="submit"
          disabled={isSubmitting}
          className="min-h-11 flex-1 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-xl px-5 py-2.5 shadow-sm transition-all focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
        >
          {isSubmitting ? 'Creating Job...' : 'Save Job'}
        </button>
        <button
          type="button"
          onClick={onCancel}
          disabled={isSubmitting}
          className="min-h-11 px-5 py-2.5 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors disabled:opacity-50"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}

function AddExpense({ categories, selectedJob, jobs, customers, onSave, onCancel }: any) {
  const [categoryId, setCategoryId] = useState('');
  const [amount, setAmount] = useState('');
  const [desc, setDesc] = useState('');
  const [paidBy, setPaidBy] = useState<'Employee'|'Company'>('Employee');
  const [chargeable, setChargeable] = useState<'Yes'|'No'|'Unknown'>('Unknown');
  const [receiptBase64, setReceiptBase64] = useState<string | undefined>(undefined);
  const [receiptFileName, setReceiptFileName] = useState<string | undefined>(undefined);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  const job = jobs?.find((j: any) => j.id === selectedJob);
  const customer = job ? customers?.find((c: any) => c.id === job.customerId) : undefined;
  const customerName = customer ? (customer.company || customer.name) : undefined;
  const jobLabel = job
    ? `${job.jobType || 'Job'}${customerName ? ` at ${customerName}` : ''}`
    : null;

  const handleFileChange = (e: any) => {
    const file = e.target.files?.[0];
    if (!file) {
      setReceiptBase64(undefined);
      setReceiptFileName(undefined);
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setFormError('File is too large (max 5MB).');
      e.target.value = '';
      setReceiptBase64(undefined);
      setReceiptFileName(undefined);
      return;
    }
    setFormError('');
    const reader = new FileReader();
    reader.onload = (ev) => {
      setReceiptBase64(ev.target?.result as string);
      setReceiptFileName(file.name);
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const numAmount = Number(amount);
    if (!categoryId) {
      setFormError('Please select a category');
      return;
    }
    if (isNaN(numAmount) || numAmount <= 0) {
      setFormError('Amount must be greater than zero');
      return;
    }
    if (isSubmitting) return;

    setFormError('');
    setIsSubmitting(true);
    try {
      await onSave({
        jobId: selectedJob,
        categoryId,
        amount: numAmount,
        description: desc,
        paidBy,
        customerChargeable: chargeable,
        dateTime: new Date().toISOString(),
        receiptBase64,
        receiptFileName,
      });
    } catch (error: any) {
      const message = error.message || 'Failed to submit expense';
      setFormError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 space-y-5">
      <div className="border-b border-slate-200 dark:border-slate-800 pb-3 mb-1">
        <p className="text-xs font-semibold text-blue-600 dark:text-blue-400 tracking-wide">PriorityPower</p>
        <h3 className="font-bold text-lg text-slate-900 dark:text-slate-100">Add Expense</h3>
        {jobLabel && (
          <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
            {jobLabel}
            {job?.status ? ` · ${job.status}` : ''}
            {job?.jobId ? ` · ${job.jobId}` : ''}
          </p>
        )}
      </div>

      {formError && (
        <p role="alert" aria-live="polite" className="text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/50 border border-red-200/80 dark:border-red-900/60 rounded-xl px-4 py-2.5">
          {formError}
        </p>
      )}

      <div>
        <label id="expense-category-label" className={labelClass}>Category *</label>
        <Select value={categoryId} onValueChange={(val) => { setCategoryId(val || ""); setFormError(''); }}>
          <SelectTrigger
            aria-labelledby="expense-category-label"
            className={`${fieldClass} h-auto`}
          >
            <SelectValue placeholder="Select Category">
              {(val: string | null) => {
                if (!val) return "Select Category";
                const category = categories.find((c: any) => c.id === val);
                return category ? category.name : "Select Category";
              }}
            </SelectValue>
          </SelectTrigger>
          <SelectContent alignItemWithTrigger={false} side="bottom" sideOffset={4} className="max-h-60 overflow-y-auto">
            {categories.map((c: any) => (
              <SelectItem key={c.id} value={c.id} label={c.name}>
                {c.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div>
        <label htmlFor="expense-amount" className={labelClass}>Amount (₹) *</label>
        <div className="relative">
          <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-500 dark:text-slate-400 text-sm pointer-events-none">₹</span>
          <input
            id="expense-amount"
            type="number"
            inputMode="decimal"
            min="0"
            step="any"
            placeholder="0.00"
            className={`${fieldClass} pl-8`}
            value={amount}
            onChange={e => { setAmount(e.target.value); setFormError(''); }}
            required
          />
        </div>
      </div>

      <div>
        <label htmlFor="expense-description" className={labelClass}>Description</label>
        <textarea
          id="expense-description"
          rows={3}
          placeholder="What was this expense for?"
          className={`${fieldClass} min-h-[5.5rem] resize-y`}
          value={desc}
          onChange={e => setDesc(e.target.value)}
        />
      </div>

      <div>
        <label htmlFor="expense-receipt" className={labelClass}>Receipt Photo (Optional)</label>
        <input
          id="expense-receipt"
          type="file"
          accept="image/*,.pdf"
          className={`${fieldClass} file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:bg-blue-50 dark:file:bg-blue-950/60 file:text-blue-700 dark:file:text-blue-300 file:text-xs file:font-semibold`}
          onChange={handleFileChange}
        />
        <p className="mt-1.5 text-xs text-slate-500 dark:text-slate-400">
          {receiptFileName ? receiptFileName : 'Images or PDF, max 5MB'}
        </p>
      </div>

      <div>
        <label htmlFor="expense-paid-by" className={labelClass}>Paid By</label>
        <select
          id="expense-paid-by"
          className={fieldClass}
          value={paidBy}
          onChange={e => setPaidBy(e.target.value as any)}
        >
          <option value="Employee">Employee</option>
          <option value="Company">Company</option>
        </select>
      </div>

      <div>
        <label htmlFor="expense-chargeable" className={labelClass}>Customer Chargeable?</label>
        <select
          id="expense-chargeable"
          className={fieldClass}
          value={chargeable}
          onChange={e => setChargeable(e.target.value as any)}
        >
          <option value="Unknown">Unknown</option>
          <option value="Yes">Yes</option>
          <option value="No">No</option>
        </select>
      </div>

      <div className="flex gap-3 pt-2">
        <button
          type="submit"
          disabled={isSubmitting}
          className="min-h-11 flex-1 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-xl px-5 py-2.5 shadow-sm transition-all focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
        >
          {isSubmitting ? 'Saving...' : 'Save Expense'}
        </button>
        <button
          type="button"
          onClick={onCancel}
          disabled={isSubmitting}
          className="min-h-11 px-5 py-2.5 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors disabled:opacity-50"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}

export default function EmployeeApp({ initialData, allEmployees }: any) {
  const [data, setData] = useState(initialData);
  const [view, setView] = useState<'login' | 'dashboard' | 'createCustomer' | 'createJob' | 'addExpense'>('dashboard');
  const [employeeId, setEmployeeId] = useState('');
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  
  const [selectedJob, setSelectedJob] = useState('');

  if (!data) {
    return (
      <form
        onSubmit={async (e) => {
          e.preventDefault();
          if (isLoggingIn) return;
          setError('');
          if (!employeeId) {
            setError('Please select an employee');
            return;
          }
          if (!pin) {
            setError('Please enter your PIN');
            return;
          }
          setIsLoggingIn(true);
          try {
            await login(employeeId, pin);
            window.location.reload();
          } catch (err: any) {
            setError(err.message);
            setIsLoggingIn(false);
          }
        }}
        className="glass-card max-w-md mx-auto p-6 sm:p-8 space-y-5 rounded-2xl shadow-sm border border-slate-200/90 dark:border-slate-800/90 mt-6 sm:mt-10"
      >
        <div>
          <div className="flex items-center gap-2.5 mb-3">
            <div className="w-9 h-9 bg-blue-600 rounded-xl flex items-center justify-center text-white shadow-2xs ring-1 ring-blue-700/20">
              <Zap className="w-5 h-5" aria-hidden="true" />
            </div>
            <span className="font-bold text-lg text-slate-900 dark:text-slate-100 tracking-tight">PriorityPower</span>
          </div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">Employee Login</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Select your profile and enter your authorization PIN to view assigned jobs.</p>
        </div>
        {error && (
          <p role="alert" aria-live="polite" className="text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/50 border border-red-200/80 dark:border-red-900/60 rounded-xl px-4 py-2.5">
            {error}
          </p>
        )}
        <div>
          <label htmlFor="employee-select" className={labelClass}>Employee Profile *</label>
          <select
            id="employee-select"
            required
            className={fieldClass}
            value={employeeId}
            onChange={e => { setEmployeeId(e.target.value); setError(''); }}
          >
            <option value="">Select Employee</option>
            {allEmployees.map((emp: any) => (
              <option key={emp.id} value={emp.id}>{emp.name}</option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="employee-pin" className={labelClass}>Authorization PIN *</label>
          <input
            id="employee-pin"
            type="password"
            autoComplete="current-password"
            placeholder="Enter your PIN"
            required
            className={fieldClass}
            value={pin}
            onChange={e => { setPin(e.target.value); setError(''); }}
          />
        </div>
        <button
          type="submit"
          disabled={isLoggingIn}
          className="w-full min-h-11 inline-flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl font-medium shadow-sm transition-all focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
        >
          {isLoggingIn ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
              <span>Logging in...</span>
            </>
          ) : (
            <span>Login</span>
          )}
        </button>
      </form>
    );
  }

  const { employee, customers, jobs, categories } = data;

  const handleLogout = async () => {
    await logout();
    window.location.reload();
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'In Progress':
        return 'bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border-blue-200/80 dark:border-blue-800/80';
      case 'Open':
        return 'bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border-amber-200/80 dark:border-amber-800/80';
      case 'Completed':
        return 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border-emerald-200/80 dark:border-emerald-800/80';
      default:
        return 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700';
    }
  };

  const renderDashboard = () => (
    <div className="space-y-6">
      {/* Welcome Bar */}
      <div className="glass-card rounded-2xl p-5 sm:p-6 border border-slate-200/90 dark:border-slate-800/90 flex justify-between items-center shadow-2xs">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 flex items-center justify-center font-bold text-sm ring-1 ring-blue-600/20">
            {employee.name ? employee.name.charAt(0).toUpperCase() : 'E'}
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">Welcome, {employee.name}</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">Employee ID: {employee.employeeId || employee.id}</p>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-red-600 dark:hover:text-red-400 px-3 py-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors"
        >
          <LogOut className="w-3.5 h-3.5" aria-hidden="true" />
          <span>Logout</span>
        </button>
      </div>

      {/* Active Jobs Card */}
      <div className="glass-card rounded-2xl p-5 sm:p-6 border border-slate-200/90 dark:border-slate-800/90 space-y-5 shadow-2xs">
        <div className="flex items-center justify-between border-b border-slate-200/80 dark:border-slate-800/80 pb-3">
          <div className="flex items-center gap-2">
            <h3 className="font-bold text-base sm:text-lg text-slate-900 dark:text-slate-100">My Active Jobs</h3>
            <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200/60 dark:border-blue-800/60">
              {jobs.length}
            </span>
          </div>
        </div>

        {jobs.length === 0 ? (
          <div className="text-center py-8 px-4 rounded-xl border border-dashed border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
            <Briefcase className="w-8 h-8 text-slate-400 dark:text-slate-500 mx-auto mb-2 opacity-60" aria-hidden="true" />
            <p className="text-sm font-medium text-slate-700 dark:text-slate-300">No active jobs assigned to you.</p>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Use the actions below to create a customer or assign a new job.</p>
          </div>
        ) : (
          <ul className="space-y-3">
            {jobs.map((job: any) => {
              const customer = customers.find((c: any) => c.id === job.customerId);
              const custDisplayName = customer?.company || customer?.name || 'Customer';
              return (
                <li
                  key={job.id}
                  className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs hover:border-blue-200 dark:hover:border-blue-800 transition-all"
                >
                  <div className="space-y-1">
                    <div className="font-semibold text-slate-900 dark:text-slate-100 text-sm sm:text-base">
                      {job.jobType} at {custDisplayName}
                    </div>
                    <div className="flex items-center gap-2 flex-wrap text-xs text-slate-500 dark:text-slate-400">
                      <span className={`inline-block px-2 py-0.5 rounded-md font-medium border text-[11px] ${getStatusBadge(job.status)}`}>
                        {job.status}
                      </span>
                      {job.jobId && <span className="font-mono text-[11px] text-slate-400 dark:text-slate-500">ID: {job.jobId}</span>}
                    </div>
                  </div>
                  <button
                    onClick={() => { setSelectedJob(job.id); setView('addExpense'); }}
                    className="w-full sm:w-auto min-h-10 inline-flex items-center justify-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl text-sm font-semibold shadow-xs transition-all focus:ring-2 focus:ring-blue-500"
                  >
                    <Plus className="w-4 h-4" aria-hidden="true" />
                    <span>Log Expense</span>
                  </button>
                </li>
              );
            })}
          </ul>
        )}
        
        {/* Quick Actions */}
        <div className="pt-4 border-t border-slate-200/80 dark:border-slate-800/80 flex flex-col sm:flex-row gap-3">
          <button
            onClick={() => setView('createCustomer')}
            className="min-h-11 flex-1 inline-flex items-center justify-center gap-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-750 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700 px-4 py-2.5 rounded-xl text-sm font-semibold shadow-2xs transition-colors"
          >
            <UserPlus className="w-4 h-4 text-blue-600 dark:text-blue-400" aria-hidden="true" />
            <span>New Customer</span>
          </button>
          <button
            onClick={() => setView('createJob')}
            className="min-h-11 flex-1 inline-flex items-center justify-center gap-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-750 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700 px-4 py-2.5 rounded-xl text-sm font-semibold shadow-2xs transition-colors"
          >
            <Briefcase className="w-4 h-4 text-blue-600 dark:text-blue-400" aria-hidden="true" />
            <span>New Job</span>
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="max-w-2xl mx-auto py-2">
      {view === 'dashboard' && renderDashboard()}
      
      {view === 'createCustomer' && (
        <CreateCustomer 
          onSave={async (payload: any) => {
            const cust = await addCustomer(payload);
            setData({ ...data, customers: [...customers, cust] });
            toast.success('Customer registered successfully!');
            setView('dashboard');
          }}
          onCancel={() => setView('dashboard')}
        />
      )}

      {view === 'createJob' && (
        <CreateJob 
          customers={customers}
          employee={employee}
          onSave={async (payload: any) => {
            const job = await addJob(payload);
            setData({ ...data, jobs: [...jobs, job] });
            toast.success('Job created successfully!');
            setView('dashboard');
          }}
          onCancel={() => setView('dashboard')}
        />
      )}

      {view === 'addExpense' && (
        <AddExpense 
          categories={categories}
          selectedJob={selectedJob}
          jobs={jobs}
          customers={customers}
          employee={employee}
          onSave={async (payload: any) => {
             await submitExpense(payload);
             toast.success('Expense submitted!');
             setView('dashboard');
          }}
          onCancel={() => setView('dashboard')}
        />
      )}
    </div>
  );
}
