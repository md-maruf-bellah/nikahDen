// "use client";

// const testimonials = [
//   {
//     name: "রাহেলা ও করিম",
//     date: "জানুয়ারি ২০২৪",
//     text: "বিবাহডিলের মাধ্যমে আমাদের পরিচয় হয়েছিল। মাত্র ৩ মাসের মধ্যে আমাদের বিবাহ সম্পন্ন হয়। অসাধারণ প্ল্যাটফর্ম!",
//     color: "#fde8e8",
//   },
//   {
//     name: "সাবিনা ও রাফিক",
//     date: "মার্চ ২০২৪",
//     text: "আমি প্রথমে সন্দিহান ছিলাম, কিন্তু বিবাহডিলের সহজ ইন্টারফেস এবং যাচাইকৃত প্রোফাইল আমাকে আস্থা দিয়েছে। আলহামদুলিল্লাহ!",
//     color: "#e8f0fd",
//   },
//   {
//     name: "তানভীর ও মাহফুজা",
//     date: "মে ২০২৪",
//     text: "প্রিমিয়াম সদস্যপদ নেওয়ার পর মাত্র ২ সপ্তাহে আমার জীবনসঙ্গিনী খুঁজে পেয়েছি। ধন্যবাদ বিবাহডিল!",
//     color: "#e8fde8",
//   },
// ];

// function Avatar() {
//   return (
//     <div className="avatar placeholder mb-4">
//       <div className="bg-base-300 text-neutral-content rounded-full w-14">
//         <span className="text-xs">❤️</span>
//       </div>
//     </div>
//   );
// }

// export default function Testimonials() {
//   return (
//     <section className="py-16 bg-base-100">
//       <div className="max-w-7xl mx-auto px-4">
//         {/* Header */}
//         <div className="text-center mb-10">
//           <div className="divider"></div>
//           <p className="text-sm text-[#fd6969] font-semibold">সাফল্যের গল্প</p>
//           <h2 className="text-2xl font-bold mt-1">বিবাহিত দম্পতিদের কথা</h2>
//           <p className="text-sm opacity-70 mt-1">
//             আমাদের সফল সদস্যদের অভিজ্ঞতা
//           </p>
//         </div>

//         {/* Cards */}
//         <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
//           {testimonials.map((t, i) => (
//             <div
//               key={i}
//               className="card shadow hover:shadow-lg transition-all"
//               style={{ backgroundColor: t.color }}
//             >
//               <div className="card-body">
//                 <Avatar />

//                 <h3 className="font-bold text-sm">{t.name}</h3>

//                 <p className="text-xs text-[#fd6969]">{t.date}</p>

//                 <p className="text-sm opacity-80 mt-2 leading-relaxed">
//                   "{t.text}"
//                 </p>
//               </div>
//             </div>
//           ))}
//         </div>

//         {/* Footer */}
//         <div className="text-center mt-8">
//           <button className="btn btn-outline">আরো গল্প পড়ুন</button>
//         </div>
//       </div>
//     </section>
//   );
// }

"use client";

import Image from "next/image";
import { ChevronLeft, ChevronRight } from "lucide-react";

export default function TestimonialSection() {
  return (
    <div className="w-full  py-32 px-4 lg:px-22">
      <div className="max-w-6xl mx-auto">
        {/* Heading */}
        <div className="text-center mb-12">
          <p className="text-[#f45f5f] font-medium mb-2">রিভিউ</p>

          <h2 className="text-3xl md:text-4xl font-bold text-gray-700">
            বিবাহিত দম্পতিদের কথা
          </h2>

          <div className="flex justify-center items-center gap-3 mt-4">
            <span className="w-6 h-2 bg-[#f45f5f] rounded-full"></span>
            <span className="w-16 h-2 bg-[#f45f5f] rounded-full"></span>
          </div>
        </div>

        {/* Content */}
        <div className="grid md:grid-cols-2 gap-10 items-center">
          {/* Image Section */}
          <div className="relative w-full max-w-md mx-auto">
            {/* Border Frame */}
            <div className="absolute -top-4 -left-4 w-full h-full border-l-10 border-t-10 border-[#f45f5f] z-0"></div>

            {/* Image */}
            <div className="relative w-full h-[320px] z-10">
              <Image
                src="https://images.unsplash.com/photo-1529636798458-92182e662485"
                alt="couple"
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, 400px"
                priority
              />
            </div>
          </div>

          {/* Text Section */}
          <div className="text-gray-600 space-y-6">
            <p className="text-lg leading-relaxed">
              আমাদের ফেসবুক পেইজের মাধ্যমে গ্রাহক আমাদের সাথে সরাসরি যোগাযোগ
              করতে পারবেন। যেকোনো ধরনের সমস্যা অথবা যেকোনো ধরনের প্রশ্নের উত্তর
              আমরা দিয়ে থাকি। আমাদের ফেসবুক পেইজের মাধ্যমে গ্রাহক আমাদের সাথে
              সরাসরি যোগাযোগ করতে পারবেন। যেকোনো ধরনের সমস্যা অথবা যেকোনো ধরনের
              প্রশ্নের উত্তর আমরা দিয়ে থাকি।
            </p>

            {/* Controls */}
            <div className="flex justify-between">
              <div className="flex items-center gap-4 mt-6">
                <button className="btn btn-sm bg-white border border-gray-400 text-gray-700 hover:bg-gray-100">
                  <ChevronLeft size={18} />
                </button>
                <button className="btn btn-sm bg-white border border-gray-400 text-gray-700 hover:bg-gray-100">
                  <ChevronRight size={18} />
                </button>
              </div>

              {/* Name */}
              <div className="flex items-center gap-4 mt-6">
                <span className="w-16 h-[2px] bg-black"></span>

                <div>
                  <p className="font-bold text-gray-800 text-2xl">
                    মিস্টার এন্ড মিসেস
                  </p>
                  <p className="text-gray-600">সরকার</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
