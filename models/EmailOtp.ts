import mongoose, { Schema, model, models } from 'mongoose';

const EmailOtpSchema = new Schema(
  {
    email: { type: String, required: true, index: true },
    codeHash: { type: String, required: true },
    expiresAt: { type: Date, required: true },
  },
  { timestamps: true }
);

// MongoDB automatically deletes a document once its expiresAt time passes.
EmailOtpSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

const EmailOtp = models.EmailOtp || model('EmailOtp', EmailOtpSchema);
export default EmailOtp;