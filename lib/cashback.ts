import { Types } from "mongoose";
import Coupon from "@/models/Coupon";
import Spent from "@/models/Use";

type CashbackCouponState = {
  _id: Types.ObjectId;
  sourceSpentIds?: Types.ObjectId[];
  isActive?: boolean;
  usedCount?: number;
  redeemedAt?: Date | null;
  updatedAt?: Date;
};

export function normalizeObjectIds(ids: unknown[] = []) {
  const uniqueIds = new Map<string, Types.ObjectId>();

  ids.forEach((id) => {
    const value = String(id || "").trim();

    if (!value || !Types.ObjectId.isValid(value) || uniqueIds.has(value)) {
      return;
    }

    uniqueIds.set(value, new Types.ObjectId(value));
  });

  return Array.from(uniqueIds.values());
}

export async function syncCashbackSpentState(userId: string | Types.ObjectId) {
  const cashbackCoupons = (await Coupon.find({
    user: userId,
    type: "cashback",
  })
    .select("_id sourceSpentIds isActive usedCount redeemedAt updatedAt")
    .sort({ createdAt: -1 })
    .lean()) as CashbackCouponState[];

  const spentStateMap = new Map<
    string,
    {
      couponId: Types.ObjectId;
      status: "locked" | "redeemed";
      redeemedAt: Date | null;
    }
  >();

  cashbackCoupons.forEach((coupon) => {
    const spentIds = normalizeObjectIds(coupon.sourceSpentIds || []);
    const isRedeemedCoupon = Boolean(coupon.redeemedAt) || Number(coupon.usedCount || 0) > 0;
    const status = isRedeemedCoupon ? "redeemed" : "locked";
    const redeemedAt = coupon.redeemedAt || coupon.updatedAt || null;

    spentIds.forEach((spentId) => {
      const key = spentId.toString();
      const existingState = spentStateMap.get(key);

      if (existingState?.status === "redeemed") {
        return;
      }

      if (!existingState || status === "redeemed") {
        spentStateMap.set(key, {
          couponId: coupon._id,
          status,
          redeemedAt,
        });
      }
    });
  });

  if (spentStateMap.size === 0) {
    return [] as Types.ObjectId[];
  }

  await Spent.bulkWrite(
    Array.from(spentStateMap.entries()).map(([spentId, state]) => ({
      updateOne: {
        filter: {
          _id: new Types.ObjectId(spentId),
          user: userId,
        },
        update: {
          $set: {
            cashbackStatus: state.status,
            cashbackCoupon: state.couponId,
            cashbackRedeemedAt: state.status === "redeemed" ? state.redeemedAt : null,
          },
        },
      },
    }))
  );

  return Array.from(spentStateMap.keys()).map((spentId) => new Types.ObjectId(spentId));
}