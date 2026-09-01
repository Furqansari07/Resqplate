import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import dbConnect from '@/lib/mongodb';
import DonationListing from '@/models/DonationListing';

type SessionUser = {
  id?: string;
  role?: string;
};

export async function GET() {
  try {
    const session = await auth();
    const user = session?.user as SessionUser | undefined;

    if (!user?.id) {
      return NextResponse.json(
        { error: 'You must sign in first.' },
        { status: 401 }
      );
    }

    if (user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Only admins can view all listings.' },
        { status: 403 }
      );
    }

    await dbConnect();

    const donations = await DonationListing.find({})
      .populate('donorId', 'name email')
      .populate('volunteerId', 'name email')
      .populate('targetShelterId', 'name email')
      .sort({ createdAt: -1 })
      .lean();

    return NextResponse.json({ donations });
  } catch (error) {
    console.error('Admin list donations error:', error);

    return NextResponse.json(
      { error: 'Unable to load listings.' },
      { status: 500 }
    );
  }
}