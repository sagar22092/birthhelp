"use client";
import React, { useEffect, useState } from "react";
import {
  ArrowUpRight,
  Calendar,
  Filter,
  Search,
  Loader,
  Download,
  CheckCircle,
  AlertCircle,
  Clock,
  XCircle,
} from "lucide-react";
import axios from "axios";
import toast from "react-hot-toast";

interface RechargeItem {
  _id: string;
  trxId: string;
  amount: number;
  method: string;
  status: "SUCCESS" | "PENDING" | "FAILED";
  number?: string;
  user: string;
  createdAt: string;
  updatedAt?: string;
}

interface RechargeData {
  recharges: RechargeItem[];
}

export default function RechargeHistory() {
  const [data, setData] = useState<RechargeItem[]>([]);
  const [filteredData, setFilteredData] = useState<RechargeItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState<"ALL" | "SUCCESS" | "PENDING" | "FAILED">("ALL");
  const [sortBy, setSortBy] = useState<"date" | "amount">("date");

  const fetchRecharges = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`/api/home`, { withCredentials: true });
      setData(res.data.recharges || []);
    } catch (error) {
      console.error("Error fetching recharges:", error);
      toast.error("রিচার্জ ডেটা লোড করতে ব্যর্থ");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecharges();
  }, []);

  // Filter and sort logic
  useEffect(() => {
    let result = [...data];

    // Apply search filter
    if (searchTerm) {
      result = result.filter(
        (item) =>
          item.trxId.toLowerCase().includes(searchTerm.toLowerCase()) ||
          item.method.toLowerCase().includes(searchTerm.toLowerCase()) ||
          item.number?.includes(searchTerm)
      );
    }

    // Apply status filter
    if (filterStatus !== "ALL") {
      result = result.filter((item) => item.status === filterStatus);
    }

    // Apply sorting
    if (sortBy === "date") {
      result.sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
    } else if (sortBy === "amount") {
      result.sort((a, b) => b.amount - a.amount);
    }

    setFilteredData(result);
  }, [data, searchTerm, filterStatus, sortBy]);

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString("bn-BD", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatCurrency = (amount: number): string => {
    return `৳${amount.toLocaleString("bn-BD")}`;
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "SUCCESS":
        return <CheckCircle className="w-5 h-5 text-emerald-500" />;
      case "PENDING":
        return <Clock className="w-5 h-5 text-amber-500" />;
      case "FAILED":
        return <XCircle className="w-5 h-5 text-red-500" />;
      default:
        return <AlertCircle className="w-5 h-5 text-slate-500" />;
    }
  };

  const getStatusBadgeClass = (status: string): string => {
    const baseClasses =
      "inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-full border";
    switch (status) {
      case "SUCCESS":
        return `${baseClasses} bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-500/30`;
      case "PENDING":
        return `${baseClasses} bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-500/30`;
      case "FAILED":
        return `${baseClasses} bg-red-50 text-red-700 border-red-200 dark:bg-red-950/40 dark:text-red-300 dark:border-red-500/30`;
      default:
        return `${baseClasses} bg-slate-50 text-slate-700 border-slate-200 dark:bg-slate-900/40 dark:text-slate-300 dark:border-slate-500/30`;
    }
  };

  const getMethodColor = (method: string): string => {
    const lowerMethod = method.toLowerCase();
    if (lowerMethod.includes("bkash")) return "bg-pink-100 text-pink-700 dark:bg-pink-900/40 dark:text-pink-300";
    if (lowerMethod.includes("nagad")) return "text-orange-700 dark:text-orange-300";
    if (lowerMethod.includes("rocket")) return "text-purple-700 dark:text-purple-300";
    if (lowerMethod.includes("bank")) return "text-blue-700 dark:text-blue-300";
    return "text-slate-700 dark:text-slate-300";
  };

  const totalRecharges = data.length;
  const totalAmount = data.reduce((sum, item) => {
    if (item.status === "SUCCESS") return sum + item.amount;
    return sum;
  }, 0);

  const successCount = data.filter((item) => item.status === "SUCCESS").length;
  const pendingCount = data.filter((item) => item.status === "PENDING").length;

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900 flex items-center justify-center">
        <div className="text-center space-y-4">
          <Loader className="w-12 h-12 text-blue-500 animate-spin mx-auto" />
          <p className="text-slate-600 dark:text-slate-400 font-medium">
            রিচার্জ হিস্টরি লোড করছি...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900 p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-slate-900 dark:text-white mb-2 flex items-center gap-3">
            <ArrowUpRight className="w-8 h-8 text-blue-500" />
            রিচার্জ হিস্টরি
          </h1>
          <p className="text-slate-600 dark:text-slate-400">
            আপনার সমস্ত রিচার্জ ট্রানজ্যাকশনের বিস্তারিত তথ্য দেখুন
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white dark:bg-slate-800 rounded-xl p-6 border border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-md transition">
            <div className="flex justify-between items-start mb-2">
              <p className="text-slate-600 dark:text-slate-400 text-sm font-medium">মোট রিচার্জ</p>
              <ArrowUpRight className="w-5 h-5 text-blue-500" />
            </div>
            <p className="text-2xl font-bold text-slate-900 dark:text-white">
              {totalRecharges}
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-500 mt-2">লেনদেন</p>
          </div>

          <div className="bg-white dark:bg-slate-800 rounded-xl p-6 border border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-md transition">
            <div className="flex justify-between items-start mb-2">
              <p className="text-slate-600 dark:text-slate-400 text-sm font-medium">মোট পরিমাণ</p>
              <CheckCircle className="w-5 h-5 text-emerald-500" />
            </div>
            <p className="text-2xl font-bold text-slate-900 dark:text-white">
              {formatCurrency(totalAmount)}
            </p>
            <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-2">সফল লেনদেন</p>
          </div>

          <div className="bg-white dark:bg-slate-800 rounded-xl p-6 border border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-md transition">
            <div className="flex justify-between items-start mb-2">
              <p className="text-slate-600 dark:text-slate-400 text-sm font-medium">সফল</p>
              <CheckCircle className="w-5 h-5 text-emerald-500" />
            </div>
            <p className="text-2xl font-bold text-slate-900 dark:text-white">
              {successCount}
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-500 mt-2">লেনদেন</p>
          </div>

          <div className="bg-white dark:bg-slate-800 rounded-xl p-6 border border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-md transition">
            <div className="flex justify-between items-start mb-2">
              <p className="text-slate-600 dark:text-slate-400 text-sm font-medium">অপেক্ষমান</p>
              <Clock className="w-5 h-5 text-amber-500" />
            </div>
            <p className="text-2xl font-bold text-slate-900 dark:text-white">
              {pendingCount}
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-500 mt-2">লেনদেন</p>
          </div>
        </div>

        {/* Filters and Search */}
        <div className="bg-white dark:bg-slate-800 rounded-xl p-6 border border-slate-200 dark:border-slate-700 shadow-sm mb-8">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search */}
            <div className="flex-1">
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                খোঁজ করুন
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  type="text"
                  placeholder="TRX ID, পদ্ধতি বা নম্বর খোঁজ করুন..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-slate-50 dark:bg-slate-700 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                />
              </div>
            </div>

            {/* Status Filter */}
            <div className="md:w-40">
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                স্ট্যাটাস
              </label>
              <select
                value={filterStatus}
                onChange={(e) =>
                  setFilterStatus(e.target.value as "ALL" | "SUCCESS" | "PENDING" | "FAILED")
                }
                className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-slate-50 dark:bg-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
              >
                <option value="ALL">সব</option>
                <option value="SUCCESS">সফল</option>
                <option value="PENDING">অপেক্ষমান</option>
                <option value="FAILED">ব্যর্থ</option>
              </select>
            </div>

            {/* Sort */}
            <div className="md:w-40">
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                সাজান
              </label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as "date" | "amount")}
                className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-slate-50 dark:bg-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
              >
                <option value="date">তারিখ অনুযায়ী</option>
                <option value="amount">পরিমাণ অনুযায়ী</option>
              </select>
            </div>
          </div>
        </div>

        {/* Table */}
        {filteredData.length > 0 ? (
          <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50">
                    <th className="px-6 py-4 text-left text-sm font-semibold text-slate-900 dark:text-white">
                      তারিখ ও সময়
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-slate-900 dark:text-white">
                      TRX ID
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-slate-900 dark:text-white">
                      পদ্ধতি
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-slate-900 dark:text-white">
                      নম্বর
                    </th>
                    <th className="px-6 py-4 text-right text-sm font-semibold text-slate-900 dark:text-white">
                      পরিমাণ
                    </th>
                    <th className="px-6 py-4 text-center text-sm font-semibold text-slate-900 dark:text-white">
                      স্ট্যাটাস
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                  {filteredData.map((item) => (
                    <tr
                      key={item._id}
                      className="hover:bg-slate-50 dark:hover:bg-slate-700/50 transition"
                    >
                      <td className="px-6 py-4 text-sm text-slate-700 dark:text-slate-300">
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-slate-400" />
                          {formatDate(item.createdAt)}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm font-mono text-slate-900 dark:text-white">
                        {item.trxId}
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <span className={`font-medium ${getMethodColor(item.method)}`}>
                          {item.method}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-700 dark:text-slate-300">
                        {item.number || "-"}
                      </td>
                      <td className="px-6 py-4 text-sm font-semibold text-slate-900 dark:text-white text-right">
                        {formatCurrency(item.amount)}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <div className={getStatusBadgeClass(item.status)}>
                          {getStatusIcon(item.status)}
                          <span>
                            {item.status === "SUCCESS"
                              ? "সফল"
                              : item.status === "PENDING"
                              ? "অপেক্ষমান"
                              : "ব্যর্থ"}
                          </span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-12 text-center">
            <AlertCircle className="w-12 h-12 text-slate-400 mx-auto mb-4" />
            <p className="text-slate-600 dark:text-slate-400 font-medium mb-2">
              কোন রিচার্জ পাওয়া যায়নি
            </p>
            <p className="text-slate-500 dark:text-slate-500 text-sm">
              আপনার সার্চ প্যারামিটার সহ কোন রিচার্জ ট্রানজ্যাকশন পাওয়া যায়নি।
            </p>
          </div>
        )}

        {/* Footer Info */}
        <div className="mt-8 text-center text-xs text-slate-500 dark:text-slate-500">
          <p>
            {filteredData.length} রিচার্জ ট্রানজ্যাকশন প্রদর্শিত হচ্ছে
          </p>
        </div>
      </div>
    </div>
  );
}
