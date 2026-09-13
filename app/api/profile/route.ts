import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import dbConnect from '@/lib/mongodb';
import User from '@/models/User';

export async function GET() {
  const session = await auth();
  const userId = (session?.user as { id?: string } | undefined)?.id;

  if (!userId) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  await dbConnect();
  const user = await User.findById(userId).lean();

  if (!user) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 });
  }

  return NextResponse.json({ user });
}

const ALLOWED_FIELDS = [
  'name',
  'phone',
  'address',
  'streetAddress',
  'city',
  'state',
  'country',
  'pincode',
  'organizationName',
  'latitude',
  'longitude',
  'shelterCapacity',
  'shelterCapacityUnit',
  'vehicleType',
  'profilePhotoUrl',
];

export async function PATCH(req: Request) {
  const session = await auth();
  const userId = (session?.user as { id?: string } | undefined)?.id;

  if (!userId) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  const body = await req.json();
  const update: Record<string, any> = {};

  for (const field of ALLOWED_FIELDS) {
    if (body[field] !== undefined) {
      update[field] = body[field];
    }
  }

  await dbConnect();
  const user = await User.findByIdAndUpdate(userId, update, { new: true }).lean();

  return NextResponse.json({ success: true, user });
}