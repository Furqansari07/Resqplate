import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import dbConnect from '@/lib/mongodb';
import DonationListing from '@/models/DonationListing';
import mongoose from 'mongoose';

type SessionUser = {
  id?: string;
  role?: string;
};

export async function POST(request: Request) {
  try {
    const session = await auth();
    const user = session?.user as SessionUser | undefined;

    if (!user?.id) {
      return NextResponse.json(
        { error: 'You must sign in first.' },
        { status: 401 }
      );
    }

    if (user.role !== 'donor') {
      return NextResponse.json(
        { error: 'Only food donors can create donation listings.' },
        { status: 403 }
      );
    }

    const body = await request.json();

    const title = body.title?.trim();
    const quantity = body.quantity?.trim();
    const category = body.category?.trim();
    const description = body.description?.trim() || '';
    const specialInstructions = body.specialInstructions?.trim() || '';
    const photoUrl = typeof body.photoUrl === 'string' ? body.photoUrl.trim() : '';
    const photoPublicId =
      typeof body.photoPublicId === 'string' ? body.photoPublicId.trim() : '';
    const quantityAmount =
      typeof body.quantityAmount === 'number' && !Number.isNaN(body.quantityAmount)
        ? body.quantityAmount
        : null;
    const quantityUnit =
      body.quantityUnit === 'meals' || body.quantityUnit === 'kg'
        ? body.quantityUnit
        : null;
    const pickupBy = new Date(body.pickupBy);

    if (!title || !quantity || !category || !body.pickupBy) {
      return NextResponse.json(
        {
          error:
            'Title, quantity, category, and pickup deadline are required.',
        },
        { status: 400 }
      );
    }

    if (
      Number.isNaN(pickupBy.getTime()) ||
      pickupBy.getTime() <= Date.now()
    ) {
      return NextResponse.json(
        { error: 'Pickup deadline must be a future date and time.' },
        { status: 400 }
      );
    }

    await dbConnect();

    const donation = await DonationListing.create({
      donorId: new mongoose.Types.ObjectId(user.id),
      title,
      quantity,
      category,
      description,
      photoUrl,
      photoPublicId,
      quantityAmount,
      quantityUnit,
      pickupBy,
      specialInstructions,
      status: 'available',
    });

    return NextResponse.json(
      {
        message: 'Donation listing created successfully.',
        donation,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Create donation error:', error);

    return NextResponse.json(
      { error: 'Unable to create the donation listing.' },
      { status: 500 }
    );
  }
}

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

    if (user.role !== 'donor') {
      return NextResponse.json(
        { error: 'Only food donors can view their donation listings.' },
        { status: 403 }
      );
    }

    await dbConnect();

    const donorId = new mongoose.Types.ObjectId(user.id);

    await DonationListing.updateMany(
      {
        donorId,
        status: 'available',
        pickupBy: { $lte: new Date() },
      },
      {
        $set: { status: 'expired' },
      }
    );

    const donations = await DonationListing.find({
      donorId,
    })
      .sort({ createdAt: -1 })
      .lean();

    return NextResponse.json({ donations });
  } catch (error) {
    console.error('Get donations error:', error);

    return NextResponse.json(
      { error: 'Unable to load donation listings.' },
      { status: 500 }
    );
  }
}