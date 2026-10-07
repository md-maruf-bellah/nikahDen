import Link from "next/link";

/** রুট-লেভেল ৪০৪ — unmatched URL বা notFound() কলে এই UI দেখায় (root layout-এর ভেতরে) */
export default function NotFound() {
  return (
    <main className="min-h-[60vh] flex flex-col items-center justify-center px-4 py-16 text-center">
      <p className="text-7xl font-extrabold text-[#FD6969]">৪০৪</p>
      <h1 className="mt-4 text-2xl font-bold md:text-3xl">
        পেজটি খুঁজে পাওয়া যায়নি
      </h1>
      <p className="mt-3 max-w-md text-gray-500">
        ঠিকানাটি সম্ভবত ভুল, অথবা পেজটি সরিয়ে ফেলা হয়েছে। নিচের যেকোনো
        বোতাম থেকে আবার শুরু করুন।
      </p>
      <div className="mt-6 flex flex-wrap justify-center gap-3">
        <Link
          href="/"
          className="btn bg-[#FD6969] hover:bg-[#e85a5a] border-none text-white"
        >
          হোমে ফিরে যান
        </Link>
        <Link
          href="/list"
          className="btn btn-outline border-[#FD6969] text-[#FD6969] hover:bg-[#FD6969] hover:border-[#FD6969] hover:text-white"
        >
          বায়োডাটা দেখুন
        </Link>
      </div>
    </main>
  );
}
