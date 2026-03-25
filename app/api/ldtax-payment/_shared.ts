import Services from "@/models/Services";

export const LDTAX_PAYMENT_PATH = "/ldtax-payment";
export const LDTAX_PAYMENT_NAME = "LDTAX Payment";
export const LDTAX_PAYMENT_ID = "ldtax-payment";
export const LDTAX_PAYMENT_DEFAULT_FEE = 150;
export const LDTAX_PAYMENT_DATA_SCHEMA = "LdTaxPayment";
export const LDTAX_ALLOWED_HOST = "portal.ldtax.gov.bd";

export function extractHoldingUrl(input: string) {
  try {
    const parsed = new URL(input);

    if (parsed.hostname !== LDTAX_ALLOWED_HOST) {
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

export async function ensureLdTaxPaymentService() {
  return Services.findOneAndUpdate(
    { href: LDTAX_PAYMENT_PATH },
    {
      $setOnInsert: {
        id: LDTAX_PAYMENT_ID,
        name: LDTAX_PAYMENT_NAME,
        fee: LDTAX_PAYMENT_DEFAULT_FEE,
        href: LDTAX_PAYMENT_PATH,
        note: "Link না এলে কোনো টাকা কাটা হবে না",
      },
    },
    {
      new: true,
      upsert: true,
    }
  );
}

export function calculateServiceCost({
  user,
  service,
}: {
  user: {
    isSpecialUser?: boolean;
    services: Array<{ service: { toString(): string } | string; fee: number }>;
  };
  service: { _id: { toString(): string }; fee: number };
}) {
  const userService = user.services.find(
    (entry) => entry.service.toString() === service._id.toString()
  );

  if (!userService) {
    return { serviceCost: null, userService: null };
  }

  const serviceCost = user.isSpecialUser
    ? userService.fee
    : userService.fee + service.fee;

  return { serviceCost, userService };
}