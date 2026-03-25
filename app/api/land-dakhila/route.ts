import { getUser } from "@/lib/getUser";
import { connectDB } from "@/lib/mongodb";
import Earnings from "@/models/Earnings";
import Reseller from "@/models/Reseller";
import Services from "@/models/Services";
import Spent from "@/models/Use";
import { NextResponse } from "next/server";

const ALLOWED_HOST = "portal.ldtax.gov.bd";

function extractHoldingUrl(input: string) {
  try {
    const parsed = new URL(input);

    if (parsed.hostname !== ALLOWED_HOST) {
      return null;
    }

    if (!parsed.pathname.startsWith("/citizen/holding/")) {
      return null;
    }

    return parsed.toString();
  } catch {
    return null;
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const input = String(body?.input || "").trim();
    const holdingUrl = extractHoldingUrl(input);

    if (!holdingUrl) {
      return NextResponse.json(
        { success: false, message: "Valid holding URL দিন" },
        { status: 400 }
      );
    }

    await connectDB();
    const user = await getUser();

    if (!user) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    const reseller = user.reseller ? await Reseller.findById(user.reseller) : null;
    const servicePath = "/land-dakhila";
    const service = await Services.findOne({ href: servicePath });

    if (!service) {
      return NextResponse.json({ success: false, message: "Service not found" }, { status: 404 });
    }

    const userService = user.services.find(
      (entry: { service: string }) => entry.service.toString() === service._id.toString()
    );

    // Default rate: if user has no explicit assignment, charge service.fee as default
    const serviceCost = userService
      ? (user.isSpecialUser ? userService.fee : userService.fee + service.fee)
      : service.fee;

    if (user.balance < serviceCost) {
      return NextResponse.json(
        { success: false, message: "Insufficient balance" },
        { status: 402 }
      );
    }

    const upstreamUrl = new URL("https://api.udcsheva.com/find_dakhila.php");
    upstreamUrl.searchParams.set("input", holdingUrl);

    const upstreamResponse = await fetch(upstreamUrl.toString(), {
      cache: "no-store",
    });

    if (!upstreamResponse.ok) {
      return NextResponse.json(
        { success: false, message: "Upstream service failed" },
        { status: 502 }
      );
    }

    const upstreamData = await upstreamResponse.json();
    const links = extractResultLinks(upstreamData);

    if (links.length === 0) {
      return NextResponse.json(
        { success: false, message: "কোনো dakhila link পাওয়া যায়নি" },
        { status: 404 }
      );
    }

    user.balance -= serviceCost;

    await Spent.create({
      user: user._id,
      service: service._id,
      serviceName: service.name,
      amount: serviceCost,
      data: JSON.stringify({
        holdingUrl,
        links,
      }),
      dataSchema: "LandDakhilaFinder",
    });

    const resellerEarning = userService ? userService.fee : 0;

    if (reseller && !user.isSpecialUser && resellerEarning > 0) {
      reseller.balance += resellerEarning;

      await Earnings.create({
        user: user._id,
        reseller: reseller._id,
        service: service._id,
        amount: resellerEarning,
        data: holdingUrl,
        dataSchema: "LandDakhilaFinder",
      });

      await reseller.save();
    }

    await user.save();

    return NextResponse.json(
      {
        success: true,
        pdfUrls: links,
        links,
        serviceCost,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Land dakhila lookup error:", error);
    return NextResponse.json(
      { success: false, message: "Internal Server Error" },
      { status: 500 }
    );
  }
}

function extractResultLinks(payload: unknown): string[] {
  const found = new Set<string>();

  const addIfUrl = (value: unknown) => {
    if (typeof value !== "string") return;
    if (!value.startsWith("http")) return;
    found.add(value);
  };

  const scan = (value: unknown) => {
    if (!value) return;
    if (Array.isArray(value)) {
      value.forEach(scan);
      return;
    }
    if (typeof value === "object") {
      const obj = value as Record<string, unknown>;
      Object.values(obj).forEach(scan);
      return;
    }
    addIfUrl(value);
  };

  scan(payload);
  return [...found];
}