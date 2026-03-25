import mongoose, { Document, Schema, ObjectId, Types } from "mongoose";

export interface ITransaction extends Document {
  trxId: string;
  amount: number;
  creditedAmount?: number;
  cashbackAmount?: number;
  couponCode?: string;
  method: string;
  status: string;
  number?: string;
  user: ObjectId;
  createdAt: Date;
}

const trxSchema = new Schema<ITransaction>({
  trxId: { type: String, required: true },
  amount: { type: Number, required: true },
  creditedAmount: { type: Number, default: 0 },
  cashbackAmount: { type: Number, default: 0 },
  couponCode: { type: String, default: "" },
  method: { type: String, required: true },
  status: { type: String, default:"SUCCESS" },
  number: { type: String },
  user: { type: Types.ObjectId, ref: "User", required: true },
  createdAt: { type: Date, default: Date.now },
});

export default mongoose.models.Transaction ||
  mongoose.model("Transaction", trxSchema);
