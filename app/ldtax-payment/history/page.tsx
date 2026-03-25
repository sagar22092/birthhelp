import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import LdTaxPaymentHistory from "@/components/LdTaxPaymentHistory";

export default async function LdTaxPaymentHistoryPage() {
    const cookieStore = await cookies();
    const token = cookieStore.get("token")?.value;

    if (!token) {
        redirect("/login");
    }

    return <LdTaxPaymentHistory />;
}