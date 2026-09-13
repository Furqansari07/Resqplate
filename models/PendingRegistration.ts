import mongoose, { Schema, model, models } from 'mongoose';

const PendingRegistrationSchema = new Schema(
  {
    email: { type: String, required: true, unique: true },
    firstName: { type: String, required: true },
    middleName: { type: String },
    lastName: { type: String, required: true },
    phone: { type: String, required: true },
    passwordHash: { type: String, required: true },
    role: { type: String, enum: ['donor', 'volunteer', 'shelter'], required: true },
    codeHash: { type: String, required: true },
    expiresAt: { type: Date, required: true },
  },
  { timestamps: true }
);

PendingRegistrationSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

const PendingRegistration =
  models.PendingRegistration || model('PendingRegistration', PendingRegistrationSchema);
export default PendingRegistration;