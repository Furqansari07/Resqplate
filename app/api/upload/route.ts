import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import cloudinary from '@/lib/cloudinary';

type SessionUser = {
  id?: string;
  role?: string;
};

const ALLOWED_ROLES = ['donor', 'volunteer', 'shelter'];

const IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const DOCUMENT_TYPES = [...IMAGE_TYPES, 'application/pdf'];

const IMAGE_MAX_BYTES = 5 * 1024 * 1024; // 5MB
const DOCUMENT_MAX_BYTES = 10 * 1024 * 1024; // 10MB

export async function POST(request: Request) {
  try {
    const session = await auth();
    const user = session?.user as SessionUser | undefined;

    if (!user?.id) {
      return NextResponse.json(
        { error: 'You must sign in first.' },
        { status: 401 }
      );
    }

    if (!user.role || !ALLOWED_ROLES.includes(user.role)) {
      return NextResponse.json(
        { error: 'You are not allowed to upload files.' },
        { status: 403 }
      );
    }

    const formData = await request.formData();
    const file = formData.get('file');
    const purpose = formData.get('purpose'); // 'donation-photo' | 'profile-photo' | 'verification-document'

    if (!file || !(file instanceof Blob)) {
      return NextResponse.json(
        { error: 'No file was provided.' },
        { status: 400 }
      );
    }

    const isVerificationUpload = purpose === 'verification-document';
    const isProfilePhoto = purpose === 'profile-photo';

    const allowedTypes = isVerificationUpload ? DOCUMENT_TYPES : IMAGE_TYPES;
    const maxSize = isVerificationUpload ? DOCUMENT_MAX_BYTES : IMAGE_MAX_BYTES;

    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        {
          error: isVerificationUpload
            ? 'Only PDF, JPEG, or PNG files are allowed.'
            : 'Only JPEG, PNG, or WEBP images are allowed.',
        },
        { status: 400 }
      );
    }

    if (file.size > maxSize) {
      return NextResponse.json(
        { error: `File must be smaller than ${maxSize / (1024 * 1024)}MB.` },
        { status: 400 }
      );
    }

    const folder = isVerificationUpload
      ? 'resqplate/verifications'
      : isProfilePhoto
        ? 'resqplate/profile-photos'
        : 'resqplate/donations';

    const arrayBuffer = await file.arrayBuffer();
    const base64 = Buffer.from(arrayBuffer).toString('base64');
    const dataUri = `data:${file.type};base64,${base64}`;

    const uploadResult = await cloudinary.uploader.upload(dataUri, {
      folder,
      resource_type: isVerificationUpload ? 'auto' : 'image',
      ...(isVerificationUpload
        ? {}
        : {
            transformation: [
              { width: 1200, height: 1200, crop: 'limit' },
              { quality: 'auto' },
              { fetch_format: 'auto' },
            ],
          }),
    });

    return NextResponse.json({
      message: 'File uploaded successfully.',
      photoUrl: uploadResult.secure_url,
      photoPublicId: uploadResult.public_id,
    });
  } catch (error) {
    console.error('Upload file error:', error);

    return NextResponse.json(
      { error: 'Unable to upload the file. Please try again.' },
      { status: 500 }
    );
  }
}