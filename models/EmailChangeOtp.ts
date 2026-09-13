import mongoose, { Schema, model, models } from 'mongoose';

const EmailChangeOtpSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    newEmail: { type: String, required: true },
    codeHash: { type: String, required: true },
    expiresAt: { type: Date, required: true },
  },
  { timestamps: true }
);

EmailChangeOtpSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

const EmailChangeOtp = models.EmailChangeOtp || model('EmailChangeOtp', EmailChangeOtpSchema);
export default EmailChangeOtp;