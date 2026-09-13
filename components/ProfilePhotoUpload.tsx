'use client';

import { useState } from 'react';

type ProfilePhotoUploadProps = {
  value: string;
  onChange: (url: string) => void;
};

export default function ProfilePhotoUpload({ value, onChange }: ProfilePhotoUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;

    setError('');
    setUploading(true);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('purpose', 'profile-photo');

      const res = await fetch('/api/upload', { method: 'POST', body: formData });
      const data = await res.json();

      if (!res.ok) throw new Error(data.error || 'Upload failed');

      onChange(data.photoUrl);
    } catch (err: any) {
      setError(err.message || 'Could not upload photo');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="flex items-center gap-4">
      <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-full border border-[var(--border)] bg-[var(--surface-2)]">
        {value ? (
          <img src={value} alt="Profile" className="h-full w-full object-cover" />
        ) : (
          <span className="text-2xl">👤</span>
        )}
      </div>

      <div>
        <input
          type="file"
          accept="image/jpeg,image/png,image/webp"
          onChange={handleFileChange}
          disabled={uploading}
          className="block text-sm text-[var(--foreground-muted)] file:mr-4 file:rounded-full file:border-0 file:bg-[var(--color-primary)] file:px-4 file:py-2 file:text-sm file:font-semibold file:text-white hover:file:bg-[var(--color-primary-hover)] disabled:opacity-50"
        />
        <p className="mt-1 text-xs text-[var(--foreground-subtle)]">JPG, PNG or WEBP · Max 5MB</p>
        {uploading && <p className="mt-1 text-xs text-[var(--foreground-subtle)]">Uploading...</p>}
        {error && <p className="mt-1 text-xs text-[var(--color-danger)]">{error}</p>}
      </div>
    </div>
  );
}