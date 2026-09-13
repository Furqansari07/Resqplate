import { auth } from '@/auth';
import VolunteerPickupsClient from '@/components/VolunteerPickupsClient';
import { redirect } from 'next/navigation';
import Navbar from '@/components/Navbar';

export default async function VolunteerPage() {
  const session = await auth();
  const user = session?.user as { role?: string } | undefined;

  if (!user) {
    redirect('/login');
  }

  if (user.role !== 'volunteer') {
    redirect('/dashboard');
  }

  return (
    <div className="min-h-screen bg-[var(--background)]">
      <Navbar />
      <VolunteerPickupsClient />
    </div>
  );
}