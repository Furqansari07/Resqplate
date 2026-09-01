import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import dbConnect from '@/lib/mongodb';
import User from '@/models/User';
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
        { error: 'Only admins can view platform stats.' },
        { status: 403 }
      );
    }

    await dbConnect();

    const [
      totalUsers,
      donorCount,
      volunteerCount,
      shelterCount,
      adminCount,
      totalDonations,
      availableCount,
      claimedCount,
      inTransitCount,
      deliveredCount,
      receivedCount,
      cancelledCount,
      expiredCount,
    ] = await Promise.all([
      User.countDocuments({}),
      User.countDocuments({ role: 'donor' }),
      User.countDocuments({ role: 'volunteer' }),
      User.countDocuments({ role: 'shelter' }),
      User.countDocuments({ role: 'admin' }),
      DonationListing.countDocuments({}),
      DonationListing.countDocuments({ status: 'available' }),
      DonationListing.countDocuments({ status: 'claimed' }),
      DonationListing.countDocuments({ status: 'in-transit' }),
      DonationListing.countDocuments({ status: 'delivered' }),
      DonationListing.countDocuments({ status: 'received' }),
      DonationListing.countDocuments({ status: 'cancelled' }),
      DonationListing.countDocuments({ status: 'expired' }),
    ]);

    return NextResponse.json({
      users: {
        total: totalUsers,
        donor: donorCount,
        volunteer: volunteerCount,
        shelter: shelterCount,
        admin: adminCount,
      },
      donations: {
        total: totalDonations,
        available: availableCount,
        claimed: claimedCount,
        inTransit: inTransitCount,
        delivered: deliveredCount,
        received: receivedCount,
        cancelled: cancelledCount,
        expired: expiredCount,
      },
    });
  } catch (error) {
    console.error('Admin stats error:', error);

    return NextResponse.json(
      { error: 'Unable to load platform stats.' },
      { status: 500 }
    );
  }
}