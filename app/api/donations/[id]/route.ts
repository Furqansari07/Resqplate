import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import dbConnect from '@/lib/mongodb';
import DonationListing from '@/models/DonationListing';
import mongoose from 'mongoose';

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

    if (!user?.id || user.role !== 'donor') {
      return NextResponse.json(
        { error: 'Only donors can edit their listings.' },
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

    const donation = await DonationListing.findOneAndUpdate(
      {
        _id: id,
        donorId: new mongoose.Types.ObjectId(user.id),
        status: 'available',
        pickupBy: { $gt: new Date() },
      },
      {
        $set: {
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
        },
      },
      {
        new: true,
        runValidators: true,
      }
    );

    if (!donation) {
      return NextResponse.json(
        {
          error:
            'Only your available listings with a future pickup deadline can be edited.',
        },
        { status: 409 }
      );
    }

    return NextResponse.json({
      message: 'Donation listing updated successfully.',
      donation,
    });
  } catch (error) {
    console.error('Update donation error:', error);

    return NextResponse.json(
      { error: 'Unable to update the donation listing.' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    const user = session?.user as SessionUser | undefined;

    if (!user?.id || user.role !== 'donor') {
      return NextResponse.json(
        { error: 'Only donors can cancel their listings.' },
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
        donorId: new mongoose.Types.ObjectId(user.id),
        status: 'available',
        pickupBy: { $gt: new Date() },
      },
      {
        $set: {
          status: 'cancelled',
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
            'Only your available listings with a future pickup deadline can be cancelled.',
        },
        { status: 409 }
      );
    }

    return NextResponse.json({
      message: 'Donation listing cancelled successfully.',
      donation,
    });
  } catch (error) {
    console.error('Cancel donation error:', error);

    return NextResponse.json(
      { error: 'Unable to cancel the donation listing.' },
      { status: 500 }
    );
  }
}