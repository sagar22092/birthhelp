"use client";

import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { DollarSign, ShoppingCart, Wallet, Calendar, BarChart3, PieChart } from "lucide-react";
import { useAppSelector } from "@/lib/hooks";
import {
  LineChart as RechartsLineChart,
  Line,
  BarChart as RechartsBarChart,
  Bar,
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import toast from "react-hot-toast";

interface SpentItem {
  _id: string;
  service: string;
  serviceName?: string;
  amount: number;
  createdAt: string;
}

interface RechargeItem {
  _id: string;
  trxId: string;
  amount: number;
  method: string;
  status: "SUCCESS" | "PENDING" | "FAILED";
  createdAt: string;
}

interface DashboardData {
  spentList: SpentItem[];
  recharges: RechargeItem[];
}

export default function Analytics() {
  const [data, setData] = useState<DashboardData>({ spentList: [], recharges: [] });
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<"week" | "month" | "year">("month");
  const { user } = useAppSelector((state) => state.userAuth);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await axios.get(`/api/home`, { withCredentials: true });
        setData(res.data);
      } catch (error) {
        console.error("Error fetching analytics data:", error);
        toast.error("অ্যানালাইসিস ডেটা লোড করতে ব্যর্থ");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const processed = useMemo(() => {
    const now = new Date();
    const cutoff = new Date(now);

    if (timeRange === "week") cutoff.setDate(now.getDate() - 7);
    if (timeRange === "month") cutoff.setDate(now.getDate() - 30);
    if (timeRange === "year") cutoff.setFullYear(now.getFullYear() - 1);

    const filteredSpent = data.spentList.filter((item) => new Date(item.createdAt) >= cutoff);
    const filteredRecharges = data.recharges.filter((item) => new Date(item.createdAt) >= cutoff);
    const successfulRecharges = filteredRecharges.filter((item) => item.status === "SUCCESS");

    const totalSpent = filteredSpent.reduce((sum, item) => sum + item.amount, 0);
    const totalRecharged = successfulRecharges.reduce((sum, item) => sum + item.amount, 0);
    const monthMap: Record<string, { recharge: number; spent: number }> = {};
    const monthFormatter = new Intl.DateTimeFormat("bn-BD", { month: "short" });

    successfulRecharges.forEach((item) => {
      const month = monthFormatter.format(new Date(item.createdAt));
      if (!monthMap[month]) monthMap[month] = { recharge: 0, spent: 0 };
      monthMap[month].recharge += item.amount;
    });

    filteredSpent.forEach((item) => {
      const month = monthFormatter.format(new Date(item.createdAt));
      if (!monthMap[month]) monthMap[month] = { recharge: 0, spent: 0 };
      monthMap[month].spent += item.amount;
    });

    const monthlyData = Object.entries(monthMap).map(([month, value]) => ({
      month,
      recharge: value.recharge,
      spent: value.spent,
      balance: value.recharge - value.spent,
    }));

    const weekDays = ["রবি", "সোম", "মঙ্গল", "বুধ", "বৃহস্পতি", "শুক্র", "শনি"];
    const weeklyMap: Record<string, number> = {
      রবি: 0,
      সোম: 0,
      মঙ্গল: 0,
      বুধ: 0,
      বৃহস্পতি: 0,
      শুক্র: 0,
      শনি: 0,
    };

    filteredSpent.forEach((item) => {
      const day = weekDays[new Date(item.createdAt).getDay()];
      weeklyMap[day] += item.amount;
    });

    const weeklyData = weekDays.map((day) => ({ day, amount: weeklyMap[day] }));

    const resolveServiceName = (item: SpentItem) => {
      if (item.serviceName && item.serviceName.trim().length > 0) {
        return item.serviceName;
      }

      if (/^[a-fA-F0-9]{24}$/.test(item.service)) {
        return `সার্ভিস (${item.service.slice(-6)})`;
      }

      return item.service || "অন্যান্য";
    };

    const serviceMap: Record<string, number> = {};
    filteredSpent.forEach((item) => {
      const key = resolveServiceName(item);
      serviceMap[key] = (serviceMap[key] || 0) + item.amount;
    });

    const categoryData = Object.entries(serviceMap)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([name, value], idx) => ({
        name,
        value,
        color: ["#0ea5e9", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6"][idx],
      }));

    const recentTransactions = [...filteredRecharges]
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 8);

    return {
      totalSpent,
      totalRecharged,
      totalRechargeCount: filteredRecharges.length,
      monthlyData,
      weeklyData,
      categoryData,
      recentTransactions,
    };
  }, [data, timeRange]);

  const formatMoney = (amount: number) => `৳ ${amount.toLocaleString("en-BD")}`;
  const formatDate = (date: string) =>
    new Date(date).toLocaleString("bn-BD", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-sky-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 p-4 sm:p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl sm:text-4xl font-bold text-slate-900 dark:text-white">📊 অ্যানালাইসিস</h1>
            <p className="text-slate-600 dark:text-slate-400 mt-2">আপনার প্রয়োজনীয় আর্থিক সারাংশ</p>
          </div>

          <div className="flex gap-2">
            {(["week", "month", "year"] as const).map((range) => (
              <button
                key={range}
                onClick={() => setTimeRange(range)}
                className={`px-4 py-2 rounded-lg font-medium transition-all ${
                  timeRange === range
                    ? "bg-sky-600 text-white"
                    : "bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300"
                }`}
              >
                {range === "week" ? "৭ দিন" : range === "month" ? "৩০ দিন" : "১ বছর"}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="bg-white dark:bg-slate-800 rounded-xl p-5 shadow-lg">
            <div className="flex items-center justify-between mb-2">
              <p className="text-slate-600 dark:text-slate-400 text-sm">সফল রিচার্জ</p>
              <DollarSign className="w-5 h-5 text-emerald-600" />
            </div>
            <p className="text-2xl font-bold text-slate-900 dark:text-white">{formatMoney(processed.totalRecharged)}</p>
          </div>

          <div className="bg-white dark:bg-slate-800 rounded-xl p-5 shadow-lg">
            <div className="flex items-center justify-between mb-2">
              <p className="text-slate-600 dark:text-slate-400 text-sm">মোট খরচ</p>
              <ShoppingCart className="w-5 h-5 text-red-500" />
            </div>
            <p className="text-2xl font-bold text-slate-900 dark:text-white">{formatMoney(processed.totalSpent)}</p>
          </div>

          <div className="bg-white dark:bg-slate-800 rounded-xl p-5 shadow-lg">
            <div className="flex items-center justify-between mb-2">
              <p className="text-slate-600 dark:text-slate-400 text-sm">বর্তমান ব্যালেন্স</p>
              <Wallet className="w-5 h-5 text-sky-600" />
            </div>
            <p className="text-2xl font-bold text-slate-900 dark:text-white">{formatMoney(user?.balance ?? 0)}</p>
          </div>

          <div className="bg-white dark:bg-slate-800 rounded-xl p-5 shadow-lg">
            <div className="flex items-center justify-between mb-2">
              <p className="text-slate-600 dark:text-slate-400 text-sm">রিচার্জ ট্রানজ্যাকশন</p>
              <Calendar className="w-5 h-5 text-amber-500" />
            </div>
            <p className="text-2xl font-bold text-slate-900 dark:text-white">{processed.totalRechargeCount}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-lg">
            <div className="flex items-center gap-2 mb-4">
              <BarChart3 className="w-5 h-5 text-sky-600" />
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">মাসভিত্তিক হিসাব</h3>
            </div>
            <ResponsiveContainer width="100%" height={300}>
              <RechartsLineChart data={processed.monthlyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="month" stroke="#94a3b8" />
                <YAxis stroke="#94a3b8" />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="recharge" stroke="#0ea5e9" name="রিচার্জ" strokeWidth={2} />
                <Line type="monotone" dataKey="spent" stroke="#ef4444" name="খরচ" strokeWidth={2} />
              </RechartsLineChart>
            </ResponsiveContainer>
          </div>

          <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-lg">
            <div className="flex items-center gap-2 mb-4">
              <BarChart3 className="w-5 h-5 text-emerald-600" />
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">সাপ্তাহিক খরচ</h3>
            </div>
            <ResponsiveContainer width="100%" height={300}>
              <RechartsBarChart data={processed.weeklyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="day" stroke="#94a3b8" />
                <YAxis stroke="#94a3b8" />
                <Tooltip />
                <Bar dataKey="amount" fill="#10b981" radius={[8, 8, 0, 0]} name="খরচ" />
              </RechartsBarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-lg">
            <div className="flex items-center gap-2 mb-4">
              <PieChart className="w-5 h-5 text-purple-600" />
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">সার্ভিস অনুযায়ী খরচ</h3>
            </div>
            <ResponsiveContainer width="100%" height={280}>
              <RechartsPieChart>
                <Pie
                  data={processed.categoryData}
                  cx="50%"
                  cy="50%"
                  outerRadius={90}
                  dataKey="value"
                  label={({ name }) => name}
                >
                  {processed.categoryData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </RechartsPieChart>
            </ResponsiveContainer>
          </div>

          <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-lg">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">সাম্প্রতিক রিচার্জ</h3>
            {processed.recentTransactions.length === 0 ? (
              <p className="text-slate-500 dark:text-slate-400">এই সময়সীমায় রিচার্জ পাওয়া যায়নি</p>
            ) : (
              <div className="space-y-3">
                {processed.recentTransactions.map((item) => (
                  <div
                    key={item._id}
                    className="flex items-center justify-between p-3 rounded-lg bg-slate-50 dark:bg-slate-700/40"
                  >
                    <div>
                      <p className="text-sm font-medium text-slate-900 dark:text-white">{item.trxId}</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">{formatDate(item.createdAt)}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold text-slate-900 dark:text-white">{formatMoney(item.amount)}</p>
                      <p
                        className={`text-xs font-medium ${
                          item.status === "SUCCESS"
                            ? "text-emerald-600"
                            : item.status === "PENDING"
                            ? "text-amber-600"
                            : "text-red-600"
                        }`}
                      >
                        {item.status}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
