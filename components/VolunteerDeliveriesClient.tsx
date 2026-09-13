'use client';

import { useEffect, useState } from 'react';
import RatingWidget from '@/components/RatingWidget';
import CategoryIcon from '@/components/CategoryIcon';

type Person = {
  name?: string;
  address?: string;
  phone?: string;
};

type Donation = {
  _id: string;
  title: string;
  quantity: string;
  category: string;
  status: 'claimed' | 'in-transit' | 'delivered' | 'received';
  claimedAt?: string;
  inTransitAt?: string;
  deliveredAt?: string;
  receivedAt?: string;
  distanceKm?: number | null;
  donorId?: Person;
  targetShelterId?: Person;
};

const statusBadgeStyles: Record<string, string> = {
  claimed: 'bg-[var(--color-accent-light)] text-[var(--color-accent)]',
  'in-transit': 'bg-[var(--color-accent-light)] text-[var(--color-accent)]',
  delivered: 'bg-[var(--color-secondary-light)] text-[var(--color-secondary)]',
  received: 'bg-[var(--color-secondary-light)] text-[var(--color-secondary)]',
};

function formatTimelineDate(dateString?: string) {
  if (!dateString) {
    return 'Not recorded yet';
  }

  return new Date(dateString).toLocaleString();
}

export default function VolunteerDeliveriesClient() {
  const [donations, setDonations] = useState<Donation[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const loadPickups = async () => {
    try {
      setLoading(true);
      setError('');

      const response = await fetch('/api/volunteer/pickups');
      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Unable to load your pickups.');
        return;
      }

      setDonations(data.donations);
    } catch {
      setError('Unable to connect to the server.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPickups();
  }, []);

  const updateStatus = async (
    donationId: string,
    status: 'in-transit' | 'delivered'
  ) => {
    try {
      setUpdatingId(donationId);
      setError('');
      setSuccess('');

      const response = await fetch(`/api/donations/${donationId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Unable to update pickup status.');
        return;
      }

      setSuccess(data.message);
      await loadPickups();
    } catch {
      setError('Unable to connect to the server.');
    } finally {
      setUpdatingId('');
    }
  };

  return (
    <main className="mx-auto max-w-5xl px-4 py-8">
      <h1 className="text-3xl font-bold text-[var(--foreground)] animate-fade-in-up">
        My Pickup Deliveries
      </h1>

      <p className="mt-2 text-[var(--foreground-muted)] animate-fade-in-up" style={{ animationDelay: '60ms' }}>
        Update your delivery as you collect and deliver food.
      </p>

      {error && (
        <p className="mt-6 rounded-xl border border-[var(--color-danger)]/20 bg-[var(--color-danger-light)] p-3 text-sm text-[var(--color-danger)]">
          {error}
        </p>
      )}

      {success && (
        <p className="mt-6 rounded-xl border border-[var(--color-secondary)]/20 bg-[var(--color-secondary-light)] p-3 text-sm text-[var(--color-secondary)]">
          {success}
        </p>
      )}

      {loading ? (
        <p className="mt-8 text-[var(--foreground-muted)]">Loading your pickups...</p>
      ) : donations.length === 0 ? (
        <p className="card mt-8 p-5 text-[var(--foreground-muted)]">
          You have not accepted any pickups yet.
        </p>
      ) : (
        <div className="mt-8 grid gap-5 md:grid-cols-2">
          {donations.map((donation, index) => {
            const nextStatus =
              donation.status === 'claimed'
                ? 'in-transit'
                : donation.status === 'in-transit'
                  ? 'delivered'
                  : null;

            const badgeClass =
              statusBadgeStyles[donation.status] ||
              'bg-[var(--surface-2)] text-[var(--foreground-muted)]';

            return (
              <article
                key={donation._id}
                className="card card-hover animate-fade-in-up p-6"
                style={{ animationDelay: `${Math.min(index, 6) * 60}ms` }}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex min-w-0 items-center gap-2">
                    <div className="icon-badge h-9 w-9 shrink-0">
                      <CategoryIcon category={donation.category} className="h-4.5 w-4.5" />
                    </div>
                    <h2 className="truncate text-xl font-semibold text-[var(--foreground)]">
                      {donation.title}
                    </h2>
                  </div>

                  <span className={`badge shrink-0 capitalize ${badgeClass}`}>
                    {donation.status}
                  </span>
                </div>

                <p className="mt-3 text-[var(--foreground-muted)]">
                  <b className="text-[var(--foreground)]">Quantity:</b> {donation.quantity}
                </p>

                <p className="mt-1 text-[var(--foreground-muted)]">
                  <b className="text-[var(--foreground)]">Category:</b> {donation.category}
                </p>

                <hr className="my-4 border-[var(--border)]" />

                <p className="text-sm text-[var(--foreground-muted)]">
                  <b className="text-[var(--foreground)]">Pickup from:</b>{' '}
                  {donation.donorId?.name || 'Donor not available'}
                </p>

                <p className="mt-1 text-sm text-[var(--foreground-muted)]">
                  <b className="text-[var(--foreground)]">Donor address:</b>{' '}
                  {donation.donorId?.address || 'Not provided'}
                </p>

                <p className="mt-4 text-sm text-[var(--foreground-muted)]">
                  <b className="text-[var(--foreground)]">Deliver to:</b>{' '}
                  {donation.targetShelterId?.name || 'Shelter not available'}
                </p>

                <p className="mt-1 text-sm text-[var(--foreground-muted)]">
                  <b className="text-[var(--foreground)]">Shelter address:</b>{' '}
                  {donation.targetShelterId?.address || 'Not provided'}
                </p>

                {typeof donation.distanceKm === 'number' && (
                  <p className="mt-2 text-sm font-medium text-[var(--color-secondary)]">
                    <b>Pickup → delivery distance:</b> {donation.distanceKm} km
                  </p>
                )}

                <section className="mt-5 rounded-2xl border border-[var(--border)] bg-[var(--surface-2)] p-4">
                  <h3 className="font-medium text-[var(--foreground)]">
                    Pickup timeline
                  </h3>

                  <div className="mt-3 space-y-3 text-sm">
                    <p className="text-[var(--foreground-muted)]">
                      <b className="text-[var(--foreground)]">1. Pickup accepted:</b>{' '}
                      {formatTimelineDate(donation.claimedAt)}
                    </p>

                    <p className="text-[var(--foreground-muted)]">
                      <b className="text-[var(--foreground)]">2. Marked in transit:</b>{' '}
                      {formatTimelineDate(donation.inTransitAt)}
                    </p>

                    <p className="text-[var(--foreground-muted)]">
                      <b className="text-[var(--foreground)]">3. Marked delivered:</b>{' '}
                      {formatTimelineDate(donation.deliveredAt)}
                    </p>

                    <p className="text-[var(--foreground-muted)]">
                      <b className="text-[var(--foreground)]">4. Shelter confirmed receipt:</b>{' '}
                      {formatTimelineDate(donation.receivedAt)}
                    </p>
                  </div>
                </section>

                {nextStatus && (
                  <button
                    onClick={() => updateStatus(donation._id, nextStatus)}
                    disabled={updatingId === donation._id}
                    className="btn-primary mt-5 w-full"
                  >
                    {updatingId === donation._id
                      ? 'Updating...'
                      : nextStatus === 'in-transit'
                        ? 'Mark as In Transit'
                        : 'Mark as Delivered'}
                  </button>
                )}

                {donation.status === 'delivered' && (
                  <p className="mt-5 rounded-xl border border-[var(--color-primary)]/20 bg-[var(--color-primary-light)] p-3 text-sm text-[var(--color-primary)]">
                    Waiting for the shelter to confirm food receipt.
                  </p>
                )}

                {donation.status === 'received' && (
                  <>
                    <p className="mt-5 rounded-xl border border-[var(--color-secondary)]/20 bg-[var(--color-secondary-light)] p-3 text-sm text-[var(--color-secondary)]">
                      The shelter has confirmed receipt of this food donation.
                    </p>

                    <RatingWidget
                      donationId={donation._id}
                      myRole="volunteer"
                    />
                  </>
                )}
              </article>
            );
          })}
        </div>
      )}
    </main>
  );
}