"use client";

const testimonials = [
  {
    name: "রাহেলা ও করিম",
    date: "জানুয়ারি ২০২৪",
    text: "বিবাহডিলের মাধ্যমে আমাদের পরিচয় হয়েছিল। মাত্র ৩ মাসের মধ্যে আমাদের বিবাহ সম্পন্ন হয়। অসাধারণ প্ল্যাটফর্ম!",
    color: "#fde8e8",
  },
  {
    name: "সাবিনা ও রাফিক",
    date: "মার্চ ২০২৪",
    text: "আমি প্রথমে সন্দিহান ছিলাম, কিন্তু বিবাহডিলের সহজ ইন্টারফেস এবং যাচাইকৃত প্রোফাইল আমাকে আস্থা দিয়েছে। আলহামদুলিল্লাহ!",
    color: "#e8f0fd",
  },
  {
    name: "তানভীর ও মাহফুজা",
    date: "মে ২০২৪",
    text: "প্রিমিয়াম সদস্যপদ নেওয়ার পর মাত্র ২ সপ্তাহে আমার জীবনসঙ্গিনী খুঁজে পেয়েছি। ধন্যবাদ বিবাহডিল!",
    color: "#e8fde8",
  },
];

function Avatar() {
  return (
    <div className="avatar placeholder mb-4">
      <div className="bg-base-300 text-neutral-content rounded-full w-14">
        <span className="text-xs">❤️</span>
      </div>
    </div>
  );
}

export default function Testimonials() {
  return (
    <section className="py-16 bg-base-100">
      <div className="max-w-7xl mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-10">
          <div className="divider"></div>
          <p className="text-sm text-primary font-semibold">সাফল্যের গল্প</p>
          <h2 className="text-2xl font-bold mt-1">বিবাহিত দম্পতিদের কথা</h2>
          <p className="text-sm opacity-70 mt-1">
            আমাদের সফল সদস্যদের অভিজ্ঞতা
          </p>
        </div>

        {/* Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {testimonials.map((t, i) => (
            <div
              key={i}
              className="card shadow hover:shadow-lg transition-all"
              style={{ backgroundColor: t.color }}
            >
              <div className="card-body">
                <Avatar />

                <h3 className="font-bold text-sm">{t.name}</h3>

                <p className="text-xs text-primary">{t.date}</p>

                <p className="text-sm opacity-80 mt-2 leading-relaxed">
                  "{t.text}"
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="text-center mt-8">
          <button className="btn btn-outline">আরো গল্প পড়ুন</button>
        </div>
      </div>
    </section>
  );
}
