"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ExternalLink, FileSearch, Loader2, Link as LinkIcon, Copy, Printer } from "lucide-react";
import toast from "react-hot-toast";

interface DakhilaLookupResponse {
  success: boolean;
  pdfUrls: string[];
  serviceCost: number;
  message?: string;
}

export default function LandDakhilaFinder() {
  const [inputUrl, setInputUrl] = useState("");
  const [serviceCost, setServiceCost] = useState<number | null>(null);
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(false);
  const [sessionLoading, setSessionLoading] = useState(true);
  const [pdfUrls, setPdfUrls] = useState<string[]>([]);
  const [downloadingIndex, setDownloadingIndex] = useState<number | null>(null);

  useEffect(() => {
    const loadSession = async () => {
      try {
        const response = await fetch("/api/land-dakhila/session", {
          credentials: "include",
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data?.error || data?.message || "Service access failed");
        }

        setServiceCost(Number(data.serviceCost || 0));
        setNote(String(data.note || ""));
      } catch (error) {
        const message = error instanceof Error ? error.message : "Service access failed";
        toast.error(message);
      } finally {
        setSessionLoading(false);
      }
    };

    loadSession();
  }, []);

  const handleCopy = async (value: string) => {
    try {
      await navigator.clipboard.writeText(value);
      toast.success("Link copied");
    } catch {
      toast.error("Copy failed");
    }
  };

  const handleDirectDownload = async (url: string, index: number) => {
    try {
      setDownloadingIndex(index);
      const response = await fetch(`/api/land-dakhila/download?url=${encodeURIComponent(url)}`, {
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error("Download failed");
      }

      const blob = await response.blob();
      const objectUrl = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = objectUrl;
      link.download = `dakhila-${index + 1}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(objectUrl);
      toast.success("Download started");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Download failed";
      toast.error(message);
    } finally {
      setDownloadingIndex(null);
    }
  };

  const handleSubmit = async () => {
    if (!inputUrl.trim()) {
      toast.error("Holding URL দিন");
      return;
    }

    setLoading(true);
    setPdfUrls([]);

    try {
      const response = await fetch("/api/land-dakhila", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({ input: inputUrl.trim() }),
      });

      const data = (await response.json()) as DakhilaLookupResponse;

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Dakhila links পাওয়া যায়নি");
      }

      setPdfUrls(data.pdfUrls || []);
      setServiceCost(Number(data.serviceCost || 0));

      if ((data.pdfUrls || []).length === 0) {
        toast.error("কোনো dakhila link পাওয়া যায়নি");
        return;
      }

      toast.success(`${data.pdfUrls.length}টি dakhila link পাওয়া গেছে`);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Request failed";
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,rgba(34,197,94,0.16),transparent_32%),linear-gradient(180deg,#f8fafc_0%,#eef6f0_100%)] dark:bg-[radial-gradient(circle_at_top,rgba(34,197,94,0.18),transparent_24%),linear-gradient(180deg,#0b1220_0%,#0f172a_100%)]">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-8 px-4 py-8 sm:px-6 lg:px-8">
        <section className="overflow-hidden rounded-3xl border border-emerald-200/70 bg-white/90 p-6 shadow-[0_24px_80px_-32px_rgba(22,163,74,0.45)] backdrop-blur dark:border-emerald-500/20 dark:bg-slate-900/85 sm:p-8">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-2xl space-y-3">
              <div className="inline-flex items-center gap-2 rounded-full border border-emerald-300/80 bg-emerald-50 px-3 py-1 text-sm font-medium text-emerald-700 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-300">
                <FileSearch className="h-4 w-4" />
                Land Dakhila Finder
              </div>
              <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-4xl">
                Holding link থেকে Dakhila PDF খুঁজে বের করুন
              </h1>
              <p className="text-sm leading-6 text-slate-600 dark:text-slate-300 sm:text-base">
                `portal.ldtax.gov.bd` এর holding URL paste করলে available dakhila print link পাওয়া যাবে।
              </p>
            </div>

            <div className="min-w-[220px] rounded-2xl border border-slate-200 bg-slate-50/90 p-4 dark:border-slate-700 dark:bg-slate-800/70">
              <p className="text-xs uppercase tracking-[0.24em] text-slate-500 dark:text-slate-400">
                Service Charge
              </p>
              <p className="mt-2 text-3xl font-semibold text-slate-900 dark:text-white">
                {sessionLoading ? "..." : `৳ ${serviceCost ?? 0}`}
              </p>
              <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">{note}</p>
              <Link
                href="/land-dakhila/history"
                className="mt-3 inline-flex items-center rounded-lg border border-emerald-300 bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700 transition hover:bg-emerald-100 dark:border-emerald-500/40 dark:bg-emerald-500/10 dark:text-emerald-300"
              >
                View History
              </Link>
            </div>
          </div>
        </section>

        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-8">
          <div className="space-y-5">
            <div>
              <label htmlFor="holding-link" className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">
                Holding URL
              </label>
              <div className="relative">
                <LinkIcon className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
                <input
                  id="holding-link"
                  value={inputUrl}
                  onChange={(event) => setInputUrl(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") {
                      handleSubmit();
                    }
                  }}
                  placeholder="https://portal.ldtax.gov.bd/citizen/holding/..."
                  className="w-full rounded-2xl border border-slate-300 bg-slate-50 py-4 pl-12 pr-4 text-sm text-slate-900 outline-none ring-0 transition focus:border-emerald-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                />
              </div>
            </div>

            <button
              type="button"
              onClick={handleSubmit}
              disabled={loading || sessionLoading}
              className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-5 py-3.5 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
            >
              {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <FileSearch className="h-5 w-5" />}
              {loading ? "খোঁজা হচ্ছে..." : "Dakhila খুঁজুন"}
            </button>
          </div>
        </section>

        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-8">
          <div className="mb-5 flex items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-semibold text-slate-900 dark:text-white">PDF Links</h2>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                Result পাওয়া গেলে নিচে print links দেখাবে
              </p>
            </div>
            <div className="rounded-full border border-slate-200 px-3 py-1 text-sm text-slate-600 dark:border-slate-700 dark:text-slate-300">
              {pdfUrls.length} found
            </div>
          </div>

          {pdfUrls.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-6 py-12 text-center text-slate-500 dark:border-slate-700 dark:bg-slate-800/60 dark:text-slate-400">
              এখনো কোনো result নেই
            </div>
          ) : (
            <div className="grid gap-4">
              {pdfUrls.map((url, index) => (
                <div
                  key={url}
                  className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-800/70 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="min-w-0">
                    <p className="text-xs uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">
                      PDF {index + 1}
                    </p>
                    <p className="mt-1 break-all text-sm text-slate-800 dark:text-slate-100">{url}</p>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => handleCopy(url)}
                      className="inline-flex items-center gap-2 rounded-xl border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100 dark:border-slate-600 dark:text-slate-200 dark:hover:bg-slate-700"
                    >
                      <Copy className="h-4 w-4" />
                      Copy
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDirectDownload(url, index)}
                      disabled={downloadingIndex === index}
                      className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-70"
                    >
                      <Printer className="h-4 w-4" />
                      {downloadingIndex === index ? "Downloading..." : "Download PDF"}
                    </button>
                    <a
                      href={url}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-700 dark:bg-slate-700 dark:hover:bg-slate-600"
                    >
                      <ExternalLink className="h-4 w-4" />
                      Open
                    </a>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}