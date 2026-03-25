import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { getUser } from "@/lib/getUser";
import Coupon from "@/models/Coupon";

export async function POST(req: Request) {
  try {
    await connectDB();

    const user = await getUser();
    if (!user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    if (!user.isSpecialUser) {
      return NextResponse.json(
        { message: "Only special users can create coupon codes" },
        { status: 403 }
      );
    }

    const body = await req.json();
    const code = String(body?.code || "").trim().toUpperCase();

    if (!code) {
      return NextResponse.json({ message: "Coupon code is required" }, { status: 400 });
    }

    const cashbackPercent = Number(body?.cashbackPercent ?? 0.5);
    const maxUses = Number(body?.maxUses ?? 0);
    const oneTimePerUser = body?.oneTimePerUser !== false;
    const expiresAt = body?.expiresAt ? new Date(body.expiresAt) : null;

    if (Number.isNaN(cashbackPercent) || cashbackPercent < 0) {
      return NextResponse.json({ message: "Invalid cashback percent" }, { status: 400 });
    }

    const existing = await Coupon.findOne({ code });
    if (existing) {
      return NextResponse.json({ message: "Coupon already exists" }, { status: 400 });
    }

    const coupon = await Coupon.create({
      code,
      cashbackPercent,
      maxUses: Number.isNaN(maxUses) ? 0 : Math.max(0, maxUses),
      oneTimePerUser,
      expiresAt,
      createdBy: user._id,
    });

    return NextResponse.json({ success: true, coupon }, { status: 201 });
  } catch (error) {
    console.error("Coupon create error:", error);
    return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
  }
}
