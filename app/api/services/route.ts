import { getUser } from "@/lib/getUser";
import "@/models/Services";
import User from "@/models/User";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const user = await getUser();
    if (!user || !user._id) {
      console.warn("❌ [Services API] User not authenticated or missing _id");
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const userWithServices = await User.findById(user._id).populate(
      "services.service"
    );
    
    if (!userWithServices) {
      console.warn(`❌ [Services API] User not found: ${user._id}`);
      return NextResponse.json({ message: "User not found" }, { status: 404 });
    }

    const services = userWithServices.services || [];

    return NextResponse.json(services);
  } catch (error) {
    console.error("❌ [Services API] Error fetching services:", error);
    return NextResponse.json(
      { message: "Internal Server Error", error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}
