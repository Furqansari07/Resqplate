import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import dbConnect from '@/lib/mongodb';
import DonationListing from '@/models/DonationListing';
import mongoose from 'mongoose';
import Notification from '@/models/Notification';
type SessionUser = {
  id?: string;
  role?: string;
};

type DonationStatus = 'in-transit' | 'delivered';

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    const user = session?.user as SessionUser | undefined;

    if (!user?.id || user.role !== 'volunteer') {
      return NextResponse.json(
        { error: 'Only volunteers can update pickup status.' },
        { status: 403 }
      );
    }

    const { id } = await context.params;
    const { status } = (await request.json()) as {
      status?: DonationStatus;
    };

    if (!mongoose.isValidObjectId(id)) {
      return NextResponse.json(
        { error: 'Invalid donation ID.' },
        { status: 400 }
      );
    }

    if (status !== 'in-transit' && status !== 'delivered') {
      return NextResponse.json(
        { error: 'Invalid delivery status.' },
        { status: 400 }
      );
    }

    const requiredCurrentStatus =
      status === 'in-transit' ? 'claimed' : 'in-transit';

    const timestampUpdate =
      status === 'in-transit'
        ? { inTransitAt: new Date() }
        : { deliveredAt: new Date() };

    await dbConnect();

    const donation = await DonationListing.findOneAndUpdate(
      {
        _id: id,
        volunteerId: new mongoose.Types.ObjectId(user.id),
        status: requiredCurrentStatus,
      },
      {
        $set: {
          status,
          ...timestampUpdate,
        },
      },
      {
        new: true,
      }
    );

    if (!donation) {
      return NextResponse.json(
        { error: 'This status change is not allowed.' },
        { status: 409 }
      );
    }
    if (status === 'delivered' && donation.targetShelterId) {
  await Notification.create({
    userId: donation.targetShelterId,
    type: 'donation_delivered',
    title: 'Food Delivered',
    message:
      'A food donation has been delivered to your shelter. Please confirm receipt.',
    donationId: donation._id,
    read: false,
  });
}

    return NextResponse.json({
      message: `Pickup marked as ${status}.`,
      donation,
    });
  } catch (error) {
    console.error('Update pickup status error:', error);

    return NextResponse.json(
      { error: 'Unable to update pickup status.' },
      { status: 500 }
    );
  }
}