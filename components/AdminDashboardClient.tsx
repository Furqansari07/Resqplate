'use client';

import { useEffect, useState } from 'react';

type Stats = {
  users: {
    total: number;
    donor: number;
    volunteer: number;
    shelter: number;
    admin: number;
  };
  donations: {
    total: number;
    available: number;
    claimed: number;
    inTransit: number;
    delivered: number;
    received: number;
    cancelled: number;
    expired: number;
  };
};

type AdminUser = {
  _id: string;
  name: string;
  email: string;
  role: string;
  phone?: string;
  organizationName?: string;
  createdAt: string;
};

type PopulatedParty = { name?: string; email?: string } | null;

type AdminDonation = {
  _id: string;
  title: string;
  quantity: string;
  category: string;
  status: string;
  createdAt: string;
  donorId?: PopulatedParty;
  volunteerId?: PopulatedParty;
  targetShelterId?: PopulatedParty;
};

const TABS = ['Overview', 'Users', 'Listings'] as const;
type Tab = (typeof TABS)[number];

const ROLE_FILTERS = ['all', 'donor', 'volunteer', 'shelter', 'admin'];

const STATUS_FILTERS = [
  'all',
  'available',
  'claimed',
  'in-transit',
  'delivered',
  'received',
  'cancelled',
  'expired',
];

