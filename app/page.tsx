import Link from 'next/link';
import dbConnect from '@/lib/mongodb';
import DonationListing from '@/models/DonationListing';
import User from '@/models/User';
import Logo from '@/components/Logo';
import HomeCarousel from '@/components/HomeCarousel';
import ProductShowcase from '@/components/ProductShowcase';
import {
  UtensilsCrossed,
  Bike,
  Home as HomeIcon,
  Heart,
  ArrowRight,
  Sparkles,
  Package,
} from 'lucide-react';

export const dynamic = 'force-dynamic';

const categoryIcon: Record<string, string> = {
  'Cooked Meals': '🍲',
  Bakery: '🥖',
  Groceries: '🥕',
  Produce: '🥦',
  Dairy: '🥛',
};

function formatPickupBy(date: Date) {
  return new Date(date).toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

const steps = [
  { Icon: Package, title: 'Donor lists surplus food', desc: 'A restaurant, store, or kitchen posts leftover food with pickup details.' },
  { Icon: Bike, title: 'Volunteer accepts pickup', desc: 'A verified, nearby volunteer claims the listing and picks it up on the way.' },
  { Icon: HomeIcon, title: 'Shelter confirms receipt', desc: 'Food is delivered to a partner shelter and the loop closes, tracked end to end.' },
];

const roleCards = [
  { Icon: UtensilsCrossed, title: 'Food Donor', desc: 'List surplus food in minutes and track every pickup.', cta: 'Register as a donor' },
  { Icon: Bike, title: 'Volunteer', desc: 'Pick up donated food and deliver it to shelters nearby.', cta: 'Register as a volunteer' },
  { Icon: HomeIcon, title: 'Shelter / NGO', desc: 'Receive verified donations and confirm what arrives.', cta: 'Register as a shelter' },
];

const marqueeWords = [
  'Zero Waste', 'Real Impact', 'Verified Volunteers', 'Trusted Shelters',
  'Live Tracking', 'Community Powered', 'Zero Waste', 'Real Impact',
  'Verified Volunteers', 'Trusted Shelters', 'Live Tracking', 'Community Powered',
];

export default async function Home() {
  await dbConnect();

  const [listing, mealsRescued, volunteerCount, shelterCount] =
    await Promise.all([
      DonationListing.findOne({ status: 'available' })
        .sort({ createdAt: -1 })
        .populate('donorId', 'name')
        .lean(),
      DonationListing.countDocuments({
        status: { $in: ['received', 'delivered'] },
      }),
      User.countDocuments({ role: 'volunteer' }),
      User.countDocuments({ role: 'shelter' }),
    ]);

  const donorName =
    (listing?.donorId as unknown as { name?: string } | undefined)?.name ||
    'A local donor';
  const icon = listing ? categoryIcon[listing.category] || '🍽️' : '🍽️';

  return (
    <div className="relative min-h-screen overflow-hidden bg-[var(--background)]">
      {/* Ambient floating blobs */}
      <div aria-hidden className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
        <div
          className="animate-float-slow absolute -left-32 top-0 h-96 w-96 rounded-full opacity-30 blur-[100px]"
          style={{ background: 'radial-gradient(circle, var(--color-primary), transparent 70%)' }}
        />
        <div
          className="animate-float-slow absolute right-0 top-1/3 h-80 w-80 rounded-full opacity-20 blur-[100px]"
          style={{ background: 'radial-gradient(circle, var(--color-accent), transparent 70%)', animationDelay: '2s' }}
        />
        <div
          className="animate-float-slow absolute bottom-0 left-1/3 h-72 w-72 rounded-full opacity-20 blur-[100px]"
          style={{ background: 'radial-gradient(circle, var(--color-secondary), transparent 70%)', animationDelay: '4s' }}
        />
      </div>

      <header className="animate-fade-in-up mx-auto flex max-w-7xl items-center justify-between px-4 py-6 sm:px-6 lg:px-8">
        <span className="flex items-center gap-2 text-xl font-bold text-[var(--foreground)]">
          <Logo size={36} />
          ResQPlate
        </span>

        <div className="flex items-center gap-2">
          <Link href="/login" className="btn-ghost">Log In</Link>
          <Link href="/register" className="btn-primary">Sign Up</Link>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 pb-8 pt-6 sm:px-6 lg:px-8">
        <div className="grid gap-10 lg:grid-cols-2 lg:items-center">
          <div className="animate-fade-in-up" style={{ animationDelay: '80ms' }}>
            <span className="badge bg-[var(--color-accent-light)] text-[var(--color-accent)]">
              <Sparkles className="h-3.5 w-3.5" /> Fighting food waste, together
            </span>

            <h1 className="mt-5 text-5xl font-bold leading-[1.05] text-[var(--foreground)] sm:text-6xl">
              Rescue food,
              <br />
              <span className="text-gradient">not just feed hope.</span>
            </h1>

            <p className="mt-5 max-w-md text-base text-[var(--foreground-muted)]">
              ResQPlate connects surplus-food donors, verified volunteer couriers, and
              shelters in real time — so good food reaches people who need it
              before it goes to waste.
            </p>

            <div className="mt-7 flex flex-wrap gap-3">
              <Link href="/register" className="btn-primary">
                Join the network <ArrowRight className="h-4 w-4" />
              </Link>
              <Link href="/login" className="btn-secondary">
                I already have an account
              </Link>
            </div>
          </div>

          <div className="card animate-fade-in-up p-6 sm:p-8" style={{ animationDelay: '160ms' }}>
            <div className="flex items-center justify-between">
              <span className="badge bg-[var(--color-secondary-light)] text-[var(--color-secondary)]">
                <span className="relative flex h-2 w-2">
                  <span className="animate-pulse-glow absolute inline-flex h-full w-full rounded-full bg-[var(--color-secondary)]" />
                </span>
                Live Food Rescue
              </span>
              <span className="text-xs font-semibold uppercase tracking-widest text-[var(--foreground-subtle)]">//01</span>
            </div>

            {listing ? (
              <>
                <h2 className="mt-5 text-2xl font-bold text-[var(--foreground)]">{listing.title}</h2>
                <p className="mt-1 text-sm text-[var(--foreground-muted)]">Donated by {donorName}</p>

                <div className="mt-5 flex items-center gap-4 rounded-2xl border border-[var(--border)] bg-[var(--surface-2)] p-4">
                  <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-[var(--color-accent-light)] text-2xl">
                    {icon}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-[var(--foreground)]">
                      {listing.quantity} · {listing.category}
                    </p>
                    <p className="text-xs text-[var(--foreground-subtle)]">
                      Pickup by {formatPickupBy(listing.pickupBy)}
                    </p>
                  </div>
                  <Link href="/register" className="btn-primary !px-4 !py-2 shrink-0 text-sm">
                    Claim
                  </Link>
                </div>
              </>
            ) : (
              <div className="mt-5">
                <h2 className="text-2xl font-bold text-[var(--foreground)]">No open rescues right now</h2>
                <p className="mt-2 max-w-sm text-sm text-[var(--foreground-muted)]">
                  New surplus-food listings show up here the moment a donor posts one. Be the first today.
                </p>
                <Link href="/register" className="btn-primary mt-4 inline-flex">Register as a donor</Link>
              </div>
            )}

            <div className="mt-5 flex flex-wrap items-center gap-2 text-xs font-semibold text-[var(--foreground-subtle)]">
              <span className="badge bg-[var(--surface-2)] text-[var(--foreground-muted)]">✓ Verified Donors</span>
              <span className="badge bg-[var(--surface-2)] text-[var(--foreground-muted)]">✓ Verified Volunteers</span>
              <span className="badge bg-[var(--surface-2)] text-[var(--foreground-muted)]">✓ Shelter Confirmed</span>
            </div>
          </div>
        </div>

        <div className="animate-fade-in-up mt-16 grid gap-4 sm:grid-cols-3" style={{ animationDelay: '240ms' }}>
          {[
            { label: 'Meals Rescued', value: `${mealsRescued}+`, color: 'primary' },
            { label: 'Verified Volunteers', value: `${volunteerCount}`, color: 'secondary' },
            { label: 'Partner Shelters', value: `${shelterCount}`, color: 'accent' },
          ].map((stat) => (
            <div key={stat.label} className="card card-hover p-6 text-center">
              <p className="text-4xl font-bold" style={{ color: `var(--color-${stat.color})` }}>{stat.value}</p>
              <p className="mt-2 text-sm font-medium text-[var(--foreground-muted)]">{stat.label}</p>
            </div>
          ))}
        </div>
      </main>

      {/* Marquee strip */}
      <div className="mt-16 overflow-hidden border-y border-[var(--border)] bg-[var(--surface)]/50 py-3">
        <div className="animate-marquee flex w-max gap-10 whitespace-nowrap">
          {[...marqueeWords, ...marqueeWords].map((word, i) => (
            <span key={i} className="flex items-center gap-2 text-sm font-semibold text-[var(--foreground-subtle)]">
              <Heart className="h-3.5 w-3.5 text-[var(--color-primary)]" /> {word}
            </span>
          ))}
        </div>
      </div>

      {/* How it works */}
      <section className="mx-auto max-w-6xl px-4 py-20 sm:px-6 lg:px-8">
        <div className="animate-fade-in-up text-center">
          <span className="badge bg-[var(--color-primary-light)] text-[var(--color-primary)]">How it works</span>
          <h2 className="mt-4 text-3xl font-bold text-[var(--foreground)] sm:text-4xl">
            Three steps from surplus to a shelter table
          </h2>
        </div>

        <div className="mt-12 grid gap-6 md:grid-cols-3">
          {steps.map((step, index) => (
            <div
              key={step.title}
              className="card card-hover animate-fade-in-up relative p-6"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <span className="absolute -top-3 -left-3 flex h-8 w-8 items-center justify-center rounded-full bg-[var(--color-primary)] text-sm font-bold text-white shadow-lg">
                {index + 1}
              </span>
              <div className="icon-badge h-12 w-12">
                <step.Icon className="h-6 w-6" />
              </div>
              <h3 className="mt-4 font-bold text-[var(--foreground)]">{step.title}</h3>
              <p className="mt-2 text-sm text-[var(--foreground-muted)]">{step.desc}</p>
            </div>
          ))}
        </div>
      </section>

            {/* Product showcase */}
      <ProductShowcase />

      {/* Testimonial carousel */}
      <HomeCarousel />

      {/* Built for every role */}
      <section className="mx-auto max-w-6xl px-4 py-20 sm:px-6 lg:px-8">
        <div className="animate-fade-in-up text-center">
          <span className="badge bg-[var(--color-secondary-light)] text-[var(--color-secondary)]">Join the network</span>
          <h2 className="mt-4 text-3xl font-bold text-[var(--foreground)] sm:text-4xl">
            Built for every part of the chain
          </h2>
        </div>

        <div className="mt-12 grid gap-6 md:grid-cols-3">
          {roleCards.map((role, index) => (
            <div
              key={role.title}
              className="card card-hover animate-fade-in-up p-6"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <div className="icon-badge h-12 w-12">
                <role.Icon className="h-6 w-6" />
              </div>
              <h3 className="mt-4 text-lg font-bold text-[var(--foreground)]">{role.title}</h3>
              <p className="mt-2 text-sm text-[var(--foreground-muted)]">{role.desc}</p>
              <Link href="/register" className="btn-secondary mt-5 w-full">{role.cta}</Link>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}