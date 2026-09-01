import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import dbConnect from '@/lib/mongodb';
import DonationListing from '@/models/DonationListing';
import mongoose from 'mongoose';
import { getDistanceKm, hasCoordinates } from '@/lib/geo';

type SessionUser = {
  id?: string;
  role?: string;
};

export async function GET() {
  try {
    const session = await auth();
    const user = session?.user as SessionUser | undefined;

    if (!user?.id || user.role !== 'volunteer') {
      return NextResponse.json(
        { error: 'Only volunteers can view their pickups.' },
        { status: 403 }
      );
    }

    await dbConnect();

    const donations = await DonationListing.find({
      volunteerId: new mongoose.Types.ObjectId(user.id),
    })
      .populate('donorId', 'name address phone latitude longitude')
      .populate('targetShelterId', 'name address phone latitude longitude')
      .sort({ createdAt: -1 })
      .lean();

    const donationsWithDistance = donations.map((donation) => {
      const donor = donation.donorId as
        | { latitude?: number; longitude?: number }
        | undefined;

      const shelter = donation.targetShelterId as
        | { latitude?: number; longitude?: number }
        | undefined;

      const distanceKm =
        hasCoordinates(donor) && hasCoordinates(shelter)
          ? getDistanceKm(
              donor.latitude,
              donor.longitude,
              shelter.latitude,
              shelter.longitude
            )
          : null;

      return { ...donation, distanceKm };
    });

    return NextResponse.json({ donations: donationsWithDistance });
  } catch (error) {
    console.error('Volunteer pickups error:', error);

    return NextResponse.json(
      { error: 'Unable to load your pickups.' },
      { status: 500 }
    );
  }
}