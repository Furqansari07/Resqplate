'use client';

import { useEffect, useState } from 'react';
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
  status: 'claimed' | 'in-transit' | 'delivered' | 'received';
  claimedAt?: string;
  inTransitAt?: string;
  deliveredAt?: string;
  receivedAt?: string;
  distanceKm?: number | null;
  donorId?: Person;
  targetShelterId?: Person;
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
      <h1 className="text-3xl font-bold text-gray-900">
        My Pickup Deliveries
      </h1>

      <p className="mt-2 text-gray-600">
        Update your delivery as you collect and deliver food.
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

      {loading ? (
        <p className="mt-8 text-gray-600">Loading your pickups...</p>
      ) : donations.length === 0 ? (
        <p className="mt-8 rounded bg-white p-5 text-gray-600 shadow">
          You have not accepted any pickups yet.
        </p>
      ) : (
        <div className="mt-8 grid gap-5 md:grid-cols-2">
          {donations.map((donation) => {
            const nextStatus =
              donation.status === 'claimed'
                ? 'in-transit'
                : donation.status === 'in-transit'
                  ? 'delivered'
                  : null;

            return (
              <article
                key={donation._id}
                className="rounded-lg bg-white p-6 shadow"
              >
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

                <hr className="my-4" />

                <p className="text-sm text-gray-700">
                  <b>Pickup from:</b>{' '}
                  {donation.donorId?.name || 'Donor not available'}
                </p>

                <p className="mt-1 text-sm text-gray-700">
                  <b>Donor address:</b>{' '}
                  {donation.donorId?.address || 'Not provided'}
                </p>

                <p className="mt-4 text-sm text-gray-700">
                  <b>Deliver to:</b>{' '}
                  {donation.targetShelterId?.name || 'Shelter not available'}
                </p>

                                <p className="mt-1 text-sm text-gray-700">
                  <b>Shelter address:</b>{' '}
                  {donation.targetShelterId?.address || 'Not provided'}
                </p>

                {typeof donation.distanceKm === 'number' && (
                  <p className="mt-2 text-sm font-medium text-emerald-700">
                    <b>Pickup → delivery distance:</b> {donation.distanceKm} km
                  </p>
                )}

                <section className="mt-5 rounded bg-gray-50 p-4">
                  <h3 className="font-medium text-gray-900">
                    Pickup timeline
                  </h3>

                  <div className="mt-3 space-y-3 text-sm">
                    <p className="text-gray-700">
                      <b>1. Pickup accepted:</b>{' '}
                      {formatTimelineDate(donation.claimedAt)}
                    </p>

                    <p className="text-gray-700">
                      <b>2. Marked in transit:</b>{' '}
                      {formatTimelineDate(donation.inTransitAt)}
                    </p>

                    <p className="text-gray-700">
                      <b>3. Marked delivered:</b>{' '}
                      {formatTimelineDate(donation.deliveredAt)}
                    </p>

                    <p className="text-gray-700">
                      <b>4. Shelter confirmed receipt:</b>{' '}
                      {formatTimelineDate(donation.receivedAt)}
                    </p>
                  </div>
                </section>

                {nextStatus && (
                  <button
                    onClick={() => updateStatus(donation._id, nextStatus)}
                    disabled={updatingId === donation._id}
                    className="mt-5 w-full rounded bg-emerald-600 px-4 py-2 font-medium text-white hover:bg-emerald-700 disabled:opacity-50"
                  >
                    {updatingId === donation._id
                      ? 'Updating...'
                      : nextStatus === 'in-transit'
                        ? 'Mark as In Transit'
                        : 'Mark as Delivered'}
                  </button>
                )}

                {donation.status === 'delivered' && (
                  <p className="mt-5 rounded bg-blue-50 p-3 text-sm text-blue-700">
                    Waiting for the shelter to confirm food receipt.
                  </p>
                )}

                              {donation.status === 'received' && (
                  <>
                    <p className="mt-5 rounded bg-green-50 p-3 text-sm text-green-700">
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