'use client';

import { useEffect, useState } from 'react';
import {
  LayoutDashboard,
  Users,
  Package,
  CheckCircle2,
  XCircle,
  FileText,
  User as UserIcon,
  Bike,
  UtensilsCrossed,
  Home as HomeIcon,
} from 'lucide-react';

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

type VerificationDocs = {
  // volunteer
  addressProofUrl?: string;
  vehicleLicenseUrl?: string;
  vehicleDocumentUrl?: string;
  criminalRecordUrl?: string;
  aadharCardUrl?: string;
  // donor
  governmentIdUrl?: string;
  businessDocUrl?: string;
  // shelter
  registrationCertificateUrl?: string;
  panCardUrl?: string;
  fssaiRegistrationDocUrl?: string;
};

type VerificationUser = {
  _id: string;
  name: string;
  email: string;
  role: string;
  organizationName?: string;
  profilePhotoUrl?: string;
  donorType?: 'individual' | 'commercial';
  gstin?: string;
  fssaiNumber?: string;
  foodSafetyUndertaking?: boolean;
  ngoDarpanId?: string;
  verificationStatus: 'unverified' | 'pending' | 'verified' | 'rejected';
  verificationDocumentUrl?: string;
  verificationDocuments?: VerificationDocs;
  verificationSubmittedAt?: string;
  verificationRejectionReason?: string;
};

const TABS = [
  'Overview',
  'Users',
  'Listings',
  'Volunteer Verification',
  'Donor Verification',
  'Shelter Verification',
] as const;
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

const statusBadgeStyles: Record<string, string> = {
  available: 'bg-[var(--color-primary-light)] text-[var(--color-primary)]',
  claimed: 'bg-[var(--color-accent-light)] text-[var(--color-accent)]',
  'in-transit': 'bg-[var(--color-accent-light)] text-[var(--color-accent)]',
  delivered: 'bg-[var(--color-secondary-light)] text-[var(--color-secondary)]',
  received: 'bg-[var(--color-secondary-light)] text-[var(--color-secondary)]',
  cancelled: 'bg-[var(--color-danger-light)] text-[var(--color-danger)]',
  expired: 'bg-[var(--color-danger-light)] text-[var(--color-danger)]',
};

const roleBadgeStyles: Record<string, string> = {
  donor: 'bg-[var(--color-primary-light)] text-[var(--color-primary)]',
  volunteer: 'bg-[var(--color-accent-light)] text-[var(--color-accent)]',
  shelter: 'bg-[var(--color-secondary-light)] text-[var(--color-secondary)]',
  admin: 'bg-[var(--surface-2)] text-[var(--foreground-muted)]',
};

const verificationBadgeStyles: Record<string, string> = {
  pending: 'bg-[var(--color-accent-light)] text-[var(--color-accent)]',
  verified: 'bg-[var(--color-secondary-light)] text-[var(--color-secondary)]',
  rejected: 'bg-[var(--color-danger-light)] text-[var(--color-danger)]',
};

