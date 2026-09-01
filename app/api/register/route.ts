import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import User from '@/models/User';
import bcrypt from 'bcryptjs';

export async function POST(req: Request) {
  try {
    await dbConnect();

    const body = await req.json();
    const { name, email, password, role, address, phone } = body;

    if (!name || !email || !password || !role) {
      return NextResponse.json(
        { error: 'Missing required fields: name, email, password, or role' },
        { status: 400 }
      );
    }

    const PUBLIC_SIGNUP_ROLES = ['donor', 'volunteer', 'shelter'];

    if (!PUBLIC_SIGNUP_ROLES.includes(role)) {
      return NextResponse.json(
        { error: 'Invalid role selected.' },
        { status: 400 }
      );
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return NextResponse.json(
        { error: 'User with this email already exists' },
        { status: 400 }
      );
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = await User.create({
      name,
      email,
      password: hashedPassword,
      role,
      address: address || '',
      phone: phone || '',
    });

    return NextResponse.json(
      { message: 'User registered successfully!', userId: newUser._id },
      { status: 201 }
    );
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Internal Server Error' },
      { status: 500 }
    );
  }
}