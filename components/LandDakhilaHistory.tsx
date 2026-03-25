"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  Calendar,
  Download,
  ExternalLink,
  History,
  Link2,
  Loader2,
  Search,
  Wallet,
} from "lucide-react";
import toast from "react-hot-toast";

interface LandDakhilaHistoryItem {
  _id: string;
  holdingUrl: string;
  links: string[];
  amount: number;
  serviceName?: string;
  createdAt: string;
}

export default function LandDakhilaHistory() {
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState<LandDakhilaHistoryItem[]>([]);
  const [search, setSearch] = useState("");
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        setLoading(true);
        const response = await fetch("/api/land-dakhila/history", {
          credentials: "include",
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data?.message || "History load failed");
        }

        setItems(Array.isArray(data) ? data : []);
      } catch (error) {
        const message = error instanceof Error ? error.message : "History load failed";
        toast.error(message);
      } finally {
        setLoading(false);
      }
    };

    fetchHistory();
  }, []);

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return items;
    return items.filter((item) => (item.holdingUrl || "").toLowerCase().includes(term));
  }, [items, search]);

  const stats = useMemo(() => {
    const totalRequests = items.length;
    const totalSpent = items.reduce((sum, item) => sum + Number(item.amount || 0), 0);
    const totalResponses = items.reduce((sum, item) => sum + (item.links?.length || 0), 0);

    return {
      totalRequests,
      totalSpent,
      totalResponses,
    };
  }, [items]);

  const handleDownload = async (url: string, rowId: string, index: number) => {
    try {
      setDownloadingId(`${rowId}-${index}`);
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
      link.download = `dakhila-history-${index + 1}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(objectUrl);
      toast.success("PDF download started");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Download failed";
      toast.error(message);
    } finally {
      setDownloadingId(null);
    }
  };

  const formatDate = (value: string) => {
    if (!value) return "-";
    return new Date(value).toLocaleString("bn-BD", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,rgba(34,197,94,0.16),transparent_32%),linear-gradient(180deg,#f8fafc_0%,#eef6f0_100%)] dark:bg-[radial-gradient(circle_at_top,rgba(34,197,94,0.18),transparent_24%),linear-gradient(180deg,#0b1220_0%,#0f172a_100%)]">
      <div className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        <section className="mb-6 overflow-hidden rounded-3xl border border-emerald-200/70 bg-white/90 p-6 shadow-[0_24px_80px_-32px_rgba(22,163,74,0.45)] backdrop-blur dark:border-emerald-500/20 dark:bg-slate-900/85 sm:p-8">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-3xl space-y-3">
              <div className="inline-flex items-center gap-2 rounded-full border border-emerald-300/80 bg-emerald-50 px-3 py-1 text-sm font-medium text-emerald-700 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-300">
                <History className="h-4 w-4" />
                Land Dakhila History
              </div>
              <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-4xl">
                Land Dakhila response history
              </h1>
              <p className="text-sm leading-6 text-slate-600 dark:text-slate-300 sm:text-base">
                আপনার করা সকল request, response link এবং PDF download action এক জায়গায় দেখুন।
              </p>
            </div>

            <Link
              href="/land-dakhila"
              className="inline-flex items-center justify-center rounded-2xl bg-emerald-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-emerald-700"
            >
              Back To Finder
            </Link>
          </div>
        </section>

        <section className="mb-6 grid gap-4 md:grid-cols-3">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500 dark:text-slate-400">Total Requests</p>
                <p className="mt-2 text-3xl font-semibold text-slate-900 dark:text-white">
                  {stats.totalRequests}
                </p>
              </div>
              <History className="h-8 w-8 text-emerald-500" />
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500 dark:text-slate-400">Total Responses</p>
                <p className="mt-2 text-3xl font-semibold text-slate-900 dark:text-white">
                  {stats.totalResponses}
                </p>
              </div>
              <Link2 className="h-8 w-8 text-sky-500" />
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500 dark:text-slate-400">Total Spent</p>
                <p className="mt-2 text-3xl font-semibold text-slate-900 dark:text-white">
                  ৳ {stats.totalSpent}
                </p>
              </div>
              <Wallet className="h-8 w-8 text-amber-500" />
            </div>
          </div>
        </section>

        <div className="mb-5 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <label htmlFor="history-search" className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">
            Search By Holding URL
          </label>
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
            <input
              id="history-search"
              type="text"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="holding URL লিখে filter করুন"
              className="w-full rounded-xl border border-slate-300 bg-slate-50 py-2.5 pl-10 pr-3 text-sm text-slate-900 outline-none transition focus:border-emerald-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
            />
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
          {loading ? (
            <div className="flex items-center justify-center gap-2 px-6 py-14 text-slate-600 dark:text-slate-300">
              <Loader2 className="h-5 w-5 animate-spin" />
              Loading history...
            </div>
          ) : filtered.length === 0 ? (
            <div className="px-6 py-14 text-center text-slate-500 dark:text-slate-400">
              কোনো history পাওয়া যায়নি
            </div>
          ) : (
            <div className="grid gap-4 p-4 sm:p-6">
              {filtered.map((item, index) => (
                <div
                  key={item._id}
                  className="rounded-2xl border border-slate-200 bg-slate-50 p-4 shadow-sm transition hover:shadow-md dark:border-slate-700 dark:bg-slate-800/60"
                >
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <div className="min-w-0 flex-1 space-y-3">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-300">
                          Request #{index + 1}
                        </span>
                        <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3 py-1 text-xs text-slate-600 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-300">
                          <Calendar className="h-3.5 w-3.5" />
                          {formatDate(item.createdAt)}
                        </span>
                        <span className="rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-300">
                          ৳ {Number(item.amount || 0)}
                        </span>
                      </div>

                      <div>
                        <p className="mb-1 text-xs font-semibold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">
                          Holding URL
                        </p>
                        <p className="break-all text-sm text-slate-800 dark:text-slate-100">
                          {item.holdingUrl || "-"}
                        </p>
                      </div>

                      <div>
                        <p className="mb-2 text-xs font-semibold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">
                          Response Links
                        </p>

                        {item.links?.length ? (
                          <div className="space-y-2">
                            {item.links.map((linkUrl, linkIndex) => {
                              const buttonId = `${item._id}-${linkIndex}`;
                              const loadingThis = downloadingId === buttonId;
                              return (
                                <div
                                  key={buttonId}
                                  className="flex flex-col gap-2 rounded-xl border border-slate-200 bg-white p-3 dark:border-slate-700 dark:bg-slate-900/70 lg:flex-row lg:items-center lg:justify-between"
                                >
                                  <div className="min-w-0 flex-1">
                                    <p className="truncate text-sm text-slate-700 dark:text-slate-200" title={linkUrl}>
                                      {linkUrl}
                                    </p>
                                  </div>

                                  <div className="flex flex-wrap gap-2">
                                    <a
                                      href={linkUrl}
                                      target="_blank"
                                      rel="noreferrer"
                                      className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 px-3 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-100 dark:border-slate-600 dark:text-slate-200 dark:hover:bg-slate-700"
                                    >
                                      <ExternalLink className="h-3.5 w-3.5" />
                                      Open
                                    </a>
                                    <button
                                      type="button"
                                      onClick={() => handleDownload(linkUrl, item._id, linkIndex)}
                                      disabled={loadingThis}
                                      className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-2 text-xs font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-70"
                                    >
                                      <Download className="h-3.5 w-3.5" />
                                      {loadingThis ? "Downloading..." : `Download PDF ${linkIndex + 1}`}
                                    </button>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        ) : (
                          <div className="rounded-xl border border-dashed border-slate-300 bg-white px-4 py-3 text-sm text-slate-500 dark:border-slate-700 dark:bg-slate-900/60 dark:text-slate-400">
                            No saved response
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
