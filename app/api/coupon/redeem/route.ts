import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { getUser } from "@/lib/getUser";
import Coupon from "@/models/Coupon";
import Spent from "@/models/Use";
import Transaction from "@/models/Transaction";
import User from "@/models/User";
import { normalizeObjectIds } from "@/lib/cashback";

export async function POST(req: Request) {
  try {
    await connectDB();
    const user = await getUser();

    if (!user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const code = String(body?.code || "").trim().toUpperCase();

    if (!code) {
      return NextResponse.json({ message: "Coupon code is required" }, { status: 400 });
    }

    const coupon = await Coupon.findOne({ code, type: "cashback" });
    if (!coupon) {
      return NextResponse.json({ message: "Coupon not found" }, { status: 404 });
    }

    if (String(coupon.user || "") !== String(user._id)) {
      return NextResponse.json({ message: "This coupon does not belong to you" }, { status: 403 });
    }

    if (!coupon.isActive || coupon.usedCount > 0 || coupon.redeemedAt) {
      return NextResponse.json({ message: "Coupon already redeemed" }, { status: 400 });
    }

    const creditAmount = Number(coupon.cashbackAmount || 0);
    if (creditAmount <= 0) {
      return NextResponse.json({ message: "Invalid cashback amount" }, { status: 400 });
    }

    const redeemedAt = new Date();
    const sourceSpentIds = normalizeObjectIds(coupon.sourceSpentIds || []);

    user.balance += creditAmount;
    await user.save();

    const trxId = `COUPON-${coupon.code}`;
    await Transaction.create({
      user: user._id,
      trxId,
      amount: creditAmount,
      creditedAmount: creditAmount,
      cashbackAmount: creditAmount,
      couponCode: coupon.code,
      method: "Coupon Redeem",
      status: "SUCCESS",
    });

    coupon.isActive = false;
    coupon.usedCount = 1;
    coupon.redeemedAt = redeemedAt;
    coupon.redeemedBy = user._id;
    await coupon.save();

    await Spent.updateMany(
      { _id: { $in: sourceSpentIds }, user: user._id },
      {
        $set: {
          cashbackStatus: "redeemed",
          cashbackCoupon: coupon._id,
          cashbackRedeemedAt: redeemedAt,
        },
      }
    );

    const userWithoutPassword = await User.findById(user._id).select("-password");

    return NextResponse.json(
      {
        success: true,
        amount: creditAmount,
        code: coupon.code,
        user: userWithoutPassword,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Coupon redeem error:", error);
    return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
  }
}
