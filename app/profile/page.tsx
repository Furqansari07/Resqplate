"use client";
import Navbar from "@/components/Navbar";


import { useEffect, useState } from "react";

interface UserProfile {
  name: string;
  email: string;
  role: string;
  phone?: string;
  address?: string;
  organizationName?: string;
  latitude?: number | null;
  longitude?: number | null;
  shelterCapacity?: number | null;
  shelterCapacityUnit?: 'meals' | 'kg' | null;
}

export default function ProfilePage() {
  const [profile, setProfile] = useState<UserProfile | null>(null);

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [organizationName, setOrganizationName] = useState("");
  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);
  const [locating, setLocating] = useState(false);
  const [locationError, setLocationError] = useState("");
  const [shelterCapacity, setShelterCapacity] = useState<number | null>(null);
  const [shelterCapacityUnit, setShelterCapacityUnit] = useState<
    'meals' | 'kg'
  >('meals');

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

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
      setAddress(user.address || "");
      setOrganizationName(user.organizationName || "");
      setLatitude(
        typeof user.latitude === "number" ? user.latitude : null
      );
      setLongitude(
        typeof user.longitude === "number" ? user.longitude : null
      );
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

  function useCurrentLocation() {
    setLocationError("");

    if (!("geolocation" in navigator)) {
      setLocationError(
        "Your browser does not support location detection. Enter coordinates manually if you have them."
      );
      return;
    }

    setLocating(true);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLatitude(Number(position.coords.latitude.toFixed(6)));
        setLongitude(Number(position.coords.longitude.toFixed(6)));
        setLocating(false);
      },
      () => {
        setLocationError(
          "Unable to detect your location. Please allow location access and try again."
        );
        setLocating(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }

  function clearLocation() {
    setLatitude(null);
    setLongitude(null);
    setLocationError("");
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
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name,
          phone,
          address,
          organizationName,
          latitude,
          longitude,
          shelterCapacity,
          shelterCapacityUnit,
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
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <main className="flex items-center justify-center py-16">
          <p>Loading profile...</p>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <main className="px-4 py-8">
      <div className="mx-auto max-w-2xl">

        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">
            My Profile
          </h1>

          <p className="mt-1 text-gray-600">
            Update your contact and account information.
          </p>
        </div>

        {error && (
          <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-4 text-red-700">
            {error}
          </div>
        )}

        {message && (
          <div className="mb-4 rounded-lg border border-green-200 bg-green-50 p-4 text-green-700">
            {message}
          </div>
        )}

        <div className="rounded-xl bg-white p-6 shadow">

          <div className="mb-8">
            <h2 className="mb-4 text-xl font-semibold">
              Account Information
            </h2>

            <div className="grid gap-4 md:grid-cols-2">

              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Email
                </label>

                <input
                  type="email"
                  value={profile?.email || ""}
                  disabled
                  className="w-full rounded-lg border bg-gray-100 px-3 py-2 text-gray-500"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Role
                </label>

                <input
                  type="text"
                  value={profile?.role || ""}
                  disabled
                  className="w-full rounded-lg border bg-gray-100 px-3 py-2 capitalize text-gray-500"
                />
              </div>

            </div>
          </div>

          <form onSubmit={handleSubmit}>

            <h2 className="mb-4 text-xl font-semibold">
              Personal Information
            </h2>

            <div className="space-y-5">

              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Full Name *
                </label>

                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  className="w-full rounded-lg border px-3 py-2 outline-none focus:ring-2"
                  placeholder="Enter your full name"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Phone Number
                </label>

                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full rounded-lg border px-3 py-2 outline-none focus:ring-2"
                  placeholder="Enter your phone number"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Address
                </label>

                <textarea
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  rows={4}
                  className="w-full rounded-lg border px-3 py-2 outline-none focus:ring-2"
                  placeholder="Enter your current address"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Pickup / Delivery Location
                </label>

                <p className="mb-2 text-xs text-gray-500">
                  Used to show nearby pickups and delivery distances. This is
                  separate from your typed address above.
                </p>

                {latitude !== null && longitude !== null ? (
                  <div className="flex flex-wrap items-center gap-3 rounded-lg border bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
                    <span>
                      Location saved: {latitude.toFixed(4)},{' '}
                      {longitude.toFixed(4)}
                    </span>

                    <button
                      type="button"
                      onClick={clearLocation}
                      className="rounded border border-emerald-300 px-2 py-1 text-xs font-medium text-emerald-800 hover:bg-emerald-100"
                    >
                      Remove
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={useCurrentLocation}
                    disabled={locating}
                    className="rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                  >
                    {locating ? "Detecting location..." : "Use my current location"}
                  </button>
                )}

                {locationError && (
                  <p className="mt-2 text-xs text-red-600">
                    {locationError}
                  </p>
                )}
              </div>

              {profile?.role === "shelter" && (
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">
                    Shelter Capacity
                  </label>

                  <p className="mb-2 text-xs text-gray-500">
                    How much food your shelter can accept at once. Volunteers
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
                      className="w-32 rounded-lg border px-3 py-2 outline-none focus:ring-2"
                    />

                    <select
                      value={shelterCapacityUnit}
                      onChange={(e) =>
                        setShelterCapacityUnit(
                          e.target.value as 'meals' | 'kg'
                        )
                      }
                      className="rounded-lg border px-3 py-2 outline-none focus:ring-2"
                    >
                      <option value="meals">meals</option>
                      <option value="kg">kilograms</option>
                    </select>
                  </div>

                  <p className="mt-2 text-xs text-gray-500">
                    Leave the number blank to accept donations with no
                    capacity limit.
                  </p>
                </div>
              )}

              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Organization / NGO Name
                </label>

                <input
                  type="text"
                  value={organizationName}
                  onChange={(e) =>
                    setOrganizationName(e.target.value)
                  }
                  className="w-full rounded-lg border px-3 py-2 outline-none focus:ring-2"
                  placeholder="Enter organization name"
                />
              </div>

              <button
                type="submit"
                disabled={saving}
                className="w-full rounded-lg bg-black px-4 py-3 font-medium text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
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