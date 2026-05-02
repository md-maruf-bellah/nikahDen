"use client";
import React, { useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { FcGoogle } from "react-icons/fc";
import { FaFacebook } from "react-icons/fa";
import Image from "next/image";
import Link from "next/link";
import logo from "./../../../assets/navbar/logo.png";
import contact from "./../../../assets/contact/img.png";

const Register = () => {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="max-w-6xl w-full bg-white rounded-lg shadow overflow-hidden flex flex-col lg:flex-row">
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

          <form className="space-y-5">
            {/* Name Fields */}

            {/* Email Field */}
            <div className="relative">
              <label className="absolute -top-2 left-3 bg-white px-1 text-xs text-gray-500 z-10">
                ই-মেইল
              </label>
              <input
                type="email"
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
                  placeholder="***********"
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
              />
              <label
                htmlFor="terms"
                className="text-sm text-gray-600 cursor-pointer"
              >
                আমি আপনাদের সকল{" "}
                <span className="text-red-500 underline">
                  ট্রামস্ এন্ড কন্ডিশন
                </span>{" "}
                এর সাথে সহমত পোষন করতেছি।
              </label>
            </div>

            {/* Submit Button */}
            <button className="btn w-full bg-[#FD6969] hover:bg-[#e85a5a] text-white border-none h-12 text-lg font-bold rounded-xl">
              কন্টিনিউ করুন
            </button>
          </form>

          {/* Divider */}
          <div className="divider text-gray-400 text-sm my-8">or</div>

          {/* Social Logins */}
          <div className="space-y-4">
            <button className="btn w-full bg-white border-gray-200 hover:bg-gray-50 text-gray-700 h-12 rounded-xl flex items-center justify-center gap-2 normal-case font-semibold">
              <FcGoogle size={22} />
              Sign up with Google
            </button>
            <button className="btn w-full bg-[#1A77F2] hover:bg-[#166fe5] border-none text-white h-12 rounded-xl flex items-center justify-center gap-2 normal-case font-semibold">
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
