import { getUser } from "@/lib/getUser";
import { connectDB } from "@/lib/mongodb";
import Services from "@/models/Services";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    await connectDB();
    const user = await getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const servicePath = "/land-dakhila";
    const service = await Services.findOne({ href: servicePath });

    if (!service) {
      return NextResponse.json({ error: "Service not found" }, { status: 404 });
    }

    const userService = user.services.find(
      (entry: { service: string }) => entry.service.toString() === service._id.toString()
    );

    // Default rate: if user has no explicit assignment, charge service.fee as default
    const serviceCost = userService
      ? (user.isSpecialUser ? userService.fee : userService.fee + service.fee)
      : service.fee;

    return NextResponse.json({ success: true, serviceCost, note: service.note }, { status: 200 });
  } catch (error) {
    console.error("Land dakhila session error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}