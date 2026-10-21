// ---------------------------------------------------------------------------
// All DaisyUI Multi-Themes Configuration
// Tiers: 0 = Free, 1 = Silver (Monthly/Bimonthly), 2 = Royal VIP (Quarterly/Semi-Annual & Staff)
// ---------------------------------------------------------------------------
export const THEMES_CONFIG = [
  // =========================================================================
  // --- Tier 0: ফ্রি মোড (Free - Accessible to all visitors & members) ---
  // =========================================================================
  {
    id: "light",
    name: "ডিফল্ট লাইট",
    desc: "স্বচ্ছ ও পরিচ্ছন্ন ডেলাইট সাদা",
    tier: 0,
    tierName: "ফ্রি",
    primaryColor: "bg-red-500",
    baseColor: "bg-white",
  },
  {
    id: "emerald",
    name: "সুন্নাহ গ্রীন",
    desc: "ইসলামিক মার্জিত সুন্নাহ সবুজ",
    tier: 0,
    tierName: "ফ্রি",
    primaryColor: "bg-emerald-600",
    baseColor: "bg-emerald-50",
  },
  {
    id: "corporate",
    name: "ফরমাল কর্পোরেট",
    desc: "প্রাতিষ্ঠানিক ও আধুনিক ব্লু",
    tier: 0,
    tierName: "ফ্রি",
    primaryColor: "bg-blue-600",
    baseColor: "bg-slate-50",
  },
  {
    id: "lofi",
    name: "সাদাসিধা মিনিমাল",
    desc: "মিনিমালিস্ট ও সাদাকালো কন্ট্রাস্ট",
    tier: 0,
    tierName: "ফ্রি",
    primaryColor: "bg-neutral-800",
    baseColor: "bg-gray-100",
  },
  {
    id: "wireframe",
    name: "ব্লুপ্রিন্ট লেআউট",
    desc: "স্ট্রাকচারাল গ্রিড ও সিম্পল ফ্রেম",
    tier: 0,
    tierName: "ফ্রি",
    primaryColor: "bg-neutral-600",
    baseColor: "bg-gray-50",
  },
  {
    id: "business",
    name: "বিজনেস গ্রে",
    desc: "প্রফেশনাল ডার্ক-গ্রে কর্পোরেট লুক",
    tier: 0,
    tierName: "ফ্রি",
    primaryColor: "bg-sky-600",
    baseColor: "bg-neutral-800",
  },

  // =========================================================================
  // --- Tier 1: সিলভার প্যাকেজ (Silver - Monthly & Bimonthly Package) ---
  // =========================================================================
  {
    id: "dark",
    name: "এলিগ্যান্ট ডার্ক",
    desc: "চোখের প্রশান্তিকর নাইট মোড",
    tier: 1,
    tierName: "সিলভার",
    primaryColor: "bg-red-500",
    baseColor: "bg-neutral-900",
  },
  {
    id: "cupcake",
    name: "সুইট কাপকেক",
    desc: "কোমল ও চমৎকার গোলাপি আভা",
    tier: 1,
    tierName: "সিলভার",
    primaryColor: "bg-pink-400",
    baseColor: "bg-amber-50",
  },
  {
    id: "bumblebee",
    name: "বাম্বলবি গোল্ড",
    desc: "উজ্জ্বল রৌদ্রোজ্জ্বল হলুদ ও ব্ল্যাক",
    tier: 1,
    tierName: "সিলভার",
    primaryColor: "bg-yellow-400",
    baseColor: "bg-white",
  },
  {
    id: "winter",
    name: "উইন্টার ফ্রেশ",
    desc: "শীতল নীল ও স্নিগ্ধ তুষার শুভ্র",
    tier: 1,
    tierName: "সিলভার",
    primaryColor: "bg-sky-500",
    baseColor: "bg-sky-50",
  },
  {
    id: "pastel",
    name: "সফট প্যাস্টেল",
    desc: "নরম মিষ্টি হালকা রেইনবো রং",
    tier: 1,
    tierName: "সিলভার",
    primaryColor: "bg-pink-300",
    baseColor: "bg-purple-50",
  },
  {
    id: "autumn",
    name: "উষ্ণ অটাম",
    desc: "শরতের মিষ্টি সোনালি পাতা",
    tier: 1,
    tierName: "সিলভার",
    primaryColor: "bg-amber-600",
    baseColor: "bg-amber-50",
  },
  {
    id: "garden",
    name: "প্রকৃতি গার্ডেন",
    desc: "সতেজ বাগান ও পাতার মিষ্টি সবুজ",
    tier: 1,
    tierName: "সিলভার",
    primaryColor: "bg-emerald-500",
    baseColor: "bg-green-50",
  },
  {
    id: "aqua",
    name: "সি অ্যাকুয়া",
    desc: "সমুদ্রের নীল জল ও প্রশান্তি",
    tier: 1,
    tierName: "সিলভার",
    primaryColor: "bg-cyan-500",
    baseColor: "bg-cyan-50",
  },
  {
    id: "nord",
    name: "নর্ডিক স্নো",
    desc: "স্ক্যান্ডিনেভিয়ান এলিগ্যান্স ও স্লেট",
    tier: 1,
    tierName: "সিলভার",
    primaryColor: "bg-slate-600",
    baseColor: "bg-slate-100",
  },
  {
    id: "cmyk",
    name: "সিএমওয়াইকে ভাইব্রেন্ট",
    desc: "উজ্জ্বল ও আধুনিক রঙের মেলবন্ধন",
    tier: 1,
    tierName: "সিলভার",
    primaryColor: "bg-blue-500",
    baseColor: "bg-white",
  },
  {
    id: "lemonade",
    name: "ফ্রেশ লেমনেড",
    desc: "সতেজ রৌদ্রোজ্জ্বল লেবুর হলুদ",
    tier: 1,
    tierName: "সিলভার",
    primaryColor: "bg-yellow-500",
    baseColor: "bg-yellow-50",
  },
  {
    id: "acid",
    name: "অ্যাসিড নিওন",
    desc: "উজ্জ্বল নিওন লাইম ও আধুনিক বোল্ড",
    tier: 1,
    tierName: "সিলভার",
    primaryColor: "bg-lime-400",
    baseColor: "bg-neutral-900",
  },
  {
    id: "caramellatte",
    name: "ক্যারামেল লাতে",
    desc: "মিষ্টি ক্যারামেল ও ক্রিমি উষ্ণতা",
    tier: 1,
    tierName: "সিলভার",
    primaryColor: "bg-amber-500",
    baseColor: "bg-orange-50",
  },
  {
    id: "silk",
    name: "সিল্ক শাইন",
    desc: "মসৃণ সিল্ক ও শ্যাম্পেন হোয়াইট",
    tier: 1,
    tierName: "সিলভার",
    primaryColor: "bg-blue-400",
    baseColor: "bg-stone-50",
  },

  // =========================================================================
  // --- Tier 2: রয়্যাল ভিআইপি (Royal VIP - Quarterly & Semi-Annual & Staff) ---
  // =========================================================================
  {
    id: "luxury",
    name: "রয়্যাল লাক্সারি",
    desc: "রাজকীয় সোনা ও গাঢ় কালো",
    tier: 2,
    tierName: "রয়্যাল ভিআইপি",
    primaryColor: "bg-amber-400",
    baseColor: "bg-neutral-950",
  },
  {
    id: "valentine",
    name: "ম্যাট্রিমনি স্পেশাল",
    desc: "বিয়ে ও রোমান্সের লাল গোলাপ",
    tier: 2,
    tierName: "রয়্যাল ভিআইপি",
    primaryColor: "bg-rose-500",
    baseColor: "bg-rose-50",
  },
  {
    id: "sunset",
    name: "গোল্ডেন সানসেট",
    desc: "গোধূলির উষ্ণ রক্তিম ও সোনালি আভা",
    tier: 2,
    tierName: "রয়্যাল ভিআইপি",
    primaryColor: "bg-orange-500",
    baseColor: "bg-neutral-900",
  },
  {
    id: "night",
    name: "ডিপ মিডনাইট",
    desc: "গাঢ় নীল রত্ন ও রাতের তারার আলো",
    tier: 2,
    tierName: "রয়্যাল ভিআইপি",
    primaryColor: "bg-indigo-500",
    baseColor: "bg-slate-900",
  },
  {
    id: "dracula",
    name: "ভেলভেট ড্রাকুলা",
    desc: "অভিজাত ডার্ক ভেলভেট পার্পল",
    tier: 2,
    tierName: "রয়্যাল ভিআইপি",
    primaryColor: "bg-purple-500",
    baseColor: "bg-slate-950",
  },
  {
    id: "synthwave",
    name: "নিওন সাইবার",
    desc: "গ্লোয়িং নিওন পিংক ও ভায়োলেট",
    tier: 2,
    tierName: "রয়্যাল ভিআইপি",
    primaryColor: "bg-fuchsia-500",
    baseColor: "bg-purple-950",
  },
  {
    id: "retro",
    name: "ভিন্টেজ রেট্রো",
    desc: "চিরায়ত ঐতিহ্যের নস্টালজিক আবহ",
    tier: 2,
    tierName: "রয়্যাল ভিআইপি",
    primaryColor: "bg-red-400",
    baseColor: "bg-amber-100",
  },
  {
    id: "coffee",
    name: "এলিগ্যান্ট মোকা",
    desc: "উষ্ণ কফি ও ব্রাউনের আভিজাত্য",
    tier: 2,
    tierName: "রয়্যাল ভিআইপি",
    primaryColor: "bg-amber-700",
    baseColor: "bg-amber-950",
  },
  {
    id: "forest",
    name: "ডিপ ফরেস্ট",
    desc: "গভীর সবুজ ঘন অরণ্যের রূপ",
    tier: 2,
    tierName: "রয়্যাল ভিআইপি",
    primaryColor: "bg-emerald-400",
    baseColor: "bg-green-950",
  },
  {
    id: "dim",
    name: "স্মোকি ডিম লাইট",
    desc: "চোখের জন্য মসৃণ ডার্ক গ্রে",
    tier: 2,
    tierName: "রয়্যাল ভিআইপি",
    primaryColor: "bg-teal-400",
    baseColor: "bg-neutral-900",
  },
  {
    id: "cyberpunk",
    name: "সাইবারপাঙ্ক ২৪",
    desc: "হাই-কন্ট্রাস্ট উজ্জ্বল নিওন সাইবার",
    tier: 2,
    tierName: "রয়্যাল ভিআইপি",
    primaryColor: "bg-yellow-400",
    baseColor: "bg-black",
  },
  {
    id: "halloween",
    name: "হ্যালোউইন ফায়ার",
    desc: "উজ্জ্বল কমলা শিখা ও ডার্ক নাইট",
    tier: 2,
    tierName: "রয়্যাল ভিআইপি",
    primaryColor: "bg-orange-500",
    baseColor: "bg-stone-900",
  },
  {
    id: "fantasy",
    name: "ম্যাজিকাল ফ্যান্টাসি",
    desc: "স্বপ্নিল ভায়োলেট ও গোলাপের মেলবন্ধন",
    tier: 2,
    tierName: "রয়্যাল ভিআইপি",
    primaryColor: "bg-purple-400",
    baseColor: "bg-pink-50",
  },
  {
    id: "black",
    name: "পিওর ব্ল্যাক OLED",
    desc: "বিশুদ্ধ ডিপ ব্ল্যাক ডিসপ্লে মোড",
    tier: 2,
    tierName: "রয়্যাল ভিআইপি",
    primaryColor: "bg-white",
    baseColor: "bg-black",
  },
  {
    id: "abyss",
    name: "অ্যাবিস ডিপ ওশান",
    desc: "মহাসাগরের অতল অন্ধকারের রূপ",
    tier: 2,
    tierName: "রয়্যাল ভিআইপি",
    primaryColor: "bg-cyan-400",
    baseColor: "bg-slate-950",
  },
];

