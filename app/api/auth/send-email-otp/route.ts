import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import dbConnect from '@/lib/mongodb';
import EmailOtp from '@/models/EmailOtp';
import { sendOtpEmail } from '@/lib/mailer';

export async function POST(req: Request) {
  try {
    const { email } = await req.json();

    if (!email || !/^\S+@\S+\.\S+$/.test(email)) {
      return NextResponse.json({ message: 'Enter a valid email address' }, { status: 400 });
    }

    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const codeHash = await bcrypt.hash(code, 10);
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000);

    await dbConnect();
    await EmailOtp.findOneAndUpdate(
      { email },
      { email, codeHash, expiresAt },
      { upsert: true, new: true }
    );

    await sendOtpEmail(email, code);

    return NextResponse.json({ success: true, message: 'OTP sent successfully' });
  } catch (error: any) {
    console.error('send-email-otp error:', error);
    return NextResponse.json(
      { message: error?.message || 'Could not send OTP. Please try again.' },
      { status: 500 }
    );
  }
}