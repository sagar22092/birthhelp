"use client";
import React, { useEffect, useMemo } from "react";
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  ArrowUpRight,
  ArrowDownLeft,
  CreditCard,
  Wallet,
  BarChart3,
  Activity,
  Zap,
  CircleDot,
} from "lucide-react";
import { useAppSelector } from "@/lib/hooks";
import axios from "axios";

// ─── Type Definitions ────────────────────────────────────────────────────────

interface SpentItem {
  _id: string;
  user: string;
  service: string;
  data: string;
  amount: number;
  dataSchema: string;
  createdAt: string;
  updatedAt: string;
}

interface RechargeItem {
  _id: string;
  trxId: string;
  amount: number;
  method: string;
  status: "SUCCESS" | "PENDING" | "FAILED";
  number?: string;
  user: string;
  createdAt: string;
}

interface DashboardData {
  spentList: SpentItem[];
  recharges: RechargeItem[];
}

interface Calculations {
  totalSpent: number;
  totalRecharged: number;
  balance: number;
  spentCount: number;
  rechargeCount: number;
  usageRate: number;
}

// ─── Greeting Config ──────────────────────────────────────────────────────────

const getTimeGreeting = () => {
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 12)
    return { label: "সুপ্রভাত", sub: "আজকের আর্থিক কার্যক্রম পরিকল্পনা করুন", hue: "from-cyan-500 to-sky-600" };
  if (hour >= 12 && hour < 17)
    return { label: "শুভ দুপুর", sub: "দিনের অগ্রগতি ও লেনদেন পর্যবেক্ষণ করুন", hue: "from-emerald-500 to-teal-600" };
  if (hour >= 17 && hour < 20)
    return { label: "শুভ সন্ধ্যা", sub: "দিনের সারাংশ পর্যালোচনা করুন", hue: "from-amber-500 to-orange-600" };
  return { label: "শুভ রাত্রি", sub: "পরবর্তী দিনের জন্য প্রস্তুতি সম্পন্ন করুন", hue: "from-slate-500 to-slate-700" };
};

// ─── Status Badge ─────────────────────────────────────────────────────────────

const StatusBadge = ({ status }: { status: string }) => {
  const map: Record<string, string> = {
    SUCCESS: "bg-emerald-500/15 text-emerald-400 border-emerald-500/25 before:bg-emerald-400",
    PENDING: "bg-amber-500/15 text-amber-400 border-amber-500/25 before:bg-amber-400",
    FAILED: "bg-red-500/15 text-red-400 border-red-500/25 before:bg-red-400",
  };
  return (
    <span
      className={`relative inline-flex items-center gap-1.5 text-[11px] font-semibold tracking-wider uppercase px-2.5 py-1 rounded-full border ${map[status] ?? "bg-slate-500/15 text-slate-400 border-slate-500/25 before:bg-slate-400"}`}
    >
      <span className="w-1.5 h-1.5 rounded-full bg-current animate-pulse" />
      {status}
    </span>
  );
};

// ─── Stat Card ────────────────────────────────────────────────────────────────

interface StatCardProps {
  icon: React.ReactNode;
  value: string;
  label: string;
  sub: string;
  accent: string;
  glow: string;
}

const StatCard = ({ icon, value, label, sub, accent, glow }: StatCardProps) => (
  <div
    className={`group relative rounded-2xl p-6 bg-[#0f1117] border border-white/[0.06] overflow-hidden transition-all duration-500 hover:border-white/[0.14] hover:shadow-2xl ${glow}`}
  >
    {/* Background shimmer */}
    <div
      className={`absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700 bg-gradient-to-br ${accent} blur-2xl scale-150`}
    />
    <div className="relative z-10">
      <div className={`inline-flex p-2.5 rounded-xl bg-gradient-to-br ${accent} mb-5 shadow-lg`}>
        {icon}
      </div>
      <p className="text-3xl font-black text-white tracking-tight font-mono mb-1">
        {value}
      </p>
      <p className="text-sm text-white/50 font-medium">{label}</p>
      <p className={`mt-2 text-xs font-semibold bg-gradient-to-r ${accent} bg-clip-text text-transparent`}>
        {sub}
      </p>
    </div>
  </div>
);

