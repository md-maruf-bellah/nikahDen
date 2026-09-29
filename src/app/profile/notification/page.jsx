"use client";
import React, { useCallback, useEffect, useState } from "react";
import { Calendar, CheckCheck, Clock, Mail, MailOpen, X } from "lucide-react";
import { notificationApi } from "@/lib/api";

const NotificationList = () => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [markAllBusy, setMarkAllBusy] = useState(false);

  const load = useCallback(async () => {
    try {
      const res = await notificationApi.list({ limit: 50 });
      // list() raw envelope: { data: { items, unreadCount }, pagination }
      const items = res?.data?.items ?? res?.items ?? [];
      setNotifications(Array.isArray(items) ? items : []);
    } catch {
      setNotifications([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    Promise.resolve().then(() => {
      if (!cancelled) return load();
    });
    return () => {
      cancelled = true;
    };
  }, [load]);


  const toggleReadStatus = async (item) => {
    try {
      await notificationApi.read(item.id);
      setNotifications((prev) =>
        prev.map((n) => (n.id === item.id ? { ...n, isRead: true } : n))
      );
      window.dispatchEvent(new Event("notifications-changed"));
    } catch {
      /* keep */
    }
  };

  const removeNotification = async (id) => {
    try {
      await notificationApi.remove(id);
      setNotifications((prev) => prev.filter((n) => n.id !== id));
      window.dispatchEvent(new Event("notifications-changed"));
    } catch {
      /* keep */
    }
  };

  // সব একসাথে পড়া হিসেবে মার্ক — bell ব্যাজও সাথে সাথে শূন্য হয়
  const markAllRead = async () => {
    setMarkAllBusy(true);
    try {
      await notificationApi.readAll();
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      window.dispatchEvent(new Event("notifications-changed"));
    } catch {
      /* keep */
    } finally {
      setMarkAllBusy(false);
    }
  };

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  return (
    <div className="min-h-screen p-4 ">
      <div className="max-w-4xl mx-auto space-y-4">
        {!loading && notifications.length > 0 && (
          <div className="flex items-center justify-between px-1">
            <p className="text-sm text-gray-500">
              {unreadCount > 0
                ? `${unreadCount.toLocaleString("bn-BD")}টি অপঠিত নোটিফিকেশন`
                : "সব নোটিফিকেশন পড়া হয়েছে"}
            </p>
            {unreadCount > 0 && (
              <button
                onClick={markAllRead}
                disabled={markAllBusy}
                className="btn btn-sm btn-outline border-[#fd6969] text-[#fd6969] hover:bg-[#fd6969] hover:text-white gap-1"
              >
                {markAllBusy ? (
                  <span className="loading loading-spinner loading-xs"></span>
                ) : (
                  <CheckCheck size={16} />
                )}
                সব পড়া হয়েছে মার্ক করুন
              </button>
            )}
          </div>
        )}
        {loading && (
          <div className="text-center py-16">
            <span className="loading loading-spinner loading-md text-red-400"></span>
          </div>
        )}

        {!loading &&
          notifications.map((item) => (
            <div
              key={item.id}
              className={`p-5 md:p-6 border-b-1 border-gray-500 relative group transition-all hover:border-b-2 ${
                item.isRead ? "opacity-70" : "bg-red-50/40"
              }`}
            >
              {/* Remove Button */}
              <button
                onClick={() => removeNotification(item.id)}
                className="absolute top-4 right-4  hover:text-red-500 transition-colors border border-gray-200 rounded p-0.5 cursor-pointer"
              >
                <X size={14} />
              </button>

              {/* Content Header */}
              <div className="mb-3 pr-6">
                <h3 className="text-md font-bold ">
                  <span className=" font-semibold">
                    {item.title || "নোটিফিকেশন"}
                  </span>
                </h3>
              </div>

              {/* Description */}
              <p className=" text-xs leading-relaxed mb-3 line-clamp-2 md:line-clamp-none">
                {item.body}
              </p>

              {/* Footer Actions & Info */}
              <div className="flex flex-wrap items-center gap-y-4 gap-x-8  text-xs font-medium pt-1 border-t border-gray-50">
                <div className="flex items-center gap-2">
                  <Calendar size={18} className="" />
                  <span>
                    {new Date(item.createdAt).toLocaleDateString("bn-BD", {
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                    })}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <Clock size={18} className="" />
                  <span>
                    {new Date(item.createdAt).toLocaleTimeString("bn-BD", {
                      hour: "numeric",
                      minute: "2-digit",
                    })}
                  </span>
                </div>

                <button
                  onClick={() => toggleReadStatus(item)}
                  className="flex items-center gap-2 hover:text-primary transition-colors ml-0 md:ml-auto"
                >
                  {item.isRead ? (
                    <>
                      <MailOpen size={18} className="" />
                      <span>পড়া হয়েছে</span>
                    </>
                  ) : (
                    <>
                      <Mail size={18} className="" />
                      <span className="">পড়ুন</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          ))}

        {!loading && notifications.length === 0 && (
          <div className="text-center py-20 bg-white rounded-xl shadow-sm border border-dashed border-gray-300">
            <p className="">কোনো নোটিফিকেশন নেই।</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default NotificationList;