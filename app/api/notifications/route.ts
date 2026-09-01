import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import dbConnect from '@/lib/mongodb';
import User from '@/models/User';
import Notification from '@/models/Notification';

export async function GET() {
  try {
    const session = await auth();

    const user = session?.user as {
      id?: string;
    } | undefined;

    if (!user?.id) {
      return NextResponse.json(
        { error: 'You must sign in first.' },
        { status: 401 }
      );
    }

    await dbConnect();

    const notifications = await Notification.find({
      userId: user.id,
    })
      .sort({ createdAt: -1 })
      .limit(50)
      .lean();

    const unreadCount = await Notification.countDocuments({
      userId: user.id,
      read: false,
    });

    return NextResponse.json({
      notifications,
      unreadCount,
    });
  } catch (error) {
    console.error('Get notifications error:', error);

    return NextResponse.json(
      { error: 'Unable to load notifications.' },
      { status: 500 }
    );
  }
}