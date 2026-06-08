"use client";
import React, { useState, useMemo } from "react";
import {
  useReactTable,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  flexRender,
} from "@tanstack/react-table";
import {
  UserPlus,
  Edit3,
  Trash2,
  ShieldCheck,
  Mail,
  Search,
  ChevronLeft,
  ChevronRight,
  ArrowUpDown,
  Phone,
  MapPin,
  Calendar,
  X,
} from "lucide-react";
import { PageButton, PaginationWithDots } from "./PageButton";

const UserManagement = () => {
  // ডাটা স্টেট
  const [data, setData] = useState([
    {
      id: 1,
      name: "রবার্ট ব্রাউন",
      email: "robert@dev.com",
      phone: "+880 1711-223344",
      location: "ঢাকা, বাংলাদেশ",
      joined: "2023-10-15",
      role: "Admin",
      status: "Active",
      image: "https://i.pravatar.cc/150?u=1",
    },
    {
      id: 2,
      name: "জেন ডো",
      email: "jane@design.com",
      phone: "+880 1812-556677",
      location: "চট্টগ্রাম, বাংলাদেশ",
      joined: "2024-01-20",
      role: "Editor",
      status: "Pending",
      image: "https://i.pravatar.cc/150?u=2",
    },
    {
      id: 1,
      name: "রবার্ট ব্রাউন",
      email: "robert@dev.com",
      phone: "+880 1711-223344",
      location: "ঢাকা, বাংলাদেশ",
      joined: "2023-10-15",
      role: "Admin",
      status: "Active",
      image: "https://i.pravatar.cc/150?u=1",
    },
    {
      id: 2,
      name: "জেন ডো",
      email: "jane@design.com",
      phone: "+880 1812-556677",
      location: "চট্টগ্রাম, বাংলাদেশ",
      joined: "2024-01-20",
      role: "Editor",
      status: "Pending",
      image: "https://i.pravatar.cc/150?u=2",
    },
    {
      id: 1,
      name: "রবার্ট ব্রাউন",
      email: "robert@dev.com",
      phone: "+880 1711-223344",
      location: "ঢাকা, বাংলাদেশ",
      joined: "2023-10-15",
      role: "Admin",
      status: "Active",
      image: "https://i.pravatar.cc/150?u=1",
    },
    {
      id: 2,
      name: "জেন ডো",
      email: "jane@design.com",
      phone: "+880 1812-556677",
      location: "চট্টগ্রাম, বাংলাদেশ",
      joined: "2024-01-20",
      role: "Editor",
      status: "Pending",
      image: "https://i.pravatar.cc/150?u=2",
    },
    {
      id: 1,
      name: "রবার্ট ব্রাউন",
      email: "robert@dev.com",
      phone: "+880 1711-223344",
      location: "ঢাকা, বাংলাদেশ",
      joined: "2023-10-15",
      role: "Admin",
      status: "Active",
      image: "https://i.pravatar.cc/150?u=1",
    },
    {
      id: 2,
      name: "জেন ডো",
      email: "jane@design.com",
      phone: "+880 1812-556677",
      location: "চট্টগ্রাম, বাংলাদেশ",
      joined: "2024-01-20",
      role: "Editor",
      status: "Pending",
      image: "https://i.pravatar.cc/150?u=2",
    },
    // ... বাকি ডাটা যোগ করতে পারেন
  ]);

  const [globalFilter, setGlobalFilter] = useState("");
  const [sorting, setSorting] = useState([]);
  const [currentUser, setCurrentUser] = useState({
    name: "",
    email: "",
    phone: "",
    location: "",
    joined: new Date().toISOString().split("T")[0],
    role: "User",
    status: "Active",
  });
  const [isEdit, setIsEdit] = useState(false);

  // CRUD অপারেশনসমূহ
  const handleOpenModal = (user = null) => {
    if (user) {
      setCurrentUser(user);
      setIsEdit(true);
    } else {
      setCurrentUser({
        name: "",
        email: "",
        phone: "",
        location: "",
        joined: new Date().toISOString().split("T")[0],
        role: "User",
        status: "Active",
      });
      setIsEdit(false);
    }
    document.getElementById("user_modal").showModal();
  };

  const handleSaveUser = (e) => {
    e.preventDefault();
    if (isEdit) {
      setData(data.map((u) => (u.id === currentUser.id ? currentUser : u)));
    } else {
      const newUser = {
        ...currentUser,
        id: Date.now(),
        image: `https://i.pravatar.cc/150?u=${Date.now()}`,
      };
      setData([...data, newUser]);
    }
    document.getElementById("user_modal").close();
  };

  const handleDelete = (id) => {
    if (
      window.confirm("আপনি কি নিশ্চিত যে আপনি এই প্রোফাইলটি মুছে ফেলতে চান?")
    ) {
      setData(data.filter((u) => u.id !== id));
    }
  };

  // কলাম ডেফিনিশন (বাংলায়)
  const columns = useMemo(
    () => [
      {
        accessorKey: "name",
        header: ({ column }) => (
          <button
            className="flex items-center gap-1 hover:text-red-500 transition-colors"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            ব্যবহারকারীর তথ্য <ArrowUpDown size={12} />
          </button>
        ),
        cell: (info) => (
          <div className="flex items-center gap-3">
            <div className="avatar">
              <div className="mask mask-squircle w-12 h-12 ring ring-red-50 ring-offset-2">
                <img src={info.row.original.image} alt="avatar" />
              </div>
            </div>
            <div>
              <div className="font-bold  text-sm">{info.getValue()}</div>
              <div className="text-[11px]  flex items-center gap-1 font-medium">
                <Mail size={10} /> {info.row.original.email}
              </div>
            </div>
          </div>
        ),
      },
      {
        accessorKey: "phone",
        header: "যোগাযোগ ও ঠিকানা",
        cell: (info) => (
          <div className="space-y-1">
            <div className="text-xs font-bold  flex items-center gap-1">
              <Phone size={10} className="text-red-400" /> {info.getValue()}
            </div>
            <div className="text-[10px]  flex items-center gap-1">
              <MapPin size={10} /> {info.row.original.location}
            </div>
          </div>
        ),
      },
      {
        accessorKey: "joined",
        header: "যোগদানের তারিখ",
        cell: (info) => (
          <div className="flex items-center gap-1.5 text-xs  font-medium">
            <Calendar size={12} className="" />
            {new Date(info.getValue()).toLocaleDateString("bn-BD", {
              day: "numeric",
              month: "long",
              year: "numeric",
            })}
          </div>
        ),
      },
      {
        accessorKey: "role",
        header: "পদবী",
        cell: (info) => (
          <div className="flex items-center gap-1.5 px-3 py-1 bg-base-200 rounded-lg w-fit border border-gray-100 ">
            <ShieldCheck size={13} className="text-red-500" />
            <span className="text-[11px]  font-semibold  ">
              {info.getValue()}
            </span>
          </div>
        ),
      },
      {
        accessorKey: "status",
        header: "অবস্থা",
        cell: (info) => {
          const status = info.getValue();
          const statusLabels = {
            Active: "সক্রিয়",
            Pending: "অপেক্ষমান",
            Inactive: "নিষ্ক্রিয়",
          };
          const colors = {
            Active: "bg-green-100 text-green-700 ring-green-200",
            Pending: "bg-orange-100 text-orange-700 ring-orange-200",
            Inactive: "bg-gray-100  ring-gray-200",
          };
          return (
            <span
              className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase ring-1 ${colors[status]}`}
            >
              {statusLabels[status] || status}
            </span>
          );
        },
      },
      {
        id: "actions",
        header: "অ্যাকশন",
        cell: (info) => (
          <div className="flex items-center gap-1">
            <button
              onClick={() => handleOpenModal(info.row.original)}
              className="p-2 hover:bg-blue-50 text-blue-500 rounded-xl transition-all active:scale-90"
            >
              <Edit3 size={16} />
            </button>
            <button
              onClick={() => handleDelete(info.row.original.id)}
              className="p-2 hover:bg-red-50 text-red-500 rounded-xl transition-all active:scale-90"
            >
              <Trash2 size={16} />
            </button>
          </div>
        ),
      },
    ],
    [data],
  );

  const table = useReactTable({
    data,
    columns,
    state: { globalFilter, sorting },
    onGlobalFilterChange: setGlobalFilter,
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    initialState: { pagination: { pageSize: 5 } },
  });

  return (
    <div>
      <div className="max-w-full">
        {/* Header Section */}
        <div className="p-8 border-b border-gray-50 ">
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
            <div>
              <div className="flex items-center gap-3">
                <h2 className="text-2xl font-black  tracking-tighter">
                  ব্যবহারকারী তালিকা
                </h2>
              </div>
              {/* <p className="text-[11px]  mt-2 uppercase font-black tracking-[0.2em] opacity-70">
                NikaHdeen ক্লাউড ম্যানেজমেন্ট — ভার্সন ২.০
              </p> */}
            </div>

            <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
              <div className="relative flex-1 lg:w-80 group">
                <Search
                  className="absolute left-4 top-1/2 -translate-y-1/2  group-focus-within:text-red-400 transition-colors"
                  size={18}
                />
                <input
                  value={globalFilter ?? ""}
                  onChange={(e) => setGlobalFilter(e.target.value)}
                  placeholder="নাম, ইমেইল বা ফোন দিয়ে খুঁজুন..."
                  className=" input input-bordered w-full w-full focus:outline-none "
                />
              </div>

              <button
                onClick={() => handleOpenModal()}
                className="btn  bg-red-400 hover:bg-red-500 border-none text-white hover:shadow-lg hover:shadow-red-200 transition-all duration-300"
              >
                {/* <UserPlus size={18} /> */}
                <span className="hidden sm:inline font-bold">
                  প্রোফাইল যোগ করুন
                </span>
              </button>
            </div>
          </div>
        </div>

        {/* Table Content */}
        <div className="overflow-x-auto">
          <table className="table w-full border-separate border-spacing-0">
            <thead>
              {table.getHeaderGroups().map((headerGroup) => (
                <tr key={headerGroup.id}>
                  {headerGroup.headers.map((header) => (
                    <th
                      key={header.id}
                      className="font-semibold text-md  py-6 px-6 border-b border-gray-300 "
                    >
                      {flexRender(
                        header.column.columnDef.header,
                        header.getContext(),
                      )}
                    </th>
                  ))}
                </tr>
              ))}
            </thead>
            <tbody className="divide-y divide-gray-50">
              {table.getRowModel().rows.map((row) => (
                <tr
                  key={row.id}
                  className="hover:bg-red-50/20 transition-all duration-200 group"
                >
                  {row.getVisibleCells().map((cell) => (
                    <td
                      key={cell.id}
                      className="py-5 px-6 border-b border-gray-50 group-last:border-none"
                    >
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext(),
                      )}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>

          {data.length === 0 && (
            <div className="text-center py-32 space-y-4">
              <div className="bg-gray-50 w-20 h-20 rounded-full flex items-center justify-center mx-auto">
                <Search size={32} className="text-gray-200" />
              </div>
              <p className=" font-medium uppercase text-xs tracking-widest">
                সিস্টেমে কোনো ব্যবহারকারী পাওয়া যায়নি
              </p>
            </div>
          )}
        </div>

        {/* Pagination Section */}
        <div className="p-4 flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-gray-100">
          <div className="flex items-center gap-8 w-full sm:w-auto">
            <p className="text-[11px] font-black  uppercase tracking-widest whitespace-nowrap">
              মোট সদস্য: <span className="">{data.length}</span>
            </p>

            <select
              className="bg-base-200 select w-32 select-xs select-ghost z-20 font-semibold  focus:outline-none"
              value={table.getState().pagination.pageSize}
              onChange={(e) => table.setPageSize(Number(e.target.value))}
            >
              {[5, 10, 20, 50].map((pageSize) => (
                <option key={pageSize} value={pageSize}>
                  দেখুন {pageSize} টি
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
              className="btn btn-circle btn-sm  border-gray-200 hover:bg-red-50 hover:text-red-500 disabled:opacity-30 disabled:bg-gray-50 transition-all shadow-sm"
            >
              <ChevronLeft size={18} />
            </button>

            <div className="flex items-center gap-1">
              <div className="hidden sm:flex gap-1">
                {table.getPageCount() <= 7 ? (
                  [...Array(table.getPageCount())].map((_, i) => (
                    <PageButton key={i} index={i} table={table} />
                  ))
                ) : (
                  <PaginationWithDots table={table} />
                )}
              </div>
              <span className="flex items-center gap-1 text-xs font-bold  sm:hidden">
                পৃষ্ঠা {table.getState().pagination.pageIndex + 1} /{" "}
                {table.getPageCount()}
              </span>
            </div>

            <button
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
              className="btn btn-circle btn-sm  border-gray-200 hover:bg-red-50 hover:text-red-500 disabled:opacity-30 disabled:bg-gray-50 transition-all shadow-sm"
            >
              <ChevronRight size={18} />
            </button>
          </div>
        </div>
      </div>

      {/* CRUD MODAL */}
      <dialog id="user_modal" className="modal modal-bottom sm:modal-middle">
        <div className="modal-box  border-none  shadow-2xl overflow-visible">
          <div className="flex justify-between pb-8">
            <h3 className="font-black text-2xl text-center  ">
              {isEdit ? "প্রোফাইল আপডেট করুন" : "নতুন প্রোফাইল তৈরি করুন"}
            </h3>

            <div
              className="cursor-pointer hover:text-red-500"
              onClick={() => document.getElementById("user_modal").close()}
            >
              <X />
            </div>
          </div>

          <form
            onSubmit={handleSaveUser}
            className="grid grid-cols-1 md:grid-cols-2 gap-4"
          >
            <div className="form-control">
              <label className="text-sm">পুরো নাম</label>
              <input
                type="text"
                required
                value={currentUser.name}
                placeholder="পুরো নাম"
                onChange={(e) =>
                  setCurrentUser({ ...currentUser, name: e.target.value })
                }
                className=" input input-bordered w-full  focus:outline-none"
              />
            </div>

            <div className="form-control">
              <label className="text-sm">ইমেইল অ্যাড্রেস</label>
              <input
                type="email"
                required
                value={currentUser.email}
                placeholder="ইমেইল অ্যাড্রেস"
                onChange={(e) =>
                  setCurrentUser({ ...currentUser, email: e.target.value })
                }
                className=" input input-bordered w-full focus:outline-none"
              />
            </div>

            <div className="form-control">
              <label className="text-sm">ফোন নাম্বার</label>
              <input
                type="text"
                value={currentUser.phone}
                placeholder="ফোন নাম্বার"
                onChange={(e) =>
                  setCurrentUser({ ...currentUser, phone: e.target.value })
                }
                className=" input input-bordered w-full focus:outline-none"
              />
            </div>

            <div className="form-control">
              <label className="label text-sm">ঠিকানা</label>
              <input
                type="text"
                value={currentUser.location}
                placeholder="ঠিকানা"
                onChange={(e) =>
                  setCurrentUser({ ...currentUser, location: e.target.value })
                }
                className=" input input-bordered w-full focus:outline-none"
              />
            </div>

            <div className="form-control">
              <label className="label text-sm">পদবী</label>
              <select
                className="select select-bordered focus:outline-none w-full"
                value={currentUser.role}
                onChange={(e) =>
                  setCurrentUser({ ...currentUser, role: e.target.value })
                }
              >
                <option value="User">ব্যবহারকারী (User)</option>
                <option value="Admin">অ্যাডমিন (Admin)</option>
                <option value="Editor">এডিটর (Editor)</option>
                <option value="Owner">মালিক (Owner)</option>
              </select>
            </div>

            <div className="form-control">
              <label className="label text-sm">অবস্থা</label>
              <select
                className="select select-bordered focus:outline-none w-full"
                value={currentUser.status}
                onChange={(e) =>
                  setCurrentUser({ ...currentUser, status: e.target.value })
                }
              >
                <option value="Active">সক্রিয় (Active)</option>
                <option value="Pending">অপেক্ষমান (Pending)</option>
                <option value="Inactive">নিষ্ক্রিয় (Inactive)</option>
              </select>
            </div>

            <div className="modal-action md:col-span-2 gap-3 mt-6">
              <button
                type="button"
                onClick={() => document.getElementById("user_modal").close()}
                className="btn btn-outline btn-error  px-6 font-bold w-50"
              >
                বাতিল করুন
              </button>
              <button
                type="submit"
                className="btn flex-1 bg-red-500 hover:bg-red-600 border-none text-white  shadow-xl w-50shadow-red-200 "
              >
                {isEdit ? "আপডেট করুন" : "সেভ করুন"}
              </button>
            </div>
          </form>
        </div>
      </dialog>
    </div>
  );
};

export default UserManagement;
