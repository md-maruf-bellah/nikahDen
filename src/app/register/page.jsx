"use client";
import React, { useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { FcGoogle } from "react-icons/fc";
import { FaFacebook } from "react-icons/fa";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import logo from "./../../../assets/navbar/logo.png";
import contact from "./../../../assets/contact/img.png";
import { authApi, tokenStore } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";

const Register = () => {
  const router = useRouter();
  const { refreshUser } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [agreed, setAgreed] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [oauthAvailable, setOauthAvailable] = useState({ google: false, facebook: false });

  // কোন প্রোভাইডার সার্ভারে কনফিগার করা আছে — সেই অনুযায়ী বাটন enable/disable
  React.useEffect(() => {
    authApi
      .oauthProviders()
      .then((p) => setOauthAvailable({ google: Boolean(p?.google), facebook: Boolean(p?.facebook) }))
      .catch(() => {});
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!agreed) {
      setError("আপনাকে অবশ্যই ট্রামস্ এন্ড কন্ডিশনে সম্মত হতে হবে।");
      return;
    }

    setLoading(true);
    try {
      const data = await authApi.register({ firstName, lastName, email, password });
      tokenStore.set(data.accessToken, data.refreshToken);
      await refreshUser();
      router.push("/profile");
    } catch (err) {
      setError(err.message || "রেজিস্ট্রেশন ব্যর্থ হয়েছে। আবার চেষ্টা করুন।");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className=" card max-w-6xl w-full bg-white  shadow overflow-hidden flex flex-col lg:flex-row">
        {/* Left Side - Image with Overlay */}
        <div className="lg:w-1/2 relative min-h-[300px] lg:min-h-full">
          <Image
            src={contact}
            alt="Couple"
            className="absolute inset-0 w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-red-400/40 mix-blend-multiply"></div>
        </div>

        {/* Right Side - Form */}
        <div className="lg:w-1/2 p-8 md:p-12 lg:p-16">
          {/* Logo */}
          <div className="flex items-center gap-2 mb-8">
            <Image src={logo} alt="logo" width={40} height={40} />
            <h1 className="text-3xl font-extrabold tracking-tight">
              নিকাহ্<span className="text-[#FD6969]">দ্বীন</span>
            </h1>
          </div>

          <h2 className="text-2xl font-bold text-gray-800 mb-8">
            একাউন্ট তৈরি করুন
          </h2>

          {error && (
            <div className="alert alert-error text-sm py-2 mb-4 shadow-none">
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Name Fields */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="relative">
                <label className="absolute -top-2 left-3 bg-white px-1 text-xs text-gray-500 z-10">
                  নামের প্রথম অংশ
                </label>
                <input
                  type="text"
                  required
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  placeholder="Mr. XXXXX"
                  className="input input-bordered w-full pt-2 h-12 focus:outline-none focus:border-red-400"
                />
              </div>
              <div className="relative">
                <label className="absolute -top-2 left-3 bg-white px-1 text-xs text-gray-500 z-10">
                  নামের শেষ অংশ
                </label>
                <input
                  type="text"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  placeholder="XXXXX"
                  className="input input-bordered w-full pt-2 h-12 focus:outline-none focus:border-red-400"
                />
              </div>
            </div>

            {/* Email Field */}
            <div className="relative">
              <label className="absolute -top-2 left-3 bg-white px-1 text-xs text-gray-500 z-10">
                ই-মেইল
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="xxx@example.com"
                className="input input-bordered w-full pt-2 h-12 focus:outline-none focus:border-red-400"
              />
            </div>

            {/* Password Field */}
            <div className="relative">
              <label className="absolute -top-2 left-3 bg-white px-1 text-xs text-gray-500 z-10">
                পাসওয়ার্ড
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  minLength={8}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="কমপক্ষে ৮ অক্ষর"
                  className="input input-bordered w-full pt-2 h-12 focus:outline-none focus:border-red-400"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>

            {/* Terms and Conditions */}
            <div className="flex items-start gap-2 py-2">
              <input
                type="checkbox"
                className="checkbox checkbox-sm checkbox-error mt-1"
                id="terms"
                checked={agreed}
                onChange={(e) => setAgreed(e.target.checked)}
              />
              <label
                htmlFor="terms"
                className="text-sm text-gray-600 cursor-pointer"
              >
                আমি আপনাদের সকল{" "}
                <Link href="/terms" className="text-red-500 underline hover:text-[#e85a5a]">
                  শর্তাবলী
                </Link>,{" "}
                <Link href="/privacy" className="text-red-500 underline hover:text-[#e85a5a]">
                  প্রাইভেসি পলিসি
                </Link>{" "}
                ও{" "}
                <Link href="/refund" className="text-red-500 underline hover:text-[#e85a5a]">
                  রিফান্ড পলিসি
                </Link>{" "}
                পড়েছি এবং সম্মত।
              </label>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="btn w-full bg-[#FD6969] hover:bg-[#e85a5a] text-white border-none h-12 text-lg font-bold disabled:opacity-60"
            >
              {loading ? (
                <span className="loading loading-spinner loading-sm"></span>
              ) : (
                "কন্টিনিউ করুন"
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="divider text-gray-400 text-sm my-8">or</div>

          {/* Social Logins */}
          <div className="space-y-4">
            <button
              type="button"
              disabled={!oauthAvailable.google}
              title={oauthAvailable.google ? "গুগল দিয়ে সাইন আপ" : "গুগল লগইন এখনো কনফিগার করা হয়নি"}
              onClick={() => { window.location.href = authApi.oauthStartUrl("google"); }}
              className="btn w-full bg-white border-gray-200 hover:bg-gray-50 text-gray-700 h-12  flex items-center justify-center gap-2 normal-case font-semibold disabled:opacity-50"
            >
              <FcGoogle size={22} />
              Sign up with Google
            </button>
            <button
              type="button"
              disabled={!oauthAvailable.facebook}
              title={oauthAvailable.facebook ? "ফেসবুক দিয়ে সাইন আপ" : "ফেসবুক লগইন এখনো কনফিগার করা হয়নি"}
              onClick={() => { window.location.href = authApi.oauthStartUrl("facebook"); }}
              className="btn w-full bg-[#1A77F2] hover:bg-[#166fe5] border-none text-white h-12  flex items-center justify-center gap-2 normal-case font-semibold disabled:opacity-50"
            >
              <FaFacebook size={22} />
              Sign up with Facebook
            </button>
          </div>

          {/* Footer Link */}
          <p className="text-center mt-8 text-sm text-gray-600 font-medium">
            আমার একাউন্ট রয়েছে{" "}
            <Link href="/login" className="text-red-500 underline font-bold">
              লগইন করুন
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Register;
