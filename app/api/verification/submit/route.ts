import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import dbConnect from '@/lib/mongodb';
import User from '@/models/User';

export async function POST(req: Request) {
  const session = await auth();
  const user = session?.user as { id?: string; role?: string } | undefined;

  if (!user?.id) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  const body = await req.json();
  await dbConnect();

  if (user.role === 'volunteer') {
    const { addressProofUrl, vehicleLicenseUrl, vehicleDocumentUrl, criminalRecordUrl, aadharCardUrl } = body;

    if (!addressProofUrl || !vehicleLicenseUrl || !vehicleDocumentUrl || !criminalRecordUrl || !aadharCardUrl) {
      return NextResponse.json({ error: 'All 5 documents are required' }, { status: 400 });
    }

    const updated = await User.findByIdAndUpdate(
      user.id,
      {
        verificationDocuments: {
          addressProofUrl,
          vehicleLicenseUrl,
          vehicleDocumentUrl,
          criminalRecordUrl,
          aadharCardUrl,
        },
        verificationStatus: 'pending',
        verificationSubmittedAt: new Date(),
        verificationRejectionReason: '',
      },
      { new: true }
    ).lean();

    return NextResponse.json({ success: true, user: updated });
  }

  if (user.role === 'donor') {
    const { donorType, governmentIdUrl, businessDocUrl, gstin, fssaiNumber, foodSafetyUndertaking } = body;

    if (!donorType || !['individual', 'commercial'].includes(donorType)) {
      return NextResponse.json({ error: 'Please select donor type' }, { status: 400 });
    }

    if (donorType === 'individual') {
      if (!governmentIdUrl) {
        return NextResponse.json({ error: 'Government ID is required' }, { status: 400 });
      }
      if (!foodSafetyUndertaking) {
        return NextResponse.json({ error: 'You must accept the food safety undertaking' }, { status: 400 });
      }
    }

    if (donorType === 'commercial') {
      if (!gstin || !fssaiNumber || !businessDocUrl) {
        return NextResponse.json(
          { error: 'GSTIN, FSSAI number, and a supporting business document are all required' },
          { status: 400 }
        );
      }
    }

    const updated = await User.findByIdAndUpdate(
      user.id,
      {
        donorType,
        gstin: gstin || '',
        fssaiNumber: fssaiNumber || '',
        foodSafetyUndertaking: donorType === 'individual' ? Boolean(foodSafetyUndertaking) : true,
        verificationDocuments: {
          governmentIdUrl: governmentIdUrl || '',
          businessDocUrl: businessDocUrl || '',
        },
        verificationStatus: 'pending',
        verificationSubmittedAt: new Date(),
        verificationRejectionReason: '',
      },
      { new: true }
    ).lean();

    return NextResponse.json({ success: true, user: updated });
  }

  if (user.role === 'shelter') {
    const { registrationCertificateUrl, panCardUrl, fssaiRegistrationDocUrl, ngoDarpanId } = body;

    if (!registrationCertificateUrl || !panCardUrl || !ngoDarpanId) {
      return NextResponse.json(
        { error: 'Registration certificate, PAN card, and NGO Darpan ID are all required' },
        { status: 400 }
      );
    }

    const updated = await User.findByIdAndUpdate(
      user.id,
      {
        ngoDarpanId,
        verificationDocuments: {
          registrationCertificateUrl,
          panCardUrl,
          fssaiRegistrationDocUrl: fssaiRegistrationDocUrl || '',
        },
        verificationStatus: 'pending',
        verificationSubmittedAt: new Date(),
        verificationRejectionReason: '',
      },
      { new: true }
    ).lean();

    return NextResponse.json({ success: true, user: updated });
  }

  return NextResponse.json({ error: 'Verification is not applicable for this role' }, { status: 400 });
}