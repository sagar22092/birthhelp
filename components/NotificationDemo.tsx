"use client";

import React from "react";
import { useNotifications } from "@/context/NotificationContext";
import { Bell, CheckCircle2, AlertCircle, AlertTriangle, Info } from "lucide-react";

/**
 * NotificationDemo Component
 * শোও কিভাবে notificationSystem ব্যবহার করতে হয়
 * 
 * খুব সহজ:
 * import { useNotifications } from "@/context/NotificationContext";
 * 
 * const { addNotification } = useNotifications();
 * 
 * addNotification({
 *   type: "success",
 *   title: "সফল",
 *   message: "আপনার পরিবর্তন সংরক্ষিত হয়েছে"
 * });
 */

export default function NotificationDemo() {
  const { addNotification } = useNotifications();

  const handleSuccessNotification = () => {
    addNotification({
      type: "success",
      title: "✅ সফল",
      message: "আপনার পরিবর্তন সফলভাবে সংরক্ষিত হয়েছে!",
    });
  };

  const handleErrorNotification = () => {
    addNotification({
      type: "error",
      title: "❌ ত্রুটি",
      message: "কিছু ভুল হয়েছে। দয়া করে পুনরায় চেষ্টা করুন।",
    });
  };

  const handleWarningNotification = () => {
    addNotification({
      type: "warning",
      title: "⚠️ সতর্কতা",
      message: "এই পদক্ষেপটি বাতিল করা যাবে না।",
    });
  };

  const handleInfoNotification = () => {
    addNotification({
      type: "info",
      title: "ℹ️ তথ্য",
      message: "আপনার নতুন বার্তা এসেছে।",
    });
  };

  const handleWithActionNotification = () => {
    addNotification({
      type: "success",
      title: "📋 নতুন অর্ডার",
      message: "আপনার অর্ডার #12345 প্রস্তুত হয়েছে",
      action: {
        label: "বিস্তারিত দেখুন",
        onClick: () => console.log("Order details clicked!"),
      },
    });
  };

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg p-6">
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-6">
          🔔 Notification System Demo
        </h2>

        <div className="space-y-3">
          <button
            onClick={handleSuccessNotification}
            className="w-full flex items-center gap-3 px-4 py-3 bg-emerald-50 dark:bg-emerald-900/20 hover:bg-emerald-100 dark:hover:bg-emerald-900/40 text-emerald-700 dark:text-emerald-400 rounded-lg transition-all font-semibold"
          >
            <CheckCircle2 className="w-5 h-5" />
            সফল বার্তা দেখান
          </button>

          <button
            onClick={handleErrorNotification}
            className="w-full flex items-center gap-3 px-4 py-3 bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/40 text-red-700 dark:text-red-400 rounded-lg transition-all font-semibold"
          >
            <AlertCircle className="w-5 h-5" />
            ত্রুটি বার্তা দেখান
          </button>

          <button
            onClick={handleWarningNotification}
            className="w-full flex items-center gap-3 px-4 py-3 bg-amber-50 dark:bg-amber-900/20 hover:bg-amber-100 dark:hover:bg-amber-900/40 text-amber-700 dark:text-amber-400 rounded-lg transition-all font-semibold"
          >
            <AlertTriangle className="w-5 h-5" />
            সতর্কতা বার্তা দেখান
          </button>

          <button
            onClick={handleInfoNotification}
            className="w-full flex items-center gap-3 px-4 py-3 bg-sky-50 dark:bg-sky-900/20 hover:bg-sky-100 dark:hover:bg-sky-900/40 text-sky-700 dark:text-sky-400 rounded-lg transition-all font-semibold"
          >
            <Info className="w-5 h-5" />
            তথ্য বার্তা দেখান
          </button>

          <button
            onClick={handleWithActionNotification}
            className="w-full flex items-center gap-3 px-4 py-3 bg-purple-50 dark:bg-purple-900/20 hover:bg-purple-100 dark:hover:bg-purple-900/40 text-purple-700 dark:text-purple-400 rounded-lg transition-all font-semibold"
          >
            <Bell className="w-5 h-5" />
            অ্যাকশন সহ বার্তা দেখান
          </button>
        </div>

        {/* Usage Instructions */}
        <div className="mt-8 p-4 bg-slate-50 dark:bg-slate-900/50 rounded-lg">
          <h3 className="font-bold text-slate-900 dark:text-white mb-3">
            📝 কিভাবে ব্যবহার করবেন:
          </h3>
          <pre className="text-sm text-slate-700 dark:text-slate-300 overflow-x-auto p-3 bg-white dark:bg-slate-800 rounded border border-slate-200 dark:border-slate-700">
{`import { useNotifications } from "@/context/NotificationContext";

const MyComponent = () => {
  const { addNotification } = useNotifications();

  const handleClick = () => {
    addNotification({
      type: "success",
      title: "সফল",
      message: "কাজটি সম্পন্ন হয়েছে!",
      // অপশনাল: অ্যাকশন বাটন
      action: {
        label: "বিস্তারিত",
        onClick: () => console.log("clicked")
      }
    });
  };

  return <button onClick={handleClick}>সাফল্য</button>;
};`}
          </pre>
        </div>
      </div>
    </div>
  );
}
