import { getUser } from "@/lib/getUser";
import { connectDB } from "@/lib/mongodb";
import Earnings from "@/models/Earnings";
import Reseller from "@/models/Reseller";
import Spent from "@/models/Use";
import { NextResponse } from "next/server";
import {
  calculateServiceCost,
  ensureLdTaxPaymentService,
  extractHoldingUrl,
  LDTAX_PAYMENT_DATA_SCHEMA,
} from "./_shared";

interface UpstreamPayload {
  url?: unknown;
  holding_data?: {
    total_demand?: unknown;
    citizen_id?: unknown;
    holding_id?: unknown;
    advance_year?: unknown;
  };
  message?: unknown;
  error?: unknown;
}

function normalizeAdvanceYear(input: unknown) {
  const value = Number.parseInt(String(input ?? "0"), 10);

  if (Number.isNaN(value) || value < 0) {
    return null;
  }

  return value;
}

async function callUpstreamPaymentLink(upstreamUrl: string) {
  const attempts: Array<{ method: "POST" | "GET"; response: Response }> = [];

  const postResponse = await fetch(upstreamUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json, text/plain, */*",
    },
    body: "",
    cache: "no-store",
  });

  attempts.push({ method: "POST", response: postResponse });

  if (postResponse.ok) {
    return attempts[0];
  }

  const getResponse = await fetch(upstreamUrl, {
    method: "GET",
    headers: {
      Accept: "application/json, text/plain, */*",
    },
    cache: "no-store",
  });

  attempts.push({ method: "GET", response: getResponse });
  return attempts[attempts.length - 1];
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const input = String(body?.input || "").trim();
    const advanceYear = normalizeAdvanceYear(body?.advance_year);
    const holdingUrl = extractHoldingUrl(input);

    if (!holdingUrl) {
      return NextResponse.json(
        { success: false, message: "Valid holding URL দিন" },
        { status: 400 }
      );
    }

    if (advanceYear === null) {
      return NextResponse.json(
        { success: false, message: "Advance year valid number দিন" },
        { status: 400 }
      );
    }

    await connectDB();
    const user = await getUser();

    if (!user) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    const reseller = user.reseller ? await Reseller.findById(user.reseller) : null;
    const service = await ensureLdTaxPaymentService();
    const { serviceCost, userService } = calculateServiceCost({ user, service });

    if (!userService || serviceCost === null) {
      return NextResponse.json(
        { success: false, message: "Service is not enabled for your account" },
        { status: 403 }
      );
    }

    if (user.balance < serviceCost) {
      return NextResponse.json(
        { success: false, message: "Insufficient balance" },
        { status: 402 }
      );
    }

    const upstreamUrl = new URL("https://api.udcsheva.com/payment_link_gen.php");
    upstreamUrl.searchParams.set("url", holdingUrl);
    upstreamUrl.searchParams.set("advance_year", String(advanceYear));

    const upstreamAttempt = await callUpstreamPaymentLink(upstreamUrl.toString());
    const upstreamResponse = upstreamAttempt.response;

    if (!upstreamResponse.ok) {
      const upstreamText = await upstreamResponse.text();
      return NextResponse.json(
        {
          success: false,
          message: `Upstream service failed (${upstreamAttempt.method} ${upstreamResponse.status})`,
          details: upstreamText.slice(0, 300),
        },
        { status: 502 }
      );
    }

    const upstreamData = (await upstreamResponse.json()) as UpstreamPayload;
    const paymentUrl = typeof upstreamData?.url === "string" ? upstreamData.url.trim() : "";
    const demand = Number(upstreamData?.holding_data?.total_demand ?? 0);
    const upstreamMessage =
      typeof upstreamData?.message === "string"
        ? upstreamData.message
        : typeof upstreamData?.error === "string"
          ? upstreamData.error
          : "Payment link পাওয়া যায়নি, টাকা কাটা হয়নি";

    if (!paymentUrl) {
      return NextResponse.json(
        {
          success: false,
          message: upstreamMessage,
        },
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
        paymentUrl,
        demand,
        advanceYear,
        holdingData: upstreamData?.holding_data || {},
      }),
      dataSchema: LDTAX_PAYMENT_DATA_SCHEMA,
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
        dataSchema: LDTAX_PAYMENT_DATA_SCHEMA,
      });

      await reseller.save();
    }

    await user.save();

    return NextResponse.json(
      {
        success: true,
        url: paymentUrl,
        demand,
        holdingData: upstreamData?.holding_data || {},
        serviceCost,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("LDTAX payment lookup error:", error);
    return NextResponse.json(
      { success: false, message: "Internal Server Error" },
      { status: 500 }
    );
  }
}