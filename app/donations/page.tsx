import { auth } from '@/auth';
import DonationsClient from '@/components/DonationsClient';
import { redirect } from 'next/navigation';
import Navbar from '@/components/Navbar';

export default async function DonationsPage() {
  const session = await auth();
  const user = session?.user as { role?: string } | undefined;

  if (!user) {
    redirect('/login');
  }

  if (user.role !== 'donor') {
    redirect('/dashboard');
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <Navbar />
      <DonationsClient />
    </div>
  );
}