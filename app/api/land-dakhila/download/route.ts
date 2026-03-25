import { getUser } from "@/lib/getUser";
import { connectDB } from "@/lib/mongodb";
import { NextRequest, NextResponse } from "next/server";
import puppeteer from "puppeteer";

// Only allow downloading from these trusted hostnames
const ALLOWED_HOSTS = ["portal.ldtax.gov.bd", "dakhila.ldtax.gov.bd", "ldtax.gov.bd"];

export async function GET(req: NextRequest) {
  try {
    await connectDB();
    const user = await getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const rawUrl = req.nextUrl.searchParams.get("url");

    if (!rawUrl) {
      return NextResponse.json({ error: "url parameter required" }, { status: 400 });
    }

    // Validate the URL is from a trusted host (SSRF protection)
    let parsed: URL;
    try {
      parsed = new URL(rawUrl);
    } catch {
      return NextResponse.json({ error: "Invalid URL" }, { status: 400 });
    }

    const hostname = parsed.hostname.toLowerCase();
    if (!ALLOWED_HOSTS.some((h) => hostname === h || hostname.endsWith(`.${h}`))) {
      return NextResponse.json({ error: "URL not allowed" }, { status: 403 });
    }

    const upstream = await fetch(parsed.toString(), { cache: "no-store" });

    if (!upstream.ok) {
      return NextResponse.json({ error: "Failed to fetch PDF" }, { status: 502 });
    }

    const contentType = upstream.headers.get("content-type") || "text/html";
    const isHtml = contentType.includes("text/html");

    if (isHtml) {
      // Render upstream print page to real PDF and remove visible print controls.
      const browser = await puppeteer.launch({
        headless: true,
        args: ["--no-sandbox", "--disable-setuid-sandbox"],
      });

      try {
        const page = await browser.newPage();
        await page.goto(parsed.toString(), { waitUntil: "networkidle2", timeout: 60000 });

        await page.evaluate(() => {
          const candidates = document.querySelectorAll("button, a, input[type='button'], input[type='submit']");
          candidates.forEach((el) => {
            const text = (el.textContent || "").toLowerCase();
            const value = ((el as HTMLInputElement).value || "").toLowerCase();
            if (text.includes("print") || text.includes("প্রিন্ট") || value.includes("print") || value.includes("প্রিন্ট")) {
              (el as HTMLElement).style.display = "none";
            }
          });

          const style = document.createElement("style");
          style.innerHTML = `
            @page { margin: 8mm; }
            body { margin: 0 !important; }
          `;
          document.head.appendChild(style);
        });

        const pdf = await page.pdf({
          format: "A4",
          printBackground: true,
          margin: {
            top: "8mm",
            right: "8mm",
            bottom: "8mm",
            left: "8mm",
          },
        });

        const pathParts = parsed.pathname.split("/").filter(Boolean);
        const lastPart = pathParts[pathParts.length - 1] || Date.now().toString();
        const filename = `dakhila-${lastPart}.pdf`;
        const pdfBytes = new Uint8Array(pdf.byteLength);
        pdfBytes.set(pdf);
        const pdfBlob = new Blob([pdfBytes.buffer], { type: "application/pdf" });

        return new NextResponse(pdfBlob, {
          status: 200,
          headers: {
            "Content-Type": "application/pdf",
            "Content-Disposition": `attachment; filename="${filename}"`,
            "Content-Length": String(pdf.byteLength),
          },
        });
      } finally {
        await browser.close();
      }
    }

    // Binary file (actual PDF)
    const buffer = await upstream.arrayBuffer();
    const pathParts = parsed.pathname.split("/").filter(Boolean);
    const filename = pathParts[pathParts.length - 1] || "dakhila.pdf";

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Content-Length": String(buffer.byteLength),
      },
    });
  } catch (error) {
    console.error("Download proxy error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
