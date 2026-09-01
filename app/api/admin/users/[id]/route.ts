import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import dbConnect from '@/lib/mongodb';
import User from '@/models/User';
import DonationListing from '@/models/DonationListing';
import mongoose from 'mongoose';

type SessionUser = {
  id?: string;
  role?: string;
};

const DONOR_ACTIVE_STATUSES = ['available', 'claimed', 'in-transit', 'delivered'];
const PARTY_ACTIVE_STATUSES = ['claimed', 'in-transit', 'delivered'];

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
        { error: 'Only admins can remove users.' },
        { status: 403 }
      );
    }

    const { id } = await context.params;

    if (!mongoose.isValidObjectId(id)) {
      return NextResponse.json(
        { error: 'Invalid user ID.' },
        { status: 400 }
      );
    }

    if (id === user.id) {
      return NextResponse.json(
        { error: 'You cannot remove your own admin account.' },
        { status: 400 }
      );
    }

    await dbConnect();

    const targetUser = await User.findById(id);

    if (!targetUser) {
      return NextResponse.json(
        { error: 'User not found.' },
        { status: 404 }
      );
    }

    const hasActiveDonations = await DonationListing.exists({
      $or: [
        { donorId: id, status: { $in: DONOR_ACTIVE_STATUSES } },
        { volunteerId: id, status: { $in: PARTY_ACTIVE_STATUSES } },
        { targetShelterId: id, status: { $in: PARTY_ACTIVE_STATUSES } },
      ],
    });

    if (hasActiveDonations) {
      return NextResponse.json(
        {
          error:
            'This user has active donations, pickups, or deliveries in progress. Those must be cancelled or completed before removing the account.',
        },
        { status: 409 }
      );
    }

    await User.findByIdAndDelete(id);

    return NextResponse.json({
      message: 'User removed successfully.',
    });
  } catch (error) {
    console.error('Admin delete user error:', error);

    return NextResponse.json(
      { error: 'Unable to remove this user.' },
      { status: 500 }
    );
  }
}