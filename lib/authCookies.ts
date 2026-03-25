import { NextRequest } from "next/server";

export function shouldUseSecureCookies(req: NextRequest) {
  const forwardedProto = req.headers.get("x-forwarded-proto");

  if (forwardedProto) {
    return forwardedProto.includes("https");
  }

  return req.nextUrl.protocol === "https:";
}