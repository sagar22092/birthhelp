import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import LandDakhilaHistory from "@/components/LandDakhilaHistory";

export default async function LandDakhilaHistoryPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value;

  if (!token) {
    redirect("/login");
  }

  return <LandDakhilaHistory />;
}
