import { getUser } from "@/lib/getUser";
import { connectDB } from "@/lib/mongodb";
import Spent from "@/models/Use";
import { NextResponse } from "next/server";
import { LDTAX_PAYMENT_DATA_SCHEMA } from "../_shared";

export async function GET() {
    try {
        await connectDB();
        const user = await getUser();

        if (!user) {
            return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
        }

        const history = await Spent.find({
            user: user._id,
            dataSchema: LDTAX_PAYMENT_DATA_SCHEMA,
        })
            .sort({ createdAt: -1 })
            .select("_id data amount serviceName createdAt");

        const normalized = history.map((item) => {
            let holdingUrl = "";
            let paymentUrl = "";
            let demand = 0;

            try {
                const parsed = JSON.parse(item.data || "{}");
                if (typeof parsed?.holdingUrl === "string") {
                    holdingUrl = parsed.holdingUrl;
                }
                if (typeof parsed?.paymentUrl === "string") {
                    paymentUrl = parsed.paymentUrl;
                }
                if (typeof parsed?.demand === "number") {
                    demand = parsed.demand;
                }
            } catch {
                // Ignore legacy malformed payloads.
            }

            return {
                _id: item._id,
                amount: item.amount,
                serviceName: item.serviceName,
                createdAt: item.createdAt,
                holdingUrl,
                paymentUrl,
                demand,
            };
        });

        return NextResponse.json(normalized, { status: 200 });
    } catch (error) {
        console.error("LDTAX payment history error:", error);
        return NextResponse.json(
            { message: "Internal Server Error" },
            { status: 500 }
        );
    }
}