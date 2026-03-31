import { NextRequest, NextResponse } from "next/server";
import jwt, { JwtPayload } from "jsonwebtoken";
import { connectDB } from "@/lib/mongodb";
import User from "@/models/User";
import { shouldUseSecureCookies } from "@/lib/authCookies";

interface TokenPayload extends JwtPayload {
  userId: string;
  email: string;
}

export async function POST(req: NextRequest) {
  try {
    const refreshToken =
      req.cookies.get("refreshToken")?.value ||
      req.headers.get("cookie")?.match(/refreshToken=([^;]+)/)?.[1];

    if (!refreshToken) {
      return NextResponse.json(
        { message: "No refresh token" },
        { status: 401 }
      );
    }

    // Verify refresh token
    let decoded: TokenPayload;
    try {
      decoded = jwt.verify(
        refreshToken,
        process.env.JWT_REFRESH_SECRET!
      ) as TokenPayload;
    } catch {
      return NextResponse.json(
        { message: "Invalid or expired refresh token" },
        { status: 401 }
      );
    }

    if (!decoded?.userId) {
      return NextResponse.json({ message: "Invalid token" }, { status: 401 });
    }

    // Verify user still exists and is active
    await connectDB();
    const user = await User.findById(decoded.userId).select("-password");
    if (!user || user.isBanned) {
      return NextResponse.json(
        { message: "User not found or banned" },
        { status: 401 }
      );
    }

    // Issue new access token (1 day)
    const newAccessToken = jwt.sign(
      { userId: decoded.userId, email: decoded.email, type: "access" },
      process.env.JWT_SECRET!,
      { expiresIn: "1d" }
    );

    const secureCookies = shouldUseSecureCookies(req);
    const response = NextResponse.json(
      { token: newAccessToken, message: "Token refreshed" },
      { status: 200 }
    );

    // Set new access token cookie
    response.cookies.set({
      name: "token",
      value: newAccessToken,
      httpOnly: true,
      maxAge: 24 * 60 * 60, // 1 day
      sameSite: "lax",
      path: "/",
      secure: secureCookies,
    });

    return response;
  } catch (error) {
    console.error("Refresh token error:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}
