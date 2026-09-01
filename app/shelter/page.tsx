import { auth } from '@/auth';
import ShelterDonationsClient from '@/components/ShelterDonationsClient';
import { redirect } from 'next/navigation';
import Navbar from '@/components/Navbar';

export default async function ShelterPage() {
  const session = await auth();
  const user = session?.user as { role?: string } | undefined;

  if (!user) {
    redirect('/login');
  }

  if (user.role !== 'shelter') {
    redirect('/dashboard');
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <Navbar />
      <ShelterDonationsClient />
    </div>
  );
}