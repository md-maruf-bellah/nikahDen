"use client";
import React, { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Link2, Trash2, ExternalLink } from "lucide-react";
import { biodataApi } from "@/lib/api";
import StartChatButton from "@/components/StartChatButton";

const LikeList = ({ received = false } = {}) => {
  const [selected, setSelected] = useState(null);
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const res = received
        ? await biodataApi.likesReceived({ limit: 50 })
        : await biodataApi.likesSent({ limit: 50 });
      setRows(res?.data || []);
    } catch {
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, [received]);

  useEffect(() => {
    let cancelled = false;
    Promise.resolve().then(() => {
      if (!cancelled) return load();
    });
    return () => {
      cancelled = true;
    };
  }, [load]);

  const handleDelete = async (item) => {
    try {
      await biodataApi.unlike(item.biodata.id);
      setRows((prev) => prev.filter((r) => r.id !== item.id));
    } catch {
      /* keep */
    }
    setSelected(null);
  };

  return (
    <div className="p-4 md:p-10  min-h-screen">
      <div className="max-w-5xl mx-auto overflow-x-auto">
        <table className="table w-full border-separate border-spacing-y-2">
          {/* Table Head */}
          <thead>
            <tr className=" text-lg border-none">
              <th className="bg-transparent font-bold">#</th>
              <th className="bg-transparent font-bold">{received ? "পছন্দকারী" : "বায়োডাটা নং"}</th>
              <th className="bg-transparent font-bold">{received ? "পছন্দের তারিখ" : "ঠিকানা"}</th>
              <th className="bg-transparent font-bold text-center">অপশন</th>
            </tr>
          </thead>

          {/* Table Body */}
          <tbody className="">
            {loading && (
              <tr>
                <td colSpan={4} className="text-center py-10">
                  <span className="loading loading-spinner loading-md text-red-400"></span>
                </td>
              </tr>
            )}
            {!loading &&
              rows.map((item, index) => (
                <tr
                  key={item.id}
                  className={`border-none hover:bg-gray-100 hover:text-gray-500 transition-colors cursor-pointer`}
                >
                  <td className="rounded-l-lg font-medium">{index + 1}</td>
                  <td className="font-medium">
                    {received ? (
                      <div>
                        <p className="font-bold">{item?.from?.name || "—"}</p>
                        {item?.from?.biodata?.biodataNo && (
                          <span className="text-xs font-mono text-gray-400">
                            {item.from.biodata.biodataNo}
                          </span>
                        )}
                      </div>
                    ) : (
                      item?.biodata?.biodataNo || "—"
                    )}
                  </td>
                  <td className="max-w-xs md:max-w-none truncate md:whitespace-normal">
                    {received
                      ? new Date(item.likedAt).toLocaleDateString("bn-BD", {
                          day: "numeric",
                          month: "long",
                          year: "numeric",
                        })
                      : item?.biodata?.district || item?.biodata?.division || "—"}
                  </td>
                  <td className="rounded-r-lg">
                    <div className="flex justify-center items-center gap-2">
                      {!received && item?.biodata ? (
                        <>
                          <Link
                            href={`/details?id=${item.biodata.id}`}
                            className="hover:text-primary transition-colors cursor-pointer"
                          >
                            <Link2 size={20} />
                          </Link>
                          <button
                            onClick={() => setSelected(item)}
                            className="hover:text-error transition-colors cursor-pointer"
                          >
                            <Trash2 size={20} />
                          </button>
                        </>
                      ) : (
                        <div className="flex items-center gap-2">
                          {item?.from?.biodata ? (
                            <Link
                              href={`/details?id=${item.from.biodata.id}`}
                              className="btn btn-xs bg-[#fd6969] hover:bg-[#eb5252] text-white border-none gap-1 font-medium"
                            >
                              <ExternalLink size={12} />
                              বায়োডাটা দেখুন
                            </Link>
                          ) : (
                            <span className="text-xs text-gray-400">বায়োডাটা নেই</span>
                          )}
                          {item?.from?.id && (
                            <StartChatButton
                              userId={item.from.id}
                              className="btn btn-xs btn-outline border-gray-300 hover:border-[#fd6969] hover:bg-[#fd6969] hover:text-white"
                            >
                              মেসেজ
                            </StartChatButton>
                          )}
                        </div>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            {!loading && rows.length === 0 && (
              <tr>
                <td colSpan={4} className="text-center py-10 text-gray-400">
                  {received
                    ? "আপনাকে কেউ এখনো পছন্দ করেনি।"
                    : "আপনি এখনো কাউকে পছন্দ করেননি।"}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* --- Delete Confirmation Modal (DaisyUI) --- */}
      <input
        type="checkbox"
        id="delete_modal"
        className="modal-toggle"
        checked={!!selected}
        readOnly
      />
      <div className="modal modal-bottom sm:modal-middle">
        <div className="modal-box bg-white">
          <h3 className="font-bold text-xl text-error flex items-center gap-2">
            <Trash2 size={24} /> সতর্কবার্তা!
          </h3>
          <p className="py-4 text-gray-700 text-lg">
            আপনি কি নিশ্চিত যে আপনি এই বায়োডাটাটি পছন্দ তালিকা থেকে মুছে ফেলতে
            চান?
          </p>
          <div className="modal-action">
            <button
              className="btn btn-outline "
              onClick={() => setSelected(null)}
            >
              বাতিল করুন
            </button>
            <button
              className="btn btn-error text-white"
              onClick={() => selected && handleDelete(selected)}
            >
              হ্যাঁ, ডিলিট করুন
            </button>
          </div>
        </div>
        <label className="modal-backdrop" onClick={() => setSelected(null)}>
          Close
        </label>
      </div>
    </div>
  );
};

export default LikeList;