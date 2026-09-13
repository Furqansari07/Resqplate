import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import dbConnect from '@/lib/mongodb';
import User from '@/models/User';
import PendingRegistration from '@/models/PendingRegistration';

export async function POST(req: Request) {
  try {
    const { email, otp } = await req.json();

    if (!email || !otp) {
      return NextResponse.json({ error: 'Email and code are required' }, { status: 400 });
    }

    await dbConnect();
    const pending = await PendingRegistration.findOne({ email });

    if (!pending || pending.expiresAt < new Date()) {
      return NextResponse.json({ error: 'Code expired, please register again' }, { status: 400 });
    }

    const valid = await bcrypt.compare(otp, pending.codeHash);
    if (!valid) {
      return NextResponse.json({ error: 'Invalid verification code' }, { status: 400 });
    }

    const existingUser = await User.findOne({ $or: [{ email }, { phone: pending.phone }] });
    if (existingUser) {
      await PendingRegistration.deleteOne({ _id: pending._id });
      return NextResponse.json(
        { error: 'An account with this email or phone number already exists' },
        { status: 400 }
      );
    }

    const fullName = [pending.firstName, pending.middleName, pending.lastName]
      .filter(Boolean)
      .join(' ');

    await User.create({
      name: fullName,
      firstName: pending.firstName,
      middleName: pending.middleName,
      lastName: pending.lastName,
      email: pending.email,
      emailVerified: true,
      phone: pending.phone,
      password: pending.passwordHash,
      role: pending.role,
      provider: 'credentials',
    });

    await PendingRegistration.deleteOne({ _id: pending._id });

    return NextResponse.json({ success: true, message: 'Account created' });
  } catch (error: any) {
    console.error('register/verify error:', error);
    return NextResponse.json({ error: error?.message || 'Internal server error' }, { status: 500 });
  }
}