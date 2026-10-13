/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { useState } from 'react';
import { login, logout, addCustomer, addJob, submitExpense } from '@/actions/employee';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { toast } from 'sonner';
import { Zap } from 'lucide-react';

const fieldClass =
  'w-full min-h-11 px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white shadow-sm text-sm transition-shadow';
const labelClass = 'block text-sm font-medium text-gray-700 mb-1.5';

function CreateCustomer({ onSave, onCancel }: any) {
  const [name, setName] = useState('');
  const [company, setCompany] = useState('');
  const [phone, setPhone] = useState('');
  return (
    <div className="bg-white text-gray-900 p-6 rounded-xl shadow-sm border border-gray-200 space-y-5">
      <h3 className="font-semibold text-lg text-gray-800 border-b pb-3 mb-4">Create Customer</h3>
      <input placeholder="Name" className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white shadow-sm text-sm transition-shadow" value={name} onChange={e => setName(e.target.value)} />
      <input placeholder="Company" className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white shadow-sm text-sm transition-shadow" value={company} onChange={e => setCompany(e.target.value)} />
      <input placeholder="Phone" className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white shadow-sm text-sm transition-shadow" value={phone} onChange={e => setPhone(e.target.value)} />
      <div className="flex space-x-2">
        <button onClick={() => onSave({ name, company, phone })} className="bg-blue-600 text-white px-5 py-2.5 rounded-lg hover:bg-blue-700 font-medium shadow-sm transition-all focus:ring-2 focus:ring-blue-500">Save</button>
        <button onClick={onCancel} className="px-4 py-2 text-gray-600">Cancel</button>
      </div>
    </div>
  );
}

