import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import dbConnect from '@/lib/mongodb';
import DonationListing from '@/models/DonationListing';
import User from '@/models/User';
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

    if (user.role !== 'volunteer') {
      return NextResponse.json(
        { error: 'Only volunteers can view available donations.' },
        { status: 403 }
      );
    }

    await dbConnect();

    await DonationListing.updateMany(
      {
        status: 'available',
        pickupBy: { $lte: new Date() },
      },
      {
        $set: { status: 'expired' },
      }
    );

    const [donations, volunteer] = await Promise.all([
      DonationListing.find({
        status: 'available',
        pickupBy: {
          $gt: new Date(),
        },
      })
        .populate('donorId', 'name latitude longitude')
        .sort({ createdAt: -1 })
        .lean(),
      User.findById(user.id).select('latitude longitude').lean(),
    ]);

    const volunteerHasLocation = hasCoordinates(
      volunteer as { latitude?: number; longitude?: number } | null
    );

    const donationsWithDistance = donations.map((donation) => {
      const donor = donation.donorId as
        | { latitude?: number; longitude?: number }
        | undefined;

      const distanceKm =
        volunteerHasLocation && hasCoordinates(donor)
          ? getDistanceKm(
              (volunteer as { latitude: number; longitude: number })
                .latitude,
              (volunteer as { latitude: number; longitude: number })
                .longitude,
              donor.latitude,
              donor.longitude
            )
          : null;

      return { ...donation, distanceKm };
    });

    return NextResponse.json({
      donations: donationsWithDistance,
      volunteerHasLocation,
    });
  } catch (error) {
    console.error('Available donations error:', error);

    return NextResponse.json(
      { error: 'Unable to load available donations.' },
      { status: 500 }
    );
  }
}