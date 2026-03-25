import { NextRequest, NextResponse } from "next/server";
import User from "@/models/User";
import Services from "@/models/Services";
import { connectDB } from "@/lib/mongodb";
import { getReseller } from "@/lib/getReseller";

export async function POST(request: NextRequest) {
    try {
        await connectDB();

        const reseller = await getReseller();
        if (!reseller || !reseller._id) {
            return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
        }

        // Ensure services exist
        const landDakhila = await Services.findOneAndUpdate(
            { href: "/land-dakhila" },
            {
                $setOnInsert: {
                    id: "land-dakhila",
                    name: "Land Dakhila Finder",
                    fee: 100,
                    href: "/land-dakhila",
                    note: "Default enabled",
                },
            },
            { upsert: true, new: true }
        );

        const ldtaxPayment = await Services.findOneAndUpdate(
            { href: "/ldtax-payment" },
            {
                $setOnInsert: {
                    id: "ldtax-payment",
                    name: "LDTAX Payment",
                    fee: 150,
                    href: "/ldtax-payment",
                    note: "Link না এলে কোনো টাকা কাটা হবে না",
                },
            },
            { upsert: true, new: true }
        );

        // Only update users under this reseller
        const users = await User.find({ reseller: reseller._id });

        let addedCount = 0;

        for (const user of users) {
            let modified = false;

            // Check and add Land Dakhila Finder
            const hasLand = user.services?.some(
                (s: any) => s.service?.toString() === landDakhila._id.toString()
            );
            if (!hasLand) {
                user.services.push({ service: landDakhila._id, fee: 0 });
                modified = true;
            }

            // Check and add LDTAX Payment
            const hasLdtax = user.services?.some(
                (s: any) => s.service?.toString() === ldtaxPayment._id.toString()
            );
            if (!hasLdtax) {
                user.services.push({ service: ldtaxPayment._id, fee: 0 });
                modified = true;
            }

            if (modified) {
                await user.save();
                addedCount++;
            }
        }

        return NextResponse.json({
            success: true,
            message: `Services enabled for ${addedCount} user(s) under your reseller account`,
            details: {
                totalUsersUnderReseller: users.length,
                usersUpdated: addedCount,
                servicesAdded: [
                    { name: "Land Dakhila Finder", defaultFee: 100 },
                    { name: "LDTAX Payment", defaultFee: 150 },
                ],
            },
        });
    } catch (error: unknown) {
        console.error("Bulk enable services error:", error);
        return NextResponse.json(
            { success: false, error: "Failed to enable services" },
            { status: 500 }
        );
    }
}
