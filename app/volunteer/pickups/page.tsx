import { auth } from '@/auth';
import VolunteerDeliveriesClient from '@/components/VolunteerDeliveriesClient';
import { redirect } from 'next/navigation';
import Navbar from '@/components/Navbar';

export default async function VolunteerPickupsPage() {
  const session = await auth();
  const user = session?.user as { role?: string } | undefined;

  if (!user) {
    redirect('/login');
  }

  if (user.role !== 'volunteer') {
    redirect('/dashboard');
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <Navbar />
      <VolunteerDeliveriesClient />
    </div>
  );
}