import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import bcrypt from 'bcryptjs';
import dbConnect from '@/lib/mongodb';
import User from '@/models/User';
import EmailChangeOtp from '@/models/EmailChangeOtp';

export async function POST(req: Request) {
  const session = await auth();
  const userId = (session?.user as { id?: string } | undefined)?.id;
  if (!userId) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });

  const { otp } = await req.json();
  if (!otp) return NextResponse.json({ error: 'Code is required' }, { status: 400 });

  await dbConnect();
  const record = await EmailChangeOtp.findOne({ userId });

  if (!record || record.expiresAt < new Date()) {
    return NextResponse.json({ error: 'Code expired, please try again' }, { status: 400 });
  }

  const valid = await bcrypt.compare(otp, record.codeHash);
  if (!valid) return NextResponse.json({ error: 'Invalid code' }, { status: 400 });

  const existing = await User.findOne({ email: record.newEmail });
  if (existing) {
    await EmailChangeOtp.deleteOne({ _id: record._id });
    return NextResponse.json({ error: 'This email is already in use' }, { status: 400 });
  }

  await User.findByIdAndUpdate(userId, { email: record.newEmail, emailVerified: true });
  await EmailChangeOtp.deleteOne({ _id: record._id });

  return NextResponse.json({
    success: true,
    message: 'Email updated. Please sign in again with your new email next time.',
  });
}