"use client";
import { Suspense, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { Loader2, CircleCheck, AlertCircle } from "lucide-react";
import logo from "./../../../../assets/navbar/logo.png";
import contact from "./../../../../assets/contact/img.png";
import { authApi, tokenStore } from "@/lib/api";

function CallbackBody() {
  const params = useSearchParams();
  const router = useRouter();
  const code = params.get("code");
  const error = params.get("error");
  const [err, setErr] = useState(error || "");
  const [done, setDone] = useState(false);
  const ranRef = useRef(false);

  useEffect(() => {
    if (ranRef.current) return;
    ranRef.current = true;
    if (error || !code) return;

    (async () => {
      try {
        const session = await authApi.oauthExchange(code);
        tokenStore.set(session.accessToken, session.refreshToken);
        // ইউজার কনটেক্সট রিফ্রেশ করতে পেজ-রিলোড — role-based রাউটিং সহ পরিচ্ছন্ন অবস্থা
        setDone(true);
        const role = session.user?.role;
        setTimeout(() => {
          window.location.href = role === "USER" || !role ? "/profile" : "/dashboard";
        }, 600);
      } catch (ex) {
        setErr(ex.message || "লগইন সম্পন্ন করা যায়নি। আবার চেষ্টা করুন।");
      }
    })();
  }, [code, error]);

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

          {err ? (
            <div className="space-y-4">
              <div className="alert alert-error text-sm">
                <AlertCircle size={16} /> <span>{err}</span>
              </div>
              <Link href="/login" className="btn bg-[#f2504d] text-white border-none w-full h-12">
                লগইনে ফিরে যান
              </Link>
            </div>
          ) : done ? (
            <div className="space-y-4 text-center py-6">
              <CircleCheck size={44} className="text-green-500 mx-auto" />
              <p className="font-bold text-lg">লগইন সফল! ড্যাশবোর্ডে নিয়ে যাচ্ছি...</p>
            </div>
          ) : (
            <div className="space-y-4 text-center py-6">
              <Loader2 size={40} className="animate-spin text-[#fd6969] mx-auto" />
              <p className="text-gray-600 font-medium">লগইন সম্পন্ন হচ্ছে...</p>
              <p className="text-xs text-gray-400">অনুগ্রহ করে পেজটি বন্ধ করবেন না।</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function AuthCallbackPage() {
  return (
    <Suspense fallback={null}>
      <CallbackBody />
    </Suspense>
  );
}
