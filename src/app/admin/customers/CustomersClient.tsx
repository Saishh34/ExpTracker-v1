'use client';

import { useState } from 'react';
import { Customer } from '@/types';
import { adminAddCustomer } from '@/actions/admin';
import { useRouter } from 'next/navigation';
import { Search, Plus, X, Building2, Phone, MapPin, Users, FileText, User, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export default function CustomersClient({ initialCustomers }: { initialCustomers: Customer[] }) {
  const router = useRouter();
  const [customers, setCustomers] = useState<Customer[]>(initialCustomers);
  const [searchTerm, setSearchTerm] = useState('');
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    company: '',
    phone: '',
    address: '',
    notes: '',
  });

  const filteredCustomers = customers.filter((c) => {
    const search = searchTerm.toLowerCase();
    return (
      (c.name || '').toLowerCase().includes(search) ||
      (c.company || '').toLowerCase().includes(search) ||
      (c.phone || '').toLowerCase().includes(search) ||
      (c.customerId || '').toLowerCase().includes(search)
    );
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      toast.error('Name is required');
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      const newCustomer = await adminAddCustomer(formData);
      setCustomers((prev) => [...prev, newCustomer]);
      setIsModalOpen(false);
      setFormData({ name: '', company: '', phone: '', address: '', notes: '' });
      toast.success('Customer added successfully');
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to add customer');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getInitials = (name: string) => {
    return (
      name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .substring(0, 2)
        .toUpperCase() || 'C'
    );
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-slate-100 tracking-tight flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center border border-blue-200/60 dark:border-blue-800/60 shrink-0">
              <Users className="w-4 h-4" aria-hidden="true" />
            </div>
            <span>Customers Directory</span>
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Manage your client accounts, contact details, and service relationships.
          </p>
        </div>
        
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          {/* Search Box */}
          <div className="relative w-full sm:w-72">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400 dark:text-slate-500">
              <Search className="h-4 w-4" aria-hidden="true" />
            </div>
            <input
              type="text"
              placeholder="Search customers or ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all shadow-2xs"
            />
          </div>
          {/* New Customer Button */}
          <button
            onClick={() => setIsModalOpen(true)}
            className="min-h-10 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl font-semibold shadow-xs transition-all focus:ring-2 focus:ring-blue-500 flex items-center justify-center gap-2 text-sm shrink-0"
          >
            <Plus className="w-4 h-4" aria-hidden="true" />
            <span>New Customer</span>
          </button>
        </div>
      </div>

      {/* Main Customers List */}
      {filteredCustomers.length === 0 ? (
        <div className="glass-card p-12 flex flex-col items-center justify-center text-center rounded-2xl border border-slate-200/90 dark:border-slate-800/90 shadow-2xs">
          <div className="w-16 h-16 bg-blue-50 dark:bg-blue-950/60 rounded-2xl flex items-center justify-center text-blue-600 dark:text-blue-400 mb-4 border border-blue-200/60 dark:border-blue-800/60">
            <Users className="w-8 h-8" aria-hidden="true" />
          </div>
          <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 mb-1">No customers found</h3>
          <p className="text-sm text-slate-500 dark:text-slate-400 max-w-sm mb-6">
            {searchTerm
              ? 'No customer records matched your query. Try a different name, phone, or company search.'
              : 'Get started by creating your first customer account in the directory.'}
          </p>
          {searchTerm ? (
            <button 
              onClick={() => setSearchTerm('')} 
              className="text-blue-600 dark:text-blue-400 font-semibold text-sm hover:underline"
            >
              Clear search query
            </button>
          ) : (
            <button
              onClick={() => setIsModalOpen(true)}
              className="bg-blue-600 text-white px-4 py-2 rounded-xl text-sm font-semibold hover:bg-blue-700 transition-colors shadow-2xs"
            >
              Add First Customer
            </button>
          )}
        </div>
      ) : (
        <div className="glass-card rounded-2xl shadow-2xs border border-slate-200/90 dark:border-slate-800/90 overflow-hidden">
          <div className="overflow-x-auto custom-scrollbar">
            <table className="w-full text-left border-collapse min-w-[760px]">
              <thead>
                <tr className="bg-slate-50/80 dark:bg-slate-850/80 border-b border-slate-200/80 dark:border-slate-800/80">
                  <th className="px-5 py-3.5 text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider w-1/4">
                    Customer
                  </th>
                  <th className="px-5 py-3.5 text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider w-1/4">
                    Company
                  </th>
                  <th className="px-5 py-3.5 text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                    Contact
                  </th>
                  <th className="px-5 py-3.5 text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                    Location &amp; Notes
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                {filteredCustomers.map((customer) => (
                  <tr
                    key={customer.id}
                    className="hover:bg-slate-50/60 dark:hover:bg-slate-850/40 transition-colors group"
                  >
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 flex items-center justify-center font-bold text-sm shrink-0 ring-1 ring-blue-600/20">
                          {getInitials(customer.name)}
                        </div>
                        <div className="min-w-0">
                          <div className="text-sm font-semibold text-slate-900 dark:text-slate-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors truncate">
                            {customer.name}
                          </div>
                          <div className="text-xs text-slate-400 dark:text-slate-500 font-mono mt-0.5">
                            {customer.customerId || '-'}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      {customer.company ? (
                        <div className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300">
                          <Building2 className="w-4 h-4 text-slate-400 dark:text-slate-500 shrink-0" aria-hidden="true" />
                          <span className="truncate max-w-[160px]">{customer.company}</span>
                        </div>
                      ) : (
                        <span className="text-xs text-slate-400 dark:text-slate-500 italic">No company</span>
                      )}
                    </td>
                    <td className="px-5 py-4">
                      {customer.phone ? (
                        <div className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300">
                          <Phone className="w-4 h-4 text-slate-400 dark:text-slate-500 shrink-0" aria-hidden="true" />
                          <span>{customer.phone}</span>
                        </div>
                      ) : (
                        <span className="text-xs text-slate-400 dark:text-slate-500 italic">No phone</span>
                      )}
                    </td>
                    <td className="px-5 py-4">
                      <div className="space-y-1">
                        {customer.address ? (
                          <div className="flex items-start gap-1.5 text-xs text-slate-700 dark:text-slate-300">
                            <MapPin className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500 shrink-0 mt-0.5" aria-hidden="true" />
                            <span className="truncate max-w-[220px]" title={customer.address}>
                              {customer.address}
                            </span>
                          </div>
                        ) : null}
                        {customer.notes ? (
                          <div className="flex items-start gap-1.5 text-xs text-slate-500 dark:text-slate-400">
                            <FileText className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500 shrink-0 mt-0.5" aria-hidden="true" />
                            <span className="truncate max-w-[220px]" title={customer.notes}>
                              {customer.notes}
                            </span>
                          </div>
                        ) : null}
                        {!customer.address && !customer.notes && (
                          <span className="text-xs text-slate-400 dark:text-slate-500 italic">No details</span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* New Customer Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in duration-150">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-lg shadow-2xl flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-slate-200/80 dark:border-slate-800/80 flex items-center justify-between shrink-0">
              <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <User className="w-5 h-5 text-blue-600 dark:text-blue-400" aria-hidden="true" />
                <span>Add New Customer</span>
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
              <form id="new-customer-form" onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label htmlFor="customer-name" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                    Full Name <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                      <User className="h-4 w-4" aria-hidden="true" />
                    </div>
                    <input
                      id="customer-name"
                      type="text"
                      required
                      placeholder="e.g. Acme Corp or Jane Doe"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full pl-9 pr-4 py-2.5 bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm shadow-2xs"
                    />
                  </div>
                </div>
                
                <div>
                  <label htmlFor="customer-company" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                    Company <span className="text-slate-400 font-normal">(Optional)</span>
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                      <Building2 className="h-4 w-4" aria-hidden="true" />
                    </div>
                    <input
                      id="customer-company"
                      type="text"
                      placeholder="e.g. Apex Industrial Solutions"
                      value={formData.company}
                      onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                      className="w-full pl-9 pr-4 py-2.5 bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm shadow-2xs"
                    />
                  </div>
                </div>
                
                <div>
                  <label htmlFor="customer-phone" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                    Phone <span className="text-slate-400 font-normal">(Optional)</span>
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                      <Phone className="h-4 w-4" aria-hidden="true" />
                    </div>
                    <input
                      id="customer-phone"
                      type="tel"
                      placeholder="e.g. +91 98765 43210"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      className="w-full pl-9 pr-4 py-2.5 bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm shadow-2xs"
                    />
                  </div>
                </div>
                
                <div>
                  <label htmlFor="customer-address" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                    Address <span className="text-slate-400 font-normal">(Optional)</span>
                  </label>
                  <textarea
                    id="customer-address"
                    placeholder="Enter on-site address or facility location..."
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    className="w-full p-3 bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[75px] text-sm shadow-2xs resize-y"
                  />
                </div>
                
                <div>
                  <label htmlFor="customer-notes" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                    Internal Notes <span className="text-slate-400 font-normal">(Optional)</span>
                  </label>
                  <textarea
                    id="customer-notes"
                    placeholder="Billing preferences, point of contact notes..."
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    className="w-full p-3 bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[75px] text-sm shadow-2xs resize-y"
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
                form="new-customer-form"
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
                  <span>Save Customer</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
