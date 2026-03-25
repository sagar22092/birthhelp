import mongoose, { Document, Schema, Types } from "mongoose";

export interface ICouponUsage extends Document {
  coupon: Types.ObjectId;
  user: Types.ObjectId;
  transaction: Types.ObjectId;
  trxId: string;
  rechargeAmount: number;
  cashbackAmount: number;
  totalCredited: number;
}

const couponUsageSchema = new Schema<ICouponUsage>(
  {
    coupon: { type: Schema.Types.ObjectId, ref: "Coupon", required: true },
    user: { type: Schema.Types.ObjectId, ref: "User", required: true },
    transaction: { type: Schema.Types.ObjectId, ref: "Transaction", required: true },
    trxId: { type: String, required: true },
    rechargeAmount: { type: Number, required: true, min: 0 },
    cashbackAmount: { type: Number, required: true, min: 0 },
    totalCredited: { type: Number, required: true, min: 0 },
  },
  { timestamps: true }
);

couponUsageSchema.index({ coupon: 1, user: 1 });
couponUsageSchema.index({ trxId: 1, user: 1 }, { unique: true });

export default mongoose.models.CouponUsage || mongoose.model<ICouponUsage>("CouponUsage", couponUsageSchema);
