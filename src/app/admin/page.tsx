import { getCustomers, getEmployees, getExpenseCategories, getExpenses, getJobs } from "@/lib/airtable";
import DashboardClient from "./DashboardClient";

export const dynamic = 'force-dynamic';

export default async function AdminDashboardPage() {
  const [jobs, expenses, customers, employees, categories] = await Promise.all([
    getJobs(),
    getExpenses(),
    getCustomers(),
    getEmployees(),
    getExpenseCategories(),
  ]);

  return (
    <DashboardClient 
      jobs={jobs} 
      expenses={expenses} 
      customers={customers} 
      employees={employees} 
      categories={categories} 
    />
  );
}