/**
 * Resolves user theme tier level (0 = Free, 1 = Silver, 2 = Royal VIP)
 */
export function resolveUserThemeTier(user, membership) {
  // 1. Staff / Admin always has full access (Level 2)
  if (user?.role && ["ADMIN", "SUPER_ADMIN", "SUPERADMIN", "STAFF", "EDITOR"].includes(user.role)) {
    return {
      level: 2,
      label: "স্টাফ / অ্যাডমিন",
      sub: "সব থিম আনলকড",
      badgeTone: "bg-purple-100 text-purple-700 border-purple-200",
    };
  }

  // 2. Paid Subscription
  const sub = membership?.subscription;
  if (sub && sub.isActive) {
    const slug = (sub.plan?.slug || "").toLowerCase();
    const price = sub.plan?.price || 0;
    if (slug === "quarterly" || slug === "semi-annual" || price >= 1000) {
      return {
        level: 2,
        label: "রয়্যাল ভিআইপি",
        sub: "সব প্রিমিয়াম থিম আনলকড",
        badgeTone: "bg-amber-100 text-amber-800 border-amber-300",
      };
    }
    if (slug === "monthly" || slug === "bimonthly" || price >= 500) {
      return {
        level: 1,
        label: "সিলভার মেম্বার",
        sub: "সিলভার ও ফ্রি থিম আনলকড",
        badgeTone: "bg-sky-100 text-sky-800 border-sky-300",
      };
    }
  }

  // 3. Free default
  return {
    level: 0,
    label: "ফ্রি মোড",
    sub: "প্রিমিয়াম থিম পেতে প্যাকেজ নিন",
    badgeTone: "bg-gray-100 text-gray-700 border-gray-200",
  };
}

/**
 * Checks if a theme is accessible by the user's tier level
 */
export function isThemeUnlocked(themeTier, userLevel) {
  return Number(themeTier) <= Number(userLevel);
}
