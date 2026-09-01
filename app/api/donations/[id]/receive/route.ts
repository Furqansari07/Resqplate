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

export async function PATCH(
  _request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    const user = session?.user as SessionUser | undefined;

    if (!user?.id || user.role !== 'shelter') {
      return NextResponse.json(
        { error: 'Only shelters can confirm food receipt.' },
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

    const donation = await DonationListing.findOneAndUpdate(
      {
        _id: id,
        targetShelterId: new mongoose.Types.ObjectId(user.id),
        status: 'delivered',
      },
      {
        $set: {
          status: 'received',
          receivedAt: new Date(),
        },
      },
      {
        new: true,
      }
    );

    if (!donation) {
      return NextResponse.json(
        {
          error:
            'Only a delivered donation assigned to your shelter can be confirmed as received.',
        },
        { status: 409 }
      );
    }
    if (donation.volunteerId) {
  await Notification.create({
    userId: donation.volunteerId,
    type: 'donation_received',
    title: 'Delivery Confirmed',
    message:
      'The shelter has confirmed that your food delivery was received.',
    donationId: donation._id,
    read: false,
  });
}

    return NextResponse.json({
      message: 'Food receipt confirmed successfully.',
      donation,
    });
  } catch (error) {
    console.error('Confirm food receipt error:', error);

    return NextResponse.json(
      { error: 'Unable to confirm food receipt.' },
      { status: 500 }
    );
  }
}