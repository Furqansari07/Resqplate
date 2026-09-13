import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import dbConnect from '@/lib/mongodb';
import User from '@/models/User';
import PendingRegistration from '@/models/PendingRegistration';
import { sendOtpEmail } from '@/lib/mailer';

const PUBLIC_SIGNUP_ROLES = ['donor', 'volunteer', 'shelter'];
const NAME_REGEX = /^[A-Za-z\s'-]+$/;

export async function POST(req: Request) {
  try {
    const { firstName, middleName, lastName, email, phone, password, role } = await req.json();

    if (!firstName || !lastName || !email || !phone || !password || !role) {
      return NextResponse.json(
        { error: 'First name, last name, email, phone, password, and role are all required' },
        { status: 400 }
      );
    }

    if (!NAME_REGEX.test(firstName) || (middleName && !NAME_REGEX.test(middleName)) || !NAME_REGEX.test(lastName)) {
      return NextResponse.json(
        { error: 'Name fields can only contain letters' },
        { status: 400 }
      );
    }

    if (!PUBLIC_SIGNUP_ROLES.includes(role)) {
      return NextResponse.json({ error: 'Invalid role selected' }, { status: 400 });
    }

    if (password.length < 8) {
      return NextResponse.json(
        { error: 'Password must be at least 8 characters' },
        { status: 400 }
      );
    }

    await dbConnect();

    const existingUser = await User.findOne({ $or: [{ email }, { phone }] });
    if (existingUser) {
      return NextResponse.json(
        { error: 'An account with this email or phone number already exists' },
        { status: 400 }
      );
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const codeHash = await bcrypt.hash(code, 10);
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000);

    await PendingRegistration.findOneAndUpdate(
      { email },
      { email, firstName, middleName, lastName, phone, passwordHash, role, codeHash, expiresAt },
      { upsert: true, new: true }
    );

    await sendOtpEmail(email, code);

    return NextResponse.json({ success: true, message: 'Verification code sent to your email' });
  } catch (error: any) {
    console.error('register/start error:', error);
    return NextResponse.json({ error: error?.message || 'Internal server error' }, { status: 500 });
  }
}