/**
 * মেসেজিং-guard কারণ-কোডের **একমাত্র সত্যের উৎস** — backend ও frontend দুই প্যাকেজ
 * এখান থেকেই পড়ে, তাই কোড বা লেবেল বদলাতে হলে এখানেই একবার বদলালেই হবে।
 *
 * দুটি পরিবার (backend যেভাবে ছাড়ে):
 *   ১. **প্রিভিউ-কারণ** — `GET /users/search-intent`-এর row-এর `reason` ফিল্ড
 *      (backend: `previewMessagingIntent`, user.service.js) + `blocked` ফ্ল্যাগ।
 *   ২. **পাঠানোর-সময় errorCode** — `assertMessagingPermission` ও block-চৌকাঠের
 *      `ApiError.errorCode` (backend: messagingGuard.service.js, block.service.js)।
 *
 * Frontend ভিউ (তিনটাই এখান থেকেই তৈরি):
 *   - `REASON_LABELS` — বায়োডাটা-কার্ডের StartChatButton (iconKey + টেক্সট)
 *   - `MEMBER_ROW_LABELS` — মেসেঞ্জার সার্চ-রো (শুধু টেক্সট)
 *   - `GUARD_NOTICES` — সার্ভার-এররে ইনলাইন নোটিস (upgrade-লিংকসহ, নীরব হলে null)
 *
 * সম্পূর্ণতার ক্রস-চেক (দুই-দিকে) `tests/guard-reasons.core.test.mjs`-এ — CI-তে
 * backend-এর নতুন কোড label-ছাড়া ঢুকলে বা frontend-এর লেবেল কোড ছেড়ে গেলে টেস্ট পড়ে যায়।
 *
 * খোঁজা-কোড নীতি: backend যে `reason: null` পাঠায় (নিজেকে নিজে, টার্গেট ACTIVE নয় —
 * যেমন PENDING/INACTIVE অ্যাকাউন্ট, মাঝে-মাঝে ডিলিট) এবং ভবিষ্যতের অজানা কোড
 * (যেমন কোথাও "PENDING") — সবই `DISABLED_FALLBACK_TITLE` দেখায়; কোড টুকরো হয় না।
 */

// ------------------------------------------------------------------
// পরিবার ১ — প্রিভিউ-কারণ (search-intent-এর reason ফিল্ড)
// ------------------------------------------------------------------
export const PREVIEW_REASONS = Object.freeze({
  LIMIT_REACHED: "LIMIT_REACHED",
  UPGRADE_REQUIRED: "UPGRADE_REQUIRED",
  NO_PACKAGE: "NO_PACKAGE",
});

/** blocked:true ফ্ল্যাগ (reason null — নীরব দেয়াল, কারণ ফাঁস হয় না) */
export const BLOCKED_KEY = "blocked";

// ------------------------------------------------------------------
// পরিবার ২ — পাঠানোর-সময় errorCode (ApiError-এর errorCode)
// ------------------------------------------------------------------
export const GUARD_ERROR_CODES = Object.freeze({
  MESSAGING_LIMIT_REACHED: "MESSAGING_LIMIT_REACHED",
  MESSAGING_UPGRADE_REQUIRED: "MESSAGING_UPGRADE_REQUIRED",
  NO_MESSAGING_PACKAGE: "NO_MESSAGING_PACKAGE",
  BLOCKED: "BLOCKED",
});

/** অজানা/খালি কারণে নিষ্ক্রিয় বোতাম-টাইটেল — reason:null বা অজানা কোডে (যেমন PENDING) */
export const DISABLED_FALLBACK_TITLE = "মেসেজিং সম্ভব নয়";

// ------------------------------------------------------------------
// একটাই টেবিল — এক কারণের তিন ভিউ (প্রিভিউ-কী ↔ errorCode ↔ UI)
// ------------------------------------------------------------------
export const GUARD_STATES = Object.freeze([
  {
    preview: PREVIEW_REASONS.LIMIT_REACHED,
    error: GUARD_ERROR_CODES.MESSAGING_LIMIT_REACHED,
    button: { iconKey: "shield-check", text: "সীমা শেষ — ম্যাচ বা আপগ্রেড" },
    row: "সীমা শেষ — আপগ্রেড বা ম্যাচ",
    notice: {
      upgrade: true,
      text: "ম্যাচ ছাড়া এই সদস্যকে পাঠানোর সীমা শেষ। দুজনে একে অপরকে পছন্দ (ম্যাচ) করলে সীমাহীন — অথবা আপগ্রেড করুন।",
    },
  },
  {
    preview: PREVIEW_REASONS.UPGRADE_REQUIRED,
    error: GUARD_ERROR_CODES.MESSAGING_UPGRADE_REQUIRED,
    button: { iconKey: "credit-card", text: "প্যাকেজ আপগ্রেড দরকার" },
    row: "প্যাকেজ আপগ্রেড দরকার",
    notice: {
      upgrade: true,
      text: "আপনার বর্তমান প্যাকেজে ম্যাচ ছাড়া মেসেজ পাঠানো যায় না। আপগ্রেড করলে নতুন সদস্যদের সাথে কথা বলতে পারবেন।",
    },
  },
  {
    preview: PREVIEW_REASONS.NO_PACKAGE,
    error: GUARD_ERROR_CODES.NO_MESSAGING_PACKAGE,
    button: { iconKey: "credit-card", text: "প্যাকেজ আপগ্রেড দরকার" },
    row: "প্যাকেজ আপগ্রেড দরকার",
    notice: {
      upgrade: true,
      text: "আপনার প্যাকেজে মেসেজিং সীমিত। ম্যাচ ছাড়া কথা বলতে উন্নত প্যাকেজ দরকার।",
    },
  },
  {
    preview: BLOCKED_KEY,
    error: GUARD_ERROR_CODES.BLOCKED,
    button: { iconKey: "ban", text: "মেসেজিং সম্ভব নয়" },
    row: "মেসেজিং সম্ভব নয়",
    // নীরব দেয়াল — কোনো কিউরেটেড নোটিস নয়; guardNoticeFor সার্ভার-মেসেজ/নীরব ফলায় যায়
    notice: null,
  },
]);

/** preview-কী → { iconKey, text } (StartChatButton) */
export const REASON_LABELS = Object.freeze(
  Object.fromEntries(GUARD_STATES.map((s) => [s.preview, s.button]))
);

/** preview-কী → সদস্য-রো টেক্সট (মেসেঞ্জার সার্চ) */
export const MEMBER_ROW_LABELS = Object.freeze(
  Object.fromEntries(GUARD_STATES.map((s) => [s.preview, s.row]))
);

/** errorCode → ইনলাইন নোটিস বা null (null = কোডটি সচেতনভাবে নীরব, যেমন BLOCKED) */
export const GUARD_NOTICES = Object.freeze(
  Object.fromEntries(GUARD_STATES.map((s) => [s.error, s.notice]))
);

/** প্রিভিউ-কী → সমতুল্য errorCode (২ পরিবারের ১:১ সেতু) */
export const PREVIEW_TO_ERROR = Object.freeze(
  Object.fromEntries(GUARD_STATES.map((s) => [s.preview, s.error]))
);
