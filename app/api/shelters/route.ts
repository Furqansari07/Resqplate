import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import dbConnect from '@/lib/mongodb';
import User from '@/models/User';
import { getShelterCapacityInfo } from '@/lib/shelterCapacity';

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
        { error: 'Only volunteers can view shelters.' },
        { status: 403 }
      );
    }

    await dbConnect();

    const shelters = await User.find({ role: 'shelter' })
      .select('name address phone shelterCapacity shelterCapacityUnit')
      .sort({ name: 1 })
      .lean();

    const sheltersWithCapacity = await Promise.all(
      shelters.map(async (shelter) => {
        const capacityInfo = await getShelterCapacityInfo(
          shelter._id.toString(),
          shelter.shelterCapacity,
          shelter.shelterCapacityUnit
        );

        return { ...shelter, ...capacityInfo };
      })
    );

    return NextResponse.json({ shelters: sheltersWithCapacity });
  } catch (error) {
    console.error('Load shelters error:', error);

    return NextResponse.json(
      { error: 'Unable to load shelters.' },
      { status: 500 }
    );
  }
}