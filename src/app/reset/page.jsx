"use client";
import { Suspense, useState } from "react";
import { Eye, EyeOff, Loader2, CircleCheck, AlertCircle, Lock } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import logo from "./../../../assets/navbar/logo.png";
import contact from "./../../../assets/contact/img.png";
import { authApi } from "@/lib/api";

function ResetBody() {
  const params = useSearchParams();
  const router = useRouter();
  const token = params.get("token") || "";

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [show, setShow] = useState(false);
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});
  const [done, setDone] = useState(false);
  const [saving, setSaving] = useState(false);

  const strength = (() => {
    let s = 0;
    if (password.length >= 8) s++;
    if (/[A-Z]/.test(password) && /[a-z]/.test(password)) s++;
    if (/\d/.test(password)) s++;
    if (/[^A-Za-z0-9]/.test(password)) s++;
    return s; // 0..4
  })();

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    setFieldErrors({});

    if (!token) {
      setError("রিসেট টোকেন পাওয়া যায়নি — নতুন লিঙ্কের জন্য আবার অনুরোধ করুন।");
      return;
    }
    const fe = {};
    if (password.length < 8) fe.password = "কমপক্ষে ৮ অক্ষরের পাসওয়ার্ড দিন";
    if (confirm !== password) fe.confirm = "দুটি পাসওয়ার্ড মিলছে না";
    setFieldErrors(fe);
    if (Object.keys(fe).length) return;

    setSaving(true);
    try {
      await authApi.resetPassword(token, password);
      setDone(true);
      setTimeout(() => router.push("/login"), 1800);
    } catch (ex) {
      const msg =
        ex.errorCode === "INVALID_RESET_TOKEN"
          ? "এই লিঙ্কটি অবৈধ বা আগেই ব্যবহার করা হয়েছে।"
          : ex.errorCode === "RESET_TOKEN_EXPIRED"
            ? "লিঙ্কের মেয়াদ শেষ — নতুন লিঙ্ক নিন।"
            : ex.message || "পাসওয়ার্ড রিসেট করা যায়নি।";
      setError(msg);
    } finally {
      setSaving(false);
    }
  };

  const strengthLabel = ["অতি দুর্বল", "দুর্বল", "মোটামুটি", "ভালো", "শক্তিশালী"][strength];
  const strengthColor = ["bg-red-400", "bg-red-400", "bg-yellow-400", "bg-lime-500", "bg-green-500"][strength];

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="max-w-6xl w-full bg-white rounded-lg shadow overflow-hidden flex flex-col lg:flex-row">
        <div className="lg:w-1/2 relative min-h-[300px] lg:min-h-full">
          <Image src={contact} alt="Couple" className="absolute inset-0 w-full h-full object-cover" />
          <div className="absolute inset-0 bg-red-400/40 mix-blend-multiply" />
        </div>

        <div className="lg:w-1/2 p-8 md:p-12 lg:p-16 flex flex-col justify-center">
          <div className="flex items-center gap-2 mb-8">
            <Image src={logo} alt="logo" width={40} height={40} />
            <h1 className="text-3xl font-extrabold tracking-tight">
              নিকাহ্<span className="text-[#FD6969]">দ্বীন</span>
            </h1>
          </div>

          {done ? (
            <div className="space-y-4 text-center py-6">
              <CircleCheck size={44} className="text-green-500 mx-auto" />
              <p className="font-bold text-lg">পাসওয়ার্ড পরিবর্তন হয়েছে!</p>
              <p className="text-sm text-gray-500">নতুন পাসওয়ার্ড দিয়ে লগইন করুন...</p>
              <div className="flex justify-center">
                <span className="loading loading-spinner text-[#fd6969]"></span>
              </div>
            </div>
          ) : (
            <>
              <h2 className="text-2xl font-bold text-gray-800 mb-2">নতুন পাসওয়ার্ড দিন</h2>
              <p className="text-sm text-gray-500 mb-6">কমপক্ষে ৮ অক্ষর; বড়-ছোট হাতের, সংখ্যা ও বিশেষ চিহ্নের মিশ্রণ শক্তিশালী।</p>

              {error && (
                <div className="alert alert-error text-sm mb-4 py-2">
                  <AlertCircle size={15} /> <span>{error}</span>
                </div>
              )}
              {!token && (
                <div className="alert alert-warning text-sm mb-4 py-2">
                  <span>লিঙ্কে টোকেন নেই। ইমেইলের লিঙ্ক থেকে খুলুন বা নতুন করে অনুরোধ করুন।</span>
                </div>
              )}

              <form onSubmit={submit} className="space-y-5" noValidate>
                <div className="relative">
                  <label className="absolute -top-2 left-3 bg-white px-1 text-xs text-gray-500 z-10">নতুন পাসওয়ার্ড</label>
                  <div className="relative">
                    <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-300" />
                    <input
                      type={show ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="***********"
                      autoComplete="new-password"
                      className={`input input-bordered w-full pl-10 pr-10 h-12 focus:outline-none focus:border-red-400 ${fieldErrors.password ? "border-red-400" : ""}`}
                    />
                    <button
                      type="button"
                      onClick={() => setShow(!show)}
                      aria-label={show ? "পাসওয়ার্ড লুকান" : "পাসওয়ার্ড দেখান"}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
                    >
                      {show ? <EyeOff size={20} /> : <Eye size={20} />}
                    </button>
                  </div>
                  {password && (
                    <div className="flex items-center gap-2 mt-2">
                      <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                        <div className={`h-full ${strengthColor} transition-all`} style={{ width: `${(strength / 4) * 100}%` }} />
                      </div>
                      <span className="text-[11px] text-gray-500">{strengthLabel}</span>
                    </div>
                  )}
                  {fieldErrors.password && <span className="text-red-500 text-xs mt-1 block">{fieldErrors.password}</span>}
                </div>

                <div className="relative">
                  <label className="absolute -top-2 left-3 bg-white px-1 text-xs text-gray-500 z-10">কনফার্ম পাসওয়ার্ড</label>
                  <input
                    type={show ? "text" : "password"}
                    value={confirm}
                    onChange={(e) => setConfirm(e.target.value)}
                    placeholder="***********"
                    autoComplete="new-password"
                    className={`input input-bordered w-full h-12 focus:outline-none focus:border-red-400 ${fieldErrors.confirm ? "border-red-400" : ""}`}
                  />
                  {fieldErrors.confirm && <span className="text-red-500 text-xs mt-1 block">{fieldErrors.confirm}</span>}
                </div>

                <button
                  type="submit"
                  disabled={saving}
                  className="btn bg-[#f2504d] hover:bg-[#d43f3c] text-white border-none w-full h-12 font-bold"
                >
                  {saving && <Loader2 size={18} className="animate-spin" />}
                  {saving ? "সংরক্ষণ হচ্ছে..." : "পাসওয়ার্ড পরিবর্তন করুন"}
                </button>
              </form>

              <p className="text-center mt-6 text-sm text-gray-600 font-medium">
                <Link href="/email" className="text-red-500 underline font-bold">
                  নতুন রিসেট লিঙ্ক চান?
                </Link>
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={null}>
      <ResetBody />
    </Suspense>
  );
}
