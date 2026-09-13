import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import dbConnect from '@/lib/mongodb';
import User from '@/models/User';
import PasswordResetOtp from '@/models/PasswordResetOtp';
import { validatePassword } from '@/lib/validators';

export async function POST(req: Request) {
  try {
    const { email, otp, newPassword } = await req.json();

    if (!email || !otp || !newPassword) {
      return NextResponse.json({ error: 'Email, code, and new password are required' }, { status: 400 });
    }

    const passwordCheck = validatePassword(newPassword);
    if (!passwordCheck.valid) {
      return NextResponse.json({ error: passwordCheck.message }, { status: 400 });
    }

    await dbConnect();
    const record = await PasswordResetOtp.findOne({ email });

    if (!record || record.expiresAt < new Date()) {
      return NextResponse.json({ error: 'Code expired, please request a new one' }, { status: 400 });
    }

    const validCode = await bcrypt.compare(otp, record.codeHash);
    if (!validCode) {
      return NextResponse.json({ error: 'Invalid code' }, { status: 400 });
    }

    const passwordHash = await bcrypt.hash(newPassword, 10);
    await User.findOneAndUpdate({ email }, { password: passwordHash });
    await PasswordResetOtp.deleteOne({ _id: record._id });

    return NextResponse.json({ success: true, message: 'Password reset successfully' });
  } catch (error) {
    console.error('reset-password error:', error);
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 });
  }
}