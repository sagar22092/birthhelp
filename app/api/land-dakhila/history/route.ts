import { getUser } from "@/lib/getUser";
import { connectDB } from "@/lib/mongodb";
import Spent from "@/models/Use";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    await connectDB();
    const user = await getUser();

    if (!user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const history = await Spent.find({
      user: user._id,
      dataSchema: "LandDakhilaFinder",
    })
      .sort({ createdAt: -1 })
      .select("_id data amount serviceName createdAt");

    const normalized = history.map((item) => {
      let holdingUrl = item.data || "";
      let links: string[] = [];

      try {
        const parsed = JSON.parse(item.data || "{}");
        if (typeof parsed?.holdingUrl === "string") {
          holdingUrl = parsed.holdingUrl;
        }
        if (Array.isArray(parsed?.links)) {
          links = parsed.links.filter((value: unknown) => typeof value === "string");
        }
      } catch {
        // Old records may contain only plain URL string in data
      }

      return {
        _id: item._id,
        amount: item.amount,
        serviceName: item.serviceName,
        createdAt: item.createdAt,
        holdingUrl,
        links,
      };
    });

    return NextResponse.json(normalized, { status: 200 });
  } catch (error) {
    console.error("Land dakhila history error:", error);
    return NextResponse.json(
      { message: "Internal Server Error" },
      { status: 500 }
    );
  }
}
