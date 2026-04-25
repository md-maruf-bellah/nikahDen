"use client";

export default function HeroSection() {
  return (
    <section className="bg-base-100 py-16 px-4">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center gap-10">
        {/* TEXT SECTION */}
        <div className="flex-1">
          <p className="text-primary font-semibold text-sm mb-2">
            বিশ্বস্ত পরিষেবা
          </p>

          <h1 className="text-4xl md:text-5xl font-extrabold leading-tight mb-4">
            মুসলিম <span className="text-primary">পাত্র-পাত্রী</span>
            <br />
            খুঁজুন <span className="text-primary">এখন খুবই সহজে</span>
          </h1>

          <p className="text-base-content/70 text-sm leading-relaxed mb-6 max-w-md">
            বাংলাদেশের সবচেয়ে বিশ্বস্ত মুসলিম ম্যাট্রিমনি প্ল্যাটফর্মে আপনাকে
            স্বাগতম। লক্ষাধিক সফল বিবাহের অভিজ্ঞতায় আমরা আপনার পাশে আছি।
          </p>

          <div className="flex gap-3 flex-wrap">
            <button className="btn btn-primary">পাত্রী খুঁজুন</button>

            <button className="btn btn-outline btn-primary">
              পাত্র খুঁজুন
            </button>
          </div>
        </div>

        {/* IMAGE SECTION */}
        <div className="flex-1 flex justify-center">
          <div className="relative w-72 h-72 md:w-96 md:h-96">
            <svg viewBox="0 0 400 400" className="w-full h-full">
              {/* Background circle */}
              <circle cx="200" cy="200" r="190" className="fill-primary/10" />

              {/* Decorative dots */}
              <circle cx="300" cy="80" r="20" className="fill-primary/60" />
              <circle cx="320" cy="100" r="14" className="fill-primary/40" />
              <circle cx="280" cy="95" r="10" className="fill-primary/50" />

              {/* Male */}
              <circle cx="155" cy="120" r="35" className="fill-base-300" />
              <rect
                x="120"
                y="155"
                width="70"
                height="110"
                rx="8"
                className="fill-primary"
              />
              <rect
                x="118"
                y="160"
                width="20"
                height="80"
                rx="6"
                className="fill-primary-focus"
              />
              <rect
                x="182"
                y="160"
                width="20"
                height="80"
                rx="6"
                className="fill-primary-focus"
              />

              {/* Female */}
              <circle cx="255" cy="115" r="32" className="fill-base-300" />
              <ellipse
                cx="255"
                cy="105"
                rx="40"
                ry="35"
                className="fill-secondary"
              />
              <ellipse
                cx="255"
                cy="130"
                rx="44"
                ry="20"
                className="fill-secondary"
              />
              <rect
                x="220"
                y="147"
                width="70"
                height="115"
                rx="8"
                className="fill-secondary/60"
              />

              {/* Extra decor */}
              <circle cx="100" cy="300" r="18" className="fill-primary/50" />
              <circle cx="80" cy="320" r="12" className="fill-primary/30" />
            </svg>
          </div>
        </div>
      </div>

      {/* STATS */}
      <div className="max-w-7xl mx-auto mt-10 grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { num: "৯২৫", label: "মোট সদস্য" },
          { num: "২৬", label: "সফল বিবাহ" },
          { num: "০২", label: "বছরের অভিজ্ঞতা" },
          { num: "৫০", label: "দৈনিক নতুন প্রোফাইল" },
        ].map((stat, i) => (
          <div
            key={i}
            className="card bg-primary text-primary-content shadow-md"
          >
            <div className="card-body p-4 text-center">
              <div className="text-3xl font-extrabold">{stat.num}</div>
              <div className="text-sm opacity-90">{stat.label}</div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
