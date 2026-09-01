'use client';

import { useEffect, useMemo, useState } from 'react';

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
      <h1 className="text-3xl font-bold text-gray-900">
        Available Food Pickups
      </h1>

      <p className="mt-2 text-gray-600">
        Choose a destination shelter, then accept a food pickup.
      </p>

      {error && (
        <p className="mt-6 rounded bg-red-50 p-3 text-sm text-red-700">
          {error}
        </p>
      )}

      {success && (
        <p className="mt-6 rounded bg-green-50 p-3 text-sm text-green-700">
          {success}
        </p>
      )}

      <section className="mt-6 rounded-lg bg-white p-5 shadow">
        <label className="block text-sm font-medium text-gray-800">
          Deliver accepted food to
        </label>

        <select
          value={shelterId}
          onChange={(event) => setShelterId(event.target.value)}
          className="mt-2 w-full rounded border border-gray-300 p-3 text-black"
        >
          <option value="">Select a shelter / NGO</option>

                   {shelters.map((shelter) => (
            <option
              key={shelter._id}
              value={shelter._id}
              disabled={shelter.isFull}
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
          <p className="mt-3 text-sm text-red-600">
            No shelter account exists yet. Register a Shelter / NGO account
            first.
          </p>
        )}
      </section>

      {!loading && donations.length > 0 && (
        <section className="mt-6 rounded-lg bg-white p-5 shadow">
          <h2 className="text-lg font-semibold text-gray-900">
            Find a pickup
          </h2>

          <div className="mt-4 grid gap-4 md:grid-cols-3">
            <input
              type="search"
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder="Search food, category, or donor"
              className="rounded border border-gray-300 p-3 text-black"
            />

            <select
              value={categoryFilter}
              onChange={(event) => setCategoryFilter(event.target.value)}
              className="rounded border border-gray-300 p-3 text-black"
            >
              <option value="all">All categories</option>

              {categories.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>

                   <select
              value={sortBy}
              onChange={(event) => setSortBy(event.target.value)}
              className="rounded border border-gray-300 p-3 text-black"
            >
              <option value="newest">Newest listings</option>
              <option value="pickup-deadline">
                Earliest pickup deadline
              </option>
              <option value="distance">Nearest to me</option>
            </select>
          </div>

          <p className="mt-3 text-sm text-gray-600">
            Showing {filteredDonations.length} of {donations.length} available
            pickup{donations.length === 1 ? '' : 's'}.
          </p>

          {!volunteerHasLocation && (
            <p className="mt-2 text-sm text-amber-700">
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
        <p className="mt-8 text-gray-600">Loading available donations...</p>
      ) : donations.length === 0 ? (
        <p className="mt-8 rounded bg-white p-5 text-gray-600 shadow">
          No food pickups are available right now.
        </p>
      ) : filteredDonations.length === 0 ? (
        <p className="mt-8 rounded bg-white p-5 text-gray-600 shadow">
          No available donations match your search or filter.
        </p>
      ) : (
        <div className="mt-8 grid gap-5 md:grid-cols-2">
          {filteredDonations.map((donation) => (
            <article
              key={donation._id}
              className="rounded-lg bg-white p-6 shadow"
            >
              {donation.photoUrl && (
                <img
                  src={donation.photoUrl}
                  alt={donation.title}
                  className="mb-4 h-40 w-full rounded object-cover"
                />
              )}
              <h2 className="text-xl font-semibold text-gray-900">
                {donation.title}
              </h2>

              <p className="mt-2 text-gray-700">
                <b>Quantity:</b> {donation.quantity}
              </p>

              <p className="mt-1 text-gray-700">
                <b>Category:</b> {donation.category}
              </p>

              {donation.description && (
                <p className="mt-3 text-sm text-gray-700">
                  <b>Description:</b> {donation.description}
                </p>
              )}

                            {donation.pickupBy && (
                <p className="mt-2 text-sm font-medium text-red-700">
                  <b>Pickup deadline:</b>{' '}
                  {new Date(donation.pickupBy).toLocaleString()}
                </p>
              )}

              {typeof donation.distanceKm === 'number' && (
                <p className="mt-2 text-sm font-medium text-emerald-700">
                  <b>Distance from you:</b> {donation.distanceKm} km
                </p>
              )}

              {donation.specialInstructions && (
                <p className="mt-2 text-sm text-gray-700">
                  <b>Handling instructions:</b>{' '}
                  {donation.specialInstructions}
                </p>
              )}

              <hr className="my-4" />

              <p className="text-sm text-gray-700">
                <b>Donor:</b> {donation.donorId?.name || 'Not available'}
              </p>

              <p className="mt-2 rounded bg-blue-50 p-3 text-sm text-blue-800">
                The donor’s pickup address and phone number become visible only
                after you accept this pickup.
              </p>

              <button
                onClick={() => claimDonation(donation._id)}
                disabled={claimingId === donation._id || !shelterId}
                className="mt-5 w-full rounded bg-emerald-600 px-4 py-2 font-medium text-white hover:bg-emerald-700 disabled:opacity-50"
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