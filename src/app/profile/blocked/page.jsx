"use client";
import React, { useCallback, useEffect, useState } from "react";
import { Ban, ShieldCheck, Undo2 } from "lucide-react";
import { blockApi } from "@/lib/api";

/**
 * ব্লক তালিকা — আমি যাদের ব্লক করেছি। নীরব দেয়াল নীতি: ব্লকড পক্ষ কিছুই জানে না,
 * তাই এই তালিকা শুধু ব্লকার নিজে দেখে। আনব্লক করলে রেকর্ড মুছে যায় — পুরনো
 * কথোপকথন অক্ষত থাকে, চাইলে সেখানেই কথা চালু হয়।
 */
const BlockedList = () => {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState(null);
  const [confirmId, setConfirmId] = useState(null);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    try {
      const res = await blockApi.list({ limit: 50 });
      setRows(res?.data || []);
    } catch {
      setRows([]);
      setError("ব্লক তালিকা লোড করা যায়নি।");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    Promise.resolve().then(() => {
      if (!cancelled) return load();
    });
    // messenger/প্রোফাইল থেকে block/unblock হলে এই তালিকা লাইভ আপডেট হয়
    const onChange = () => load();
    window.addEventListener("blocks-changed", onChange);
    return () => {
      cancelled = true;
      window.removeEventListener("blocks-changed", onChange);
    };
  }, [load]);

  const handleUnblock = async (item) => {
    setBusyId(item.user.id);
    try {
      await blockApi.unblock(item.user.id);
      setRows((prev) => prev.filter((r) => r.id !== item.id));
    } catch {
      setError("আনব্লক করা যায়নি। আবার চেষ্টা করুন।");
    } finally {
      setBusyId(null);
      setConfirmId(null);
    }
  };

  return (
    <div className="p-4 md:p-10 min-h-screen">
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-full bg-red-50 flex items-center justify-center">
            <Ban size={20} className="text-red-500" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-800">ব্লক তালিকা</h1>
            <p className="text-xs text-gray-500">
              আপনি যাদের ব্লক করেছেন। ব্লক করা ব্যক্তি এটি জানতে পারে না এবং
              আপনাকে মেসেজ দিতে পারবে না।
            </p>
          </div>
        </div>

        {error && (
          <p className="text-xs text-error mb-4 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
            {error}
          </p>
        )}

        {loading && (
          <div className="text-center py-16">
            <span className="loading loading-spinner loading-md text-red-400"></span>
          </div>
        )}

        {!loading && rows.length === 0 && (
          <div className="text-center py-16 bg-base-100 border border-primary/15 rounded-lg">
            <ShieldCheck size={40} className="mx-auto text-green-500 mb-3" />
            <p className="text-gray-500">আপনি কাউকে ব্লক করেননি।</p>
          </div>
        )}

        {!loading && rows.length > 0 && (
          <ul className="space-y-3">
            {rows.map((item) => (
              <li
                key={item.id}
                className="flex items-center gap-3 bg-base-100 border border-primary/15 rounded-lg p-3"
              >
                <img
                  src={item.user?.avatar || `https://i.pravatar.cc/150?u=${item.user?.id}`}
                  className="w-11 h-11 rounded-full object-cover"
                  alt="user"
                />
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-gray-800 text-sm truncate">
                    {item.user?.name || "ব্যবহারকারী"}
                  </p>
                  <p className="text-[11px] text-gray-400">
                    ব্লক করেছেন:{" "}
                    {item.blockedAt
                      ? new Date(item.blockedAt).toLocaleDateString("bn-BD", {
                          day: "numeric",
                          month: "long",
                          year: "numeric",
                        })
                      : "—"}
                  </p>
                </div>
                {confirmId === item.user.id ? (
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setConfirmId(null)}
                      className="btn btn-ghost btn-xs"
                    >
                      বাতিল
                    </button>
                    <button
                      onClick={() => handleUnblock(item)}
                      disabled={busyId === item.user.id}
                      className="btn btn-xs bg-green-600 hover:bg-green-700 text-white border-none"
                    >
                      {busyId === item.user.id ? (
                        <span className="loading loading-spinner loading-xs"></span>
                      ) : (
                        <Undo2 size={12} />
                      )}
                      নিশ্চিত আনব্লক
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => setConfirmId(item.user.id)}
                    className="btn btn-xs bg-green-50 text-green-600 hover:bg-green-100 border-none"
                  >
                    <Undo2 size={12} /> আনব্লক
                  </button>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

export default BlockedList;
