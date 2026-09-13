'use client';

import { useEffect, useMemo, useState } from 'react';
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
  description?: string;
  photoUrl?: string;
  pickupBy?: string;
  distanceKm?: number | null;
  specialInstructions?: string;
  status: string;
  createdAt: string;
  claimedAt?: string;
  inTransitAt?: string;
  deliveredAt?: string;
  receivedAt?: string;
  donorId?: Person;
  volunteerId?: Person;
};

const statusBadgeStyles: Record<string, string> = {
  available: 'bg-[var(--color-primary-light)] text-[var(--color-primary)]',
  claimed: 'bg-[var(--color-accent-light)] text-[var(--color-accent)]',
  'in-transit': 'bg-[var(--color-accent-light)] text-[var(--color-accent)]',
  delivered: 'bg-[var(--color-secondary-light)] text-[var(--color-secondary)]',
  received: 'bg-[var(--color-secondary-light)] text-[var(--color-secondary)]',
  cancelled: 'bg-[var(--color-danger-light)] text-[var(--color-danger)]',
  expired: 'bg-[var(--color-danger-light)] text-[var(--color-danger)]',
};

function formatTimelineDate(dateString?: string) {
  if (!dateString) {
    return 'Not recorded yet';
  }

  return new Date(dateString).toLocaleString();
}

