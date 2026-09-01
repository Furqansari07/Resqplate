import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import dbConnect from '@/lib/mongodb';
import DonationListing from '@/models/DonationListing';
import Rating from '@/models/Rating';
import mongoose from 'mongoose';

type SessionUser = {
  id?: string;
  role?: string;
};

export async function DELETE(
  _request: Request,
  context: { params: Promise<{ id: string }> }
) {
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
        { error: 'Only admins can remove listings.' },
        { status: 403 }
      );
    }

    const { id } = await context.params;

    if (!mongoose.isValidObjectId(id)) {
      return NextResponse.json(
        { error: 'Invalid donation ID.' },
        { status: 400 }
      );
    }

    await dbConnect();

    const donation = await DonationListing.findByIdAndDelete(id);

    if (!donation) {
      return NextResponse.json(
        { error: 'Listing not found.' },
        { status: 404 }
      );
    }

    await Rating.deleteMany({ donationId: id });

    return NextResponse.json({
      message: 'Listing removed successfully.',
    });
  } catch (error) {
    console.error('Admin delete donation error:', error);

    return NextResponse.json(
      { error: 'Unable to remove this listing.' },
      { status: 500 }
    );
  }
}