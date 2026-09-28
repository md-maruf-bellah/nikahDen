"use client";
import { useState } from "react";
import { Mail, Loader2, CircleCheck, AlertCircle } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import logo from "./../../../assets/navbar/logo.png";
import contact from "./../../../assets/contact/img.png";
import { authApi } from "@/lib/api";

// পাসওয়ার্ড ভুলে গেছেন — ইমেইল দিলে রিসেট লিঙ্ক যাবে (৩০ মিনিট মেয়াদি)।
const ForgotPassword = () => {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [sent, setSent] = useState(false);
  const [sending, setSending] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setError("সঠিক ই-মেইল লিখুন।");
      return;
    }
    setSending(true);
    try {
      await authApi.forgotPassword(email.trim());
      setSent(true); // অ্যাকাউন্ট থাকুক বা না থাকুক একই নিরপেক্ষ বার্তা (enumeration-প্রতিরোধ)
    } catch (ex) {
      setError(ex.message || "অনুরোধ পাঠানো যায়নি। আবার চেষ্টা করুন।");
    } finally {
      setSending(false);
    }
  };

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

          {sent ? (
            <div className="space-y-5">
              <div className="alert alert-success text-sm">
                <CircleCheck size={16} />
                <span>ইমেইল পাঠানো হয়েছে — ইনবক্সে রিসেট লিঙ্ক দেখুন (৩০ মিনিটের মেয়াদ)। যদি না পান, স্প্যাম ফোল্ডারও দেখে নিন।</span>
              </div>
              <Link href="/login" className="btn bg-[#f2504d] text-white border-none w-full h-12">
                লগইনে ফিরে যান
              </Link>
              <button
                type="button"
                onClick={() => { setSent(false); setEmail(""); }}
                className="btn btn-ghost w-full text-gray-500"
              >
                অন্য ইমেইল দিয়ে আবার চেষ্টা করুন
              </button>
            </div>
          ) : (
            <>
              <h2 className="text-2xl font-bold text-gray-800 mb-2">পাসওয়ার্ড ভুলে গেছেন?</h2>
              <p className="text-sm text-gray-500 mb-6">আপনার অ্যাকাউন্টের ই-মেইল লিখুন — রিসেট লিঙ্ক পাঠানো হবে।</p>

              {error && (
                <div className="alert alert-error text-sm mb-4 py-2">
                  <AlertCircle size={15} /> <span>{error}</span>
                </div>
              )}

              <form onSubmit={submit} className="space-y-5" noValidate>
                <div className="relative">
                  <label className="absolute -top-2 left-3 bg-white px-1 text-xs text-gray-500 z-10">ই-মেইল</label>
                  <div className="relative">
                    <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-300" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="xxx@example.com"
                      autoComplete="email"
                      className="input input-bordered w-full pl-10 h-12 focus:outline-none focus:border-red-400"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={sending}
                  className="btn bg-[#f2504d] hover:bg-[#d43f3c] text-white border-none w-full h-12 font-bold"
                >
                  {sending ? <Loader2 size={18} className="animate-spin" /> : <Mail size={16} />}
                  {sending ? "পাঠানো হচ্ছে..." : "রিসেট লিঙ্ক পাঠান"}
                </button>
              </form>

              <p className="text-center mt-6 text-sm text-gray-600 font-medium">
                মনে পড়েছে?{" "}
                <Link href="/login" className="text-red-500 underline font-bold">
                  লগইন করুন
                </Link>
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
