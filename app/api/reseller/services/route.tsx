import { connectDB } from "@/lib/mongodb";
import { NextResponse } from "next/server";
import { ensureLdTaxPaymentService } from "@/app/api/ldtax-payment/_shared";

export async function GET() {
    try {
        const db = await connectDB();
        await ensureLdTaxPaymentService();
        const services = await db.collection("services").find({}).toArray();
     
        return NextResponse.json(services);
    } catch {
        return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
    }
}