export default function AdminDashboardClient() {
  const [activeTab, setActiveTab] = useState<Tab>('Overview');

  const [stats, setStats] = useState<Stats | null>(null);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [donations, setDonations] = useState<AdminDonation[]>([]);
  const [verifications, setVerifications] = useState<VerificationUser[]>([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [roleFilter, setRoleFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');

  const [removingUserId, setRemovingUserId] = useState('');
  const [removingDonationId, setRemovingDonationId] = useState('');
  const [decidingId, setDecidingId] = useState('');
  const [rejectReasons, setRejectReasons] = useState<Record<string, string>>({});

  const loadAll = async () => {
    setLoading(true);
    setError('');

    try {
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
      } else {
        setStats(statsData);
        setUsers(usersData.users);
        setDonations(donationsData.donations);
      }
    } catch {
      setError('Unable to connect to the server.');
    } finally {
      setLoading(false);
    }

    try {
      const verificationsRes = await fetch('/api/admin/verifications');
      const verificationsData = await verificationsRes.json();
      setVerifications(verificationsRes.ok ? verificationsData.users : []);
    } catch {
      setVerifications([]);
    }
  };

  useEffect(() => {
    loadAll();
  }, []);

  const removeUser = async (id: string, name: string) => {
    const confirmed = window.confirm(`Remove ${name}'s account? This cannot be undone.`);
    if (!confirmed) return;

    setRemovingUserId(id);
    setError('');

    try {
      const response = await fetch(`/api/admin/users/${id}`, { method: 'DELETE' });
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
    const confirmed = window.confirm(`Remove the listing "${title}"? This cannot be undone.`);
    if (!confirmed) return;

    setRemovingDonationId(id);
    setError('');

    try {
      const response = await fetch(`/api/admin/donations/${id}`, { method: 'DELETE' });
      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Unable to remove this listing.');
        return;
      }

      setDonations((previous) => previous.filter((donation) => donation._id !== id));
    } catch {
      setError('Unable to connect to the server.');
    } finally {
      setRemovingDonationId('');
    }
  };

  const decideVerification = async (id: string, status: 'verified' | 'rejected') => {
    if (status === 'rejected' && !rejectReasons[id]?.trim()) {
      setError('Please enter a reason before rejecting.');
      return;
    }

    setDecidingId(id);
    setError('');

    try {
      const response = await fetch(`/api/admin/verifications/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, reason: rejectReasons[id] }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Unable to update verification status.');
        return;
      }

      setVerifications((previous) =>
        previous.map((v) => (v._id === id ? { ...v, verificationStatus: status } : v))
      );
    } catch {
      setError('Unable to connect to the server.');
    } finally {
      setDecidingId('');
    }
  };

  const filteredUsers = users.filter((user) => roleFilter === 'all' || user.role === roleFilter);
  const filteredDonations = donations.filter((donation) => statusFilter === 'all' || donation.status === statusFilter);

  const volunteerVerifications = verifications.filter((v) => v.role === 'volunteer');
  const donorVerifications = verifications.filter((v) => v.role === 'donor');
  const shelterVerifications = verifications.filter((v) => v.role === 'shelter');

  const pendingCountByRole = (role: string) =>
    verifications.filter((v) => v.role === role && v.verificationStatus === 'pending').length;

  const tabIcon: Record<Tab, React.ComponentType<{ className?: string }>> = {
    Overview: LayoutDashboard,
    Users: Users,
    Listings: Package,
    'Volunteer Verification': Bike,
    'Donor Verification': UtensilsCrossed,
    'Shelter Verification': HomeIcon,
  };

  const renderVerificationCards = (list: VerificationUser[], role: 'volunteer' | 'donor' | 'shelter') => {
    if (list.length === 0) {
      return <p className="card p-5 text-[var(--foreground-muted)]">No {role} verification requests yet.</p>;
    }

    return (
      <div className="grid gap-4 md:grid-cols-2">
        {list.map((v) => {
          const docs = v.verificationDocuments || {};
          let documentEntries: { label: string; url?: string }[] = [];

          if (role === 'volunteer') {
            documentEntries = [
              { label: 'Address Proof', url: docs.addressProofUrl },
              { label: 'Driving License', url: docs.vehicleLicenseUrl },
              { label: 'Vehicle Document', url: docs.vehicleDocumentUrl },
              { label: 'Police Clearance', url: docs.criminalRecordUrl },
              { label: 'Aadhar Card', url: docs.aadharCardUrl },
            ].filter((d) => d.url);
          } else if (role === 'donor') {
            documentEntries =
              v.donorType === 'commercial'
                ? [{ label: 'Business Document (FSSAI/GST)', url: docs.businessDocUrl }].filter((d) => d.url)
                : [{ label: 'Government ID', url: docs.governmentIdUrl }].filter((d) => d.url);
          } else if (role === 'shelter') {
            documentEntries = [
              { label: 'Registration Certificate', url: docs.registrationCertificateUrl },
              { label: 'PAN Card', url: docs.panCardUrl },
              { label: 'FSSAI Registration', url: docs.fssaiRegistrationDocUrl },
            ].filter((d) => d.url);
          }

          return (
            <article key={v._id} className="card card-hover p-5">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  {v.profilePhotoUrl ? (
                    <img src={v.profilePhotoUrl} alt={v.name} className="h-10 w-10 rounded-full object-cover" />
                  ) : (
                    <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--surface-2)] text-[var(--foreground-subtle)]">
                      <UserIcon className="h-5 w-5" />
                    </span>
                  )}
                  <div>
                    <h3 className="font-semibold text-[var(--foreground)]">{v.name}</h3>
                    <p className="text-sm text-[var(--foreground-muted)]">{v.email}</p>
                    {v.organizationName && (
                      <p className="text-xs text-[var(--foreground-subtle)]">{v.organizationName}</p>
                    )}
                  </div>
                </div>

                <span className={`badge capitalize ${verificationBadgeStyles[v.verificationStatus] || 'bg-[var(--surface-2)] text-[var(--foreground-muted)]'}`}>
                  {v.verificationStatus}
                </span>
              </div>

              {role === 'donor' && (
                <div className="mt-2 flex flex-wrap gap-2">
                  <span className="badge bg-[var(--surface-2)] text-[var(--foreground-muted)] capitalize">
                    {v.donorType || 'individual'}
                  </span>
                  {v.donorType === 'commercial' && (
                    <>
                      {v.fssaiNumber && (
                        <span className="badge bg-[var(--surface-2)] text-[var(--foreground-muted)]">
                          FSSAI: {v.fssaiNumber}
                        </span>
                      )}
                      {v.gstin && (
                        <span className="badge bg-[var(--surface-2)] text-[var(--foreground-muted)]">
                          GSTIN: {v.gstin}
                        </span>
                      )}
                    </>
                  )}
                  {v.donorType !== 'commercial' && (
                    <span className={`badge ${v.foodSafetyUndertaking ? 'bg-[var(--color-secondary-light)] text-[var(--color-secondary)]' : 'bg-[var(--color-danger-light)] text-[var(--color-danger)]'}`}>
                      {v.foodSafetyUndertaking ? 'Undertaking accepted' : 'Undertaking not accepted'}
                    </span>
                  )}
                </div>
              )}

              {role === 'shelter' && v.ngoDarpanId && (
                <p className="mt-2 text-xs text-[var(--foreground-subtle)]">
                  NGO Darpan ID: <span className="text-[var(--foreground)]">{v.ngoDarpanId}</span>
                </p>
              )}

              {v.verificationSubmittedAt && (
                <p className="mt-2 text-xs text-[var(--foreground-subtle)]">
                  Submitted {new Date(v.verificationSubmittedAt).toLocaleString()}
                </p>
              )}

              {documentEntries.length > 0 && (
                <div className="mt-3 grid grid-cols-2 gap-2">
                  {documentEntries.map((d) => (
                    <a
                      key={d.label}
                      href={d.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1.5 rounded-xl border border-[var(--border)] bg-[var(--surface-2)] px-3 py-2 text-xs font-semibold text-[var(--foreground)] transition-colors hover:bg-[var(--surface)]"
                    >
                      <FileText className="h-3.5 w-3.5 shrink-0" /> {d.label}
                    </a>
                  ))}
                </div>
              )}

              {v.verificationStatus === 'rejected' && v.verificationRejectionReason && (
                <p className="mt-3 rounded-xl border border-[var(--color-danger)]/20 bg-[var(--color-danger-light)] p-2 text-xs text-[var(--color-danger)]">
                  Rejected: {v.verificationRejectionReason}
                </p>
              )}

              {v.verificationStatus === 'pending' && (
                <div className="mt-4 space-y-3">
                  <textarea
                    value={rejectReasons[v._id] || ''}
                    onChange={(e) => setRejectReasons((prev) => ({ ...prev, [v._id]: e.target.value }))}
                    placeholder="Reason (required only if rejecting)"
                    className="input min-h-16 resize-none text-sm"
                  />

                  <div className="flex gap-3">
                    <button
                      onClick={() => decideVerification(v._id, 'verified')}
                      disabled={decidingId === v._id}
                      className="btn-primary flex-1 !bg-[var(--color-secondary)] hover:!bg-[var(--color-secondary-hover)] text-sm"
                    >
                      <CheckCircle2 className="h-4 w-4" />
                      {decidingId === v._id ? 'Saving...' : 'Approve'}
                    </button>
                    <button
                      onClick={() => decideVerification(v._id, 'rejected')}
                      disabled={decidingId === v._id}
                      className="inline-flex flex-1 items-center justify-center gap-2 rounded-full bg-[var(--color-danger)] px-4 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <XCircle className="h-4 w-4" />
                      Reject
                    </button>
                  </div>
                </div>
              )}
            </article>
          );
        })}
      </div>
    );
  };

  return (
    <main className="mx-auto max-w-6xl px-4 py-8">
      <h1 className="text-3xl font-bold text-[var(--foreground)] animate-fade-in-up">Admin Panel</h1>

      <p className="mt-2 text-[var(--foreground-muted)] animate-fade-in-up" style={{ animationDelay: '60ms' }}>
        Monitor platform activity and manage users and listings.
      </p>

      {error && (
        <p className="mt-4 rounded-xl border border-[var(--color-danger)]/20 bg-[var(--color-danger-light)] p-3 text-sm text-[var(--color-danger)]">
          {error}
        </p>
      )}

      <div className="mt-6 flex flex-wrap gap-1 border-b border-[var(--border)]">
        {TABS.map((tab) => {
          const TabIcon = tabIcon[tab];
          const pendingBadge =
            tab === 'Volunteer Verification'
              ? pendingCountByRole('volunteer')
              : tab === 'Donor Verification'
                ? pendingCountByRole('donor')
                : tab === 'Shelter Verification'
                  ? pendingCountByRole('shelter')
                  : 0;

          return (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`relative flex items-center gap-2 whitespace-nowrap px-3 py-2.5 text-sm font-semibold transition-colors ${
                activeTab === tab
                  ? 'text-[var(--color-primary)]'
                  : 'text-[var(--foreground-muted)] hover:text-[var(--foreground)]'
              }`}
            >
              <TabIcon className="h-4 w-4" />
              {tab}
              {pendingBadge > 0 && (
                <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-[var(--color-danger)] px-1 text-xs font-bold text-white">
                  {pendingBadge}
                </span>
              )}
              {activeTab === tab && (
                <span className="absolute bottom-0 left-0 right-0 h-0.5 rounded-full bg-[var(--color-primary)]" />
              )}
            </button>
          );
        })}
      </div>

      {loading ? (
        <p className="mt-6 text-[var(--foreground-muted)]">Loading admin data...</p>
      ) : (
        <div className="mt-6 animate-fade-in-up">
          {activeTab === 'Overview' && stats && (
            <div className="grid gap-6 md:grid-cols-2">
              <section className="card p-5">
                <h2 className="font-semibold text-[var(--foreground)]">Users</h2>
                <dl className="mt-3 grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <dt className="text-[var(--foreground-subtle)]">Total</dt>
                    <dd className="text-lg font-bold text-[var(--foreground)]">{stats.users.total}</dd>
                  </div>
                  <div>
                    <dt className="text-[var(--foreground-subtle)]">Donors</dt>
                    <dd className="text-lg font-bold text-[var(--color-primary)]">{stats.users.donor}</dd>
                  </div>
                  <div>
                    <dt className="text-[var(--foreground-subtle)]">Volunteers</dt>
                    <dd className="text-lg font-bold text-[var(--color-accent)]">{stats.users.volunteer}</dd>
                  </div>
                  <div>
                    <dt className="text-[var(--foreground-subtle)]">Shelters</dt>
                    <dd className="text-lg font-bold text-[var(--color-secondary)]">{stats.users.shelter}</dd>
                  </div>
                  <div>
                    <dt className="text-[var(--foreground-subtle)]">Admins</dt>
                    <dd className="text-lg font-bold text-[var(--foreground)]">{stats.users.admin}</dd>
                  </div>
                </dl>
              </section>

              <section className="card p-5">
                <h2 className="font-semibold text-[var(--foreground)]">Donation outcomes</h2>
                <dl className="mt-3 grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <dt className="text-[var(--foreground-subtle)]">Total listings</dt>
                    <dd className="text-lg font-bold text-[var(--foreground)]">{stats.donations.total}</dd>
                  </div>
                  <div>
                    <dt className="text-[var(--foreground-subtle)]">Available</dt>
                    <dd className="text-lg font-bold text-[var(--color-primary)]">{stats.donations.available}</dd>
                  </div>
                  <div>
                    <dt className="text-[var(--foreground-subtle)]">Claimed</dt>
                    <dd className="text-lg font-bold text-[var(--color-accent)]">{stats.donations.claimed}</dd>
                  </div>
                  <div>
                    <dt className="text-[var(--foreground-subtle)]">In transit</dt>
                    <dd className="text-lg font-bold text-[var(--color-accent)]">{stats.donations.inTransit}</dd>
                  </div>
                  <div>
                    <dt className="text-[var(--foreground-subtle)]">Delivered</dt>
                    <dd className="text-lg font-bold text-[var(--color-secondary)]">{stats.donations.delivered}</dd>
                  </div>
                  <div>
                    <dt className="text-[var(--foreground-subtle)]">Received</dt>
                    <dd className="text-lg font-bold text-[var(--color-secondary)]">{stats.donations.received}</dd>
                  </div>
                  <div>
                    <dt className="text-[var(--foreground-subtle)]">Cancelled</dt>
                    <dd className="text-lg font-bold text-[var(--color-danger)]">{stats.donations.cancelled}</dd>
                  </div>
                  <div>
                    <dt className="text-[var(--foreground-subtle)]">Expired</dt>
                    <dd className="text-lg font-bold text-[var(--color-danger)]">{stats.donations.expired}</dd>
                  </div>
                </dl>
              </section>
            </div>
          )}

          {activeTab === 'Users' && (
            <section>
              <div className="mb-4 flex flex-wrap items-center gap-3">
                <label className="text-sm text-[var(--foreground-muted)]">Filter by role:</label>
                <select value={roleFilter} onChange={(event) => setRoleFilter(event.target.value)} className="input w-auto !py-2 text-sm">
                  {ROLE_FILTERS.map((role) => (
                    <option key={role} value={role} className="bg-[var(--surface)]">
                      {role === 'all' ? 'All roles' : role}
                    </option>
                  ))}
                </select>
                <span className="text-sm text-[var(--foreground-subtle)]">{filteredUsers.length} of {users.length} users</span>
              </div>

              <div className="card overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="border-b border-[var(--border)] text-xs uppercase text-[var(--foreground-subtle)]">
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
                      <tr key={user._id} className="border-t border-[var(--border)] transition-colors hover:bg-[var(--surface-2)]">
                        <td className="px-4 py-3 text-[var(--foreground)]">
                          {user.name}
                          {user.organizationName && (
                            <span className="block text-xs text-[var(--foreground-subtle)]">{user.organizationName}</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-[var(--foreground-muted)]">{user.email}</td>
                        <td className="px-4 py-3">
                          <span className={`badge capitalize ${roleBadgeStyles[user.role] || 'bg-[var(--surface-2)] text-[var(--foreground-muted)]'}`}>
                            {user.role}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-[var(--foreground-muted)]">{user.phone || '—'}</td>
                        <td className="px-4 py-3 text-[var(--foreground-muted)]">{new Date(user.createdAt).toLocaleDateString()}</td>
                        <td className="px-4 py-3">
                          <button
                            onClick={() => removeUser(user._id, user.name)}
                            disabled={removingUserId === user._id}
                            className="inline-flex items-center justify-center gap-1 rounded-full bg-[var(--color-danger)] px-3 py-1.5 text-xs font-semibold text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            {removingUserId === user._id ? 'Removing...' : 'Remove'}
                          </button>
                        </td>
                      </tr>
                    ))}
                    {filteredUsers.length === 0 && (
                      <tr>
                        <td colSpan={6} className="px-4 py-6 text-center text-[var(--foreground-subtle)]">
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
              <div className="mb-4 flex flex-wrap items-center gap-3">
                <label className="text-sm text-[var(--foreground-muted)]">Filter by status:</label>
                <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)} className="input w-auto !py-2 text-sm">
                  {STATUS_FILTERS.map((status) => (
                    <option key={status} value={status} className="bg-[var(--surface)]">
                      {status === 'all' ? 'All statuses' : status}
                    </option>
                  ))}
                </select>
                <span className="text-sm text-[var(--foreground-subtle)]">{filteredDonations.length} of {donations.length} listings</span>
              </div>

              <div className="card overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="border-b border-[var(--border)] text-xs uppercase text-[var(--foreground-subtle)]">
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
                      <tr key={donation._id} className="border-t border-[var(--border)] transition-colors hover:bg-[var(--surface-2)]">
                        <td className="px-4 py-3 text-[var(--foreground)]">
                          {donation.title}
                          <span className="block text-xs text-[var(--foreground-subtle)]">
                            {donation.quantity} · {donation.category}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-[var(--foreground-muted)]">{donation.donorId?.name || '—'}</td>
                        <td className="px-4 py-3 text-[var(--foreground-muted)]">{donation.volunteerId?.name || '—'}</td>
                        <td className="px-4 py-3 text-[var(--foreground-muted)]">{donation.targetShelterId?.name || '—'}</td>
                        <td className="px-4 py-3">
                          <span className={`badge capitalize ${statusBadgeStyles[donation.status] || 'bg-[var(--surface-2)] text-[var(--foreground-muted)]'}`}>
                            {donation.status}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-[var(--foreground-muted)]">{new Date(donation.createdAt).toLocaleDateString()}</td>
                        <td className="px-4 py-3">
                          <button
                            onClick={() => removeDonation(donation._id, donation.title)}
                            disabled={removingDonationId === donation._id}
                            className="inline-flex items-center justify-center gap-1 rounded-full bg-[var(--color-danger)] px-3 py-1.5 text-xs font-semibold text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            {removingDonationId === donation._id ? 'Removing...' : 'Remove'}
                          </button>
                        </td>
                      </tr>
                    ))}
                    {filteredDonations.length === 0 && (
                      <tr>
                        <td colSpan={7} className="px-4 py-6 text-center text-[var(--foreground-subtle)]">
                          No listings match this filter.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </section>
          )}

          {activeTab === 'Volunteer Verification' && (
            <section>
              <p className="mb-4 text-sm text-[var(--foreground-muted)]">
                Review Aadhar, driving license, vehicle RC, police clearance, and address proof for volunteers.
              </p>
              {renderVerificationCards(volunteerVerifications, 'volunteer')}
            </section>
          )}

          {activeTab === 'Donor Verification' && (
            <section>
              <p className="mb-4 text-sm text-[var(--foreground-muted)]">
                Individual donors submit a government ID and safety undertaking. Commercial donors submit FSSAI/GSTIN details.
              </p>
              {renderVerificationCards(donorVerifications, 'donor')}
            </section>
          )}

          {activeTab === 'Shelter Verification' && (
            <section>
              <p className="mb-4 text-sm text-[var(--foreground-muted)]">
                Review registration certificate, PAN card, NGO Darpan ID, and FSSAI registration for shelters/NGOs.
              </p>
              {renderVerificationCards(shelterVerifications, 'shelter')}
            </section>
          )}
        </div>
      )}
    </main>
  );
}