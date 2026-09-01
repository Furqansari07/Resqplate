import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import dbConnect from '@/lib/mongodb';
import DonationListing from '@/models/DonationListing';
import Rating, { RaterRole, RatingCategory } from '@/models/Rating';
import mongoose from 'mongoose';

type SessionUser = {
  id?: string;
  role?: RaterRole;
};

const CATEGORY_BY_ROLE: Record<RaterRole, RatingCategory> = {
  shelter: 'food_condition',
  donor: 'pickup_coordination',
  volunteer: 'pickup_delivery_experience',
};

function getPartyIdForRole(
  donation: {
    donorId?: mongoose.Types.ObjectId | null;
    volunteerId?: mongoose.Types.ObjectId | null;
    targetShelterId?: mongoose.Types.ObjectId | null;
  },
  role: RaterRole
) {
  if (role === 'donor') {
    return donation.donorId?.toString();
  }

  if (role === 'volunteer') {
    return donation.volunteerId?.toString();
  }

  return donation.targetShelterId?.toString();
}

async function getAuthorizedDonation(
  donationId: string,
  userId: string,
  role?: RaterRole
) {
  if (!mongoose.isValidObjectId(donationId)) {
    return { error: 'Invalid donation ID.', status: 400 } as const;
  }

  await dbConnect();

  const donation = await DonationListing.findById(donationId);

  if (!donation) {
    return { error: 'Donation not found.', status: 404 } as const;
  }

  if (!role || !CATEGORY_BY_ROLE[role]) {
    return { error: 'Unrecognized account role.', status: 403 } as const;
  }

  const partyId = getPartyIdForRole(donation, role);

  if (!partyId || partyId !== userId) {
    return {
      error: 'You are not a participant in this donation.',
      status: 403,
    } as const;
  }

  return { donation } as const;
}

export async function POST(
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

    const { id } = await context.params;

    const authResult = await getAuthorizedDonation(id, user.id, user.role);

    if ('error' in authResult) {
      return NextResponse.json(
        { error: authResult.error },
        { status: authResult.status }
      );
    }

    const { donation } = authResult;

    if (donation.status !== 'received') {
      return NextResponse.json(
        {
          error:
            'You can only leave a rating after the shelter has confirmed receipt.',
        },
        { status: 409 }
      );
    }

    const body = await request.json();
    const score = Number(body.score);
    const comment =
      typeof body.comment === 'string' ? body.comment.trim().slice(0, 500) : '';

    if (!Number.isInteger(score) || score < 1 || score > 5) {
      return NextResponse.json(
        { error: 'Score must be a whole number from 1 to 5.' },
        { status: 400 }
      );
    }

    const role = user.role as RaterRole;

    const existingRating = await Rating.findOne({
      donationId: donation._id,
      raterRole: role,
    });

    if (existingRating) {
      return NextResponse.json(
        { error: 'You have already rated this delivery.' },
        { status: 409 }
      );
    }

    const rating = await Rating.create({
      donationId: donation._id,
      raterId: new mongoose.Types.ObjectId(user.id),
      raterRole: role,
      category: CATEGORY_BY_ROLE[role],
      score,
      comment,
    });

    return NextResponse.json(
      { message: 'Rating submitted successfully.', rating },
      { status: 201 }
    );
  } catch (error) {
    console.error('Submit rating error:', error);

    return NextResponse.json(
      { error: 'Unable to submit the rating.' },
      { status: 500 }
    );
  }
}

export async function GET(
  _request: Request,
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

    const { id } = await context.params;

    const authResult = await getAuthorizedDonation(id, user.id, user.role);

    if ('error' in authResult) {
      return NextResponse.json(
        { error: authResult.error },
        { status: authResult.status }
      );
    }

    const ratings = await Rating.find({ donationId: id })
      .populate('raterId', 'name')
      .sort({ createdAt: 1 })
      .lean();

    return NextResponse.json({ ratings });
  } catch (error) {
    console.error('Get ratings error:', error);

    return NextResponse.json(
      { error: 'Unable to load ratings.' },
      { status: 500 }
    );
  }
}