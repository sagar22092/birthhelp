import { getUser } from "@/lib/getUser";
import { connectDB } from "@/lib/mongodb";
import Transaction from "@/models/Transaction";
import Coupon from "@/models/Coupon";
import CouponUsage from "@/models/CouponUsage";
import User from "@/models/User";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { trxId, couponCode } = body;

    // Validate fields
    if (!trxId) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    await connectDB();

    const user = await getUser();
    if (!user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    // Prevent duplicate trxId for same user
    const existingTrx = await Transaction.findOne({
      trxId,
    });

    if (existingTrx) {
      return NextResponse.json(
        { error: "Transaction ID already submitted" },
        { status: 400 }
      );
    }

    try {
      const payment = await fetch(
        `https://sagarconstruction.site/bkash/submit.php?trxid=${trxId}`
      );

      if (!payment.ok) {
        return NextResponse.json(
          {
            error: "Bkash payment not found",
            message: "Bkash payment not found",
          },
          { status: 400 }
        );
      }

      const paymentData = await payment.json();
      if (paymentData.error) {
        return NextResponse.json(
          { error: paymentData.error, message: paymentData.error },
          { status: 400 }
        );
      }

      if (!paymentData.amount || !paymentData.payerAccount) {
        return NextResponse.json(
          {
            error: "Bkash payment not found",
            message: "Bkash payment not found",
          },
          { status: 400 }
        );
      }

      const rechargeAmount = Number(paymentData.amount);
      const normalizedCouponCode = String(couponCode || "").trim().toUpperCase();

      let cashbackAmount = 0;
      let appliedCouponCode = "";
      let appliedCouponId: string | null = null;

      if (normalizedCouponCode) {
        const coupon = await Coupon.findOne({
          code: normalizedCouponCode,
          isActive: true,
        });

        if (coupon) {
          const now = new Date();
          const expired = coupon.expiresAt && now > new Date(coupon.expiresAt);
          const quotaExceeded = coupon.maxUses > 0 && coupon.usedCount >= coupon.maxUses;

          let usedByUser = false;
          if (coupon.oneTimePerUser) {
            usedByUser = Boolean(
              await CouponUsage.findOne({ coupon: coupon._id, user: user._id })
            );
          }

          if (!expired && !quotaExceeded && !usedByUser) {
            cashbackAmount = Number(
              ((rechargeAmount * Number(coupon.cashbackPercent || 0)) / 100).toFixed(2)
            );
            appliedCouponCode = coupon.code;
            appliedCouponId = String(coupon._id);
          }
        }
      }

      const creditedAmount = rechargeAmount + cashbackAmount;

      const newTransaction = await Transaction.create({
        user: user._id,
        amount: rechargeAmount,
        creditedAmount,
        cashbackAmount,
        couponCode: appliedCouponCode,
        trxId,
        number: paymentData.payerAccount,
        method: "Bkash",
        status: "SUCCESS",
      });

      if (appliedCouponCode && appliedCouponId) {
        await Coupon.updateOne({ _id: appliedCouponId }, { $inc: { usedCount: 1 } });
        await CouponUsage.create({
          coupon: appliedCouponId,
          user: user._id,
          transaction: newTransaction._id,
          trxId,
          rechargeAmount,
          cashbackAmount,
          totalCredited: creditedAmount,
        });
      }

      user.balance += creditedAmount;
      await user.save();
      const userWithoutPassword = await User.findById(user._id).select(
        "-password"
      );
      // Get all transactions sorted (latest first)
      const allTransactions = await Transaction.find({ user: user._id }).sort({
        createdAt: -1,
      });

      return NextResponse.json(
        {
          success: true,
          cashbackAmount,
          creditedAmount,
          appliedCouponCode,
          transactions: allTransactions,
          user: userWithoutPassword,
        },
        { status: 200 }
      );
    } catch (error) {
      return NextResponse.json(
        { message: "TRX validation failed" },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("Transaction API Error:", error);
    return NextResponse.json(
      { message: "Internal Server Error" },
      { status: 500 }
    );
  }
}
