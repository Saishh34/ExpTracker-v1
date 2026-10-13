import { getExpenses, getJobs, getEmployees, getCustomers, getExpenseCategories } from '@/lib/airtable';
import ExpensesClient from './ExpensesClient';

export const dynamic = 'force-dynamic';

export default async function AdminExpensesPage() {
  const [expenses, jobs, employees, categories, customers] = await Promise.all([
    getExpenses(),
    getJobs(),
    getEmployees(),
    getExpenseCategories(),
    getCustomers(),
  ]);

  return (
    <ExpensesClient 
      initialExpenses={expenses} 
      jobs={jobs} 
      employees={employees} 
      categories={categories} 
      customers={customers} 
    />
  );
}
