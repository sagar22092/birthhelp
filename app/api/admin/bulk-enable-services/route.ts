import { NextRequest, NextResponse } from "next/server";
import User from "@/models/User";
import Services from "@/models/Services";
import { connectDB } from "@/lib/mongodb";
import { getUser } from "@/lib/getUser";

/**
 * Admin-only endpoint to enable Land Dakhila Finder and LDTAX Payment for all users
 */
export async function POST(request: NextRequest) {
    try {
        await connectDB();

        const user = await getUser();
        if (!user || !user.isSpecialUser) {
            return NextResponse.json(
                { success: false, error: "Only admins can use this endpoint" },
                { status: 403 }
            );
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

        // Get all users
        const allUsers = await User.find({});

        let addedCount = 0;

        for (const u of allUsers) {
            let modified = false;

            // Check and add Land Dakhila Finder
            const hasLand = u.services?.some(
                (s: any) => s.service?.toString() === landDakhila._id.toString()
            );
            if (!hasLand) {
                u.services.push({ service: landDakhila._id, fee: 0 });
                modified = true;
            }

            // Check and add LDTAX Payment
            const hasLdtax = u.services?.some(
                (s: any) => s.service?.toString() === ldtaxPayment._id.toString()
            );
            if (!hasLdtax) {
                u.services.push({ service: ldtaxPayment._id, fee: 0 });
                modified = true;
            }

            if (modified) {
                await u.save();
                addedCount++;
            }
        }

        return NextResponse.json({
            success: true,
            message: `✅ Services enabled for ${addedCount} user(s)`,
            details: {
                totalUsers: allUsers.length,
                usersUpdated: addedCount,
                servicesAdded: [
                    { name: "Land Dakhila Finder", defaultFee: 100 },
                    { name: "LDTAX Payment", defaultFee: 150 },
                ],
            },
        });
    } catch (error: unknown) {
        console.error("Admin bulk enable services error:", error);
        return NextResponse.json(
            { success: false, error: "Failed to enable services" },
            { status: 500 }
        );
    }
}
