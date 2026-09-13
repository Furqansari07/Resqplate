'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { countryCodes, type CountryCode } from '@/lib/countryCodes';
import { validatePhoneForCountry } from '@/lib/phonePatterns';

function flagFromIso2(iso2: string) {
  return iso2
    .toUpperCase()
    .replace(/./g, (char) =>
      String.fromCodePoint(127397 + char.charCodeAt(0))
    );
}

type PhoneInputProps = {
  onChange: (fullE164Number: string, isValid: boolean) => void;
  defaultIso2?: string;
  disabled?: boolean;
};

export default function PhoneInput({
  onChange,
  defaultIso2 = 'IN',
  disabled,
}: PhoneInputProps) {
  const [country, setCountry] = useState<CountryCode>(
    countryCodes.find((c) => c.iso2 === defaultIso2) || countryCodes[0]
  );
  const [nationalNumber, setNationalNumber] = useState('');
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [touched, setTouched] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const validation = useMemo(
    () => validatePhoneForCountry(country.iso2, nationalNumber),
    [country, nationalNumber]
  );

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return countryCodes;

    return countryCodes.filter(
      (c) =>
        c.name.toLowerCase().includes(query) ||
        c.dialCode.includes(query) ||
        c.iso2.toLowerCase() === query
    );
  }, [search]);

  useEffect(() => {
    const digits = nationalNumber.replace(/\D/g, '');
    onChange(digits ? `${country.dialCode}${digits}` : '', validation.valid);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [country, nationalNumber]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setOpen(false);
        setSearch('');
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div ref={containerRef}>
      <div className="relative flex gap-2">
        <button
          type="button"
          disabled={disabled}
          onClick={() => setOpen((current) => !current)}
          className="input flex w-[110px] shrink-0 items-center justify-between gap-1.5 !px-3"
        >
          <span className="flex items-center gap-1.5 truncate">
            <span>{flagFromIso2(country.iso2)}</span>
            <span className="text-sm font-medium">{country.dialCode}</span>
          </span>
          <span
            className={`text-xs text-[var(--foreground-subtle)] transition-transform duration-200 ${
              open ? 'rotate-180' : ''
            }`}
          >
            ▾
          </span>
        </button>

        <input
          type="tel"
          required
          disabled={disabled}
          value={nationalNumber}
          onChange={(e) => setNationalNumber(e.target.value.replace(/[^\d]/g, ''))}
          onBlur={() => setTouched(true)}
          placeholder="Phone number"
          className="input flex-1"
        />

        {open && (
          <div className="animate-scale-in absolute left-0 top-full z-50 mt-2 w-72 origin-top-left overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--surface)] shadow-2xl shadow-black/40 backdrop-blur-xl">
            <div className="border-b border-[var(--border)] p-2">
              <input
                autoFocus
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search country or code..."
                className="input !py-2 text-sm"
              />
            </div>

            <div className="max-h-64 overflow-y-auto py-1">
              {filtered.length === 0 ? (
                <p className="px-4 py-3 text-sm text-[var(--foreground-subtle)]">
                  No matches.
                </p>
              ) : (
                filtered.map((c) => (
                  <button
                    key={c.iso2}
                    type="button"
                    onClick={() => {
                      setCountry(c);
                      setOpen(false);
                      setSearch('');
                      setNationalNumber('');
                    }}
                    className={`flex w-full items-center gap-3 px-4 py-2 text-left text-sm transition-colors hover:bg-[var(--surface-2)] ${
                      c.iso2 === country.iso2 ? 'bg-[var(--color-primary-light)]' : ''
                    }`}
                  >
                    <span>{flagFromIso2(c.iso2)}</span>
                    <span className="flex-1 truncate text-[var(--foreground)]">
                      {c.name}
                    </span>
                    <span className="text-[var(--foreground-subtle)]">
                      {c.dialCode}
                    </span>
                  </button>
                ))
              )}
            </div>
          </div>
        )}
      </div>

      {touched && nationalNumber && !validation.valid && (
        <p className="mt-1.5 text-xs text-[var(--color-danger)]">{validation.message}</p>
      )}
    </div>
  );
}