'use client';

import { useEffect, useMemo, useState } from 'react';
import { Country, State, City, type ICountry, type IState, type ICity } from 'country-state-city';
import { MapPin } from 'lucide-react';

export type AddressValue = {
  streetAddress: string;
  city: string;
  state: string;
  country: string;
  pincode: string;
  latitude: number | null;
  longitude: number | null;
  address: string; // composed full display string
};

function composeAddress(v: Omit<AddressValue, 'address'>) {
  return [v.streetAddress, v.city, v.state, v.country]
    .filter(Boolean)
    .join(', ') + (v.pincode ? ` - ${v.pincode}` : '');
}

function findCountryIsoByName(name: string): ICountry | undefined {
  const target = name.trim().toLowerCase();
  return Country.getAllCountries().find((c) => c.name.toLowerCase() === target);
}

function findStateIsoByName(countryIso: string, name: string): IState | undefined {
  const target = name.trim().toLowerCase();
  return State.getStatesOfCountry(countryIso).find((s) => s.name.toLowerCase() === target);
}

type AddressPickerProps = {
  initialValue?: Partial<AddressValue>;
  onChange: (value: AddressValue) => void;
};

export default function AddressPicker({ initialValue, onChange }: AddressPickerProps) {
  const [countryIso, setCountryIso] = useState('');
  const [stateIso, setStateIso] = useState('');
  const [cityName, setCityName] = useState('');
  const [streetAddress, setStreetAddress] = useState(initialValue?.streetAddress || '');
  const [pincode, setPincode] = useState(initialValue?.pincode || '');
  const [latitude, setLatitude] = useState<number | null>(initialValue?.latitude ?? null);
  const [longitude, setLongitude] = useState<number | null>(initialValue?.longitude ?? null);

  const [locating, setLocating] = useState(false);
  const [locationError, setLocationError] = useState('');

  // Resolve initial country/state iso from names, if editing an existing profile.
  useEffect(() => {
    if (initialValue?.country) {
      const c = findCountryIsoByName(initialValue.country);
      if (c) {
        setCountryIso(c.isoCode);
        if (initialValue.state) {
          const s = findStateIsoByName(c.isoCode, initialValue.state);
          if (s) setStateIso(s.isoCode);
        }
      }
    }
    if (initialValue?.city) setCityName(initialValue.city);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const countries = useMemo(() => Country.getAllCountries(), []);
  const states = useMemo(
    () => (countryIso ? State.getStatesOfCountry(countryIso) : []),
    [countryIso]
  );
  const cities = useMemo(
    () => (countryIso && stateIso ? City.getCitiesOfState(countryIso, stateIso) : []),
    [countryIso, stateIso]
  );

  const countryName = countries.find((c) => c.isoCode === countryIso)?.name || '';
  const stateName = states.find((s) => s.isoCode === stateIso)?.name || '';

  useEffect(() => {
    const value: AddressValue = {
      streetAddress,
      city: cityName,
      state: stateName,
      country: countryName,
      pincode,
      latitude,
      longitude,
      address: '',
    };
    value.address = composeAddress(value);
    onChange(value);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [streetAddress, cityName, stateName, countryName, pincode, latitude, longitude]);

  const useCurrentLocation = () => {
    setLocationError('');

    if (!('geolocation' in navigator)) {
      setLocationError('Your browser does not support location detection.');
      return;
    }

    setLocating(true);

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const lat = position.coords.latitude;
        const lon = position.coords.longitude;
        setLatitude(Number(lat.toFixed(6)));
        setLongitude(Number(lon.toFixed(6)));

        try {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lon}`
          );
          const data = await res.json();
          const addr = data.address || {};

          const fetchedCountry = addr.country || '';
          const fetchedState = addr.state || '';
          const fetchedCity = addr.city || addr.town || addr.village || addr.county || '';
          const fetchedPincode = addr.postcode || '';
          const fetchedStreet =
            [addr.house_number, addr.road].filter(Boolean).join(' ') || addr.suburb || '';

          if (fetchedCountry) {
            const c = findCountryIsoByName(fetchedCountry);
            if (c) {
              setCountryIso(c.isoCode);
              if (fetchedState) {
                const s = findStateIsoByName(c.isoCode, fetchedState);
                if (s) setStateIso(s.isoCode);
              }
            }
          }

          setCityName(fetchedCity);
          setPincode(fetchedPincode);
          setStreetAddress(fetchedStreet);
        } catch {
          setLocationError('Detected your location, but could not fetch the address details. Please fill manually below.');
        } finally {
          setLocating(false);
        }
      },
      () => {
        setLocationError('Unable to detect your location. Please allow location access and try again.');
        setLocating(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  return (
    <div className="space-y-4">
            <button
        type="button"
        onClick={useCurrentLocation}
        disabled={locating}
        className="btn-secondary w-full"
      >
        <MapPin className="h-4 w-4" />
        {locating ? 'Detecting your location...' : 'Use my current location'}
      </button>
      {locationError && (
        <p className="text-xs text-[var(--color-danger)]">{locationError}</p>
      )}

      {latitude !== null && longitude !== null && (
        <p className="text-xs text-[var(--foreground-subtle)]">
          Location: {latitude.toFixed(4)}, {longitude.toFixed(4)}
        </p>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="label">Country</label>
          <select
            value={countryIso}
            onChange={(e) => {
              setCountryIso(e.target.value);
              setStateIso('');
              setCityName('');
            }}
            className="input"
          >
            <option value="" className="bg-[var(--surface)]">Select country</option>
            {countries.map((c) => (
              <option key={c.isoCode} value={c.isoCode} className="bg-[var(--surface)]">
                {c.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="label">State / Province</label>
          <select
            value={stateIso}
            onChange={(e) => {
              setStateIso(e.target.value);
              setCityName('');
            }}
            disabled={!countryIso}
            className="input disabled:opacity-50"
          >
            <option value="" className="bg-[var(--surface)]">
              {countryIso ? 'Select state' : 'Select country first'}
            </option>
            {states.map((s) => (
              <option key={s.isoCode} value={s.isoCode} className="bg-[var(--surface)]">
                {s.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="label">City</label>
          <select
            value={cityName}
            onChange={(e) => setCityName(e.target.value)}
            disabled={!stateIso}
            className="input disabled:opacity-50"
          >
            <option value="" className="bg-[var(--surface)]">
              {stateIso ? 'Select city' : 'Select state first'}
            </option>
            {cities.map((c) => (
              <option key={`${c.name}-${c.latitude}`} value={c.name} className="bg-[var(--surface)]">
                {c.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="label">Pincode / Postal Code</label>
          <input
            type="text"
            value={pincode}
            onChange={(e) => setPincode(e.target.value)}
            className="input"
            placeholder="e.g. 380001"
          />
        </div>
      </div>

      <div>
        <label className="label">Street Address</label>
        <input
          type="text"
          value={streetAddress}
          onChange={(e) => setStreetAddress(e.target.value)}
          className="input"
          placeholder="House/flat no., street name"
        />
      </div>
    </div>
  );
}