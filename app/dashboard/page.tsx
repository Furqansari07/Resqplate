import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import mongoose from 'mongoose';
import dbConnect from '@/lib/mongodb';
import DonationListing from '@/models/DonationListing';
import Navbar from '@/components/Navbar';

type SessionUser = {
  id?: string;
  name?: string;
  email?: string;
  role?: 'donor' | 'volunteer' | 'shelter' | 'admin';
};

type StatCard = {
  label: string;
  value: number;
  color: string;
};

const roleMeta: Record<string, { emoji: string; title: string }> = {
  donor: { emoji: '🥕', title: 'Food Donor Portal' },
  volunteer: { emoji: '🚴', title: 'Volunteer Courier Portal' },
  shelter: { emoji: '🏠', title: 'Shelter / NGO Portal' },
  admin: { emoji: '🛠️', title: 'Platform Admin Portal' },
};

export default async function DashboardPage() {
  const session = await auth();
  const user = session?.user as SessionUser | undefined;

  if (!user?.id || !user.role) {
    redirect('/login');
  }

  await dbConnect();

  await DonationListing.updateMany(
    {
      status: 'available',
      pickupBy: { $lte: new Date() },
    },
    {
      $set: { status: 'expired' },
    }
  );

  const userId = new mongoose.Types.ObjectId(user.id);
  let stats: StatCard[] = [];

  if (user.role === 'donor') {
    const [available, inProgress, received] = await Promise.all([
      DonationListing.countDocuments({
        donorId: userId,
        status: 'available',
      }),
      DonationListing.countDocuments({
        donorId: userId,
        status: { $in: ['claimed', 'in-transit', 'delivered'] },
      }),
      DonationListing.countDocuments({
        donorId: userId,
        status: 'received',
      }),
    ]);

    stats = [
      {
        label: 'Available listings',
        value: available,
        color: 'bg-[var(--color-primary-light)] text-[var(--color-primary-hover)]',
      },
      {
        label: 'Pickups in progress',
        value: inProgress,
        color: 'bg-[var(--color-accent-light)] text-amber-800',
      },
      {
        label: 'Food received by shelters',
        value: received,
        color: 'bg-[var(--color-secondary-light)] text-[var(--color-secondary-hover)]',
      },
    ];
  }

  if (user.role === 'volunteer') {
    const [active, inTransit, completed] = await Promise.all([
      DonationListing.countDocuments({
        volunteerId: userId,
        status: 'claimed',
      }),
      DonationListing.countDocuments({
        volunteerId: userId,
        status: 'in-transit',
      }),
      DonationListing.countDocuments({
        volunteerId: userId,
        status: { $in: ['delivered', 'received'] },
      }),
    ]);

    stats = [
      {
        label: 'Pickups to collect',
        value: active,
        color: 'bg-[var(--color-accent-light)] text-amber-800',
      },
      {
        label: 'Pickups in transit',
        value: inTransit,
        color: 'bg-[var(--color-primary-light)] text-[var(--color-primary-hover)]',
      },
      {
        label: 'Completed deliveries',
        value: completed,
        color: 'bg-[var(--color-secondary-light)] text-[var(--color-secondary-hover)]',
      },
    ];
  }

  if (user.role === 'shelter') {
    const [awaitingReceipt, received] = await Promise.all([
      DonationListing.countDocuments({
        targetShelterId: userId,
        status: { $in: ['claimed', 'in-transit', 'delivered'] },
      }),
      DonationListing.countDocuments({
        targetShelterId: userId,
        status: 'received',
      }),
    ]);

    stats = [
      {
        label: 'Deliveries in progress',
        value: awaitingReceipt,
        color: 'bg-[var(--color-primary-light)] text-[var(--color-primary-hover)]',
      },
      {
        label: 'Food received',
        value: received,
        color: 'bg-[var(--color-secondary-light)] text-[var(--color-secondary-hover)]',
      },
    ];
  }

  const meta = roleMeta[user.role];

  return (
    <div className="min-h-screen bg-[var(--background)]">
      <Navbar />

      <main className="mx-auto max-w-7xl py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <h1 className="text-3xl font-bold text-[var(--foreground)]">
            {meta?.emoji} Dashboard
          </h1>

          <p className="mt-1 text-sm text-[var(--color-text-muted)]">
            Welcome, <b className="text-[var(--foreground)]">{user.name || 'User'}</b> ({user.role})
          </p>

          <section className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {stats.map((stat) => (
              <article
                key={stat.label}
                className={`card-warm p-5 ${stat.color}`}
              >
                <p className="text-sm font-semibold">{stat.label}</p>
                <p className="mt-2 text-3xl font-bold">{stat.value}</p>
              </article>
            ))}
          </section>

          {user.role === 'donor' && (
            <section className="card-warm mt-6 p-6">
              <h2 className="text-lg font-bold text-[var(--foreground)]">
                🥕 Food Donor Portal
              </h2>

              <p className="mt-1 text-sm text-[var(--color-text-muted)]">
                Create and manage surplus-food listings, track delivery status,
                and download your donation report.
              </p>

              <div className="mt-4 flex flex-wrap gap-3">
                <Link href="/donations" className="btn-primary">
                  Create or manage donations
                </Link>

                <a href="/api/donations/export" className="btn-soft">
                  Download CSV report
                </a>
              </div>
            </section>
          )}

          {user.role === 'volunteer' && (
            <section className="card-warm mt-6 p-6">
              <h2 className="text-lg font-bold text-[var(--foreground)]">
                🚴 Volunteer Courier Portal
              </h2>

              <p className="mt-1 text-sm text-[var(--color-text-muted)]">
                Browse available food donations, accept pickups, and update
                delivery progress.
              </p>

              <div className="mt-4 flex flex-wrap gap-3">
                <Link href="/volunteer" className="btn-primary">
                  View available pickups
                </Link>

                <Link href="/volunteer/pickups" className="btn-soft">
                  Manage my pickups
                </Link>
              </div>
            </section>
          )}

          {user.role === 'shelter' && (
            <section className="card-warm mt-6 p-6">
              <h2 className="text-lg font-bold text-[var(--foreground)]">
                🏠 Shelter / NGO Portal
              </h2>

              <p className="mt-1 text-sm text-[var(--color-text-muted)]">
                Monitor assigned food donations and confirm food when it
                arrives at your shelter.
              </p>

              <Link href="/shelter" className="btn-primary mt-4">
                View incoming donations
              </Link>
            </section>
          )}

          {user.role === 'admin' && (
            <section className="card-warm mt-6 p-6">
              <h2 className="text-lg font-bold text-[var(--foreground)]">
                🛠️ Platform Admin Portal
              </h2>

              <p className="mt-1 text-sm text-[var(--color-text-muted)]">
                View every user and listing, remove suspicious accounts or
                donations, and monitor platform-wide activity.
              </p>

              <Link href="/admin" className="btn-primary mt-4">
                Open admin panel
              </Link>
            </section>
          )}
        </div>
      </main>
    </div>
  );
}