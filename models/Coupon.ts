import mongoose, { Document, Schema, Types } from "mongoose";

export interface ICoupon extends Document {
  code: string;
  type: "manual" | "cashback";
  cashbackPercent: number;
  cashbackAmount?: number;
  isActive: boolean;
  maxUses: number;
  usedCount: number;
  oneTimePerUser: boolean;
  expiresAt?: Date | null;
  user?: Types.ObjectId | null;
  sourceSpentIds?: Types.ObjectId[];
  redeemedAt?: Date | null;
  redeemedBy?: Types.ObjectId | null;
  createdBy?: Types.ObjectId;
}

const couponSchema = new Schema<ICoupon>(
  {
    code: { type: String, required: true, unique: true, trim: true, uppercase: true },
    type: { type: String, enum: ["manual", "cashback"], default: "manual" },
    cashbackPercent: { type: Number, required: true, default: 0.5, min: 0 },
    cashbackAmount: { type: Number, default: 0, min: 0 },
    isActive: { type: Boolean, default: true },
    maxUses: { type: Number, default: 0, min: 0 },
    usedCount: { type: Number, default: 0, min: 0 },
    oneTimePerUser: { type: Boolean, default: true },
    expiresAt: { type: Date, default: null },
    user: { type: Types.ObjectId, ref: "User", default: null },
    sourceSpentIds: [{ type: Types.ObjectId, ref: "Spent" }],
    redeemedAt: { type: Date, default: null },
    redeemedBy: { type: Types.ObjectId, ref: "User", default: null },
    createdBy: { type: Types.ObjectId, ref: "User" },
  },
  { timestamps: true }
);

export default mongoose.models.Coupon || mongoose.model<ICoupon>("Coupon", couponSchema);
