'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import Navbar from '@/components/Navbar';
import { volunteerDocumentDefs } from '@/lib/volunteerDocuments';
import { ShieldCheck } from 'lucide-react';

type DocState = Record<string, { url: string; uploading: boolean; error: string }>;

async function uploadFile(file: File): Promise<string> {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('purpose', 'verification-document');

  const res = await fetch('/api/upload', { method: 'POST', body: formData });
  const data = await res.json();

  if (!res.ok) throw new Error(data.error || 'Upload failed');
  return data.photoUrl;
}

export default function VerifyPage() {
  const { data: session } = useSession();
  const role = (session?.user as { role?: string } | undefined)?.role;

  const [status, setStatus] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');
  const [loadingProfile, setLoadingProfile] = useState(true);

  // Volunteer state
  const [docs, setDocs] = useState<DocState>(() => {
    const initial: DocState = {};
    volunteerDocumentDefs.forEach((d) => {
      initial[d.key] = { url: '', uploading: false, error: '' };
    });
    return initial;
  });

  // Donor state
  const [donorType, setDonorType] = useState<'individual' | 'commercial'>('individual');
  const [governmentIdUrl, setGovernmentIdUrl] = useState('');
  const [governmentIdUploading, setGovernmentIdUploading] = useState(false);
  const [foodSafetyUndertaking, setFoodSafetyUndertaking] = useState(false);
  const [gstin, setGstin] = useState('');
  const [fssaiNumber, setFssaiNumber] = useState('');
  const [businessDocUrl, setBusinessDocUrl] = useState('');
  const [businessDocUploading, setBusinessDocUploading] = useState(false);

  // Shelter state
  const [registrationCertificateUrl, setRegistrationCertificateUrl] = useState('');
  const [registrationUploading, setRegistrationUploading] = useState(false);
  const [panCardUrl, setPanCardUrl] = useState('');
  const [panUploading, setPanUploading] = useState(false);
  const [fssaiRegistrationDocUrl, setFssaiRegistrationDocUrl] = useState('');
  const [fssaiUploading, setFssaiUploading] = useState(false);
  const [ngoDarpanId, setNgoDarpanId] = useState('');

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    fetch('/api/profile')
      .then((res) => res.json())
      .then((data) => {
        if (data.user) {
          setStatus(data.user.verificationStatus || '');
          setRejectionReason(data.user.verificationRejectionReason || '');
          setDonorType(data.user.donorType || 'individual');
          setGstin(data.user.gstin || '');
          setFssaiNumber(data.user.fssaiNumber || '');
          setNgoDarpanId(data.user.ngoDarpanId || '');
        }
      })
      .finally(() => setLoadingProfile(false));
  }, []);

  const handleVolunteerDocUpload = async (key: string, file: File | null) => {
    if (!file) return;

    setDocs((prev) => ({ ...prev, [key]: { ...prev[key], uploading: true, error: '' } }));

    try {
      const url = await uploadFile(file);
      setDocs((prev) => ({ ...prev, [key]: { url, uploading: false, error: '' } }));
    } catch (err: any) {
      setDocs((prev) => ({
        ...prev,
        [key]: { ...prev[key], uploading: false, error: err.message || 'Upload failed' },
      }));
    }
  };

  const handleVolunteerSubmit = async () => {
    setError('');
    setSuccess('');

    const missing = volunteerDocumentDefs.filter((d) => !docs[d.key]?.url);
    if (missing.length > 0) {
      setError(`Please upload: ${missing.map((d) => d.label).join(', ')}`);
      return;
    }

    setSubmitting(true);
    try {
      const body: Record<string, string> = {};
      volunteerDocumentDefs.forEach((d) => {
        body[d.key] = docs[d.key].url;
      });

      const res = await fetch('/api/verification/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Submission failed');

      setSuccess('Documents submitted. An admin will review them shortly.');
      setStatus('pending');
    } catch (err: any) {
      setError(err.message || 'Something went wrong');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDonorSubmit = async () => {
    setError('');
    setSuccess('');

    if (donorType === 'individual' && (!governmentIdUrl || !foodSafetyUndertaking)) {
      setError('Please upload a government ID and accept the food safety undertaking');
      return;
    }

    if (donorType === 'commercial' && (!gstin.trim() || !fssaiNumber.trim() || !businessDocUrl)) {
      setError('Please provide GSTIN, FSSAI number, and a supporting business document');
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch('/api/verification/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          donorType,
          governmentIdUrl,
          businessDocUrl,
          gstin,
          fssaiNumber,
          foodSafetyUndertaking,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Submission failed');

      setSuccess('Submitted. An admin will review it shortly.');
      setStatus('pending');
    } catch (err: any) {
      setError(err.message || 'Something went wrong');
    } finally {
      setSubmitting(false);
    }
  };

  const handleShelterSubmit = async () => {
    setError('');
    setSuccess('');

    if (!registrationCertificateUrl || !panCardUrl || !ngoDarpanId.trim()) {
      setError('Please upload the registration certificate, PAN card, and enter your NGO Darpan ID');
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch('/api/verification/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          registrationCertificateUrl,
          panCardUrl,
          fssaiRegistrationDocUrl,
          ngoDarpanId,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Submission failed');

      setSuccess('Documents submitted. An admin will review them shortly.');
      setStatus('pending');
    } catch (err: any) {
      setError(err.message || 'Something went wrong');
    } finally {
      setSubmitting(false);
    }
  };

  if (loadingProfile) {
    return (
      <div className="min-h-screen bg-[var(--background)]">
        <Navbar />
        <main className="flex items-center justify-center py-16">
          <p className="text-[var(--foreground-muted)] text-sm">Loading...</p>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--background)]">
      <Navbar />
      <main className="mx-auto max-w-2xl px-4 py-10">
        <div className="flex items-center gap-3">
          <div className="icon-badge h-11 w-11 shrink-0">
            <ShieldCheck className="h-5 w-5" />
          </div>
          <h1 className="text-2xl font-bold text-[var(--foreground)]">Get Verified</h1>
        </div>

        <p className="mt-3 text-sm text-[var(--foreground-muted)]">
          {role === 'volunteer' &&
            'Upload the following 5 documents so donors and shelters can trust you as a courier.'}
          {role === 'donor' &&
            'Verified donors get a trust badge. Individuals and businesses have different requirements — select which applies to you.'}
          {role === 'shelter' &&
            'Upload your NGO registration details so donors and volunteers can trust your organization.'}
        </p>

        {status === 'rejected' && rejectionReason && (
          <div className="animate-fade-in mt-4 rounded-xl border border-[var(--color-danger)]/20 bg-[var(--color-danger-light)] p-4 text-sm text-[var(--color-danger)]">
            <b>Your previous submission was rejected:</b>
            <p className="mt-1">{rejectionReason}</p>
            <p className="mt-2 text-xs opacity-80">Please fix the issue and resubmit below.</p>
          </div>
        )}

        {status === 'pending' && !success && (
          <div className="animate-fade-in mt-4 rounded-xl border border-[var(--color-accent)]/20 bg-[var(--color-accent-light)] p-4 text-sm text-[var(--color-accent)]">
            Your submission is currently under review. You can resubmit below if needed.
          </div>
        )}

        {status === 'verified' && (
          <div className="animate-fade-in mt-4 rounded-xl border border-[var(--color-secondary)]/20 bg-[var(--color-secondary-light)] p-4 text-sm text-[var(--color-secondary)]">
            ✓ You're already verified. No action needed.
          </div>
        )}

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

        {/* VOLUNTEER FLOW */}
        {role === 'volunteer' && (
          <div className="card mt-6 space-y-5 p-6">
            {volunteerDocumentDefs.map((doc) => (
              <div key={doc.key}>
                <label className="label">{doc.label} *</label>
                {docs[doc.key]?.url ? (
                  <div className="flex items-center gap-3 rounded-xl border border-[var(--color-secondary)]/20 bg-[var(--color-secondary-light)] p-3 text-sm text-[var(--color-secondary)]">
                    <span>✓ Uploaded</span>
                    <a href={docs[doc.key].url} target="_blank" rel="noopener noreferrer" className="underline">
                      View
                    </a>
                    <button
                      type="button"
                      onClick={() => setDocs((prev) => ({ ...prev, [doc.key]: { url: '', uploading: false, error: '' } }))}
                      className="ml-auto text-xs underline"
                    >
                      Replace
                    </button>
                  </div>
                ) : (
                  <>
                    <input
                      type="file"
                      accept="application/pdf,image/jpeg,image/png"
                      onChange={(e) => handleVolunteerDocUpload(doc.key, e.target.files?.[0] || null)}
                      disabled={docs[doc.key]?.uploading}
                      className="block w-full text-sm text-[var(--foreground-muted)] file:mr-4 file:rounded-full file:border-0 file:bg-[var(--color-primary)] file:px-4 file:py-2 file:text-sm file:font-semibold file:text-white hover:file:bg-[var(--color-primary-hover)] disabled:opacity-50"
                    />
                    <p className="mt-1 text-xs text-[var(--foreground-subtle)]">{doc.hint}</p>
                    {docs[doc.key]?.uploading && (
                      <p className="mt-1 text-xs text-[var(--foreground-subtle)]">Uploading...</p>
                    )}
                    {docs[doc.key]?.error && (
                      <p className="mt-1 text-xs text-[var(--color-danger)]">{docs[doc.key].error}</p>
                    )}
                  </>
                )}
              </div>
            ))}

            <button onClick={handleVolunteerSubmit} disabled={submitting} className="btn-primary w-full">
              {submitting ? 'Submitting...' : 'Submit for Verification'}
            </button>
          </div>
        )}

        {/* DONOR FLOW */}
        {role === 'donor' && (
          <div className="card mt-6 space-y-5 p-6">
            <div>
              <label className="label">I am donating as *</label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setDonorType('individual')}
                  className={`rounded-2xl border p-4 text-left transition-colors ${
                    donorType === 'individual'
                      ? 'border-[var(--color-primary)] bg-[var(--color-primary-light)]'
                      : 'border-[var(--border)] bg-[var(--surface-2)]'
                  }`}
                >
                  <p className="font-semibold text-[var(--foreground)]">Individual</p>
                  <p className="mt-1 text-xs text-[var(--foreground-muted)]">Household, party leftovers, personal cooking</p>
                </button>
                <button
                  type="button"
                  onClick={() => setDonorType('commercial')}
                  className={`rounded-2xl border p-4 text-left transition-colors ${
                    donorType === 'commercial'
                      ? 'border-[var(--color-primary)] bg-[var(--color-primary-light)]'
                      : 'border-[var(--border)] bg-[var(--surface-2)]'
                  }`}
                >
                  <p className="font-semibold text-[var(--foreground)]">Commercial</p>
                  <p className="mt-1 text-xs text-[var(--foreground-muted)]">Restaurant, caterer, hotel, or other food business</p>
                </button>
              </div>
            </div>

            {donorType === 'individual' ? (
              <>
                <div>
                  <label className="label">Government ID (Aadhaar / Voter ID) *</label>
                  {governmentIdUrl ? (
                    <div className="flex items-center gap-3 rounded-xl border border-[var(--color-secondary)]/20 bg-[var(--color-secondary-light)] p-3 text-sm text-[var(--color-secondary)]">
                      <span>✓ Uploaded</span>
                      <a href={governmentIdUrl} target="_blank" rel="noopener noreferrer" className="underline">View</a>
                      <button type="button" onClick={() => setGovernmentIdUrl('')} className="ml-auto text-xs underline">
                        Replace
                      </button>
                    </div>
                  ) : (
                    <>
                      <input
                        type="file"
                        accept="application/pdf,image/jpeg,image/png"
                        disabled={governmentIdUploading}
                        onChange={async (e) => {
                          const file = e.target.files?.[0];
                          if (!file) return;
                          setGovernmentIdUploading(true);
                          try {
                            setGovernmentIdUrl(await uploadFile(file));
                          } catch (err: any) {
                            setError(err.message || 'Upload failed');
                          } finally {
                            setGovernmentIdUploading(false);
                          }
                        }}
                        className="block w-full text-sm text-[var(--foreground-muted)] file:mr-4 file:rounded-full file:border-0 file:bg-[var(--color-primary)] file:px-4 file:py-2 file:text-sm file:font-semibold file:text-white hover:file:bg-[var(--color-primary-hover)] disabled:opacity-50"
                      />
                      <p className="mt-1 text-xs text-[var(--foreground-subtle)]">PDF, JPG or PNG · Max 10MB</p>
                      {governmentIdUploading && <p className="mt-1 text-xs text-[var(--foreground-subtle)]">Uploading...</p>}
                    </>
                  )}
                </div>

                <label className="flex items-start gap-3 rounded-2xl border border-[var(--border)] bg-[var(--surface-2)] p-4">
                  <input
                    type="checkbox"
                    checked={foodSafetyUndertaking}
                    onChange={(e) => setFoodSafetyUndertaking(e.target.checked)}
                    className="mt-1 h-4 w-4 shrink-0 accent-[var(--color-primary)]"
                  />
                  <span className="text-sm text-[var(--foreground-muted)]">
                    I confirm that food I donate will be prepared within a safe timeframe, stored hygienically,
                    and free of spoiled ingredients. I will upload a photo of packed food with every listing.
                  </span>
                </label>
              </>
            ) : (
              <>
                <div>
                  <label className="label">FSSAI License / Registration Number *</label>
                  <input
                    type="text"
                    value={fssaiNumber}
                    onChange={(e) => setFssaiNumber(e.target.value)}
                    className="input"
                    placeholder="14-digit FSSAI number"
                  />
                </div>

                <div>
                  <label className="label">GSTIN / Business PAN *</label>
                  <input
                    type="text"
                    value={gstin}
                    onChange={(e) => setGstin(e.target.value)}
                    className="input"
                    placeholder="Enter GSTIN or business PAN"
                  />
                </div>

                <div>
                  <label className="label">Supporting Document (FSSAI Certificate or GST Certificate) *</label>
                  {businessDocUrl ? (
                    <div className="flex items-center gap-3 rounded-xl border border-[var(--color-secondary)]/20 bg-[var(--color-secondary-light)] p-3 text-sm text-[var(--color-secondary)]">
                      <span>✓ Uploaded</span>
                      <a href={businessDocUrl} target="_blank" rel="noopener noreferrer" className="underline">View</a>
                      <button type="button" onClick={() => setBusinessDocUrl('')} className="ml-auto text-xs underline">
                        Replace
                      </button>
                    </div>
                  ) : (
                    <>
                      <input
                        type="file"
                        accept="application/pdf,image/jpeg,image/png"
                        disabled={businessDocUploading}
                        onChange={async (e) => {
                          const file = e.target.files?.[0];
                          if (!file) return;
                          setBusinessDocUploading(true);
                          try {
                            setBusinessDocUrl(await uploadFile(file));
                          } catch (err: any) {
                            setError(err.message || 'Upload failed');
                          } finally {
                            setBusinessDocUploading(false);
                          }
                        }}
                        className="block w-full text-sm text-[var(--foreground-muted)] file:mr-4 file:rounded-full file:border-0 file:bg-[var(--color-primary)] file:px-4 file:py-2 file:text-sm file:font-semibold file:text-white hover:file:bg-[var(--color-primary-hover)] disabled:opacity-50"
                      />
                      <p className="mt-1 text-xs text-[var(--foreground-subtle)]">PDF, JPG or PNG · Max 10MB</p>
                      {businessDocUploading && <p className="mt-1 text-xs text-[var(--foreground-subtle)]">Uploading...</p>}
                    </>
                  )}
                </div>
              </>
            )}

            <button onClick={handleDonorSubmit} disabled={submitting} className="btn-primary w-full">
              {submitting ? 'Submitting...' : 'Submit for Verification'}
            </button>
          </div>
        )}

        {/* SHELTER FLOW */}
        {role === 'shelter' && (
          <div className="card mt-6 space-y-5 p-6">
            <div>
              <label className="label">Registration Certificate (Trust / Society / Section 8) *</label>
              {registrationCertificateUrl ? (
                <div className="flex items-center gap-3 rounded-xl border border-[var(--color-secondary)]/20 bg-[var(--color-secondary-light)] p-3 text-sm text-[var(--color-secondary)]">
                  <span>✓ Uploaded</span>
                  <a href={registrationCertificateUrl} target="_blank" rel="noopener noreferrer" className="underline">View</a>
                  <button type="button" onClick={() => setRegistrationCertificateUrl('')} className="ml-auto text-xs underline">
                    Replace
                  </button>
                </div>
              ) : (
                <>
                  <input
                    type="file"
                    accept="application/pdf,image/jpeg,image/png"
                    disabled={registrationUploading}
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      setRegistrationUploading(true);
                      try {
                        setRegistrationCertificateUrl(await uploadFile(file));
                      } catch (err: any) {
                        setError(err.message || 'Upload failed');
                      } finally {
                        setRegistrationUploading(false);
                      }
                    }}
                    className="block w-full text-sm text-[var(--foreground-muted)] file:mr-4 file:rounded-full file:border-0 file:bg-[var(--color-primary)] file:px-4 file:py-2 file:text-sm file:font-semibold file:text-white hover:file:bg-[var(--color-primary-hover)] disabled:opacity-50"
                  />
                  <p className="mt-1 text-xs text-[var(--foreground-subtle)]">PDF, JPG or PNG · Max 10MB</p>
                  {registrationUploading && <p className="mt-1 text-xs text-[var(--foreground-subtle)]">Uploading...</p>}
                </>
              )}
            </div>

            <div>
              <label className="label">PAN Card of the NGO *</label>
              {panCardUrl ? (
                <div className="flex items-center gap-3 rounded-xl border border-[var(--color-secondary)]/20 bg-[var(--color-secondary-light)] p-3 text-sm text-[var(--color-secondary)]">
                  <span>✓ Uploaded</span>
                  <a href={panCardUrl} target="_blank" rel="noopener noreferrer" className="underline">View</a>
                  <button type="button" onClick={() => setPanCardUrl('')} className="ml-auto text-xs underline">
                    Replace
                  </button>
                </div>
              ) : (
                <>
                  <input
                    type="file"
                    accept="application/pdf,image/jpeg,image/png"
                    disabled={panUploading}
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      setPanUploading(true);
                      try {
                        setPanCardUrl(await uploadFile(file));
                      } catch (err: any) {
                        setError(err.message || 'Upload failed');
                      } finally {
                        setPanUploading(false);
                      }
                    }}
                    className="block w-full text-sm text-[var(--foreground-muted)] file:mr-4 file:rounded-full file:border-0 file:bg-[var(--color-primary)] file:px-4 file:py-2 file:text-sm file:font-semibold file:text-white hover:file:bg-[var(--color-primary-hover)] disabled:opacity-50"
                  />
                  <p className="mt-1 text-xs text-[var(--foreground-subtle)]">PDF, JPG or PNG · Max 10MB</p>
                  {panUploading && <p className="mt-1 text-xs text-[var(--foreground-subtle)]">Uploading...</p>}
                </>
              )}
            </div>

            <div>
              <label className="label">NGO Darpan Unique ID *</label>
              <input
                type="text"
                value={ngoDarpanId}
                onChange={(e) => setNgoDarpanId(e.target.value)}
                className="input"
                placeholder="e.g. XX/XXXX/XXXXXXX"
              />
              <p className="mt-1 text-xs text-[var(--foreground-subtle)]">
                Register at ngodarpan.gov.in if you don't have one yet.
              </p>
            </div>

            <div>
              <label className="label">FSSAI Registration <span className="normal-case text-[var(--foreground-subtle)]">(optional, recommended)</span></label>
              {fssaiRegistrationDocUrl ? (
                <div className="flex items-center gap-3 rounded-xl border border-[var(--color-secondary)]/20 bg-[var(--color-secondary-light)] p-3 text-sm text-[var(--color-secondary)]">
                  <span>✓ Uploaded</span>
                  <a href={fssaiRegistrationDocUrl} target="_blank" rel="noopener noreferrer" className="underline">View</a>
                  <button type="button" onClick={() => setFssaiRegistrationDocUrl('')} className="ml-auto text-xs underline">
                    Replace
                  </button>
                </div>
              ) : (
                <>
                  <input
                    type="file"
                    accept="application/pdf,image/jpeg,image/png"
                    disabled={fssaiUploading}
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      setFssaiUploading(true);
                      try {
                        setFssaiRegistrationDocUrl(await uploadFile(file));
                      } catch (err: any) {
                        setError(err.message || 'Upload failed');
                      } finally {
                        setFssaiUploading(false);
                      }
                    }}
                    className="block w-full text-sm text-[var(--foreground-muted)] file:mr-4 file:rounded-full file:border-0 file:bg-[var(--color-primary)] file:px-4 file:py-2 file:text-sm file:font-semibold file:text-white hover:file:bg-[var(--color-primary-hover)] disabled:opacity-50"
                  />
                  <p className="mt-1 text-xs text-[var(--foreground-subtle)]">PDF, JPG or PNG · Max 10MB</p>
                  {fssaiUploading && <p className="mt-1 text-xs text-[var(--foreground-subtle)]">Uploading...</p>}
                </>
              )}
            </div>

            <button onClick={handleShelterSubmit} disabled={submitting} className="btn-primary w-full">
              {submitting ? 'Submitting...' : 'Submit for Verification'}
            </button>
          </div>
        )}
      </main>
    </div>
  );
}