import mongoose, { Schema, model, models } from 'mongoose';

const PasswordResetOtpSchema = new Schema(
  {
    email: { type: String, required: true, index: true },
    codeHash: { type: String, required: true },
    expiresAt: { type: Date, required: true },
  },
  { timestamps: true }
);

PasswordResetOtpSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

const PasswordResetOtp = models.PasswordResetOtp || model('PasswordResetOtp', PasswordResetOtpSchema);
export default PasswordResetOtp;