// ─── Main Component ───────────────────────────────────────────────────────────

const Dashboard = () => {
  const [data, setData] = React.useState<DashboardData>({ spentList: [], recharges: [] });
  const { user } = useAppSelector((state) => state.userAuth);

  useEffect(() => {
    axios
      .get(`/api/home`, { withCredentials: true })
      .then((res) => setData(res.data))
      .catch(console.error);
  }, []);

  const calc: Calculations = useMemo(() => {
    const totalSpent = data.spentList.reduce((s, i) => s + i.amount, 0);
    const successful = data.recharges.filter((i) => i.status === "SUCCESS");
    const totalRecharged = successful.reduce((s, i) => s + i.amount, 0);
    return {
      totalSpent,
      totalRecharged,
      balance: totalRecharged - totalSpent,
      spentCount: data.spentList.length,
      rechargeCount: successful.length,
      usageRate: totalRecharged > 0 ? (totalSpent / totalRecharged) * 100 : 0,
    };
  }, [data]);

  const fmt = (n: number) => `৳${n.toLocaleString()}`;
  const fmtDate = (d: string) =>
    new Date(d).toLocaleDateString("en-US", {
      month: "short", day: "numeric", year: "numeric",
      hour: "2-digit", minute: "2-digit",
    });

  const greet = getTimeGreeting();

  const allTxns = useMemo(
    () =>
      [
        ...data.recharges.map((r) => ({ ...r, type: "recharge" as const })),
        ...data.spentList.map((s) => ({ ...s, type: "spent" as const })),
      ].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()),
    [data]
  );

  return (
    <>
      {/* Google Fonts */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@700;800&family=Geist+Mono:wght@400;600;700&family=Geist:wght@300;400;500;600&display=swap');

        .dash-root { font-family: 'Geist', sans-serif; }
        .dash-display { font-family: 'Syne', sans-serif; }
        .dash-mono { font-family: 'Geist Mono', monospace; }

        .scrollbar-thin::-webkit-scrollbar { width: 4px; }
        .scrollbar-thin::-webkit-scrollbar-track { background: transparent; }
        .scrollbar-thin::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 99px; }

        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(16px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .fade-up { animation: fadeUp 0.55s cubic-bezier(0.22,1,0.36,1) both; }
        .fade-up-1 { animation-delay: 0.05s; }
        .fade-up-2 { animation-delay: 0.12s; }
        .fade-up-3 { animation-delay: 0.19s; }
        .fade-up-4 { animation-delay: 0.26s; }
        .fade-up-5 { animation-delay: 0.33s; }
        .fade-up-6 { animation-delay: 0.40s; }

        .noise-bg::before {
          content: '';
          position: absolute; inset: 0;
          background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.04'/%3E%3C/svg%3E");
          background-size: 160px;
          pointer-events: none;
          z-index: 0;
          border-radius: inherit;
        }
      `}</style>

      <div className="dash-root min-h-screen bg-[#070d14] text-white">
        {/* Ambient background orbs */}
        <div className="fixed inset-0 pointer-events-none overflow-hidden">
          <div className="absolute -top-48 -left-48 w-[600px] h-[600px] bg-cyan-500/12 rounded-full blur-[120px]" />
          <div className="absolute top-1/3 right-0 w-[500px] h-[500px] bg-teal-500/10 rounded-full blur-[120px]" />
          <div className="absolute bottom-0 left-1/3 w-[400px] h-[400px] bg-amber-500/8 rounded-full blur-[100px]" />
        </div>

        <div className="relative z-10 max-w-[1280px] mx-auto px-4 sm:px-6 py-8 sm:py-10">

          {/* ── Hero Banner ─────────────────────────────────────────────── */}
          <div className="fade-up fade-up-1 noise-bg relative rounded-3xl overflow-hidden mb-8 border border-white/[0.07]">
            <div className={`absolute inset-0 bg-gradient-to-r ${greet.hue} opacity-20`} />
            <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-[#080a0f]/80" />

            {/* Decorative ring */}
            <div className="absolute -right-20 -top-20 w-72 h-72 rounded-full border border-white/5" />
            <div className="absolute -right-8 -top-8 w-48 h-48 rounded-full border border-white/5" />

            <div className="relative z-10 p-8 sm:p-10 flex items-center justify-between gap-6">
              <div className="flex-1">
                <div className="mb-4">
                  <span className="inline-flex items-center px-3 py-1 rounded-full bg-white/10 border border-white/15 text-[11px] font-semibold tracking-[0.16em] uppercase text-white/70 mb-3">
                    Operations Dashboard
                  </span>
                  <p className="text-white/40 text-xs font-semibold tracking-widest uppercase mb-1">
                    {new Date().toLocaleDateString("bn-BD", { weekday: "long" })}
                  </p>
                  <h1 className="dash-display text-2xl sm:text-3xl font-extrabold text-white leading-none">
                    {greet.label},{" "}
                    <span className={`bg-gradient-to-r ${greet.hue} bg-clip-text text-transparent`}>
                      {user?.name?.split(" ")[0]}!
                    </span>
                  </h1>
                </div>

                <p className="text-white/60 text-sm mb-6">{greet.sub}</p>

                <div className="flex flex-wrap gap-2">
                  {[
                    { label: "সফল লেনদেন", value: `${calc.rechargeCount}টি` },
                    { label: "ব্যবহারের হার", value: `${calc.usageRate.toFixed(0)}%` },
                    {
                      label: "অবস্থা",
                      value: user.balance >= 0 ? "ইতিবাচক ভারসাম্য" : "নেতিবাচক ভারসাম্য",
                    },
                  ].map((chip) => (
                    <span
                      key={chip.label}
                      className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/8 border border-white/10 text-sm text-white/70 backdrop-blur-sm hover:bg-white/12 transition-colors"
                    >
                      <span className="text-white/40 uppercase text-[10px] tracking-widest">{chip.label}</span>
                      <span className="text-white/80 font-medium">{chip.value}</span>
                    </span>
                  ))}
                </div>
              </div>

              {/* Balance pill */}
              <div className="hidden sm:flex flex-col items-end gap-1 shrink-0">
                <p className="text-white/30 text-xs uppercase tracking-widest font-semibold">Current Balance</p>
                <p className="dash-mono text-3xl font-bold text-white">{fmt(user.balance)}</p>
                <div
                  className={`mt-1 h-1 w-24 rounded-full bg-gradient-to-r ${greet.hue}`}
                  style={{ opacity: 0.7 }}
                />
              </div>
            </div>
          </div>

          {/* ── Stats Bento Grid ────────────────────────────────────────── */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <div className="fade-up fade-up-2">
              <StatCard
                icon={<Wallet className="w-5 h-5 text-white" />}
                value={fmt(calc.totalRecharged)}
                label="মোট চার্জ"
                sub={`${calc.rechargeCount}টি সফল লেনদেন`}
                accent="from-emerald-500/30 to-teal-600/30"
                glow="hover:shadow-emerald-900/60"
              />
            </div>
            <div className="fade-up fade-up-3">
              <StatCard
                icon={<CreditCard className="w-5 h-5 text-white" />}
                value={fmt(calc.totalSpent)}
                label="মোট খরচ"
                sub={`${calc.spentCount}টি ব্যয়`}
                accent="from-rose-500/30 to-pink-600/30"
                glow="hover:shadow-rose-900/60"
              />
            </div>
            <div className="fade-up fade-up-4">
              <StatCard
                icon={<DollarSign className="w-5 h-5 text-white" />}
                value={fmt(user.balance)}
                label="বর্তমান ভারসাম্য"
                sub={user.balance >= 0 ? "ব্যবহারের জন্য প্রস্তুত" : "ব্যয় পুনর্বিন্যাস প্রয়োজন"}
                accent={user.balance >= 0 ? "from-blue-500/30 to-cyan-600/30" : "from-amber-500/30 to-orange-600/30"}
                glow={user.balance >= 0 ? "hover:shadow-blue-900/60" : "hover:shadow-amber-900/60"}
              />
            </div>
            <div className="fade-up fade-up-5">
              <StatCard
                icon={<BarChart3 className="w-5 h-5 text-white" />}
                value={`${calc.usageRate.toFixed(1)}%`}
                label="ব্যবহারের হার"
                sub="চার্জ করা পরিমাণের"
                accent="from-cyan-500/30 to-sky-600/30"
                glow="hover:shadow-cyan-900/60"
              />
            </div>
          </div>

          {/* Usage Bar */}
          <div className="fade-up fade-up-5 mb-8 rounded-2xl bg-[#0f1117] border border-white/[0.06] p-5">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Zap className="w-4 h-4 text-cyan-400" />
                <span className="text-sm font-semibold text-white/70">Usage Overview</span>
              </div>
              <span className="dash-mono text-sm font-bold text-cyan-400">{calc.usageRate.toFixed(1)}%</span>
            </div>
            <div className="h-2 rounded-full bg-white/5 overflow-hidden">
              <div
                className="h-full rounded-full bg-gradient-to-r from-cyan-500 to-sky-500 transition-all duration-1000"
                style={{ width: `${Math.min(calc.usageRate, 100)}%` }}
              />
            </div>
            <div className="flex justify-between mt-2.5">
              <span className="text-xs text-white/30 dash-mono">৳0</span>
              <span className="text-xs text-white/30 dash-mono">{fmt(calc.totalRecharged)}</span>
            </div>
          </div>

          {/* ── Transaction Lists ────────────────────────────────────────── */}
          <div className="fade-up fade-up-6 grid grid-cols-1 xl:grid-cols-2 gap-6 mb-6">

            {/* Recharge History */}
            <div className="rounded-2xl bg-[#0f1117] border border-white/[0.06] overflow-hidden">
              <div className="flex items-center justify-between px-6 py-4 border-b border-white/[0.06]">
                <div className="flex items-center gap-2.5">
                  <div className="p-1.5 bg-emerald-500/15 rounded-lg">
                    <TrendingUp className="w-4 h-4 text-emerald-400" />
                  </div>
                  <h2 className="font-semibold text-white/90 text-sm">Recharge History</h2>
                </div>
                <span className="dash-mono text-xs px-2.5 py-1 rounded-full bg-white/5 text-white/40 border border-white/[0.06]">
                  {calc.rechargeCount}
                </span>
              </div>

              <div className="overflow-y-auto max-h-80 scrollbar-thin divide-y divide-white/[0.04]">
                {data.recharges.map((r) => (
                  <div key={r._id} className="flex items-center justify-between px-6 py-3.5 hover:bg-white/[0.03] transition-colors group">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="shrink-0 w-9 h-9 flex items-center justify-center rounded-xl bg-emerald-500/10 group-hover:bg-emerald-500/15 transition-colors">
                        <Wallet className="w-4 h-4 text-emerald-400" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-white/80 text-sm font-medium truncate">{r.method}</p>
                        <p className="text-white/30 text-xs dash-mono truncate">{r.trxId}</p>
                        <p className="text-white/20 text-[11px] mt-0.5">{fmtDate(r.createdAt)}</p>
                      </div>
                    </div>
                    <div className="shrink-0 text-right ml-3">
                      <p className="dash-mono text-emerald-400 font-bold text-sm">+{fmt(r.amount)}</p>
                      <div className="mt-1">
                        <StatusBadge status={r.status} />
                      </div>
                    </div>
                  </div>
                ))}
                {data.recharges.length === 0 && (
                  <p className="text-center text-white/20 text-sm py-10">কোনো ডেটা নেই</p>
                )}
              </div>
            </div>

            {/* Spending History */}
            <div className="rounded-2xl bg-[#0f1117] border border-white/[0.06] overflow-hidden">
              <div className="flex items-center justify-between px-6 py-4 border-b border-white/[0.06]">
                <div className="flex items-center gap-2.5">
                  <div className="p-1.5 bg-rose-500/15 rounded-lg">
                    <TrendingDown className="w-4 h-4 text-rose-400" />
                  </div>
                  <h2 className="font-semibold text-white/90 text-sm">Spending History</h2>
                </div>
                <span className="dash-mono text-xs px-2.5 py-1 rounded-full bg-white/5 text-white/40 border border-white/[0.06]">
                  {calc.spentCount}
                </span>
              </div>

              <div className="overflow-y-auto max-h-80 scrollbar-thin divide-y divide-white/[0.04]">
                {data.spentList.map((s) => (
                  <div key={s._id} className="flex items-center justify-between px-6 py-3.5 hover:bg-white/[0.03] transition-colors group">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="shrink-0 w-9 h-9 flex items-center justify-center rounded-xl bg-rose-500/10 group-hover:bg-rose-500/15 transition-colors">
                        <CreditCard className="w-4 h-4 text-rose-400" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-white/80 text-sm font-medium truncate">{s.dataSchema}</p>
                        <p className="text-white/30 text-xs truncate">
                          {s.service.length > 10 ? s.service.slice(0, 10) + "…" : s.service}
                        </p>
                        <p className="text-white/20 text-[11px] mt-0.5">{fmtDate(s.createdAt)}</p>
                      </div>
                    </div>
                    <p className="dash-mono text-rose-400 font-bold text-sm shrink-0 ml-3">
                      -{fmt(s.amount)}
                    </p>
                  </div>
                ))}
                {data.spentList.length === 0 && (
                  <p className="text-center text-white/20 text-sm py-10">কোনো ডেটা নেই</p>
                )}
              </div>
            </div>
          </div>

          {/* ── All Transactions ─────────────────────────────────────────── */}
          <div className="fade-up fade-up-6 rounded-2xl bg-[#0f1117] border border-white/[0.06] overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-white/[0.06]">
              <div className="flex items-center gap-2.5">
                <div className="p-1.5 bg-blue-500/15 rounded-lg">
                  <Activity className="w-4 h-4 text-blue-400" />
                </div>
                <h2 className="font-semibold text-white/90 text-sm">All Transactions</h2>
              </div>
              <span className="dash-mono text-xs px-2.5 py-1 rounded-full bg-white/5 text-white/40 border border-white/[0.06]">
                {allTxns.length}
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/[0.04]">
                    {["Type", "Description", "Amount", "Date"].map((h) => (
                      <th
                        key={h}
                        className="px-6 py-3 text-left text-xs font-semibold text-white/30 uppercase tracking-widest"
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.03]">
                  {allTxns.map((txn, i) => (
                    <tr
                      key={`${txn.type}-${i}`}
                      className="hover:bg-white/[0.025] transition-colors group"
                    >
                      <td className="px-6 py-3.5">
                        <span
                          className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1.5 rounded-full border ${txn.type === "recharge"
                            ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                            : "bg-rose-500/10 text-rose-400 border-rose-500/20"
                            }`}
                        >
                          {txn.type === "recharge" ? (
                            <ArrowUpRight className="w-3 h-3" />
                          ) : (
                            <ArrowDownLeft className="w-3 h-3" />
                          )}
                          {txn.type === "recharge" ? "Recharge" : "Spent"}
                        </span>
                      </td>
                      <td className="px-6 py-3.5">
                        <p className="text-white/75 font-medium">
                          {txn.type === "recharge" ? txn.method : txn.dataSchema}
                        </p>
                        {txn.type === "recharge" && txn.number && (
                          <p className="text-white/30 text-xs dash-mono mt-0.5">{txn.number}</p>
                        )}
                      </td>
                      <td className="px-6 py-3.5">
                        <span
                          className={`dash-mono font-bold ${txn.type === "recharge" ? "text-emerald-400" : "text-rose-400"
                            }`}
                        >
                          {txn.type === "recharge" ? "+" : "-"}
                          {fmt(Math.abs(txn.amount))}
                        </span>
                      </td>
                      <td className="px-6 py-3.5 text-white/30 dash-mono text-xs">
                        {fmtDate(txn.createdAt)}
                      </td>
                    </tr>
                  ))}
                  {allTxns.length === 0 && (
                    <tr>
                      <td colSpan={4} className="text-center text-white/20 py-12 text-sm">
                        কোনো লেনদেন নেই
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Footer micro text */}
          <p className="text-center text-white/15 text-xs mt-8 dash-mono">
            <CircleDot className="inline w-3 h-3 mr-1 align-middle" />
            রিয়েল-টাইম ডেটা · {new Date().toLocaleTimeString("en-US")}
          </p>
        </div>
      </div>
    </>
  );
};

export default Dashboard;