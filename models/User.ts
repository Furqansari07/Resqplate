import mongoose, { Schema, Document, Model } from "mongoose";

export type UserRole = "donor" | "volunteer" | "shelter" | "admin";

export interface IUser extends Document {
  name: string;
  email: string;
  password: string;
  role: UserRole;
  phone?: string;
  address?: string;
  organizationName?: string;
  latitude?: number;
  longitude?: number;
  shelterCapacity?: number;
  shelterCapacityUnit?: 'meals' | 'kg';
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUser>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },

    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },

    password: {
      type: String,
      required: true,
    },

    role: {
      type: String,
      enum: ["donor", "volunteer", "shelter", "admin"],
      required: true,
    },

    phone: {
      type: String,
      trim: true,
      default: "",
    },

    address: {
      type: String,
      trim: true,
      default: "",
    },

    organizationName: {
      type: String,
      trim: true,
      default: "",
    },

    latitude: {
      type: Number,
      default: null,
    },

    longitude: {
      type: Number,
      default: null,
    },
    shelterCapacity: {
      type: Number,
      default: null,
    },

    shelterCapacityUnit: {
      type: String,
      enum: ['meals', 'kg', null],
      default: null,
    },

  },
  {
    timestamps: true,
  }
);

const User: Model<IUser> =
  mongoose.models.User ||
  mongoose.model<IUser>("User", UserSchema);

export default User;