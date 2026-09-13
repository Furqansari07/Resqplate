import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import dbConnect from '@/lib/mongodb';
import User from '@/models/User';

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  const role = (session?.user as { role?: string } | undefined)?.role;

  if (role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { id } = await params;
  const { status, reason } = await req.json();

  if (!['verified', 'rejected'].includes(status)) {
    return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
  }

  if (status === 'rejected' && (!reason || !reason.trim())) {
    return NextResponse.json({ error: 'A reason is required when rejecting' }, { status: 400 });
  }

  await dbConnect();
  const user = await User.findByIdAndUpdate(
    id,
    {
      verificationStatus: status,
      verificationRejectionReason: status === 'rejected' ? reason.trim() : '',
    },
    { new: true }
  ).lean();

  return NextResponse.json({ success: true, user });
}