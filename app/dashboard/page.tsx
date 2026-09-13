import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import mongoose from 'mongoose';
import dbConnect from '@/lib/mongodb';
import DonationListing from '@/models/DonationListing';
import User from '@/models/User';
import Navbar from '@/components/Navbar';
import ProfileRing from '@/components/ProfileRing';
import { getProfileCompletion } from '@/lib/profileCompletion';
import {
  Carrot,
  Bike,
  Home as HomeIcon,
  Wrench,
  ClipboardList,
  CheckCircle2,
  Clock,
  XCircle,
  ShieldCheck,
  ArrowRight,
  Download,
} from 'lucide-react';

type SessionUser = {
  id?: string;
  name?: string;
  email?: string;
  role?: 'donor' | 'volunteer' | 'shelter' | 'admin';
};

type StatCard = {
  label: string;
  value: number;
  color: 'primary' | 'secondary' | 'accent';
};

const roleMeta: Record<string, { Icon: React.ComponentType<{ className?: string }>; title: string }> = {
  donor: { Icon: Carrot, title: 'Food Donor Portal' },
  volunteer: { Icon: Bike, title: 'Volunteer Courier Portal' },
  shelter: { Icon: HomeIcon, title: 'Shelter / NGO Portal' },
  admin: { Icon: Wrench, title: 'Platform Admin Portal' },
};

