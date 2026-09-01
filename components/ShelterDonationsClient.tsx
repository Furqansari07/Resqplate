'use client';

import { useEffect, useMemo, useState } from 'react';
import RatingWidget from '@/components/RatingWidget';
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
      <h1 className="text-3xl font-bold text-gray-900">
        Incoming Food Donations
      </h1>

      <p className="mt-2 text-gray-600">
        Review food details, coordinate with volunteers, and confirm receipt
        when food arrives.
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

      {!loading && donations.length > 0 && (
        <section className="mt-6 rounded-lg bg-white p-5 shadow">
          <h2 className="text-lg font-semibold text-gray-900">
            Find an incoming donation
          </h2>

          <div className="mt-4 grid gap-4 md:grid-cols-3">
            <input
              type="search"
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder="Search food, donor, or volunteer"
              className="rounded border border-gray-300 p-3 text-black"
            />

            <select
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value)}
              className="rounded border border-gray-300 p-3 text-black"
            >
              <option value="all">All statuses</option>

              {statuses.map((status) => (
                <option key={status} value={status}>
                  {status.replace('-', ' ')}
                </option>
              ))}
            </select>

            <select
              value={sortBy}
              onChange={(event) => setSortBy(event.target.value)}
              className="rounded border border-gray-300 p-3 text-black"
            >
              <option value="newest">Newest assigned donations</option>
              <option value="pickup-deadline">
                Earliest pickup deadline
              </option>
            </select>
          </div>

          <p className="mt-3 text-sm text-gray-600">
            Showing {filteredDonations.length} of {donations.length} assigned
            donation{donations.length === 1 ? '' : 's'}.
          </p>
        </section>
      )}

      {loading ? (
        <p className="mt-8 text-gray-600">Loading incoming donations...</p>
      ) : donations.length === 0 ? (
        <p className="mt-8 rounded bg-white p-5 text-gray-600 shadow">
          No donations have been assigned to your shelter yet.
        </p>
      ) : filteredDonations.length === 0 ? (
        <p className="mt-8 rounded bg-white p-5 text-gray-600 shadow">
          No donations match your current search or filter.
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

              <div className="flex items-start justify-between gap-3">
                <h2 className="text-xl font-semibold text-gray-900">
                  {donation.title}
                </h2>

                <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-medium capitalize text-emerald-800">
                  {donation.status}
                </span>
              </div>

              <p className="mt-3 text-gray-700">
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
                  <b>Distance from donor:</b> {donation.distanceKm} km
                </p>
              )} 

              {donation.specialInstructions && (
                <p className="mt-2 rounded bg-amber-50 p-3 text-sm text-amber-900">
                  <b>Food-handling instructions:</b>{' '}
                  {donation.specialInstructions}
                </p>
              )}

              <hr className="my-4" />

              <p className="text-sm text-gray-700">
                <b>Donor:</b> {donation.donorId?.name || 'Not available'}
              </p>

              <p className="mt-1 text-sm text-gray-700">
                <b>Volunteer:</b>{' '}
                {donation.volunteerId?.name || 'Not assigned yet'}
              </p>

              <p className="mt-1 text-sm text-gray-700">
                <b>Volunteer phone:</b>{' '}
                {donation.volunteerId?.phone || 'Not provided'}
              </p>

              <section className="mt-5 rounded bg-gray-50 p-4">
                <h3 className="font-medium text-gray-900">
                  Delivery timeline
                </h3>

                <div className="mt-3 space-y-3 text-sm">
                  <p className="text-gray-700">
                    <b>1. Volunteer accepted pickup:</b>{' '}
                    {formatTimelineDate(donation.claimedAt)}
                  </p>

                  <p className="text-gray-700">
                    <b>2. Food marked in transit:</b>{' '}
                    {formatTimelineDate(donation.inTransitAt)}
                  </p>

                  <p className="text-gray-700">
                    <b>3. Volunteer marked food delivered:</b>{' '}
                    {formatTimelineDate(donation.deliveredAt)}
                  </p>

                  <p className="text-gray-700">
                    <b>4. Shelter confirmed receipt:</b>{' '}
                    {formatTimelineDate(donation.receivedAt)}
                  </p>
                </div>
              </section>

              {donation.status === 'delivered' && (
                <button
                  onClick={() => confirmReceipt(donation._id)}
                  disabled={confirmingId === donation._id}
                  className="mt-5 w-full rounded bg-emerald-600 px-4 py-2 font-medium text-white hover:bg-emerald-700 disabled:opacity-50"
                >
                  {confirmingId === donation._id
                    ? 'Confirming receipt...'
                    : 'Confirm receipt'}
                </button>
              )}
                          {donation.status === 'received' && (
                <>
                  <p className="mt-5 rounded bg-green-50 p-3 text-sm text-green-700">
                    Your shelter has confirmed receipt of this food donation.
                  </p>

                  <RatingWidget
                    donationId={donation._id}
                    myRole="shelter"
                  />
                </>
              )}
             
            </article>
          ))}
        </div>
      )}
    </main>
  );
}