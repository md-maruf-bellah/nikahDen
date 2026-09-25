"use client";
import React, { useCallback, useEffect, useState } from "react";
import {
  Edit3,
  Trash2,
  ShieldCheck,
  Mail,
  Search,
  ChevronLeft,
  ChevronRight,
  ArrowUpDown,
  Phone,
  Calendar,
  X,
  RefreshCw,
} from "lucide-react";
import { usersApi } from "@/lib/api";

const STATUS_MAP = { ACTIVE: "Active", PENDING: "Pending", INACTIVE: "Inactive" };
const ROLE_LABELS = {
  SUPERADMIN: "Owner",
  ADMIN: "Admin",
  EDITOR: "Editor",
  USER: "User",
};
const bn = (n) => Number(n ?? 0).toLocaleString("bn-BD");

const toRow = (u) => ({
  id: u.id,
  name: u.name || u.email,
  email: u.email,
  phone: u.phone || "—",
  joined: u.createdAt,
  role: ROLE_LABELS[u.role] || u.role,
  roleKey: u.role,
  status: STATUS_MAP[u.status] || u.status,
  statusKey: u.status,
  image: u.avatar || `https://i.pravatar.cc/150?u=${u.id}`,
});

const UserManagement = () => {
  // server-driven state: every change re-fetches from GET /users
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [sortBy, setSortBy] = useState("createdAt");
  const [sortOrder, setSortOrder] = useState("desc");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [pagination, setPagination] = useState({ total: 0, totalPages: 1, page: 1 });

  const [currentUser, setCurrentUser] = useState(null);
  const [isEdit, setIsEdit] = useState(false);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await usersApi.list({
        page,
        limit,
        search: search || undefined,
        role: roleFilter || undefined,
        status: statusFilter || undefined,
        sortBy,
        sortOrder,
      });
      setData((Array.isArray(res?.data) ? res.data : []).map(toRow));
      setPagination(res?.pagination || { total: 0, totalPages: 1, page: 1 });
    } catch {
      setData([]);
    } finally {
      setLoading(false);
    }
  }, [page, limit, search, roleFilter, statusFilter, sortBy, sortOrder]);

  useEffect(() => {
    let cancelled = false;
    Promise.resolve().then(() => {
      if (!cancelled) return load();
    });
    return () => {
      cancelled = true;
    };
  }, [load]);

  // debounce the server search (300ms)
  useEffect(() => {
    const t = setTimeout(() => {
      setSearch(searchInput.trim());
      setPage(1);
    }, 300);
    return () => clearTimeout(t);
  }, [searchInput]);

  const toggleSort = (field) => {
    if (sortBy === field) {
      setSortOrder((o) => (o === "asc" ? "desc" : "asc"));
    } else {
      setSortBy(field);
      setSortOrder("asc");
    }
    setPage(1);
  };

  const handleOpenModal = (user = null) => {
    if (user) {
      setCurrentUser({ ...user, password: "", phone: user.phone === "—" ? "" : user.phone });
      setIsEdit(true);
    } else {
      setCurrentUser({ name: "", email: "", phone: "", password: "", roleKey: "USER", statusKey: "ACTIVE" });
      setIsEdit(false);
    }
    document.getElementById("user_modal").showModal();
  };

  const handleSaveUser = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const firstName = currentUser.name.trim().split(" ")[0] || "";
      const lastName = currentUser.name.trim().split(" ").slice(1).join(" ");
      if (isEdit) {
        await usersApi.update(currentUser.id, {
          firstName,
          lastName,
          phone: currentUser.phone,
          role: currentUser.roleKey,
          status: currentUser.statusKey,
        });
      } else {
        await usersApi.create({
          firstName,
          lastName,
          email: currentUser.email,
          password: currentUser.password,
          phone: currentUser.phone,
          role: currentUser.roleKey,
          status: currentUser.statusKey,
        });
      }
      document.getElementById("user_modal").close();
      await load();
    } catch (err) {
      window.alert(err.message || "সংরক্ষণ করা যায়নি");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm("আপনি কি নিশ্চিত যে আপনি এই প্রোফাইলটি মুছে ফেলতে চান? (অ্যাকাউন্ট নিষ্ক্রিয় হবে)")) {
      try {
        await usersApi.remove(id);
        await load();
      } catch (err) {
        window.alert(err.message || "মুছে ফেলা যায়নি");
      }
    }
  };

  const sortIcon = (field) =>
    sortBy === field ? (sortOrder === "asc" ? "▲" : "▼") : "";

  return (
    <div>
      <div className="max-w-full">
        {/* Header Section */}
        <div className="p-8 border-b border-gray-50">
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
            <div>
              <h2 className="text-2xl font-black tracking-tighter">ব্যবহারকারী তালিকা</h2>
              <p className="text-xs text-gray-400 mt-1">
                সার্ভার-সাইড সার্চ ও ফিল্টার — মোট {bn(pagination.total)} জন
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
              <div className="relative flex-1 lg:w-64 group">
                <Search
                  className="absolute left-4 top-1/2 -translate-y-1/2 group-focus-within:text-red-400 transition-colors"
                  size={18}
                />
                <input
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  placeholder="নাম, ইমেইল বা ফোন দিয়ে খুঁজুন..."
                  className="input input-bordered w-full focus:outline-none"
                />
              </div>

              <select
                className="select select-bordered select-sm focus:outline-none"
                value={roleFilter}
                onChange={(e) => {
                  setRoleFilter(e.target.value);
                  setPage(1);
                }}
              >
                <option value="">সব পদবী</option>
                <option value="USER">User</option>
                <option value="EDITOR">Editor</option>
                <option value="ADMIN">Admin</option>
                <option value="SUPERADMIN">Owner</option>
              </select>

              <select
                className="select select-bordered select-sm focus:outline-none"
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value);
                  setPage(1);
                }}
              >
                <option value="">সব অবস্থা</option>
                <option value="ACTIVE">সক্রিয়</option>
                <option value="PENDING">অপেক্ষমান</option>
                <option value="INACTIVE">নিষ্ক্রিয়</option>
              </select>

              <button
                onClick={() => {
                  setSearchInput("");
                  setRoleFilter("");
                  setStatusFilter("");
                  setSortBy("createdAt");
                  setSortOrder("desc");
                  setPage(1);
                }}
                className="btn btn-sm btn-ghost gap-1"
                title="ফিল্টার মুছুন"
              >
                <RefreshCw size={14} />
              </button>

              <button
                onClick={() => handleOpenModal()}
                className="btn bg-red-400 hover:bg-red-500 border-none text-white hover:shadow-lg hover:shadow-red-200 transition-all duration-300"
              >
                <span className="hidden sm:inline font-bold">প্রোফাইল যোগ করুন</span>
              </button>
            </div>
          </div>
        </div>

        {/* Table Content */}
        <div className="overflow-x-auto">
          {loading ? (
            <div className="text-center py-20">
              <span className="loading loading-spinner loading-lg text-red-400"></span>
            </div>
          ) : (
            <table className="table w-full border-separate border-spacing-0">
              <thead>
                <tr>
                  <th className="font-semibold text-md py-6 px-6 border-b border-gray-300">
                    <button
                      className="flex items-center gap-1 hover:text-red-500 transition-colors"
                      onClick={() => toggleSort("name")}
                    >
                      ব্যবহারকারীর তথ্য <ArrowUpDown size={12} /> {sortIcon("name")}
                    </button>
                  </th>
                  <th className="font-semibold text-md py-6 px-6 border-b border-gray-300">যোগাযোগ</th>
                  <th className="font-semibold text-md py-6 px-6 border-b border-gray-300">
                    <button
                      className="flex items-center gap-1 hover:text-red-500 transition-colors"
                      onClick={() => toggleSort("createdAt")}
                    >
                      যোগদানের তারিখ <ArrowUpDown size={12} /> {sortIcon("createdAt")}
                    </button>
                  </th>
                  <th className="font-semibold text-md py-6 px-6 border-b border-gray-300">পদবী</th>
                  <th className="font-semibold text-md py-6 px-6 border-b border-gray-300">অবস্থা</th>
                  <th className="font-semibold text-md py-6 px-6 border-b border-gray-300">অ্যাকশন</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {data.map((u) => (
                  <tr key={u.id} className="hover:bg-red-50/20 transition-all duration-200 group">
                    <td className="py-5 px-6 border-b border-gray-50">
                      <div className="flex items-center gap-3">
                        <div className="avatar">
                          <div className="mask mask-squircle w-12 h-12 ring ring-red-50 ring-offset-2">
                            <img src={u.image} alt="avatar" />
                          </div>
                        </div>
                        <div>
                          <div className="font-bold text-sm">{u.name}</div>
                          <div className="text-[11px] flex items-center gap-1 font-medium">
                            <Mail size={10} /> {u.email}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="py-5 px-6 border-b border-gray-50">
                      <div className="text-xs font-bold flex items-center gap-1">
                        <Phone size={10} className="text-red-400" /> {u.phone}
                      </div>
                    </td>
                    <td className="py-5 px-6 border-b border-gray-50">
                      <div className="flex items-center gap-1.5 text-xs font-medium">
                        <Calendar size={12} />
                        {new Date(u.joined).toLocaleDateString("bn-BD", {
                          day: "numeric",
                          month: "long",
                          year: "numeric",
                        })}
                      </div>
                    </td>
                    <td className="py-5 px-6 border-b border-gray-50">
                      <div className="flex items-center gap-1.5 px-3 py-1 bg-base-200 rounded-lg w-fit border border-gray-100">
                        <ShieldCheck size={13} className="text-red-500" />
                        <span className="text-[11px] font-semibold">{u.role}</span>
                      </div>
                    </td>
                    <td className="py-5 px-6 border-b border-gray-50">
                      {(() => {
                        const labels = { Active: "সক্রিয়", Pending: "অপেক্ষমান", Inactive: "নিষ্ক্রিয়" };
                        const colors = {
                          Active: "bg-green-100 text-green-700 ring-green-200",
                          Pending: "bg-orange-100 text-orange-700 ring-orange-200",
                          Inactive: "bg-gray-100 text-gray-600 ring-gray-200",
                        };
                        return (
                          <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase ring-1 ${colors[u.status]}`}>
                            {labels[u.status] || u.status}
                          </span>
                        );
                      })()}
                    </td>
                    <td className="py-5 px-6 border-b border-gray-50">
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleOpenModal(u)}
                          className="p-2 hover:bg-blue-50 text-blue-500 rounded-xl transition-all active:scale-90"
                        >
                          <Edit3 size={16} />
                        </button>
                        <button
                          onClick={() => handleDelete(u.id)}
                          className="p-2 hover:bg-red-50 text-red-500 rounded-xl transition-all active:scale-90"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {!loading && data.length === 0 && (
            <div className="text-center py-32 space-y-4">
              <div className="bg-gray-50 w-20 h-20 rounded-full flex items-center justify-center mx-auto">
                <Search size={32} className="text-gray-200" />
              </div>
              <p className="font-medium uppercase text-xs tracking-widest">
                কোনো ব্যবহারকারী পাওয়া যায়নি
              </p>
            </div>
          )}
        </div>

        {/* Pagination Section (server-side) */}
        <div className="p-4 flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-gray-100">
          <div className="flex items-center gap-8 w-full sm:w-auto">
            <p className="text-[11px] font-black uppercase tracking-widest whitespace-nowrap">
              মোট: <span>{bn(pagination.total)}</span> জন
            </p>

            <select
              className="bg-base-200 select w-32 select-xs select-ghost z-20 font-semibold focus:outline-none"
              value={limit}
              onChange={(e) => {
                setLimit(Number(e.target.value));
                setPage(1);
              }}
            >
              {[10, 20, 50].map((n) => (
                <option key={n} value={n}>
                  দেখুন {n} টি
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="btn btn-circle btn-sm border-gray-200 hover:bg-red-50 hover:text-red-500 disabled:opacity-30 disabled:bg-gray-50 transition-all shadow-sm"
            >
              <ChevronLeft size={18} />
            </button>
            <span className="text-xs font-bold">
              পৃষ্ঠা {pagination.page || page} / {pagination.totalPages || 1}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(pagination.totalPages || 1, p + 1))}
              disabled={!pagination.totalPages || page >= pagination.totalPages}
              className="btn btn-circle btn-sm border-gray-200 hover:bg-red-50 hover:text-red-500 disabled:opacity-30 disabled:bg-gray-50 transition-all shadow-sm"
            >
              <ChevronRight size={18} />
            </button>
          </div>
        </div>
      </div>

      {/* CRUD MODAL */}
      <dialog id="user_modal" className="modal modal-bottom sm:modal-middle">
        <div className="modal-box border-none shadow-2xl overflow-visible">
          <div className="flex justify-between pb-8">
            <h3 className="font-black text-2xl text-center">
              {isEdit ? "প্রোফাইল আপডেট করুন" : "নতুন প্রোফাইল তৈরি করুন"}
            </h3>

            <div
              className="cursor-pointer hover:text-red-500"
              onClick={() => document.getElementById("user_modal").close()}
            >
              <X />
            </div>
          </div>

          <form onSubmit={handleSaveUser} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="form-control">
              <label className="text-sm">পুরো নাম</label>
              <input
                type="text"
                required
                value={currentUser?.name || ""}
                placeholder="পুরো নাম"
                onChange={(e) => setCurrentUser({ ...currentUser, name: e.target.value })}
                className="input input-bordered w-full focus:outline-none"
              />
            </div>

            <div className="form-control">
              <label className="text-sm">ইমেইল অ্যাড্রেস</label>
              <input
                type="email"
                required={!isEdit}
                disabled={isEdit}
                value={currentUser?.email || ""}
                placeholder="ইমেইল অ্যাড্রেস"
                onChange={(e) => setCurrentUser({ ...currentUser, email: e.target.value })}
                className="input input-bordered w-full focus:outline-none"
              />
            </div>

            {!isEdit && (
              <div className="form-control">
                <label className="text-sm">পাসওয়ার্ড</label>
                <input
                  type="password"
                  required
                  minLength={8}
                  value={currentUser?.password || ""}
                  placeholder="কমপক্ষে ৮ অক্ষর"
                  onChange={(e) => setCurrentUser({ ...currentUser, password: e.target.value })}
                  className="input input-bordered w-full focus:outline-none"
                />
              </div>
            )}

            <div className="form-control">
              <label className="text-sm">ফোন নাম্বার</label>
              <input
                type="text"
                value={currentUser?.phone || ""}
                placeholder="ফোন নাম্বার"
                onChange={(e) => setCurrentUser({ ...currentUser, phone: e.target.value })}
                className="input input-bordered w-full focus:outline-none"
              />
            </div>

            <div className="form-control">
              <label className="label text-sm">পদবী</label>
              <select
                className="select select-bordered focus:outline-none w-full"
                value={currentUser?.roleKey || "USER"}
                onChange={(e) => setCurrentUser({ ...currentUser, roleKey: e.target.value })}
              >
                <option value="USER">ব্যবহারকারী (User)</option>
                <option value="ADMIN">অ্যাডমিন (Admin)</option>
                <option value="EDITOR">এডিটর (Editor)</option>
                <option value="SUPERADMIN">মালিক (Owner)</option>
              </select>
            </div>

            <div className="form-control">
              <label className="label text-sm">অবস্থা</label>
              <select
                className="select select-bordered focus:outline-none w-full"
                value={currentUser?.statusKey || "ACTIVE"}
                onChange={(e) => setCurrentUser({ ...currentUser, statusKey: e.target.value })}
              >
                <option value="ACTIVE">সক্রিয় (Active)</option>
                <option value="PENDING">অপেক্ষমান (Pending)</option>
                <option value="INACTIVE">নিষ্ক্রিয় (Inactive)</option>
              </select>
            </div>

            <div className="modal-action md:col-span-2 gap-3 mt-6">
              <button
                type="button"
                onClick={() => document.getElementById("user_modal").close()}
                className="btn btn-outline btn-error px-6 font-bold"
              >
                বাতিল করুন
              </button>
              <button
                type="submit"
                disabled={saving}
                className="btn flex-1 bg-red-500 hover:bg-red-600 border-none text-white shadow-xl shadow-red-200"
              >
                {saving ? "সংরক্ষণ হচ্ছে..." : isEdit ? "আপডেট করুন" : "সেভ করুন"}
              </button>
            </div>
          </form>
        </div>
      </dialog>
    </div>
  );
};

export default UserManagement;
