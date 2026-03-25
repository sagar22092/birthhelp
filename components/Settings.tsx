"use client";

import React, { useState, useEffect } from "react";
import {
  Moon,
  Sun,
  Bell,
  Lock,
  Settings as SettingsIcon,
  LogOut,
  Check,
  X,
} from "lucide-react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";

interface NotificationSettings {
  emailNotifications: boolean;
  pushNotifications: boolean;
  transactionAlerts: boolean;
  weeklyDigest: boolean;
}

interface ThemeSettings {
  darkMode: boolean;
}

export default function Settings() {
  const router = useRouter();
  const [theme, setTheme] = useState<ThemeSettings>({ darkMode: false });
  const [notifications, setNotifications] = useState<NotificationSettings>({
    emailNotifications: true,
    pushNotifications: true,
    transactionAlerts: true,
    weeklyDigest: false,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<"theme" | "notifications" | "security">("theme");

  useEffect(() => {
    // Load settings from localStorage
    const savedTheme = localStorage.getItem("theme");
    const savedNotifications = localStorage.getItem("notifications");

    if (savedTheme) setTheme(JSON.parse(savedTheme));
    if (savedNotifications) setNotifications(JSON.parse(savedNotifications));

    // Apply theme
    if (savedTheme) {
      const parsed = JSON.parse(savedTheme);
      if (parsed.darkMode) {
        document.documentElement.classList.add("dark");
      } else {
        document.documentElement.classList.remove("dark");
      }
    }
  }, []);

  const handleThemeChange = (darkMode: boolean) => {
    const newTheme = { darkMode };
    setTheme(newTheme);
    localStorage.setItem("theme", JSON.stringify(newTheme));

    if (darkMode) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }

    toast.success(darkMode ? "🌙 ডার্ক মোড চালু হয়েছে" : "☀️ লাইট মোড চালু হয়েছে");
  };

  const handleNotificationChange = (key: keyof NotificationSettings) => {
    const newNotifications = {
      ...notifications,
      [key]: !notifications[key],
    };
    setNotifications(newNotifications);
    localStorage.setItem("notifications", JSON.stringify(newNotifications));
    toast.success("✅ সেটিংস সংরক্ষিত হয়েছে");
  };

  const handleLogout = async () => {
    setIsLoading(true);
    try {
      await fetch("/api/logout", { method: "POST" });
      toast.success("লগআউট সফল");
      router.push("/login");
    } catch (error) {
      toast.error("লগআউট ব্যর্থ");
    } finally {
      setIsLoading(false);
    }
  };

  const handleChangePassword = () => {
    router.push("/profile");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 p-4 sm:p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 bg-sky-100 dark:bg-sky-900/20 rounded-xl">
              <SettingsIcon className="w-8 h-8 text-sky-600 dark:text-sky-400" />
            </div>
            <div>
              <h1 className="text-3xl sm:text-4xl font-bold text-slate-900 dark:text-white">
                সেটিংস
              </h1>
              <p className="text-slate-600 dark:text-slate-400 mt-1">
                আপনার অ্যাকাউন্ট এবং পছন্দগুলি পরিচালনা করুন
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Sidebar Navigation */}
          <div className="lg:col-span-1">
            <nav className="space-y-2">
              <button
                onClick={() => setActiveTab("theme")}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                  activeTab === "theme"
                    ? "bg-sky-600 text-white shadow-lg shadow-sky-600/30"
                    : "text-slate-700 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-800"
                }`}
              >
                {theme.darkMode ? (
                  <Moon className="w-5 h-5" />
                ) : (
                  <Sun className="w-5 h-5" />
                )}
                থিম
              </button>

              <button
                onClick={() => setActiveTab("notifications")}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                  activeTab === "notifications"
                    ? "bg-sky-600 text-white shadow-lg shadow-sky-600/30"
                    : "text-slate-700 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-800"
                }`}
              >
                <Bell className="w-5 h-5" />
                বিজ্ঞপ্তি
              </button>

              <button
                onClick={() => setActiveTab("security")}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                  activeTab === "security"
                    ? "bg-sky-600 text-white shadow-lg shadow-sky-600/30"
                    : "text-slate-700 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-800"
                }`}
              >
                <Lock className="w-5 h-5" />
                নিরাপত্তা
              </button>
            </nav>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            {/* Theme Settings */}
            {activeTab === "theme" && (
              <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 sm:p-8 shadow-lg">
                <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-6">
                  থিম পছন্দ
                </h2>

                <div className="space-y-6">
                  {/* Light Mode */}
                  <div
                    className={`p-6 rounded-xl border-2 cursor-pointer transition-all ${
                      !theme.darkMode
                        ? "border-sky-600 bg-sky-50 dark:bg-sky-900/20"
                        : "border-slate-200 dark:border-slate-700 hover:border-sky-400"
                    }`}
                    onClick={() => handleThemeChange(false)}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-4">
                        <Sun className="w-8 h-8 text-amber-500 mt-1" />
                        <div>
                          <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
                            লাইট মোড
                          </h3>
                          <p className="text-slate-600 dark:text-slate-400 mt-1">
                            উজ্জ্বল এবং পরিষ্কার ইন্টারফেস
                          </p>
                        </div>
                      </div>
                      {!theme.darkMode && (
                        <Check className="w-6 h-6 text-sky-600 mt-1" />
                      )}
                    </div>
                  </div>

                  {/* Dark Mode */}
                  <div
                    className={`p-6 rounded-xl border-2 cursor-pointer transition-all ${
                      theme.darkMode
                        ? "border-sky-600 bg-sky-50 dark:bg-sky-900/20"
                        : "border-slate-200 dark:border-slate-700 hover:border-sky-400"
                    }`}
                    onClick={() => handleThemeChange(true)}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-4">
                        <Moon className="w-8 h-8 text-indigo-500 mt-1" />
                        <div>
                          <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
                            ডার্ক মোড
                          </h3>
                          <p className="text-slate-600 dark:text-slate-400 mt-1">
                            চোখের জন্য আরামদায়ক এবং নিরাপদ
                          </p>
                        </div>
                      </div>
                      {theme.darkMode && (
                        <Check className="w-6 h-6 text-sky-600 mt-1" />
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Notification Settings */}
            {activeTab === "notifications" && (
              <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 sm:p-8 shadow-lg">
                <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-6">
                  বিজ্ঞপ্তি সেটিংস
                </h2>

                <div className="space-y-4">
                  {/* Email Notifications */}
                  <label className="flex items-center p-4 rounded-lg bg-slate-50 dark:bg-slate-700/50 hover:bg-slate-100 dark:hover:bg-slate-700 cursor-pointer transition-all">
                    <input
                      type="checkbox"
                      checked={notifications.emailNotifications}
                      onChange={() =>
                        handleNotificationChange("emailNotifications")
                      }
                      className="w-5 h-5 text-sky-600 rounded cursor-pointer"
                    />
                    <div className="ml-4 flex-1">
                      <p className="font-semibold text-slate-900 dark:text-white">
                        ইমেইল বিজ্ঞপ্তি
                      </p>
                      <p className="text-sm text-slate-600 dark:text-slate-400">
                        গুরুত্বপূর্ণ আপডেটের জন্য ইমেইল পান
                      </p>
                    </div>
                    {notifications.emailNotifications && (
                      <Check className="w-5 h-5 text-emerald-500" />
                    )}
                  </label>

                  {/* Push Notifications */}
                  <label className="flex items-center p-4 rounded-lg bg-slate-50 dark:bg-slate-700/50 hover:bg-slate-100 dark:hover:bg-slate-700 cursor-pointer transition-all">
                    <input
                      type="checkbox"
                      checked={notifications.pushNotifications}
                      onChange={() =>
                        handleNotificationChange("pushNotifications")
                      }
                      className="w-5 h-5 text-sky-600 rounded cursor-pointer"
                    />
                    <div className="ml-4 flex-1">
                      <p className="font-semibold text-slate-900 dark:text-white">
                        পুশ বিজ্ঞপ্তি
                      </p>
                      <p className="text-sm text-slate-600 dark:text-slate-400">
                        ব্রাউজার পুশ নোটিফিকেশন পান
                      </p>
                    </div>
                    {notifications.pushNotifications && (
                      <Check className="w-5 h-5 text-emerald-500" />
                    )}
                  </label>

                  {/* Transaction Alerts */}
                  <label className="flex items-center p-4 rounded-lg bg-slate-50 dark:bg-slate-700/50 hover:bg-slate-100 dark:hover:bg-slate-700 cursor-pointer transition-all">
                    <input
                      type="checkbox"
                      checked={notifications.transactionAlerts}
                      onChange={() =>
                        handleNotificationChange("transactionAlerts")
                      }
                      className="w-5 h-5 text-sky-600 rounded cursor-pointer"
                    />
                    <div className="ml-4 flex-1">
                      <p className="font-semibold text-slate-900 dark:text-white">
                        লেনদেন সতর্কতা
                      </p>
                      <p className="text-sm text-slate-600 dark:text-slate-400">
                        প্রতিটি লেনদেনের পরে বিজ্ঞপ্তি পান
                      </p>
                    </div>
                    {notifications.transactionAlerts && (
                      <Check className="w-5 h-5 text-emerald-500" />
                    )}
                  </label>

                  {/* Weekly Digest */}
                  <label className="flex items-center p-4 rounded-lg bg-slate-50 dark:bg-slate-700/50 hover:bg-slate-100 dark:hover:bg-slate-700 cursor-pointer transition-all">
                    <input
                      type="checkbox"
                      checked={notifications.weeklyDigest}
                      onChange={() => handleNotificationChange("weeklyDigest")}
                      className="w-5 h-5 text-sky-600 rounded cursor-pointer"
                    />
                    <div className="ml-4 flex-1">
                      <p className="font-semibold text-slate-900 dark:text-white">
                        সাপ্তাহিক ডাইজেস্ট
                      </p>
                      <p className="text-sm text-slate-600 dark:text-slate-400">
                        সাপ্তাহিক সংক্ষিপ্ত সারণী পান
                      </p>
                    </div>
                    {notifications.weeklyDigest && (
                      <Check className="w-5 h-5 text-emerald-500" />
                    )}
                  </label>
                </div>
              </div>
            )}

            {/* Security Settings */}
            {activeTab === "security" && (
              <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 sm:p-8 shadow-lg">
                <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-6">
                  নিরাপত্তা সেটিংস
                </h2>

                <div className="space-y-4">
                  {/* Change Password */}
                  <button
                    onClick={handleChangePassword}
                    className="w-full flex items-center justify-between p-4 rounded-lg bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 dark:hover:bg-blue-900/40 transition-all border border-blue-200 dark:border-blue-800"
                  >
                    <div className="flex items-center gap-3">
                      <Lock className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                      <div className="text-left">
                        <p className="font-semibold text-slate-900 dark:text-white">
                          পাসওয়ার্ড পরিবর্তন করুন
                        </p>
                        <p className="text-sm text-slate-600 dark:text-slate-400">
                          আপনার অ্যাকাউন্ট নিরাপদ রাখতে পাসওয়ার্ড পরিবর্তন করুন
                        </p>
                      </div>
                    </div>
                    <span className="text-blue-600 dark:text-blue-400">→</span>
                  </button>

                  {/* Logout */}
                  <button
                    onClick={handleLogout}
                    disabled={isLoading}
                    className="w-full flex items-center justify-between p-4 rounded-lg bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/40 transition-all border border-red-200 dark:border-red-800 disabled:opacity-50"
                  >
                    <div className="flex items-center gap-3">
                      <LogOut className="w-6 h-6 text-red-600 dark:text-red-400" />
                      <div className="text-left">
                        <p className="font-semibold text-slate-900 dark:text-white">
                          লগআউট করুন
                        </p>
                        <p className="text-sm text-slate-600 dark:text-slate-400">
                          সব ডিভাইস থেকে লগআউট করুন
                        </p>
                      </div>
                    </div>
                    {isLoading ? (
                      <span className="text-red-600 dark:text-red-400">...</span>
                    ) : (
                      <span className="text-red-600 dark:text-red-400">→</span>
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
