import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import bcrypt from 'bcryptjs';
import dbConnect from '@/lib/mongodb';
import User from '@/models/User';
import EmailChangeOtp from '@/models/EmailChangeOtp';
import { sendOtpEmail } from '@/lib/mailer';

export async function POST(req: Request) {
  const session = await auth();
  const userId = (session?.user as { id?: string } | undefined)?.id;
  if (!userId) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });

  const { newEmail } = await req.json();
  if (!newEmail || !/^\S+@\S+\.\S+$/.test(newEmail)) {
    return NextResponse.json({ error: 'Enter a valid email address' }, { status: 400 });
  }

  await dbConnect();
  const existing = await User.findOne({ email: newEmail });
  if (existing) {
    return NextResponse.json({ error: 'This email is already in use' }, { status: 400 });
  }

  const code = Math.floor(100000 + Math.random() * 900000).toString();
  const codeHash = await bcrypt.hash(code, 10);
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

  await EmailChangeOtp.findOneAndUpdate(
    { userId },
    { userId, newEmail, codeHash, expiresAt },
    { upsert: true, new: true }
  );

  await sendOtpEmail(newEmail, code);

  return NextResponse.json({ success: true, message: 'Verification code sent to your new email' });
}