function CreateJob({ customers, employee, onSave, onCancel }: any) {
  const [custId, setCustId] = useState('');
  const [jobType, setJobType] = useState('Repair');
  const [quotedAmount, setQuotedAmount] = useState('');
  const [finalBilledAmount, setFinalBilledAmount] = useState('');
  return (
    <div className="bg-white text-gray-900 p-6 rounded-xl shadow-sm border border-gray-200 space-y-5">
      <h3 className="font-semibold text-lg text-gray-800 border-b pb-3 mb-4">Create Job</h3>
      <select className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white shadow-sm text-sm transition-shadow" value={custId} onChange={e => setCustId(e.target.value)}>
        <option value="">Select Customer</option>
        {customers.map((c: any) => <option key={c.id} value={c.id}>{c.company || c.name}</option>)}
      </select>
      <select className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white shadow-sm text-sm transition-shadow" value={jobType} onChange={e => setJobType(e.target.value)}>
        <option value="Repair">Repair</option>
        <option value="Installation">Installation</option>
        <option value="Maintenance">Maintenance</option>
        <option value="Inspection">Inspection</option>
        <option value="Other">Other</option>
      </select>
      <input type="number" min="0" step="any" placeholder="Quoted / Agreed Amount (₹)" className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white shadow-sm text-sm transition-shadow" value={quotedAmount} onChange={e => setQuotedAmount(e.target.value)} />
      <input type="number" min="0" step="any" placeholder="Final Billed Amount (₹)" className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white shadow-sm text-sm transition-shadow" value={finalBilledAmount} onChange={e => setFinalBilledAmount(e.target.value)} />
      <div className="flex space-x-2">
        <button onClick={() => {
          const parsedQuoted = quotedAmount === '' ? undefined : Number(quotedAmount);
          const parsedFinal = finalBilledAmount === '' ? undefined : Number(finalBilledAmount);
          
          if (parsedQuoted !== undefined && (isNaN(parsedQuoted) || parsedQuoted < 0)) return alert('Quoted Amount must be a valid positive number');
          if (parsedFinal !== undefined && (isNaN(parsedFinal) || parsedFinal < 0)) return alert('Final Billed Amount must be a valid positive number');
          
          onSave({ customerId: custId, jobType, employeeIds: [employee.id], visitDate: new Date().toISOString().split('T')[0], quotedAmount: parsedQuoted, finalBilledAmount: parsedFinal })
        }} className="bg-blue-600 text-white px-5 py-2.5 rounded-lg hover:bg-blue-700 font-medium shadow-sm transition-all focus:ring-2 focus:ring-blue-500">Save</button>
        <button onClick={onCancel} className="px-4 py-2 text-gray-600">Cancel</button>
      </div>
    </div>
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
    <form onSubmit={handleSubmit} className="bg-white text-gray-900 p-6 rounded-xl shadow-sm border border-gray-200 space-y-5">
      <div className="border-b pb-3 mb-1">
        <p className="text-xs font-medium text-blue-700 tracking-wide">PriorityPower</p>
        <h3 className="font-semibold text-lg text-gray-800">Add Expense</h3>
        {jobLabel && (
          <p className="text-sm text-gray-600 mt-1">
            {jobLabel}
            {job?.status ? ` · ${job.status}` : ''}
            {job?.jobId ? ` · ${job.jobId}` : ''}
          </p>
        )}
      </div>

      {formError && (
        <p role="alert" aria-live="polite" className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
          {formError}
        </p>
      )}

      <div>
        <label id="expense-category-label" className={labelClass}>Category</label>
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
        <label htmlFor="expense-amount" className={labelClass}>Amount (₹)</label>
        <div className="relative">
          <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-500 text-sm pointer-events-none">₹</span>
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
          className={`${fieldClass} file:mr-3 file:py-1.5 file:px-3 file:rounded-md file:border-0 file:bg-blue-50 file:text-blue-700 file:text-sm file:font-medium`}
          onChange={handleFileChange}
        />
        <p className="mt-1.5 text-xs text-gray-500">
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

      <div className="flex gap-3 pt-1">
        <button
          type="submit"
          disabled={isSubmitting}
          className="min-h-11 flex-1 bg-blue-600 text-white px-5 py-2.5 rounded-lg hover:bg-blue-700 font-medium shadow-sm transition-all focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
        >
          {isSubmitting ? 'Saving...' : 'Save Expense'}
        </button>
        <button
          type="button"
          onClick={onCancel}
          disabled={isSubmitting}
          className="min-h-11 px-4 py-2.5 text-gray-600 rounded-lg hover:bg-gray-50 disabled:opacity-50"
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
        className="max-w-md mx-auto p-6 space-y-5 bg-white text-gray-900 rounded-xl shadow-sm border border-gray-200 mt-10"
      >
        <div>
          <div className="flex items-center gap-2 mb-3">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white">
              <Zap className="w-5 h-5" aria-hidden="true" />
            </div>
            <span className="font-bold text-lg text-gray-900 tracking-tight">PriorityPower</span>
          </div>
          <h2 className="text-xl font-bold">Employee Login</h2>
        </div>
        {error && (
          <p role="alert" aria-live="polite" className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
            {error}
          </p>
        )}
        <div>
          <label htmlFor="employee-select" className={labelClass}>Employee</label>
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
          <label htmlFor="employee-pin" className={labelClass}>PIN</label>
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
          className="w-full min-h-11 bg-blue-600 text-white px-5 py-2.5 rounded-lg hover:bg-blue-700 font-medium shadow-sm transition-all focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
        >
          {isLoggingIn ? 'Logging in...' : 'Login'}
        </button>
      </form>
    );
  }

  const { employee, customers, jobs, categories } = data;

  const handleLogout = async () => {
    await logout();
    window.location.reload();
  };

  const renderDashboard = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center bg-white text-gray-900 p-6 rounded-xl shadow-md border border-gray-100">
        <div>
          <h2 className="text-xl font-bold">Welcome, {employee.name}</h2>
          <p className="text-gray-500 text-sm">Employee ID: {employee.employeeId}</p>
        </div>
        <button onClick={handleLogout} className="text-red-600 text-sm hover:underline">Logout</button>
      </div>

      <div className="bg-white text-gray-900 p-6 rounded-xl shadow-sm border border-gray-200 space-y-5">
        <h3 className="font-semibold text-lg">My Active Jobs</h3>
        {jobs.length === 0 ? <p className="text-gray-500">No active jobs assigned to you.</p> : (
          <ul className="space-y-3">
            {jobs.map((job: any) => {
              const customer = customers.find((c: any) => c.id === job.customerId);
              return (
                <li key={job.id} className="border p-3 rounded flex justify-between items-center">
                  <div>
                    <div className="font-medium">{job.jobType} at {customer?.company || customer?.name}</div>
                    <div className="text-sm text-gray-500">Status: {job.status}</div>
                  </div>
                  <button onClick={() => { setSelectedJob(job.id); setView('addExpense'); }} className="bg-green-600 text-white px-3 py-1 rounded text-sm">Add Expense</button>
                </li>
              );
            })}
          </ul>
        )}
        
        <div className="pt-4 border-t flex space-x-3">
          <button onClick={() => setView('createCustomer')} className="bg-blue-50 text-blue-700 px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-100 transition-colors border border-blue-200 shadow-sm">New Customer</button>
          <button onClick={() => setView('createJob')} className="bg-blue-50 text-blue-700 px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-100 transition-colors border border-blue-200 shadow-sm">New Job</button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="max-w-xl mx-auto py-6 px-4">
      {view === 'dashboard' && renderDashboard()}
      
      {view === 'createCustomer' && (
        <CreateCustomer 
          onSave={async (payload: any) => {
            const cust = await addCustomer(payload);
            setData({ ...data, customers: [...customers, cust] });
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
