import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import dbConnect from '@/lib/mongodb';
import DonationListing from '@/models/DonationListing';
import User from '@/models/User';
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

    if (!user?.id) {
      return NextResponse.json(
        { error: 'You must sign in first.' },
        { status: 401 }
      );
    }

    if (user.role !== 'shelter') {
      return NextResponse.json(
        { error: 'Only shelters can view incoming donations.' },
        { status: 403 }
      );
    }

    await dbConnect();

    const [donations, shelter] = await Promise.all([
      DonationListing.find({
        targetShelterId: new mongoose.Types.ObjectId(user.id),
      })
        .populate('donorId', 'name address phone latitude longitude')
        .populate('volunteerId', 'name phone')
        .sort({ createdAt: -1 })
        .lean(),
      User.findById(user.id).select('latitude longitude').lean(),
    ]);

    const shelterHasLocation = hasCoordinates(
      shelter as { latitude?: number; longitude?: number } | null
    );

    const donationsWithDistance = donations.map((donation) => {
      const donor = donation.donorId as
        | { latitude?: number; longitude?: number }
        | undefined;

      const distanceKm =
        shelterHasLocation && hasCoordinates(donor)
          ? getDistanceKm(
              (shelter as { latitude: number; longitude: number })
                .latitude,
              (shelter as { latitude: number; longitude: number })
                .longitude,
              donor.latitude,
              donor.longitude
            )
          : null;

      return { ...donation, distanceKm };
    });

    return NextResponse.json({ donations: donationsWithDistance });
  } catch (error) {
    console.error('Shelter donations error:', error);

    return NextResponse.json(
      { error: 'Unable to load incoming donations.' },
      { status: 500 }
    );
  }
}