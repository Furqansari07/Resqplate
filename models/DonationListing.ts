import mongoose, { Schema, model, models } from 'mongoose';

export interface IDonationListing {
  _id?: string;
  donorId: mongoose.Types.ObjectId;
  title: string;
  quantity: string;
  category: string;
  description?: string;
  photoUrl?: string;
  photoPublicId?: string;
  quantityAmount?: number;
  quantityUnit?: 'meals' | 'kg';
  pickupBy: Date;
  specialInstructions?: string;
  targetShelterId?: mongoose.Types.ObjectId | null;
  status:
    | 'available'
    | 'claimed'
    | 'in-transit'
    | 'delivered'
    | 'cancelled'
    | 'expired'
    | 'received';
  volunteerId?: mongoose.Types.ObjectId | null;
  claimedAt?: Date | null;
  inTransitAt?: Date | null;
  deliveredAt?: Date | null;
  receivedAt?: Date | null;
  createdAt?: Date;
  safetyConfirmed?: boolean;
}

const DonationListingSchema = new Schema<IDonationListing>(
  {
    donorId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    title: {
      type: String,
      required: [true, 'Please provide a title for the food listing'],
    },
    quantity: {
      type: String,
      required: [true, 'Please specify the quantity'],
    },
    category: {
      type: String,
      required: [
        true,
        'Please provide a category (e.g., Cooked Meals, Groceries, Bakery)',
      ],
    },
    description: {
      type: String,
      default: '',
      trim: true,
    },
    photoUrl: {
      type: String,
      default: '',
    },
    photoPublicId: {
      type: String,
      default: '',
    },
    quantityAmount: {
      type: Number,
      default: null,
    },
    quantityUnit: {
      type: String,
      enum: ['meals', 'kg', null],
      default: null,
    },
    pickupBy: {
      type: Date,
      required: [true, 'Please provide a pickup deadline'],
    },
    specialInstructions: {
      type: String,
      default: '',
      trim: true,
    },
    targetShelterId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    status: {
      type: String,
      enum: [
        'available',
        'claimed',
        'in-transit',
        'delivered',
        'cancelled',
        'expired',
        'received',
      ],
      default: 'available',
    },
    volunteerId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    claimedAt: {
      type: Date,
      default: null,
    },
    inTransitAt: {
      type: Date,
      default: null,
    },
    deliveredAt: {
      type: Date,
      default: null,
    },
    receivedAt: {
      type: Date,
      default: null,
    },
    safetyConfirmed: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

const DonationListing =
  models.DonationListing ||
  model<IDonationListing>('DonationListing', DonationListingSchema);

export default DonationListing;