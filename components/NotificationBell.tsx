"use client";

import React, { useState } from "react";
import { Bell, X, Check, CheckCheck, Trash2 } from "lucide-react";
import { useNotifications } from "@/context/NotificationContext";

export default function NotificationBell() {
  const {
    notifications,
    unreadCount,
    removeNotification,
    markAsRead,
    markAllAsRead,
    clearAll,
  } = useNotifications();
  const [isOpen, setIsOpen] = useState(false);

  const getNotificationColor = (type: string) => {
    switch (type) {
      case "success":
        return "text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20";
      case "error":
        return "text-red-600 bg-red-50 dark:bg-red-900/20";
      case "warning":
        return "text-amber-600 bg-amber-50 dark:bg-amber-900/20";
      case "info":
      default:
        return "text-sky-600 bg-sky-50 dark:bg-sky-900/20";
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "success":
        return "✓";
      case "error":
        return "✕";
      case "warning":
        return "⚠";
      case "info":
      default:
        return "ℹ";
    }
  };

  const formatTime = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return "এখনই";
    if (minutes < 60) return `${minutes} মিনিট আগে`;
    if (hours < 24) return `${hours} ঘন্টা আগে`;
    if (days < 7) return `${days} দিন আগে`;
    return date.toLocaleDateString("bn-BD");
  };

  return (
    <div className="relative">
      {/* Bell Button */}
      <button
        onClick={() => {
          setIsOpen(!isOpen);
          if (!isOpen && unreadCount > 0) {
            markAllAsRead();
          }
        }}
        className="relative p-2 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-900 rounded-lg transition-all"
        title="বিজ্ঞপ্তি"
      >
        <Bell className="w-6 h-6" />

        {/* Unread Badge */}
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-600 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center animate-pulse">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {/* Notification Panel */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-96 max-h-96 bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 overflow-hidden z-50">
          {/* Header */}
          <div className="bg-gradient-to-r from-sky-600 to-sky-700 text-white p-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold">বিজ্ঞপ্তি সেন্টার</h3>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1 hover:bg-sky-800 rounded-lg transition-all"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            {notifications.length > 0 && (
              <p className="text-sky-100 text-sm mt-2">
                <span className="font-semibold">{unreadCount}</span> নতুন বিজ্ঞপ্তি
              </p>
            )}
          </div>

          {/* Notifications List */}
          <div className="overflow-y-auto max-h-80">
            {notifications.length === 0 ? (
              <div className="p-8 text-center text-slate-500 dark:text-slate-400">
                <Bell className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p className="text-sm">কোন বিজ্ঞপ্তি নেই</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-200 dark:divide-slate-700">
                {notifications.map((notification) => (
                  <div
                    key={notification.id}
                    className={`p-4 hover:bg-slate-50 dark:hover:bg-slate-900/50 transition-colors ${
                      !notification.read
                        ? "bg-blue-50 dark:bg-blue-900/10 border-l-4 border-sky-600"
                        : ""
                    }`}
                  >
                    <div className="flex gap-3">
                      {/* Icon */}
                      <div
                        className={`w-10 h-10 rounded-lg flex items-center justify-center text-lg flex-shrink-0 ${getNotificationColor(
                          notification.type
                        )}`}
                      >
                        {getNotificationIcon(notification.type)}
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <h4 className="font-semibold text-slate-900 dark:text-white">
                            {notification.title}
                          </h4>
                          {!notification.read && (
                            <span className="w-2.5 h-2.5 bg-sky-600 rounded-full flex-shrink-0 mt-1"></span>
                          )}
                        </div>
                        <p className="text-sm text-slate-600 dark:text-slate-400 mt-1 line-clamp-2">
                          {notification.message}
                        </p>
                        <p className="text-xs text-slate-500 dark:text-slate-500 mt-2">
                          {formatTime(notification.timestamp)}
                        </p>

                        {/* Action Button */}
                        {notification.action && (
                          <button
                            onClick={() => {
                              notification.action?.onClick();
                              setIsOpen(false);
                            }}
                            className="mt-2 text-xs font-semibold text-sky-600 dark:text-sky-400 hover:underline"
                          >
                            {notification.action.label}
                          </button>
                        )}
                      </div>

                      {/* Close Button */}
                      <button
                        onClick={() => removeNotification(notification.id)}
                        className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 rounded hover:bg-slate-200 dark:hover:bg-slate-700 transition-all"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer Actions */}
          {notifications.length > 0 && (
            <div className="border-t border-slate-200 dark:border-slate-700 p-3 flex gap-2 bg-slate-50 dark:bg-slate-900/50">
              <button
                onClick={() => {
                  markAllAsRead();
                }}
                className="flex-1 flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium text-sky-600 dark:text-sky-400 hover:bg-sky-50 dark:hover:bg-sky-900/20 rounded-lg transition-all"
              >
                <CheckCheck className="w-4 h-4" />
                সব পড়া চিহ্নিত করুন
              </button>
              <button
                onClick={() => {
                  clearAll();
                }}
                className="flex-1 flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-all"
              >
                <Trash2 className="w-4 h-4" />
                সব মুছুন
              </button>
            </div>
          )}
        </div>
      )}

      {/* Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setIsOpen(false)}
        ></div>
      )}
    </div>
  );
}
