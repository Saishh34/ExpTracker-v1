import { getExpenses, getJobs, getEmployees, getCustomers, getExpenseCategories } from '@/lib/airtable';
import ReportsClient from './ReportsClient';

export const dynamic = 'force-dynamic';

export default async function AdminReportsPage() {
  const [expenses, jobs, employees, categories, customers] = await Promise.all([
    getExpenses(),
    getJobs(),
    getEmployees(),
    getExpenseCategories(),
    getCustomers(),
  ]);

  return (
    <ReportsClient 
      expenses={expenses} 
      jobs={jobs} 
      employees={employees} 
      categories={categories} 
      customers={customers} 
    />
  );
}
