import mongoose, { Schema, model, models } from 'mongoose';

const UserSchema = new Schema(
  {
    name: { type: String, required: true },
    firstName: { type: String },
    middleName: { type: String },
    lastName: { type: String },

    email: { type: String, unique: true, sparse: true },
    emailVerified: { type: Boolean, default: false },
    password: { type: String },
    phone: { type: String, unique: true, sparse: true },

    role: {
      type: String,
      enum: ['donor', 'volunteer', 'shelter', 'admin'],
    },
    provider: { type: String, default: 'credentials' },

    address: { type: String, default: '' },
    streetAddress: { type: String, default: '' },
    city: { type: String, default: '' },
    state: { type: String, default: '' },
    country: { type: String, default: '' },
    pincode: { type: String, default: '' },
    latitude: { type: Number },
    longitude: { type: Number },

    organizationName: { type: String, default: '' },
    shelterCapacity: { type: Number },
    shelterCapacityUnit: { type: String, enum: ['meals', 'kg'] },
    vehicleType: { type: String, default: '' },

    profilePhotoUrl: { type: String, default: '' },

    // Donor-specific
    donorType: { type: String, enum: ['individual', 'commercial'] },
    gstin: { type: String, default: '' },
    fssaiNumber: { type: String, default: '' },
    foodSafetyUndertaking: { type: Boolean, default: false },

    // Shelter-specific
    ngoDarpanId: { type: String, default: '' },

    // Identity verification (shared across roles)
    verificationStatus: {
      type: String,
      enum: ['unverified', 'pending', 'verified', 'rejected'],
      default: 'unverified',
    },
    verificationSubmittedAt: { type: Date },
    verificationRejectionReason: { type: String, default: '' },
    verificationDocumentUrl: { type: String, default: '' }, // legacy single-doc fallback

    verificationDocuments: {
      // Volunteer
      addressProofUrl: { type: String, default: '' },
      vehicleLicenseUrl: { type: String, default: '' },
      vehicleDocumentUrl: { type: String, default: '' },
      criminalRecordUrl: { type: String, default: '' },
      aadharCardUrl: { type: String, default: '' },

      // Donor
      governmentIdUrl: { type: String, default: '' },
      businessDocUrl: { type: String, default: '' },

      // Shelter
      registrationCertificateUrl: { type: String, default: '' },
      panCardUrl: { type: String, default: '' },
      fssaiRegistrationDocUrl: { type: String, default: '' },
    },
  },
  { timestamps: true }
);

const User = models.User || model('User', UserSchema);
export default User;