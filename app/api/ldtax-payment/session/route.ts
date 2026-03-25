import { getUser } from "@/lib/getUser";
import { connectDB } from "@/lib/mongodb";
import { NextResponse } from "next/server";
import { calculateServiceCost, ensureLdTaxPaymentService } from "../_shared";

export async function GET() {
  try {
    await connectDB();
    const user = await getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const service = await ensureLdTaxPaymentService();
    const { serviceCost, userService } = calculateServiceCost({ user, service });

    if (!userService || serviceCost === null) {
      return NextResponse.json(
        { error: "Service is not enabled for your account" },
        { status: 403 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        serviceCost,
        note: service.note || "Link না এলে কোনো টাকা কাটা হবে না",
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("LDTAX payment session error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}