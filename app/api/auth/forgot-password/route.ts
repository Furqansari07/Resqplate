import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import dbConnect from '@/lib/mongodb';
import User from '@/models/User';
import PasswordResetOtp from '@/models/PasswordResetOtp';
import { sendOtpEmail } from '@/lib/mailer';

export async function POST(req: Request) {
  try {
    const { email } = await req.json();
    if (!email) return NextResponse.json({ error: 'Email is required' }, { status: 400 });

    await dbConnect();
    const user = await User.findOne({ email });

    // Always return success even if the email isn't registered — this
    // prevents attackers from discovering which emails have accounts.
    if (user) {
      const code = Math.floor(100000 + Math.random() * 900000).toString();
      const codeHash = await bcrypt.hash(code, 10);
      const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

      await PasswordResetOtp.findOneAndUpdate(
        { email },
        { email, codeHash, expiresAt },
        { upsert: true, new: true }
      );

      await sendOtpEmail(email, code);
    }

    return NextResponse.json({
      success: true,
      message: 'If an account exists for this email, a reset code has been sent.',
    });
  } catch (error) {
    console.error('forgot-password error:', error);
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 });
  }
}