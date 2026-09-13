import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import dbConnect from '@/lib/mongodb';
import User from '@/models/User';

export async function GET() {
  const session = await auth();
  const role = (session?.user as { role?: string } | undefined)?.role;

  if (role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  await dbConnect();
  const users = await User.find({
    verificationStatus: { $in: ['pending', 'verified', 'rejected'] },
  })
    .select(
      'name email role organizationName profilePhotoUrl verificationStatus verificationDocumentUrl verificationDocuments verificationSubmittedAt verificationRejectionReason'
    )
    .sort({ verificationSubmittedAt: -1 })
    .lean();

  return NextResponse.json({ users });
}