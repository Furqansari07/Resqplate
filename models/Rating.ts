import mongoose, { Schema, Document, Model } from 'mongoose';

export type RaterRole = 'donor' | 'volunteer' | 'shelter';

export type RatingCategory =
  | 'food_condition'
  | 'pickup_coordination'
  | 'pickup_delivery_experience';

export interface IRating extends Document {
  donationId: mongoose.Types.ObjectId;
  raterId: mongoose.Types.ObjectId;
  raterRole: RaterRole;
  category: RatingCategory;
  score: number;
  comment?: string;
  createdAt: Date;
}

const RatingSchema = new Schema<IRating>(
  {
    donationId: {
      type: Schema.Types.ObjectId,
      ref: 'DonationListing',
      required: true,
    },

    raterId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },

    raterRole: {
      type: String,
      enum: ['donor', 'volunteer', 'shelter'],
      required: true,
    },

    category: {
      type: String,
      enum: [
        'food_condition',
        'pickup_coordination',
        'pickup_delivery_experience',
      ],
      required: true,
    },

    score: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
    },

    comment: {
      type: String,
      trim: true,
      maxlength: 500,
      default: '',
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
  }
);

// One rating per donation per role — a donor can't rate the same
// delivery twice, and neither can the shelter or the volunteer.
RatingSchema.index({ donationId: 1, raterRole: 1 }, { unique: true });

const Rating: Model<IRating> =
  mongoose.models.Rating || mongoose.model<IRating>('Rating', RatingSchema);

export default Rating;