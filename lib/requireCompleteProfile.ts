import { redirect } from 'next/navigation';
import dbConnect from '@/lib/mongodb';
import User from '@/models/User';
import { getProfileCompletion } from '@/lib/profileCompletion';

export async function requireCompleteProfile(userId: string, role: string) {
  await dbConnect();
  const dbUser = await User.findById(userId).lean();
  const completion = getProfileCompletion(dbUser || {}, role);

  if (completion.percent < 100) {
    redirect('/profile?required=1');
  }
}