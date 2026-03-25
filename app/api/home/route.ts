import { connectDB } from "@/lib/mongodb";
import Spent from "@/models/Use";
import Transaction from "@/models/Transaction";
import Services from "@/models/Services";
import User from "@/models/User";
import { NextResponse } from "next/server";
import { getUser } from "@/lib/getUser";


export async function GET() {
  try {
    await connectDB();
    const user = await getUser();
    if(!user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const rawSpentList = await Spent.find({ user: user._id })
      .select("_id service serviceName dataSchema amount createdAt")
      .sort({ createdAt: -1 })
      .lean();

    const schemaLabelMap: Record<string, string> = {
      RegistrationApplication: "Birth Registration Application",
      CurrectionApplication: "Birth Correction Application",
      ApplicationPDF: "Application PDF",
      MinistryData: "Birth Ministry Data",
    };

    const serviceIds = Array.from(
      new Set(
        rawSpentList
          .map((item: any) => String(item?.service || ""))
          .filter(Boolean)
      )
    );

    const serviceDocs = await Services.find({ _id: { $in: serviceIds } })
      .select("_id name")
      .lean();

    const serviceNameMap = new Map<string, string>(
      serviceDocs.map((service: any) => [String(service._id), String(service.name || "")])
    );

    // Historical bug compatibility:
    // Some spent records stored user.services sub-document _id instead of service _id.
    // Map both ids -> service name so old data still renders correctly.
    const userWithServices = await User.findById(user._id)
      .select("services")
      .populate("services.service", "name")
      .lean();

    const assignedServices = Array.isArray((userWithServices as any)?.services)
      ? (userWithServices as any).services
      : [];

    assignedServices.forEach((entry: any) => {
      const subDocId = String(entry?._id || "");
      const serviceObj = entry?.service;
      const realServiceId =
        serviceObj && typeof serviceObj === "object"
          ? String(serviceObj._id || "")
          : String(serviceObj || "");
      const name =
        serviceObj && typeof serviceObj === "object"
          ? String(serviceObj.name || "")
          : "";

      if (name) {
        if (subDocId) serviceNameMap.set(subDocId, name);
        if (realServiceId) serviceNameMap.set(realServiceId, name);
      }
    });

    const spentList = rawSpentList.map((item: any) => {
      const serviceId = String(item?.service || "");
      const inferredFromSchema = schemaLabelMap[String(item?.dataSchema || "")] || "";
      const resolvedName =
        String(item?.serviceName || "") ||
        serviceNameMap.get(serviceId) ||
        inferredFromSchema ||
        "";

      return {
        _id: item._id,
        service: serviceId,
        serviceName: resolvedName,
        amount: item.amount,
        createdAt: item.createdAt,
      };
    });

    const backfillOps = spentList
      .filter((item: any) => item.serviceName)
      .map((item: any) => ({
        updateOne: {
          filter: { _id: item._id, $or: [{ serviceName: { $exists: false } }, { serviceName: "" }] },
          update: { $set: { serviceName: item.serviceName } },
        },
      }));

    if (backfillOps.length > 0) {
      await Spent.bulkWrite(backfillOps, { ordered: false });
    }

    const recharges = await Transaction.find({ user: user._id })
      .select("_id trxId amount method status number createdAt")
      .sort({ createdAt: -1 })
      .lean();

    const data = {
      spentList,
      recharges,
    };
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json(
      { message: "Internal Server Error" },
      { status: 500 }
    );
  }
}
