'use client';

import { ChangeEvent, FormEvent, useEffect, useMemo, useState } from 'react';
import RatingWidget from '@/components/RatingWidget';
import CategoryIcon from '@/components/CategoryIcon';

type Donation = {
  _id: string;
  title: string;
  quantity: string;
  quantityAmount?: number | null;
  quantityUnit?: 'meals' | 'kg' | null;
  category: string;
  description?: string;
  photoUrl?: string;
  photoPublicId?: string;
  pickupBy?: string;
  specialInstructions?: string;
  status: string;
  createdAt: string;
  claimedAt?: string;
  inTransitAt?: string;
  deliveredAt?: string;
  receivedAt?: string;
};

const foodCategories = [
  'Cooked Meals',
  'Bakery Items',
  'Fruits and Vegetables',
  'Groceries',
  'Dairy Products',
  'Packaged Food',
  'Beverages',
  'Other',
];

const statusOptions = [
  { value: 'all', label: 'All statuses' },
  { value: 'available', label: 'Available' },
  { value: 'claimed', label: 'Claimed' },
  { value: 'in-transit', label: 'In transit' },
  { value: 'delivered', label: 'Delivered' },
  { value: 'received', label: 'Received' },
  { value: 'cancelled', label: 'Cancelled' },
  { value: 'expired', label: 'Expired' },
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

const emptyForm = {
  title: '',
  quantity: '',
  quantityAmount: '',
  quantityUnit: 'meals' as 'meals' | 'kg',
  category: '',
  description: '',
  pickupBy: '',
  specialInstructions: '',
  photoUrl: '',
  photoPublicId: '',
  safetyConfirmed: false,
};

function formatDateTimeLocal(dateString?: string) {
  if (!dateString) {
    return '';
  }

  const date = new Date(dateString);
  const timezoneOffset = date.getTimezoneOffset() * 60 * 1000;

  return new Date(date.getTime() - timezoneOffset)
    .toISOString()
    .slice(0, 16);
}

function formatTimelineDate(dateString?: string) {
  if (!dateString) {
    return 'Not recorded yet';
  }

  return new Date(dateString).toLocaleString();
}

export default function DonationsClient() {
  const [form, setForm] = useState(emptyForm);
  const [donations, setDonations] = useState<Donation[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [cancellingId, setCancellingId] = useState('');
  const [editingId, setEditingId] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const loadDonations = async () => {
    try {
      setLoading(true);

      const response = await fetch('/api/donations');
      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Unable to load donation listings.');
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

  const filteredDonations = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();

    return donations.filter((donation) => {
      const matchesStatus =
        statusFilter === 'all' || donation.status === statusFilter;

      const searchableText = [donation.title, donation.category]
        .join(' ')
        .toLowerCase();

      const matchesSearch =
        !normalizedSearch || searchableText.includes(normalizedSearch);

      return matchesStatus && matchesSearch;
    });
  }, [donations, searchTerm, statusFilter]);

  const resetForm = () => {
    setForm(emptyForm);
    setEditingId('');
  };

  const startEditing = (donation: Donation) => {
    setError('');
    setSuccess('');

    setForm({
      title: donation.title,
      quantity: donation.quantity,
      quantityAmount:
        typeof donation.quantityAmount === 'number'
          ? String(donation.quantityAmount)
          : '',
      quantityUnit: donation.quantityUnit || 'meals',
      category: donation.category,
      description: donation.description || '',
      pickupBy: formatDateTimeLocal(donation.pickupBy),
      specialInstructions: donation.specialInstructions || '',
      photoUrl: donation.photoUrl || '',
      photoPublicId: donation.photoPublicId || '',
      safetyConfirmed: true,
    });

    setEditingId(donation._id);

    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    });
  };

  const handlePhotoChange = async (
    event: ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    event.target.value = '';

    if (!file) {
      return;
    }

    setError('');
    setUploadingPhoto(true);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Unable to upload the photo.');
        return;
      }

      setForm((previous) => ({
        ...previous,
        photoUrl: data.photoUrl,
        photoPublicId: data.photoPublicId,
      }));
    } catch {
      setError('Unable to connect to the server.');
    } finally {
      setUploadingPhoto(false);
    }
  };

  const removePhoto = () => {
    setForm((previous) => ({
      ...previous,
      photoUrl: '',
      photoPublicId: '',
    }));
  };

    const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');
    setSuccess('');

    if (!form.photoUrl) {
      setError('Please upload a photo of the packed food before publishing.');
      return;
    }

    if (!form.safetyConfirmed) {
      setError('Please confirm the food safety declaration before publishing.');
      return;
    }

    setSubmitting(true);

    try {
      const isEditing = Boolean(editingId);
      const endpoint = isEditing
        ? `/api/donations/${editingId}`
        : '/api/donations';

      const response = await fetch(endpoint, {
        method: isEditing ? 'PATCH' : 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...form,
          quantityAmount:
            form.quantityAmount === '' ? null : Number(form.quantityAmount),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(
          data.error ||
            (isEditing
              ? 'Unable to update donation listing.'
              : 'Unable to create donation listing.')
        );
        return;
      }

      resetForm();

      setSuccess(
        isEditing
          ? 'Donation listing updated successfully.'
          : 'Donation listing created successfully.'
      );

      await loadDonations();
    } catch {
      setError('Unable to connect to the server.');
    } finally {
      setSubmitting(false);
    }
  };

  const cancelDonation = async (id: string) => {
    const confirmed = window.confirm(
      'Are you sure you want to cancel this donation listing?'
    );

    if (!confirmed) {
      return;
    }

    try {
      setCancellingId(id);
      setError('');
      setSuccess('');

      const response = await fetch(`/api/donations/${id}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Unable to cancel this donation.');
        return;
      }

      if (editingId === id) {
        resetForm();
      }

      setSuccess('Donation listing cancelled successfully.');
      await loadDonations();
    } catch {
      setError('Unable to connect to the server.');
    } finally {
      setCancellingId('');
    }
  };

  return (
    <main className="mx-auto max-w-5xl px-4 py-8">
      <h1 className="text-3xl font-bold text-[var(--foreground)] animate-fade-in-up">
        My Food Donations
      </h1>

      <p className="mt-2 text-[var(--foreground-muted)] animate-fade-in-up" style={{ animationDelay: '60ms' }}>
        Add surplus food so volunteers can arrange a safe pickup.
      </p>

      <section className="card mt-8 p-6 animate-fade-in-up" style={{ animationDelay: '120ms' }}>
        <div className="flex items-center justify-between gap-4">
          <h2 className="text-xl font-semibold text-[var(--foreground)]">
            {editingId ? 'Edit donation listing' : 'Create a donation listing'}
          </h2>

          {editingId && (
            <button type="button" onClick={resetForm} className="btn-secondary !px-3 !py-2 text-sm">
              Cancel editing
            </button>
          )}
        </div>

        {error && (
          <p className="mt-4 rounded-xl border border-[var(--color-danger)]/20 bg-[var(--color-danger-light)] p-3 text-sm text-[var(--color-danger)]">
            {error}
          </p>
        )}

        {success && (
          <p className="mt-4 rounded-xl border border-[var(--color-secondary)]/20 bg-[var(--color-secondary-light)] p-3 text-sm text-[var(--color-secondary)]">
            {success}
          </p>
        )}

        <form
          onSubmit={handleSubmit}
          className="mt-5 grid gap-4 md:grid-cols-2"
        >
          <input
            required
            placeholder="Food title (example: Cooked rice meals)"
            value={form.title}
            onChange={(event) =>
              setForm({ ...form, title: event.target.value })
            }
            className="input"
          />

          <input
            required
            placeholder="Quantity (example: 25 meals)"
            value={form.quantity}
            onChange={(event) =>
              setForm({ ...form, quantity: event.target.value })
            }
            className="input"
          />

          <div className="md:col-span-2">
            <label className="label">
              Exact amount (optional, but needed for shelter capacity
              matching)
            </label>

            <div className="flex gap-3">
              <input
                type="number"
                min={0}
                placeholder="e.g. 25"
                value={form.quantityAmount}
                onChange={(event) =>
                  setForm({ ...form, quantityAmount: event.target.value })
                }
                className="input w-32"
              />

              <select
                value={form.quantityUnit}
                onChange={(event) =>
                  setForm({
                    ...form,
                    quantityUnit: event.target.value as 'meals' | 'kg',
                  })
                }
                className="input w-auto"
              >
                <option value="meals" className="bg-[var(--surface)]">meals</option>
                <option value="kg" className="bg-[var(--surface)]">kilograms</option>
              </select>
            </div>
          </div>

          <select
            required
            value={form.category}
            onChange={(event) =>
              setForm({ ...form, category: event.target.value })
            }
            className="input"
          >
            <option value="" disabled className="bg-[var(--surface)]">
              Select food category
            </option>

            {foodCategories.map((category) => (
              <option key={category} value={category} className="bg-[var(--surface)]">
                {category}
              </option>
            ))}
          </select>

          <input
            required
            type="datetime-local"
            min={new Date().toISOString().slice(0, 16)}
            value={form.pickupBy}
            onChange={(event) =>
              setForm({ ...form, pickupBy: event.target.value })
            }
            className="input"
          />

          <textarea
            placeholder="Food description (optional)"
            value={form.description}
            onChange={(event) =>
              setForm({ ...form, description: event.target.value })
            }
            className="input min-h-24 resize-none md:col-span-2"
          />

          <textarea
            placeholder="Allergen, storage, packaging, or pickup instructions (optional)"
            value={form.specialInstructions}
            onChange={(event) =>
              setForm({
                ...form,
                specialInstructions: event.target.value,
              })
            }
            className="input min-h-24 resize-none md:col-span-2"
          />

                      <div className="md:col-span-2">
            <label className="label">
              Food photo *
            </label>

            {form.photoUrl ? (
              <div className="flex items-center gap-4">
                <img
                  src={form.photoUrl}
                  alt="Food preview"
                  className="h-24 w-24 rounded-2xl border border-[var(--border)] object-cover"
                />

                <button type="button" onClick={removePhoto} className="btn-secondary !px-3 !py-2 text-sm">
                  Remove photo
                </button>
              </div>
            ) : (
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={handlePhotoChange}
                disabled={uploadingPhoto}
                className="block w-full text-sm text-[var(--foreground-muted)] file:mr-4 file:rounded-full file:border-0 file:bg-[var(--color-primary)] file:px-4 file:py-2 file:text-sm file:font-semibold file:text-white hover:file:bg-[var(--color-primary-hover)] disabled:opacity-50"
              />
            )}

            {uploadingPhoto && (
              <p className="mt-2 text-sm text-[var(--foreground-subtle)]">Uploading photo...</p>
            )}
          </div>

                    <label className="flex items-start gap-3 rounded-2xl border border-[var(--border)] bg-[var(--surface-2)] p-4 md:col-span-2">
            <input
              type="checkbox"
              checked={form.safetyConfirmed}
              onChange={(event) => setForm({ ...form, safetyConfirmed: event.target.checked })}
              className="mt-1 h-4 w-4 shrink-0 accent-[var(--color-primary)]"
            />
            <span className="text-sm text-[var(--foreground-muted)]">
              I confirm this food was prepared recently, stored hygienically, and contains no
              spoiled ingredients.
            </span>
          </label>

          <button
            type="submit"
            disabled={submitting || uploadingPhoto}
            className="btn-primary md:col-span-2"
          >
            {submitting
              ? editingId
                ? 'Updating listing...'
                : 'Creating listing...'
              : editingId
                ? 'Save changes'
                : 'Publish donation'}
          </button>
        </form>
      </section>

      <section className="mt-8">
        <h2 className="text-xl font-semibold text-[var(--foreground)]">
          Your listings
        </h2>

        {!loading && donations.length > 0 && (
          <div className="card mt-4 grid gap-4 p-5 md:grid-cols-2">
            <input
              type="search"
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder="Search by title or category"
              className="input"
            />

            <select
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value)}
              className="input"
            >
              {statusOptions.map((option) => (
                <option key={option.value} value={option.value} className="bg-[var(--surface)]">
                  {option.label}
                </option>
              ))}
            </select>

            <p className="text-sm text-[var(--foreground-muted)] md:col-span-2">
              Showing {filteredDonations.length} of {donations.length}{' '}
              listing{donations.length === 1 ? '' : 's'}.
            </p>
          </div>
        )}

        {loading ? (
          <p className="mt-4 text-[var(--foreground-muted)]">Loading listings...</p>
        ) : donations.length === 0 ? (
          <p className="card mt-4 p-5 text-[var(--foreground-muted)]">
            You have not created a donation listing yet.
          </p>
        ) : filteredDonations.length === 0 ? (
          <p className="card mt-4 p-5 text-[var(--foreground-muted)]">
            No listings match your search or filter.
          </p>
        ) : (
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            {filteredDonations.map((donation, index) => {
              const hasTimeline =
                donation.claimedAt ||
                donation.inTransitAt ||
                donation.deliveredAt ||
                donation.receivedAt;

              const badgeClass =
                statusBadgeStyles[donation.status] ||
                'bg-[var(--surface-2)] text-[var(--foreground-muted)]';

              return (
                <article
                  key={donation._id}
                  className="card card-hover animate-fade-in-up p-5"
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
                      <div className="icon-badge h-8 w-8 shrink-0">
                        <CategoryIcon category={donation.category} className="h-4 w-4" />
                      </div>
                      <div className="min-w-0">
                        <h3 className="truncate font-semibold text-[var(--foreground)]">
                          {donation.title}
                        </h3>
                        <p className="mt-1 text-sm text-[var(--foreground-muted)]">
                          {donation.quantity} · {donation.category}
                        </p>
                      </div>
                    </div>

                    <span className={`badge shrink-0 capitalize ${badgeClass}`}>
                      {donation.status}
                    </span>
                  </div>

                  {donation.description && (
                    <p className="mt-4 text-sm text-[var(--foreground-muted)]">
                      <b className="text-[var(--foreground)]">Description:</b> {donation.description}
                    </p>
                  )}

                  {donation.pickupBy && (
                    <p className="mt-2 text-sm text-[var(--foreground-muted)]">
                      <b className="text-[var(--foreground)]">Pickup deadline:</b>{' '}
                      {new Date(donation.pickupBy).toLocaleString()}
                    </p>
                  )}

                  {donation.specialInstructions && (
                    <p className="mt-2 text-sm text-[var(--foreground-muted)]">
                      <b className="text-[var(--foreground)]">Instructions:</b> {donation.specialInstructions}
                    </p>
                  )}

                  {hasTimeline && (
                    <section className="mt-4 rounded-2xl border border-[var(--border)] bg-[var(--surface-2)] p-4">
                      <h4 className="font-medium text-[var(--foreground)]">
                        Delivery timeline
                      </h4>

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
                  )}

                  <p className="mt-4 text-xs text-[var(--foreground-subtle)]">
                    Created: {new Date(donation.createdAt).toLocaleString()}
                  </p>

                  {donation.status === 'received' && (
                    <RatingWidget
                      donationId={donation._id}
                      myRole="donor"
                    />
                  )}

                  {donation.status === 'available' && (
                    <div className="mt-4 flex flex-wrap gap-3">
                      <button onClick={() => startEditing(donation)} className="btn-secondary text-sm">
                        Edit listing
                      </button>

                      <button
                        onClick={() => cancelDonation(donation._id)}
                        disabled={cancellingId === donation._id}
                        className="inline-flex items-center justify-center gap-2 rounded-full bg-[var(--color-danger)] px-4 py-2 text-sm font-semibold text-white transition-all duration-200 hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        {cancellingId === donation._id
                          ? 'Cancelling...'
                          : 'Cancel listing'}
                      </button>
                    </div>
                  )}
                </article>
              );
            })}
          </div>
        )}
      </section>
    </main>
  );
}