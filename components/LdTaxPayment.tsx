"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
    ArrowUpRight,
    BadgeDollarSign,
    ExternalLink,
    Link as LinkIcon,
    Loader2,
    ReceiptText,
    ShieldCheck,
} from "lucide-react";
import toast from "react-hot-toast";

interface SessionResponse {
    success: boolean;
    serviceCost: number;
    note?: string;
    error?: string;
}

interface PaymentLookupResponse {
    success: boolean;
    url?: string;
    demand?: number;
    serviceCost?: number;
    message?: string;
}

export default function LdTaxPayment() {
    const [inputUrl, setInputUrl] = useState("");
    const [advanceYear, setAdvanceYear] = useState("0");
    const [serviceCost, setServiceCost] = useState<number | null>(null);
    const [note, setNote] = useState("");
    const [loading, setLoading] = useState(false);
    const [sessionLoading, setSessionLoading] = useState(true);
    const [paymentUrl, setPaymentUrl] = useState("");
    const [demand, setDemand] = useState<number | null>(null);

    useEffect(() => {
        const loadSession = async () => {
            try {
                const response = await fetch("/api/ldtax-payment/session", {
                    credentials: "include",
                });

                const data = (await response.json()) as SessionResponse;

                if (!response.ok) {
                    throw new Error(data?.error || data?.note || "Service access failed");
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

    const handleCopy = async () => {
        if (!paymentUrl) return;

        try {
            await navigator.clipboard.writeText(paymentUrl);
            toast.success("Payment link copied");
        } catch {
            toast.error("Copy failed");
        }
    };

    const handleSubmit = async () => {
        if (!inputUrl.trim()) {
            toast.error("Holding URL দিন");
            return;
        }

        const normalizedAdvanceYear = Number.parseInt(advanceYear, 10);

        if (Number.isNaN(normalizedAdvanceYear) || normalizedAdvanceYear < 0) {
            toast.error("Advance year valid number দিন");
            return;
        }

        setLoading(true);
        setPaymentUrl("");
        setDemand(null);

        try {
            const response = await fetch("/api/ldtax-payment", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                credentials: "include",
                body: JSON.stringify({
                    input: inputUrl.trim(),
                    advance_year: normalizedAdvanceYear,
                }),
            });

            const data = (await response.json()) as PaymentLookupResponse;

            if (!response.ok || !data.success || !data.url) {
                throw new Error(data.message || "Payment link পাওয়া যায়নি");
            }

            setPaymentUrl(data.url);
            setDemand(Number(data.demand || 0));
            setServiceCost(Number(data.serviceCost || serviceCost || 0));
            toast.success("Payment link ready");
        } catch (error) {
            const message = error instanceof Error ? error.message : "Request failed";
            toast.error(message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-[radial-gradient(circle_at_top,rgba(20,184,166,0.18),transparent_32%),linear-gradient(180deg,#f8fafc_0%,#eef8f6_100%)] dark:bg-[radial-gradient(circle_at_top,rgba(20,184,166,0.18),transparent_24%),linear-gradient(180deg,#0b1220_0%,#0f172a_100%)]">
            <div className="mx-auto flex w-full max-w-5xl flex-col gap-8 px-4 py-8 sm:px-6 lg:px-8">
                <section className="overflow-hidden rounded-3xl border border-teal-200/70 bg-white/90 p-6 shadow-[0_24px_80px_-32px_rgba(13,148,136,0.42)] backdrop-blur dark:border-teal-500/20 dark:bg-slate-900/85 sm:p-8">
                    <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
                        <div className="max-w-2xl space-y-3">
                            <div className="inline-flex items-center gap-2 rounded-full border border-teal-300/80 bg-teal-50 px-3 py-1 text-sm font-medium text-teal-700 dark:border-teal-500/30 dark:bg-teal-500/10 dark:text-teal-300">
                                <ReceiptText className="h-4 w-4" />
                                LDTAX Payment
                            </div>
                            <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-4xl">
                                Holding URL থেকে payment link generate করুন
                            </h1>
                            <p className="text-sm leading-6 text-slate-600 dark:text-slate-300 sm:text-base">
                                Response এ শুধু payment link আর demand দেখানো হবে। Link না এলে কোনো টাকা কাটা হবে না।
                            </p>
                        </div>

                        <div className="min-w-[240px] rounded-2xl border border-slate-200 bg-slate-50/90 p-4 dark:border-slate-700 dark:bg-slate-800/70">
                            <p className="text-xs uppercase tracking-[0.24em] text-slate-500 dark:text-slate-400">
                                Default Price
                            </p>
                            <p className="mt-2 text-3xl font-semibold text-slate-900 dark:text-white">
                                {sessionLoading ? "..." : `৳ ${serviceCost ?? 150}`}
                            </p>
                            <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">{note}</p>
                            <div className="mt-3 inline-flex items-center gap-2 rounded-xl border border-teal-200 bg-teal-50 px-3 py-2 text-xs font-semibold text-teal-700 dark:border-teal-500/30 dark:bg-teal-500/10 dark:text-teal-300">
                                <ShieldCheck className="h-4 w-4" />
                                Link ছাড়া charge হবে না
                            </div>
                            <div>
                                <Link
                                    href="/ldtax-payment/history"
                                    className="mt-3 inline-flex items-center rounded-lg border border-teal-300 bg-teal-50 px-3 py-1.5 text-xs font-semibold text-teal-700 transition hover:bg-teal-100 dark:border-teal-500/40 dark:bg-teal-500/10 dark:text-teal-300"
                                >
                                    View History
                                </Link>
                            </div>
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
                                    className="w-full rounded-2xl border border-slate-300 bg-slate-50 py-4 pl-12 pr-4 text-sm text-slate-900 outline-none ring-0 transition focus:border-teal-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                                />
                            </div>
                        </div>

                        <div>
                            <label htmlFor="advance-year" className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">
                                Advance Year
                            </label>
                            <input
                                id="advance-year"
                                type="number"
                                min="0"
                                step="1"
                                value={advanceYear}
                                onChange={(event) => setAdvanceYear(event.target.value)}
                                className="w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-4 text-sm text-slate-900 outline-none ring-0 transition focus:border-teal-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white sm:max-w-[220px]"
                            />
                        </div>

                        <button
                            type="button"
                            onClick={handleSubmit}
                            disabled={loading || sessionLoading}
                            className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-teal-600 px-5 py-3.5 text-sm font-semibold text-white transition hover:bg-teal-700 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
                        >
                            {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <BadgeDollarSign className="h-5 w-5" />}
                            {loading ? "Generate হচ্ছে..." : "Payment Link Generate করুন"}
                        </button>
                    </div>
                </section>

                <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-8">
                    <div className="mb-5 flex items-center justify-between gap-4">
                        <div>
                            <h2 className="text-xl font-semibold text-slate-900 dark:text-white">Response</h2>
                            <p className="text-sm text-slate-600 dark:text-slate-400">
                                Payment link এলে নিচে link এবং demand দেখাবে
                            </p>
                        </div>
                        <div className="rounded-full border border-slate-200 px-3 py-1 text-sm text-slate-600 dark:border-slate-700 dark:text-slate-300">
                            {paymentUrl ? "Ready" : "Waiting"}
                        </div>
                    </div>

                    {!paymentUrl ? (
                        <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-6 py-12 text-center text-slate-500 dark:border-slate-700 dark:bg-slate-800/60 dark:text-slate-400">
                            এখনো কোনো payment response নেই
                        </div>
                    ) : (
                        <div className="grid gap-4">
                            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5 dark:border-slate-700 dark:bg-slate-800/70">
                                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">
                                    Payment Link
                                </p>
                                <p className="mt-2 break-all text-sm text-slate-800 dark:text-slate-100">{paymentUrl}</p>

                                <div className="mt-4 flex flex-wrap gap-2">
                                    <button
                                        type="button"
                                        onClick={handleCopy}
                                        className="inline-flex items-center gap-2 rounded-xl border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100 dark:border-slate-600 dark:text-slate-200 dark:hover:bg-slate-700"
                                    >
                                        <LinkIcon className="h-4 w-4" />
                                        Copy Link
                                    </button>
                                    <a
                                        href={paymentUrl}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-700 dark:bg-slate-700 dark:hover:bg-slate-600"
                                    >
                                        <ExternalLink className="h-4 w-4" />
                                        Open Link
                                    </a>
                                </div>
                            </div>

                            <div className="rounded-2xl border border-teal-200 bg-teal-50 p-5 dark:border-teal-500/30 dark:bg-teal-500/10">
                                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-teal-700 dark:text-teal-300">
                                    Demand
                                </p>
                                <p className="mt-2 text-3xl font-semibold text-slate-900 dark:text-white">
                                    ৳ {Number(demand || 0)}
                                </p>
                                <p className="mt-2 inline-flex items-center gap-2 text-sm text-teal-700 dark:text-teal-300">
                                    <ArrowUpRight className="h-4 w-4" />
                                    Response থেকে total demand দেখানো হয়েছে
                                </p>
                            </div>
                        </div>
                    )}
                </section>
            </div>
        </div>
    );
}