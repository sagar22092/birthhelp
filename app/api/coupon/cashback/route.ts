import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { getUser } from "@/lib/getUser";
import Spent from "@/models/Use";
import Coupon from "@/models/Coupon";
import { Types } from "mongoose";
import { syncCashbackSpentState } from "@/lib/cashback";

const CASHBACK_RATE_PERCENT = 0.5;
// 2026-03-25 00:00 in Bangladesh time (UTC+6)
const CASHBACK_PROGRAM_START_AT = new Date("2026-03-24T18:00:00.000Z");

function buildEligibleSpentQuery(userId: string, excludedSpentIds: Types.ObjectId[] = []) {
  return {
    user: userId,
    createdAt: { $gte: CASHBACK_PROGRAM_START_AT },
    ...(excludedSpentIds.length > 0 ? { _id: { $nin: excludedSpentIds } } : {}),
    $and: [
      {
        $or: [
          { cashbackStatus: "none" },
          { cashbackStatus: { $exists: false } },
          { cashbackStatus: null },
        ],
      },
      {
        $or: [
          { cashbackCoupon: { $exists: false } },
          { cashbackCoupon: null },
        ],
      },
    ],
  };
}

function createCouponCode() {
  return `CB${Date.now().toString(36).toUpperCase()}${Math.random()
    .toString(36)
    .slice(2, 6)
    .toUpperCase()}`;
}

export async function GET() {
  try {
    await connectDB();
    const user = await getUser();

    if (!user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const excludedSpentIds = await syncCashbackSpentState(user._id);

    const eligibleSpent = await Spent.find(
      buildEligibleSpentQuery(user._id, excludedSpentIds)
    )
      .select("_id amount createdAt")
      .sort({ createdAt: -1 })
      .lean();

    const eligibleSpendAmount = eligibleSpent.reduce(
      (sum: number, item: any) => sum + Number(item.amount || 0),
      0
    );

    const estimatedCashback = Number(
      ((eligibleSpendAmount * CASHBACK_RATE_PERCENT) / 100).toFixed(2)
    );

    const recentCoupons = await Coupon.find({ user: user._id, type: "cashback" })
      .select("code cashbackAmount isActive usedCount redeemedAt createdAt")
      .sort({ createdAt: -1 })
      .limit(10)
      .lean();

    return NextResponse.json({
      success: true,
      cashbackRatePercent: CASHBACK_RATE_PERCENT,
      programStartAt: CASHBACK_PROGRAM_START_AT,
      eligibleUseCount: eligibleSpent.length,
      eligibleSpendAmount,
      estimatedCashback,
      recentCoupons,
    });
  } catch (error) {
    console.error("Cashback summary error:", error);
    return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
  }
}

export async function POST() {
  try {
    await connectDB();
    const user = await getUser();

    if (!user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const excludedSpentIds = await syncCashbackSpentState(user._id);

    const existingActiveCoupon = (await Coupon.findOne({
      user: user._id,
      type: "cashback",
      isActive: true,
      usedCount: 0,
      redeemedAt: null,
    })
      .select("code cashbackAmount cashbackPercent")
      .lean()) as
      | { code: string; cashbackAmount: number; cashbackPercent: number }
      | null;

    if (existingActiveCoupon) {
      return NextResponse.json(
        {
          success: true,
          existing: true,
          coupon: {
            code: existingActiveCoupon.code,
            cashbackAmount: existingActiveCoupon.cashbackAmount,
            cashbackPercent: existingActiveCoupon.cashbackPercent,
          },
        },
        { status: 200 }
      );
    }

    const eligibleSpent = await Spent.find(
      buildEligibleSpentQuery(user._id, excludedSpentIds)
    )
      .select("_id amount")
      .sort({ createdAt: 1 })
      .lean();

    if (eligibleSpent.length === 0) {
      return NextResponse.json(
        { message: "No eligible usage found for cashback coupon" },
        { status: 400 }
      );
    }

    const eligibleSpendAmount = eligibleSpent.reduce(
      (sum: number, item: any) => sum + Number(item.amount || 0),
      0
    );

    const cashbackAmount = Number(
      ((eligibleSpendAmount * CASHBACK_RATE_PERCENT) / 100).toFixed(2)
    );

    if (cashbackAmount <= 0) {
      return NextResponse.json(
        { message: "Cashback amount is too low to generate coupon" },
        { status: 400 }
      );
    }

    const code = createCouponCode();
    const spentIds = eligibleSpent.map((item: any) => item._id);

    const coupon = await Coupon.create({
      code,
      type: "cashback",
      cashbackPercent: CASHBACK_RATE_PERCENT,
      cashbackAmount,
      user: user._id,
      sourceSpentIds: spentIds,
      maxUses: 1,
      usedCount: 0,
      oneTimePerUser: true,
      isActive: true,
      createdBy: user._id,
    });

    const lockResult = await Spent.updateMany(
      {
        _id: { $in: spentIds },
        ...buildEligibleSpentQuery(user._id, excludedSpentIds),
      },
      {
        $set: {
          cashbackStatus: "locked",
          cashbackCoupon: coupon._id,
        },
      }
    );

    if (lockResult.modifiedCount !== spentIds.length) {
      await Coupon.deleteOne({ _id: coupon._id });
      return NextResponse.json(
        {
          message: "Cashback coupon already generated from these uses. Please refresh.",
        },
        { status: 409 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        coupon: {
          code: coupon.code,
          cashbackAmount: coupon.cashbackAmount,
          cashbackPercent: coupon.cashbackPercent,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Cashback coupon generation error:", error);
    return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
  }
}