export default async function DashboardPage() {
  const session = await auth();
  const user = session?.user as SessionUser | undefined;

  if (!user?.id) {
    redirect('/login');
  }

  if (!user.role) {
    redirect('/select-role');
  }

  await dbConnect();

  await DonationListing.updateMany(
    { status: 'available', pickupBy: { $lte: new Date() } },
    { $set: { status: 'expired' } }
  );

  const dbUser = await User.findById(user.id).lean();
  const completion = getProfileCompletion(dbUser || {}, user.role);

  const userId = new mongoose.Types.ObjectId(user.id);
  let stats: StatCard[] = [];

  if (user.role === 'donor') {
    const [available, inProgress, received] = await Promise.all([
      DonationListing.countDocuments({ donorId: userId, status: 'available' }),
      DonationListing.countDocuments({ donorId: userId, status: { $in: ['claimed', 'in-transit', 'delivered'] } }),
      DonationListing.countDocuments({ donorId: userId, status: 'received' }),
    ]);

    stats = [
      { label: 'Available listings', value: available, color: 'primary' },
      { label: 'Pickups in progress', value: inProgress, color: 'accent' },
      { label: 'Food received by shelters', value: received, color: 'secondary' },
    ];
  }

  if (user.role === 'volunteer') {
    const [active, inTransit, completed] = await Promise.all([
      DonationListing.countDocuments({ volunteerId: userId, status: 'claimed' }),
      DonationListing.countDocuments({ volunteerId: userId, status: 'in-transit' }),
      DonationListing.countDocuments({ volunteerId: userId, status: { $in: ['delivered', 'received'] } }),
    ]);

    stats = [
      { label: 'Pickups to collect', value: active, color: 'accent' },
      { label: 'Pickups in transit', value: inTransit, color: 'primary' },
      { label: 'Completed deliveries', value: completed, color: 'secondary' },
    ];
  }

  if (user.role === 'shelter') {
    const [awaitingReceipt, received] = await Promise.all([
      DonationListing.countDocuments({ targetShelterId: userId, status: { $in: ['claimed', 'in-transit', 'delivered'] } }),
      DonationListing.countDocuments({ targetShelterId: userId, status: 'received' }),
    ]);

    stats = [
      { label: 'Deliveries in progress', value: awaitingReceipt, color: 'primary' },
      { label: 'Food received', value: received, color: 'secondary' },
    ];
  }

  const meta = roleMeta[user.role];
  const RoleIcon = meta.Icon;

  return (
    <div className="min-h-screen bg-[var(--background)]">
      <Navbar />

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="animate-fade-in-up flex items-center gap-3">
          <div className="icon-badge h-12 w-12 shrink-0">
            <RoleIcon className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-[var(--foreground)]">Dashboard</h1>
            <p className="mt-1 text-sm text-[var(--foreground-muted)]">
              Welcome, <b className="text-[var(--foreground)]">{user.name || 'User'}</b> ({user.role})
            </p>
          </div>
        </div>

        {completion.total > 0 && (
          <section className="card animate-fade-in-up mt-6 p-6">
            <div className="flex items-center gap-6">
              <ProfileRing percent={completion.percent} />

              <div className="flex-1">
                {completion.percent === 100 ? (
                  <>
                    <h2 className="flex items-center gap-2 text-lg font-bold text-[var(--foreground)]">
                      <CheckCircle2 className="h-5 w-5 text-[var(--color-secondary)]" />
                      Your profile is complete
                    </h2>
                    <p className="mt-1 text-sm text-[var(--foreground-muted)]">
                      All required details are filled in.
                    </p>
                  </>
                ) : (
                  <>
                    <h2 className="text-lg font-bold text-[var(--foreground)]">
                      Your profile is {completion.percent}% complete
                    </h2>
                    <p className="mt-1 text-sm text-[var(--foreground-muted)]">
                      {completion.filled} of {completion.total} fields completed — missing:{' '}
                      {completion.missing.map((f) => f.label).join(', ')}
                    </p>
                    <Link href="/profile?required=1" className="btn-primary mt-3 inline-flex">
                      Complete profile <ArrowRight className="h-4 w-4" />
                    </Link>
                  </>
                )}
              </div>
            </div>
          </section>
        )}

        {(user.role === 'volunteer' || user.role === 'shelter' || user.role === 'donor') && (
          <>
            {(!dbUser?.verificationStatus || dbUser.verificationStatus === 'unverified') && (
              <section className="card animate-fade-in-up mt-6 flex flex-wrap items-center justify-between gap-4 p-6">
                <div className="flex items-center gap-3">
                  <div className="icon-badge h-11 w-11 shrink-0">
                    <ShieldCheck className="h-5 w-5" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-[var(--foreground)]">Get verified</h2>
                    <p className="mt-1 text-sm text-[var(--foreground-muted)]">
                      Verified accounts get a trust badge and are prioritized by donors and shelters.
                    </p>
                  </div>
                </div>
                <Link href="/profile/verify" className="btn-primary shrink-0">
                  Get Verified <ArrowRight className="h-4 w-4" />
                </Link>
              </section>
            )}

            {dbUser?.verificationStatus === 'pending' && (
              <section className="card animate-fade-in-up mt-6 flex items-center gap-3 p-6">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[var(--color-accent-light)] text-[var(--color-accent)]">
                  <Clock className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-[var(--foreground)]">Verification pending</h2>
                  <p className="mt-1 text-sm text-[var(--foreground-muted)]">
                    Your document has been submitted and is awaiting admin review.
                  </p>
                </div>
              </section>
            )}

            {dbUser?.verificationStatus === 'verified' && (
              <section className="card animate-fade-in-up mt-6 flex items-center gap-3 p-6">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[var(--color-secondary-light)] text-[var(--color-secondary)]">
                  <CheckCircle2 className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-[var(--color-secondary)]">Verified account</h2>
                  <p className="mt-1 text-sm text-[var(--foreground-muted)]">
                    Your identity has been verified. Thanks for helping keep ResQPlate trustworthy.
                  </p>
                </div>
              </section>
            )}

            {dbUser?.verificationStatus === 'rejected' && (
              <section className="card animate-fade-in-up mt-6 p-6">
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[var(--color-danger-light)] text-[var(--color-danger)]">
                    <XCircle className="h-5 w-5" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-[var(--color-danger)]">Verification rejected</h2>
                    <p className="mt-1 text-sm text-[var(--foreground-muted)]">
                      Your document could not be verified. Please submit a clearer document.
                    </p>
                  </div>
                </div>
                <Link href="/profile/verify" className="btn-secondary mt-3 inline-flex">
                  Resubmit <ArrowRight className="h-4 w-4" />
                </Link>
              </section>
            )}
          </>
        )}

        <section className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {stats.map((stat, index) => (
            <article
              key={stat.label}
              className="card card-hover animate-fade-in-up p-5"
              style={{ animationDelay: `${index * 80}ms` }}
            >
              <p className="text-sm font-medium text-[var(--foreground-muted)]">{stat.label}</p>
              <p className="mt-2 text-3xl font-bold" style={{ color: `var(--color-${stat.color})` }}>
                {stat.value}
              </p>
            </article>
          ))}
        </section>

        {user.role === 'donor' && (
          <section className="card animate-fade-in-up mt-6 p-6" style={{ animationDelay: '240ms' }}>
            <div className="flex items-center gap-3">
              <div className="icon-badge h-11 w-11 shrink-0">
                <Carrot className="h-5 w-5" />
              </div>
              <h2 className="text-lg font-bold text-[var(--foreground)]">Food Donor Portal</h2>
            </div>

            <p className="mt-3 text-sm text-[var(--foreground-muted)]">
              Create and manage surplus-food listings, track delivery status,
              and download your donation report.
            </p>

            <div className="mt-4 flex flex-wrap gap-3">
              <Link href="/donations" className="btn-primary">
                Create or manage donations <ArrowRight className="h-4 w-4" />
              </Link>

              <a href="/api/donations/export" className="btn-secondary">
                <Download className="h-4 w-4" /> Download CSV report
              </a>
            </div>
          </section>
        )}

        {user.role === 'volunteer' && (
          <section className="card animate-fade-in-up mt-6 p-6" style={{ animationDelay: '240ms' }}>
            <div className="flex items-center gap-3">
              <div className="icon-badge h-11 w-11 shrink-0">
                <Bike className="h-5 w-5" />
              </div>
              <h2 className="text-lg font-bold text-[var(--foreground)]">Volunteer Courier Portal</h2>
            </div>

            <p className="mt-3 text-sm text-[var(--foreground-muted)]">
              Browse available food donations, accept pickups, and update
              delivery progress.
            </p>

            <div className="mt-4 flex flex-wrap gap-3">
              <Link href="/volunteer" className="btn-primary">
                View available pickups <ArrowRight className="h-4 w-4" />
              </Link>

              <Link href="/volunteer/pickups" className="btn-secondary">
                Manage my pickups
              </Link>
            </div>
          </section>
        )}

        {user.role === 'shelter' && (
          <section className="card animate-fade-in-up mt-6 p-6" style={{ animationDelay: '240ms' }}>
            <div className="flex items-center gap-3">
              <div className="icon-badge h-11 w-11 shrink-0">
                <HomeIcon className="h-5 w-5" />
              </div>
              <h2 className="text-lg font-bold text-[var(--foreground)]">Shelter / NGO Portal</h2>
            </div>

            <p className="mt-3 text-sm text-[var(--foreground-muted)]">
              Monitor assigned food donations and confirm food when it
              arrives at your shelter.
            </p>

            <Link href="/shelter" className="btn-primary mt-4 inline-flex">
              View incoming donations <ArrowRight className="h-4 w-4" />
            </Link>
          </section>
        )}

        {user.role === 'admin' && (
          <section className="card animate-fade-in-up mt-6 p-6" style={{ animationDelay: '240ms' }}>
            <div className="flex items-center gap-3">
              <div className="icon-badge h-11 w-11 shrink-0">
                <Wrench className="h-5 w-5" />
              </div>
              <h2 className="text-lg font-bold text-[var(--foreground)]">Platform Admin Portal</h2>
            </div>

            <p className="mt-3 text-sm text-[var(--foreground-muted)]">
              View every user and listing, remove suspicious accounts or
              activity.
            </p>

            <Link href="/admin" className="btn-primary mt-4 inline-flex">
              Open admin panel <ArrowRight className="h-4 w-4" />
            </Link>
          </section>
        )}
      </main>
    </div>
  );
}