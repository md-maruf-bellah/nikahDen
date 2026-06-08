"use client";
import React, { useState } from "react";
import { Calendar, Clock, Mail, MailOpen, X } from "lucide-react";

const NotificationList = () => {
  const [notifications, setNotifications] = useState([
    {
      id: 1,
      name: "সেলিনা খাতুন",
      description:
        "সেলিনা খাতুনের জন্ম জুন ১৯, ১৯৯৯ইং সালে, তিনি জাতীয় বিশ্ববিদ্যালয় থেকে বি.এ ডিগ্রী অর্জন করেছেন। ৩ ভাই-বোনের মধ্যে তিনি সবার ছোট। বর্তমানে তিনি...",
      date: "মার্চ ২৫, ২০২৪ইং",
      time: "বিকাল ০৪:২৫ মিনিট",
      isRead: false,
    },
    {
      id: 2,
      name: "সেলিনা খাতুন",
      description:
        "সেলিনা খাতুনের জন্ম জুন ১৯, ১৯৯৯ইং সালে, তিনি জাতীয় বিশ্ববিদ্যালয় থেকে বি.এ ডিগ্রী অর্জন করেছেন। ৩ ভাই-বোনের মধ্যে তিনি সবার ছোট। বর্তমানে তিনি...",
      date: "মার্চ ২৫, ২০২৪ইং",
      time: "বিকাল ০৪:২৫ মিনিট",
      isRead: true,
    },
    {
      id: 3,
      name: "সেলিনা খাতুন",
      description:
        "সেলিনা খাতুনের জন্ম জুন ১৯, ১৯৯৯ইং সালে, তিনি জাতীয় বিশ্ববিদ্যালয় থেকে বি.এ ডিগ্রী অর্জন করেছেন। ৩ ভাই-বোনের মধ্যে তিনি সবার ছোট। বর্তমানে তিনি...",
      date: "মার্চ ২৫, ২০২৪ইং",
      time: "বিকাল ০৪:২৫ মিনিট",
      isRead: true,
    },
  ]);

  const removeNotification = (id) => {
    setNotifications(notifications.filter((n) => n.id !== id));
  };

  const toggleReadStatus = (id) => {
    setNotifications(
      notifications.map((n) => (n.id === id ? { ...n, isRead: !n.isRead } : n)),
    );
  };

  return (
    <div className="min-h-screen p-4 ">
      <div className="max-w-4xl mx-auto space-y-4">
        {notifications.map((item) => (
          <div
            key={item.id}
            className="  p-5 md:p-6  border-b-1 border-gray-500 relative group transition-all hover:border-b-2"
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
                আপনার বায়োডাটা পছন্দ করেছেন{" "}
                <span className=" font-semibold">{item.name}</span>
              </h3>
            </div>

            {/* Description */}
            <p className=" text-xs leading-relaxed mb-3 line-clamp-2 md:line-clamp-none">
              {item.description}
            </p>

            {/* Footer Actions & Info */}
            <div className="flex flex-wrap items-center gap-y-4 gap-x-8  text-xs font-medium pt-1 border-t border-gray-50">
              <div className="flex items-center gap-2">
                <Calendar size={18} className="" />
                <span>{item.date}</span>
              </div>

              <div className="flex items-center gap-2">
                <Clock size={18} className="" />
                <span>{item.time}</span>
              </div>

              <button
                onClick={() => toggleReadStatus(item.id)}
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

        {notifications.length === 0 && (
          <div className="text-center py-20 bg-white rounded-xl shadow-sm border border-dashed border-gray-300">
            <p className="">কোনো নোটিফিকেশন নেই।</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default NotificationList;
