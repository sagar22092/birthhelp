import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import RechargeHistory from "@/components/RechargeHistory";

export default async function RechargeHistoryPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value;

  if (!token) {
    redirect("/login");
  }

  return <RechargeHistory />;
}
