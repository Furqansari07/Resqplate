import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import dbConnect from '@/lib/mongodb';
import DonationListing from '@/models/DonationListing';
import mongoose from 'mongoose';

type SessionUser = {
  id?: string;
  role?: string;
};

function formatCsvValue(value: unknown) {
  if (value === null || value === undefined) {
    return '""';
  }

  const text = String(value).replace(/"/g, '""');

  return `"${text}"`;
}

function formatDate(value?: Date | string | null) {
  if (!value) {
    return '';
  }

  return new Date(value).toLocaleString();
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
        { error: 'Only donors can export their donation reports.' },
        { status: 403 }
      );
    }

    await dbConnect();

    const donations = await DonationListing.find({
      donorId: new mongoose.Types.ObjectId(user.id),
    })
      .sort({ createdAt: -1 })
      .lean();

    const headers = [
      'Title',
      'Quantity',
      'Category',
      'Description',
      'Pickup Deadline',
      'Handling Instructions',
      'Status',
      'Created At',
      'Claimed At',
      'In Transit At',
      'Delivered At',
      'Received At',
    ];

    const rows = donations.map((donation) => [
      donation.title,
      donation.quantity,
      donation.category,
      donation.description || '',
      formatDate(donation.pickupBy),
      donation.specialInstructions || '',
      donation.status,
      formatDate(donation.createdAt),
      formatDate(donation.claimedAt),
      formatDate(donation.inTransitAt),
      formatDate(donation.deliveredAt),
      formatDate(donation.receivedAt),
    ]);

    const csv = [
      headers.map(formatCsvValue).join(','),
      ...rows.map((row) => row.map(formatCsvValue).join(',')),
    ].join('\n');

    return new NextResponse(csv, {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition':
          'attachment; filename="resqplate-donation-report.csv"',
      },
    });
  } catch (error) {
    console.error('Export donations error:', error);

    return NextResponse.json(
      { error: 'Unable to export the donation report.' },
      { status: 500 }
    );
  }
}