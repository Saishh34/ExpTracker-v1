import { getJobs, getCustomers, getEmployees } from '@/lib/airtable';
import JobsClient from './JobsClient';

export const dynamic = 'force-dynamic';

export default async function AdminJobsPage() {
  const [jobs, customers, employees] = await Promise.all([
    getJobs(),
    getCustomers(),
    getEmployees(),
  ]);

  return <JobsClient initialJobs={jobs} customers={customers} employees={employees} />;
}
