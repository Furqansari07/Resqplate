import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import dbConnect from '@/lib/mongodb';
import DonationListing from '@/models/DonationListing';
import User from '@/models/User';
import mongoose from 'mongoose';
import Notification from '@/models/Notification';
import { getShelterCapacityInfo } from '@/lib/shelterCapacity';

type SessionUser = {
  id?: string;
  role?: string;
};

export async function PATCH(
  request: Request,
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

    if (user.role !== 'volunteer') {
      return NextResponse.json(
        { error: 'Only volunteers can claim donations.' },
        { status: 403 }
      );
    }

    const { id } = await context.params;
    const { shelterId } = await request.json();

    if (!mongoose.isValidObjectId(id)) {
      return NextResponse.json(
        { error: 'Invalid donation ID.' },
        { status: 400 }
      );
    }

    if (!mongoose.isValidObjectId(shelterId)) {
      return NextResponse.json(
        { error: 'Please select a valid shelter.' },
        { status: 400 }
      );
    }

    await dbConnect();

    const shelter = await User.findOne({
      _id: shelterId,
      role: 'shelter',
    })
      .select('shelterCapacity shelterCapacityUnit')
      .lean();

    if (!shelter) {
      return NextResponse.json(
        { error: 'The selected shelter does not exist.' },
        { status: 404 }
      );
    }

    const donationToClaim = await DonationListing.findOne({
      _id: id,
      status: 'available',
      pickupBy: { $gt: new Date() },
    }).select('quantityAmount quantityUnit');

    if (!donationToClaim) {
      return NextResponse.json(
        {
          error:
            'This donation is no longer available or its pickup deadline has passed.',
        },
        { status: 409 }
      );
    }

    if (donationToClaim.quantityAmount && donationToClaim.quantityUnit) {
      const capacityInfo = await getShelterCapacityInfo(
        shelterId,
        shelter.shelterCapacity,
        shelter.shelterCapacityUnit
      );

      if (
        capacityInfo.capacity !== null &&
        capacityInfo.capacityUnit === donationToClaim.quantityUnit &&
        capacityInfo.currentLoad + donationToClaim.quantityAmount >
          capacityInfo.capacity
      ) {
        return NextResponse.json(
          {
            error: `This shelter only has room for ${
              capacityInfo.capacity - capacityInfo.currentLoad
            } more ${capacityInfo.capacityUnit} — this donation (${
              donationToClaim.quantityAmount
            } ${donationToClaim.quantityUnit}) would exceed their capacity. Please choose another shelter.`,
          },
          { status: 409 }
        );
      }
    }

    const donation = await DonationListing.findOneAndUpdate(
      {
        _id: id,
        status: 'available',
        pickupBy: { $gt: new Date() },
      },
      {
        $set: {
          status: 'claimed',
          volunteerId: new mongoose.Types.ObjectId(user.id),
          targetShelterId: new mongoose.Types.ObjectId(shelterId),
          claimedAt: new Date(),
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
            'This donation is no longer available or its pickup deadline has passed.',
        },
        { status: 409 }
      );
    }
    await Notification.create({
  userId: donation.donorId,
  type: 'donation_claimed',
  title: 'Donation Claimed',
  message: 'Your food donation has been claimed by a volunteer.',
  donationId: donation._id,
  read: false,
});

    return NextResponse.json({
      message: 'Pickup accepted and shelter selected successfully.',
      donation,
    });
  } catch (error) {
    console.error('Claim donation error:', error);

    return NextResponse.json(
      { error: 'Unable to claim this donation.' },
      { status: 500 }
    );
  }
}