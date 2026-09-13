'use client';

import { useEffect, useMemo, useState } from 'react';
import CategoryIcon from '@/components/CategoryIcon';

type Donation = {
  _id: string;
  title: string;
  quantity: string;
  category: string;
  description?: string;
  photoUrl?: string;
  pickupBy?: string;
  specialInstructions?: string;
  distanceKm?: number | null;
  donorId?: {
    name?: string;
  };
};

type Shelter = {
  _id: string;
  name: string;
  address?: string;
  capacity?: number | null;
  capacityUnit?: 'meals' | 'kg' | null;
  currentLoad?: number;
  isFull?: boolean;
};

export default function VolunteerPickupsClient() {
  const [donations, setDonations] = useState<Donation[]>([]);
  const [shelters, setShelters] = useState<Shelter[]>([]);
  const [shelterId, setShelterId] = useState('');
  const [loading, setLoading] = useState(true);
  const [claimingId, setClaimingId] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [sortBy, setSortBy] = useState('newest');
  const [volunteerHasLocation, setVolunteerHasLocation] = useState(true);
  const [verificationStatus, setVerificationStatus] = useState<string>('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const loadData = async () => {
    try {
      setLoading(true);
      setError('');

      const [donationsResponse, sheltersResponse] = await Promise.all([
        fetch('/api/donations/available'),
        fetch('/api/shelters'),
      ]);

      const donationsData = await donationsResponse.json();
      const sheltersData = await sheltersResponse.json();

      if (!donationsResponse.ok) {
        setError(donationsData.error || 'Unable to load donations.');
        return;
      }

      if (!sheltersResponse.ok) {
        setError(sheltersData.error || 'Unable to load shelters.');
        return;
      }

      setDonations(donationsData.donations);
      setShelters(sheltersData.shelters);
      setVolunteerHasLocation(
        donationsData.volunteerHasLocation !== false
      );
    } catch {
      setError('Unable to connect to the server.');
    } finally {
      setLoading(false);
    }

    fetch('/api/profile')
      .then((res) => res.json())
      .then((data) => setVerificationStatus(data.user?.verificationStatus || ''))
      .catch(() => {});
  };

  useEffect(() => {
    loadData();
  }, []);

  const categories = useMemo(() => {
    return [...new Set(donations.map((donation) => donation.category))].sort(
      (firstCategory, secondCategory) =>
        firstCategory.localeCompare(secondCategory)
    );
  }, [donations]);

  const filteredDonations = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();

    const matchingDonations = donations.filter((donation) => {
      const matchesCategory =
        categoryFilter === 'all' || donation.category === categoryFilter;

      const searchableText = [
        donation.title,
        donation.category,
        donation.description || '',
        donation.donorId?.name || '',
      ]
        .join(' ')
        .toLowerCase();

      const matchesSearch =
        !normalizedSearch || searchableText.includes(normalizedSearch);

      return matchesCategory && matchesSearch;
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

      if (sortBy === 'distance') {
        const firstDistance =
          typeof firstDonation.distanceKm === 'number'
            ? firstDonation.distanceKm
            : Number.MAX_SAFE_INTEGER;

        const secondDistance =
          typeof secondDonation.distanceKm === 'number'
            ? secondDonation.distanceKm
            : Number.MAX_SAFE_INTEGER;

        return firstDistance - secondDistance;
      }

      return 0;
    });
  }, [donations, searchTerm, categoryFilter, sortBy]);

  const claimDonation = async (id: string) => {
    if (verificationStatus !== 'verified') {
      setError('You need to complete verification before accepting pickups. Go to "Get Verified" in the menu.');
      return;
    }

    if (!shelterId) {
      setError('Please select a destination shelter first.');
      return;
    }

    try {
      setClaimingId(id);
      setError('');
      setSuccess('');

      const response = await fetch(`/api/donations/${id}/claim`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ shelterId }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Unable to accept this pickup.');
        return;
      }

      setSuccess(
        'Pickup accepted. Full donor contact details are now available in My Pickup Deliveries.'
      );

      await loadData();
    } catch {
      setError('Unable to connect to the server.');
    } finally {
      setClaimingId('');
    }
  };

  return (
    <main className="mx-auto max-w-5xl px-4 py-8">
      <h1 className="text-3xl font-bold text-[var(--foreground)] animate-fade-in-up">
        Available Food Pickups
      </h1>

      <p className="mt-2 text-[var(--foreground-muted)] animate-fade-in-up" style={{ animationDelay: '60ms' }}>
        Choose a destination shelter, then accept a food pickup.
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

      {verificationStatus && verificationStatus !== 'verified' && (
        <section className="animate-fade-in mt-6 rounded-2xl border border-[var(--color-accent)]/20 bg-[var(--color-accent-light)] p-4 text-sm text-[var(--color-accent)]">
          ⚠️ You must complete verification before accepting pickups.{' '}
          <a href="/profile/verify" className="font-semibold underline">Get Verified now</a>
        </section>
      )}

      <section className="card mt-6 p-5">
        <label className="label">
          Deliver accepted food to
        </label>

        <select
          value={shelterId}
          onChange={(event) => setShelterId(event.target.value)}
          className="input mt-2"
        >
          <option value="" className="bg-[var(--surface)]">Select a shelter / NGO</option>

          {shelters.map((shelter) => (
            <option
              key={shelter._id}
              value={shelter._id}
              disabled={shelter.isFull}
              className="bg-[var(--surface)]"
            >
              {shelter.name}
              {shelter.address ? ` — ${shelter.address}` : ''}
              {shelter.capacity
                ? shelter.isFull
                  ? ' (Full)'
                  : ` (${shelter.currentLoad}/${shelter.capacity} ${shelter.capacityUnit})`
                : ''}
            </option>
          ))}
        </select>

        {shelters.length === 0 && !loading && (
          <p className="mt-3 text-sm text-[var(--color-danger)]">
            No shelter account exists yet. Register a Shelter / NGO account
            first.
          </p>
        )}
      </section>

      {!loading && donations.length > 0 && (
        <section className="card mt-6 p-5">
          <h2 className="text-lg font-semibold text-[var(--foreground)]">
            Find a pickup
          </h2>

          <div className="mt-4 grid gap-4 md:grid-cols-3">
            <input
              type="search"
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder="Search food, category, or donor"
              className="input"
            />

            <select
              value={categoryFilter}
              onChange={(event) => setCategoryFilter(event.target.value)}
              className="input"
            >
              <option value="all" className="bg-[var(--surface)]">All categories</option>

              {categories.map((category) => (
                <option key={category} value={category} className="bg-[var(--surface)]">
                  {category}
                </option>
              ))}
            </select>

            <select
              value={sortBy}
              onChange={(event) => setSortBy(event.target.value)}
              className="input"
            >
              <option value="newest" className="bg-[var(--surface)]">Newest listings</option>
              <option value="pickup-deadline" className="bg-[var(--surface)]">
                Earliest pickup deadline
              </option>
              <option value="distance" className="bg-[var(--surface)]">Nearest to me</option>
            </select>
          </div>

          <p className="mt-3 text-sm text-[var(--foreground-muted)]">
            Showing {filteredDonations.length} of {donations.length} available
            pickup{donations.length === 1 ? '' : 's'}.
          </p>

          {!volunteerHasLocation && (
            <p className="mt-2 text-sm text-[var(--color-accent)]">
              Set your location in{' '}
              <a href="/profile" className="underline">
                your profile
              </a>{' '}
              to sort pickups by distance.
            </p>
          )}
        </section>
      )}

      {loading ? (
        <p className="mt-8 text-[var(--foreground-muted)]">Loading available donations...</p>
      ) : donations.length === 0 ? (
        <p className="card mt-8 p-5 text-[var(--foreground-muted)]">
          No food pickups are available right now.
        </p>
      ) : filteredDonations.length === 0 ? (
        <p className="card mt-8 p-5 text-[var(--foreground-muted)]">
          No available donations match your search or filter.
        </p>
      ) : (
        <div className="mt-8 grid gap-5 md:grid-cols-2">
          {filteredDonations.map((donation, index) => (
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

              <div className="flex items-center gap-2">
                <div className="icon-badge h-9 w-9 shrink-0">
                  <CategoryIcon category={donation.category} className="h-4.5 w-4.5" />
                </div>
                <h2 className="text-xl font-semibold text-[var(--foreground)]">
                  {donation.title}
                </h2>
              </div>

              <p className="mt-2 text-[var(--foreground-muted)]">
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
                  <b>Distance from you:</b> {donation.distanceKm} km
                </p>
              )}

              {donation.specialInstructions && (
                <p className="mt-2 text-sm text-[var(--foreground-muted)]">
                  <b className="text-[var(--foreground)]">Handling instructions:</b>{' '}
                  {donation.specialInstructions}
                </p>
              )}

              <hr className="my-4 border-[var(--border)]" />

              <p className="text-sm text-[var(--foreground-muted)]">
                <b className="text-[var(--foreground)]">Donor:</b> {donation.donorId?.name || 'Not available'}
              </p>

              <p className="mt-2 rounded-xl border border-[var(--color-primary)]/20 bg-[var(--color-primary-light)] p-3 text-sm text-[var(--color-primary)]">
                The donor's pickup address and phone number become visible only
                after you accept this pickup.
              </p>

              <button
                onClick={() => claimDonation(donation._id)}
                disabled={claimingId === donation._id || !shelterId || verificationStatus !== 'verified'}
                className="btn-primary mt-5 w-full"
              >
                {claimingId === donation._id
                  ? 'Accepting pickup...'
                  : 'Accept Pickup'}
              </button>
            </article>
          ))}
        </div>
      )}
    </main>
  );
}