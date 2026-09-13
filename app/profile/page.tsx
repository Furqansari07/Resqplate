"use client";
import Navbar from "@/components/Navbar";
import ProfilePhotoUpload from '@/components/ProfilePhotoUpload';
import { useEffect, useState, Suspense} from "react";
import { useSearchParams } from "next/navigation";
import AddressPicker, { type AddressValue } from "@/components/AddressPicker";
import { getProfileCompletion } from "@/lib/profileCompletion";

interface UserProfile {
  name: string;
  email: string;
  role: string;
  phone?: string;
  address?: string;
  streetAddress?: string;
  city?: string;
  state?: string;
  country?: string;
  pincode?: string;
  organizationName?: string;
  latitude?: number | null;
  longitude?: number | null;
  shelterCapacity?: number | null;
  shelterCapacityUnit?: 'meals' | 'kg' | null;
  profilePhotoUrl?: string;
  vehicleType?: string;
  verificationStatus?: string;
}

function ProfilePageContent() {
  const searchParams = useSearchParams();
  const isRequired = searchParams.get('required') === '1';

  const [profile, setProfile] = useState<UserProfile | null>(null);

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [addressData, setAddressData] = useState<AddressValue | null>(null);
  const [organizationName, setOrganizationName] = useState("");
  const [shelterCapacity, setShelterCapacity] = useState<number | null>(null);
  const [shelterCapacityUnit, setShelterCapacityUnit] = useState<
    'meals' | 'kg'
  >('meals');
  const [vehicleType, setVehicleType] = useState("");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [profilePhotoUrl, setProfilePhotoUrl] = useState('');

  useEffect(() => {
    loadProfile();
  }, []);

  async function loadProfile() {
    try {
      setLoading(true);
      setError("");

      const response = await fetch("/api/profile");

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to load profile");
      }

      const user = data.user;

      setProfile(user);

      setName(user.name || "");
      setPhone(user.phone || "");
      setOrganizationName(user.organizationName || "");
      setProfilePhotoUrl(user.profilePhotoUrl || "");
      setVehicleType(user.vehicleType || "");
      setShelterCapacity(
        typeof user.shelterCapacity === "number" ? user.shelterCapacity : null
      );
      setShelterCapacityUnit(user.shelterCapacityUnit || 'meals');
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to load profile"
      );
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(
    event: React.FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    setSaving(true);
    setMessage("");
    setError("");

    try {
      const response = await fetch("/api/profile", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name,
          profilePhotoUrl,
          phone,
          address: addressData?.address || profile?.address || '',
          streetAddress: addressData?.streetAddress ?? profile?.streetAddress ?? '',
          city: addressData?.city ?? profile?.city ?? '',
          state: addressData?.state ?? profile?.state ?? '',
          country: addressData?.country ?? profile?.country ?? '',
          pincode: addressData?.pincode ?? profile?.pincode ?? '',
          latitude: addressData?.latitude ?? profile?.latitude ?? null,
          longitude: addressData?.longitude ?? profile?.longitude ?? null,
          organizationName,
          shelterCapacity,
          shelterCapacityUnit,
          vehicleType,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error || "Failed to update profile"
        );
      }

      setProfile(data.user);

      setMessage("Profile updated successfully.");
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to update profile"
      );
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[var(--background)]">
        <Navbar />
        <main className="flex items-center justify-center py-16">
          <p className="text-[var(--foreground-muted)]">Loading profile...</p>
        </main>
      </div>
    );
  }

  const completion = profile ? getProfileCompletion(profile, profile.role) : null;

  return (
    <div className="min-h-screen bg-[var(--background)]">
      <Navbar />

      <main className="px-4 py-8">
        <div className="mx-auto max-w-2xl animate-fade-in-up">

          <div className="mb-6 flex items-start justify-between gap-4">
            <div>
            <h1 className="flex items-center gap-2 text-3xl font-bold text-[var(--foreground)]">
              My Profile
              {profile?.verificationStatus === 'verified' && (
                <span className="badge bg-[var(--color-secondary-light)] text-[var(--color-secondary)]">
                  ✓ Verified
                </span>
              )}
            </h1>

                       <p className="mt-1 text-[var(--foreground-muted)]">
              Update your contact and account information.
            </p>
            </div>

            <a href="/profile/security" className="btn-secondary shrink-0 !px-3 !py-2 text-sm">
              Security
            </a>
          </div> 
          {isRequired && completion && completion.percent < 100 && (
            <div className="mb-4 animate-fade-in rounded-2xl border border-[var(--color-accent)]/20 bg-[var(--color-accent-light)] p-4 text-sm text-[var(--color-accent)]">
              <p className="font-semibold">⚠️ Please complete your profile before using this feature.</p>
              <p className="mt-1">
                Still needed: {completion.missing.map((f) => f.label).join(', ')}
              </p>
              <p className="mt-1 text-xs opacity-80">
                Fill these in below, then click &quot;Save Changes&quot; at the bottom.
              </p>
            </div>
          )}

          {error && (
            <div className="mb-4 rounded-2xl border border-[var(--color-danger)]/20 bg-[var(--color-danger-light)] p-4 text-[var(--color-danger)]">
              {error}
            </div>
          )}

          {message && (
            <div className="mb-4 rounded-2xl border border-[var(--color-secondary)]/20 bg-[var(--color-secondary-light)] p-4 text-[var(--color-secondary)]">
              {message}
              {completion && completion.percent < 100 && (
                <span className="mt-1 block text-xs opacity-80">
                  Still needed for full access: {completion.missing.map((f) => f.label).join(', ')}
                </span>
              )}
            </div>
          )}

          <div className="card p-6">

            <div className="mb-8">
              <h2 className="mb-4 text-xl font-semibold text-[var(--foreground)]">
                Account Information
              </h2>

              <div className="grid gap-4 md:grid-cols-2">

                <div>
                  <label className="label">
                    Email
                  </label>

                  <input
                    type="email"
                    value={profile?.email || ""}
                    disabled
                    className="input opacity-60"
                  />
                </div>

                <div>
                  <label className="label">
                    Role
                  </label>

                  <input
                    type="text"
                    value={profile?.role || ""}
                    disabled
                    className="input capitalize opacity-60"
                  />
                </div>

              </div>
            </div>

            <form onSubmit={handleSubmit}>

              <h2 className="mb-4 text-xl font-semibold text-[var(--foreground)]">
                Personal Information
              </h2>
              <div>
                <label className="label">Profile Photo *</label>
                <ProfilePhotoUpload value={profilePhotoUrl} onChange={setProfilePhotoUrl} />
              </div>

              <div className="space-y-5">

                <div>
                  <label className="label">
                    Full Name *
                  </label>

                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    className="input"
                    placeholder="Enter your full name"
                  />
                </div>

                <div>
                  <label className="label">
                    Phone Number
                  </label>

                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="input"
                    placeholder="Enter your phone number"
                  />
                </div>

                <div>
                  <label className="label">Address *</label>
                  <AddressPicker
                    initialValue={{
                      streetAddress: profile?.streetAddress || '',
                      city: profile?.city || '',
                      state: profile?.state || '',
                      country: profile?.country || '',
                      pincode: profile?.pincode || '',
                      latitude: profile?.latitude ?? null,
                      longitude: profile?.longitude ?? null,
                    }}
                    onChange={setAddressData}
                  />
                </div>

                {profile?.role === "volunteer" && (
                  <div>
                    <label className="label">
                      Vehicle Type *
                    </label>

                    <input
                      type="text"
                      value={vehicleType}
                      onChange={(e) => setVehicleType(e.target.value)}
                      className="input"
                      placeholder="e.g. Bike, Car, On foot"
                    />
                  </div>
                )}

                {profile?.role === "shelter" && (
                  <div>
                    <label className="label">
                      Shelter Capacity *
                    </label>

                    <p className="mb-2 text-xs text-[var(--foreground-subtle)]">
                      How much food your shelter can accept at once. Required — volunteers
                      won't be able to assign donations here once you're full.
                    </p>

                    <div className="flex gap-3">
                      <input
                        type="number"
                        min={0}
                        value={shelterCapacity ?? ''}
                        onChange={(e) =>
                          setShelterCapacity(
                            e.target.value === ''
                              ? null
                              : Number(e.target.value)
                          )
                        }
                        placeholder="e.g. 50"
                        className="input w-32"
                      />

                      <select
                        value={shelterCapacityUnit}
                        onChange={(e) =>
                          setShelterCapacityUnit(
                            e.target.value as 'meals' | 'kg'
                          )
                        }
                        className="input w-auto"
                      >
                        <option value="meals" className="bg-[var(--surface)]">meals</option>
                        <option value="kg" className="bg-[var(--surface)]">kilograms</option>
                      </select>
                    </div>
                  </div>
                )}

                {(profile?.role === "donor" || profile?.role === "shelter") && (
                  <div>
                    <label className="label">
                      {profile?.role === "shelter" ? "NGO / Shelter Name *" : "Business / Restaurant Name *"}
                    </label>

                    <input
                      type="text"
                      value={organizationName}
                      onChange={(e) =>
                        setOrganizationName(e.target.value)
                      }
                      className="input"
                      placeholder="Enter organization name"
                    />
                  </div>
                )}

                <button
                  type="submit"
                  disabled={saving}
                  className="btn-primary w-full"
                >
                  {saving ? "Saving..." : "Save Changes"}
                </button>

              </div>
            </form>

          </div>
        </div>
      </main>
    </div>
  );
}

export default function ProfilePage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[var(--background)]">
          <Navbar />
          <main className="flex items-center justify-center py-16">
            <p className="text-[var(--foreground-muted)]">Loading profile...</p>
          </main>
        </div>
      }
    >
      <ProfilePageContent />
    </Suspense>
  );
}