export default function ShelterDonationsClient() {
  const [donations, setDonations] = useState<Donation[]>([]);
  const [loading, setLoading] = useState(true);
  const [confirmingId, setConfirmingId] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortBy, setSortBy] = useState('newest');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const loadDonations = async () => {
    try {
      setLoading(true);
      setError('');

      const response = await fetch('/api/shelter/donations');
      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Unable to load incoming donations.');
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
    loadDonations();
  }, []);

  const statuses = useMemo(() => {
    return [...new Set(donations.map((donation) => donation.status))].sort();
  }, [donations]);

  const filteredDonations = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();

    const matchingDonations = donations.filter((donation) => {
      const matchesStatus =
        statusFilter === 'all' || donation.status === statusFilter;

      const searchableText = [
        donation.title,
        donation.category,
        donation.description || '',
        donation.donorId?.name || '',
        donation.volunteerId?.name || '',
      ]
        .join(' ')
        .toLowerCase();

      const matchesSearch =
        !normalizedSearch || searchableText.includes(normalizedSearch);

      return matchesStatus && matchesSearch;
    });

    return [...matchingDonations].sort((firstDonation, secondDonation) => {
      if (sortBy === 'pickup-deadline') {
        const firstDeadline = firstDonation.pickupBy
          ? new Date(firstDonation.pickupBy).getTime()
          : Number.MAX_SAFE_INTEGER;

        const secondDeadline = secondDonation.pickupBy
          ? new Date(secondDonation.pickupBy).getTime()
          : Number.MAX_SAFE_INTEGER;

        return firstDeadline - secondDeadline;
      }

      return (
        new Date(secondDonation.createdAt).getTime() -
        new Date(firstDonation.createdAt).getTime()
      );
    });
  }, [donations, searchTerm, statusFilter, sortBy]);

  const confirmReceipt = async (donationId: string) => {
    const confirmed = window.confirm(
      'Confirm that your shelter has physically received this food donation?'
    );

    if (!confirmed) {
      return;
    }

    try {
      setConfirmingId(donationId);
      setError('');
      setSuccess('');

      const response = await fetch(
        `/api/donations/${donationId}/receive`,
        {
          method: 'PATCH',
        }
      );

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Unable to confirm food receipt.');
        return;
      }

      setSuccess('Food receipt confirmed successfully.');
      await loadDonations();
    } catch {
      setError('Unable to connect to the server.');
    } finally {
      setConfirmingId('');
    }
  };

  return (
    <main className="mx-auto max-w-5xl px-4 py-8">
      <h1 className="text-3xl font-bold text-[var(--foreground)] animate-fade-in-up">
        Incoming Food Donations
      </h1>

      <p className="mt-2 text-[var(--foreground-muted)] animate-fade-in-up" style={{ animationDelay: '60ms' }}>
        Review food details, coordinate with volunteers, and confirm receipt
        when food arrives.
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

      {!loading && donations.length > 0 && (
        <section className="card mt-6 p-5">
          <h2 className="text-lg font-semibold text-[var(--foreground)]">
            Find an incoming donation
          </h2>

          <div className="mt-4 grid gap-4 md:grid-cols-3">
            <input
              type="search"
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder="Search food, donor, or volunteer"
              className="input"
            />

            <select
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value)}
              className="input"
            >
              <option value="all" className="bg-[var(--surface)]">All statuses</option>

              {statuses.map((status) => (
                <option key={status} value={status} className="bg-[var(--surface)]">
                  {status.replace('-', ' ')}
                </option>
              ))}
            </select>

            <select
              value={sortBy}
              onChange={(event) => setSortBy(event.target.value)}
              className="input"
            >
              <option value="newest" className="bg-[var(--surface)]">Newest assigned donations</option>
              <option value="pickup-deadline" className="bg-[var(--surface)]">
                Earliest pickup deadline
              </option>
            </select>
          </div>

          <p className="mt-3 text-sm text-[var(--foreground-muted)]">
            Showing {filteredDonations.length} of {donations.length} assigned
            donation{donations.length === 1 ? '' : 's'}.
          </p>
        </section>
      )}

      {loading ? (
        <p className="mt-8 text-[var(--foreground-muted)]">Loading incoming donations...</p>
      ) : donations.length === 0 ? (
        <p className="card mt-8 p-5 text-[var(--foreground-muted)]">
          No donations have been assigned to your shelter yet.
        </p>
      ) : filteredDonations.length === 0 ? (
        <p className="card mt-8 p-5 text-[var(--foreground-muted)]">
          No donations match your current search or filter.
        </p>
      ) : (
        <div className="mt-8 grid gap-5 md:grid-cols-2">
          {filteredDonations.map((donation, index) => {
            const badgeClass =
              statusBadgeStyles[donation.status] ||
              'bg-[var(--surface-2)] text-[var(--foreground-muted)]';

            return (
              <article
                key={donation._id}
                className="card card-hover animate-fade-in-up p-6"
                style={{ animationDelay: `${Math.min(index, 6) * 60}ms` }}
              >
                {donation.photoUrl ? (
                  <img
                    src={donation.photoUrl}
                    alt={donation.title}
                    className="mb-4 h-40 w-full rounded-2xl border border-[var(--border)] object-cover"
                  />
                ) : (
                  <div className="mb-4 flex h-40 w-full items-center justify-center rounded-2xl border border-[var(--border)] bg-[var(--surface-2)]">
                    <CategoryIcon category={donation.category} className="h-12 w-12 text-[var(--foreground-subtle)]" />
                  </div>
                )}

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

                {donation.description && (
                  <p className="mt-3 text-sm text-[var(--foreground-muted)]">
                    <b className="text-[var(--foreground)]">Description:</b> {donation.description}
                  </p>
                )}

                {donation.pickupBy && (
                  <p className="mt-2 text-sm font-medium text-[var(--color-danger)]">
                    <b>Pickup deadline:</b>{' '}
                    {new Date(donation.pickupBy).toLocaleString()}
                  </p>
                )}

                {typeof donation.distanceKm === 'number' && (
                  <p className="mt-2 text-sm font-medium text-[var(--color-secondary)]">
                    <b>Distance from donor:</b> {donation.distanceKm} km
                  </p>
                )}

                {donation.specialInstructions && (
                  <p className="mt-2 rounded-xl border border-[var(--color-accent)]/20 bg-[var(--color-accent-light)] p-3 text-sm text-[var(--color-accent)]">
                    <b>Food-handling instructions:</b>{' '}
                    {donation.specialInstructions}
                  </p>
                )}

                <hr className="my-4 border-[var(--border)]" />

                <p className="text-sm text-[var(--foreground-muted)]">
                  <b className="text-[var(--foreground)]">Donor:</b> {donation.donorId?.name || 'Not available'}
                </p>

                <p className="mt-1 text-sm text-[var(--foreground-muted)]">
                  <b className="text-[var(--foreground)]">Volunteer:</b>{' '}
                  {donation.volunteerId?.name || 'Not assigned yet'}
                </p>

                <p className="mt-1 text-sm text-[var(--foreground-muted)]">
                  <b className="text-[var(--foreground)]">Volunteer phone:</b>{' '}
                  {donation.volunteerId?.phone || 'Not provided'}
                </p>

                <section className="mt-5 rounded-2xl border border-[var(--border)] bg-[var(--surface-2)] p-4">
                  <h3 className="font-medium text-[var(--foreground)]">
                    Delivery timeline
                  </h3>

                  <div className="mt-3 space-y-3 text-sm">
                    <p className="text-[var(--foreground-muted)]">
                      <b className="text-[var(--foreground)]">1. Volunteer accepted pickup:</b>{' '}
                      {formatTimelineDate(donation.claimedAt)}
                    </p>

                    <p className="text-[var(--foreground-muted)]">
                      <b className="text-[var(--foreground)]">2. Food marked in transit:</b>{' '}
                      {formatTimelineDate(donation.inTransitAt)}
                    </p>

                    <p className="text-[var(--foreground-muted)]">
                      <b className="text-[var(--foreground)]">3. Volunteer marked food delivered:</b>{' '}
                      {formatTimelineDate(donation.deliveredAt)}
                    </p>

                    <p className="text-[var(--foreground-muted)]">
                      <b className="text-[var(--foreground)]">4. Shelter confirmed receipt:</b>{' '}
                      {formatTimelineDate(donation.receivedAt)}
                    </p>
                  </div>
                </section>

                {donation.status === 'delivered' && (
                  <button
                    onClick={() => confirmReceipt(donation._id)}
                    disabled={confirmingId === donation._id}
                    className="btn-primary mt-5 w-full"
                  >
                    {confirmingId === donation._id
                      ? 'Confirming receipt...'
                      : 'Confirm receipt'}
                  </button>
                )}

                {donation.status === 'received' && (
                  <>
                    <p className="mt-5 rounded-xl border border-[var(--color-secondary)]/20 bg-[var(--color-secondary-light)] p-3 text-sm text-[var(--color-secondary)]">
                      Your shelter has confirmed receipt of this food donation.
                    </p>

                    <RatingWidget
                      donationId={donation._id}
                      myRole="shelter"
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