export default function AdminDashboardClient() {
  const [activeTab, setActiveTab] = useState<Tab>('Overview');

  const [stats, setStats] = useState<Stats | null>(null);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [donations, setDonations] = useState<AdminDonation[]>([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [roleFilter, setRoleFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');

  const [removingUserId, setRemovingUserId] = useState('');
  const [removingDonationId, setRemovingDonationId] = useState('');

  const loadAll = async () => {
    try {
      setLoading(true);
      setError('');

      const [statsRes, usersRes, donationsRes] = await Promise.all([
        fetch('/api/admin/stats'),
        fetch('/api/admin/users'),
        fetch('/api/admin/donations'),
      ]);

      const [statsData, usersData, donationsData] = await Promise.all([
        statsRes.json(),
        usersRes.json(),
        donationsRes.json(),
      ]);

      if (!statsRes.ok || !usersRes.ok || !donationsRes.ok) {
        setError(
          statsData.error ||
            usersData.error ||
            donationsData.error ||
            'Unable to load admin data.'
        );
        return;
      }

      setStats(statsData);
      setUsers(usersData.users);
      setDonations(donationsData.donations);
    } catch {
      setError('Unable to connect to the server.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAll();
  }, []);

  const removeUser = async (id: string, name: string) => {
    const confirmed = window.confirm(
      `Remove ${name}'s account? This cannot be undone.`
    );

    if (!confirmed) {
      return;
    }

    setRemovingUserId(id);
    setError('');

    try {
      const response = await fetch(`/api/admin/users/${id}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Unable to remove this user.');
        return;
      }

      setUsers((previous) => previous.filter((user) => user._id !== id));
    } catch {
      setError('Unable to connect to the server.');
    } finally {
      setRemovingUserId('');
    }
  };

  const removeDonation = async (id: string, title: string) => {
    const confirmed = window.confirm(
      `Remove the listing "${title}"? This cannot be undone.`
    );

    if (!confirmed) {
      return;
    }

    setRemovingDonationId(id);
    setError('');

    try {
      const response = await fetch(`/api/admin/donations/${id}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Unable to remove this listing.');
        return;
      }

      setDonations((previous) =>
        previous.filter((donation) => donation._id !== id)
      );
    } catch {
      setError('Unable to connect to the server.');
    } finally {
      setRemovingDonationId('');
    }
  };

  const filteredUsers = users.filter(
    (user) => roleFilter === 'all' || user.role === roleFilter
  );

  const filteredDonations = donations.filter(
    (donation) => statusFilter === 'all' || donation.status === statusFilter
  );

  return (
    <main className="mx-auto max-w-6xl px-4 py-8">
      <h1 className="text-3xl font-bold text-gray-900">Admin Panel</h1>

      <p className="mt-2 text-gray-600">
        Monitor platform activity and manage users and listings.
      </p>

      {error && (
        <p className="mt-4 rounded bg-red-50 p-3 text-sm text-red-700">
          {error}
        </p>
      )}

      <div className="mt-6 flex gap-2 border-b border-gray-200">
        {TABS.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 text-sm font-medium ${
              activeTab === tab
                ? 'border-b-2 border-emerald-600 text-emerald-700'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {loading ? (
        <p className="mt-6 text-gray-600">Loading admin data...</p>
      ) : (
        <div className="mt-6">
          {activeTab === 'Overview' && stats && (
            <div className="grid gap-6 md:grid-cols-2">
              <section className="rounded-lg bg-white p-5 shadow">
                <h2 className="font-semibold text-gray-900">Users</h2>

                <dl className="mt-3 grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <dt className="text-gray-500">Total</dt>
                    <dd className="text-lg font-semibold">
                      {stats.users.total}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-gray-500">Donors</dt>
                    <dd className="text-lg font-semibold">
                      {stats.users.donor}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-gray-500">Volunteers</dt>
                    <dd className="text-lg font-semibold">
                      {stats.users.volunteer}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-gray-500">Shelters</dt>
                    <dd className="text-lg font-semibold">
                      {stats.users.shelter}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-gray-500">Admins</dt>
                    <dd className="text-lg font-semibold">
                      {stats.users.admin}
                    </dd>
                  </div>
                </dl>
              </section>

              <section className="rounded-lg bg-white p-5 shadow">
                <h2 className="font-semibold text-gray-900">
                  Donation outcomes
                </h2>

                <dl className="mt-3 grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <dt className="text-gray-500">Total listings</dt>
                    <dd className="text-lg font-semibold">
                      {stats.donations.total}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-gray-500">Available</dt>
                    <dd className="text-lg font-semibold">
                      {stats.donations.available}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-gray-500">Claimed</dt>
                    <dd className="text-lg font-semibold">
                      {stats.donations.claimed}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-gray-500">In transit</dt>
                    <dd className="text-lg font-semibold">
                      {stats.donations.inTransit}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-gray-500">Delivered</dt>
                    <dd className="text-lg font-semibold">
                      {stats.donations.delivered}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-gray-500">Received</dt>
                    <dd className="text-lg font-semibold text-emerald-700">
                      {stats.donations.received}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-gray-500">Cancelled</dt>
                    <dd className="text-lg font-semibold">
                      {stats.donations.cancelled}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-gray-500">Expired</dt>
                    <dd className="text-lg font-semibold text-red-600">
                      {stats.donations.expired}
                    </dd>
                  </div>
                </dl>
              </section>
            </div>
          )}

          {activeTab === 'Users' && (
            <section>
              <div className="mb-4 flex items-center gap-3">
                <label className="text-sm text-gray-700">
                  Filter by role:
                </label>

                <select
                  value={roleFilter}
                  onChange={(event) => setRoleFilter(event.target.value)}
                  className="rounded border border-gray-300 p-2 text-sm text-black"
                >
                  {ROLE_FILTERS.map((role) => (
                    <option key={role} value={role}>
                      {role === 'all' ? 'All roles' : role}
                    </option>
                  ))}
                </select>

                <span className="text-sm text-gray-500">
                  {filteredUsers.length} of {users.length} users
                </span>
              </div>

              <div className="overflow-x-auto rounded-lg bg-white shadow">
                <table className="w-full text-left text-sm">
                  <thead className="bg-gray-50 text-xs uppercase text-gray-500">
                    <tr>
                      <th className="px-4 py-3">Name</th>
                      <th className="px-4 py-3">Email</th>
                      <th className="px-4 py-3">Role</th>
                      <th className="px-4 py-3">Phone</th>
                      <th className="px-4 py-3">Joined</th>
                      <th className="px-4 py-3">Action</th>
                    </tr>
                  </thead>

                  <tbody>
                    {filteredUsers.map((user) => (
                      <tr key={user._id} className="border-t border-gray-100">
                        <td className="px-4 py-3">
                          {user.name}
                          {user.organizationName && (
                            <span className="block text-xs text-gray-500">
                              {user.organizationName}
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3">{user.email}</td>
                        <td className="px-4 py-3 capitalize">{user.role}</td>
                        <td className="px-4 py-3">{user.phone || '—'}</td>
                        <td className="px-4 py-3">
                          {new Date(user.createdAt).toLocaleDateString()}
                        </td>
                        <td className="px-4 py-3">
                          <button
                            onClick={() => removeUser(user._id, user.name)}
                            disabled={removingUserId === user._id}
                            className="rounded bg-red-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-red-700 disabled:opacity-50"
                          >
                            {removingUserId === user._id
                              ? 'Removing...'
                              : 'Remove'}
                          </button>
                        </td>
                      </tr>
                    ))}

                    {filteredUsers.length === 0 && (
                      <tr>
                        <td
                          colSpan={6}
                          className="px-4 py-6 text-center text-gray-500"
                        >
                          No users match this filter.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </section>
          )}

          {activeTab === 'Listings' && (
            <section>
              <div className="mb-4 flex items-center gap-3">
                <label className="text-sm text-gray-700">
                  Filter by status:
                </label>

                <select
                  value={statusFilter}
                  onChange={(event) => setStatusFilter(event.target.value)}
                  className="rounded border border-gray-300 p-2 text-sm text-black"
                >
                  {STATUS_FILTERS.map((status) => (
                    <option key={status} value={status}>
                      {status === 'all' ? 'All statuses' : status}
                    </option>
                  ))}
                </select>

                <span className="text-sm text-gray-500">
                  {filteredDonations.length} of {donations.length} listings
                </span>
              </div>

              <div className="overflow-x-auto rounded-lg bg-white shadow">
                <table className="w-full text-left text-sm">
                  <thead className="bg-gray-50 text-xs uppercase text-gray-500">
                    <tr>
                      <th className="px-4 py-3">Title</th>
                      <th className="px-4 py-3">Donor</th>
                      <th className="px-4 py-3">Volunteer</th>
                      <th className="px-4 py-3">Shelter</th>
                      <th className="px-4 py-3">Status</th>
                      <th className="px-4 py-3">Created</th>
                      <th className="px-4 py-3">Action</th>
                    </tr>
                  </thead>

                  <tbody>
                    {filteredDonations.map((donation) => (
                      <tr
                        key={donation._id}
                        className="border-t border-gray-100"
                      >
                        <td className="px-4 py-3">
                          {donation.title}
                          <span className="block text-xs text-gray-500">
                            {donation.quantity} · {donation.category}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          {donation.donorId?.name || '—'}
                        </td>
                        <td className="px-4 py-3">
                          {donation.volunteerId?.name || '—'}
                        </td>
                        <td className="px-4 py-3">
                          {donation.targetShelterId?.name || '—'}
                        </td>
                        <td className="px-4 py-3 capitalize">
                          {donation.status}
                        </td>
                        <td className="px-4 py-3">
                          {new Date(donation.createdAt).toLocaleDateString()}
                        </td>
                        <td className="px-4 py-3">
                          <button
                            onClick={() =>
                              removeDonation(donation._id, donation.title)
                            }
                            disabled={removingDonationId === donation._id}
                            className="rounded bg-red-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-red-700 disabled:opacity-50"
                          >
                            {removingDonationId === donation._id
                              ? 'Removing...'
                              : 'Remove'}
                          </button>
                        </td>
                      </tr>
                    ))}

                    {filteredDonations.length === 0 && (
                      <tr>
                        <td
                          colSpan={7}
                          className="px-4 py-6 text-center text-gray-500"
                        >
                          No listings match this filter.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </section>
          )}
        </div>
      )}
    </main>
  );
}