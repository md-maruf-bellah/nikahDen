/**
 * StartChatButton কোর — React-মুক্ত, শুধু-লজিক মডিউল।
 *
 * StartChatButton.jsx এটাকে ব্যবহার করে; ইউনিট টেস্টও এটাকেই চালায়
 * (tests/start-chat-button.core.test.mjs, node --test — কোনো DOM/React লাগে না)।
 *
 * দায়িত্ব (কম্পোনেন্টের আচরণ হুবহু):
 *   - guard-প্রিভিউ → {disabled, reason, title} রেজলভ (blocked > reason > fallback)
 *   - আইকন React জগতের বিষয় — এখানে শুধু string iconKey
 *   - নিজের বায়োডাটা/আইডি-হীন কেসে বোতাম লুকানোর সিদ্ধান্ত
 *   - গেস্ট-ক্লিকের লগইন-রিডাইরেক্ট পথ (next= ডাবল-এনকোডসহ)
 */

/** reason/blocked → { iconKey, text } — canMessage:false হলেই কার্যকর */
export const REASON_LABELS = {
  blocked: { iconKey: "ban", text: "মেসেজিং সম্ভব নয়" },
  LIMIT_REACHED: { iconKey: "shield-check", text: "সীমা শেষ — ম্যাচ বা আপগ্রেড" },
  UPGRADE_REQUIRED: { iconKey: "credit-card", text: "প্যাকেজ আপগ্রেড দরকার" },
  NO_PACKAGE: { iconKey: "credit-card", text: "প্যাকেজ আপগ্রেড দরকার" },
};

/** কারণ অজানা/নেই (যেমন PENDING অ্যাকাউন্ট) — তবু নিষ্ক্রিয় বোতামের title এটাই */
export const DISABLED_FALLBACK_TITLE = "মেসেজিং সম্ভব নয়";

export const MESSAGING_TAB = "মেসেজিং";

/**
 * guard-প্রিভিউকে বোতাম-স্টেটে রেজলভ করে।
 * @param {{canMessage?: boolean, blocked?: boolean, reason?: string} | null} preview
 * @returns {{disabled: boolean, reason: {iconKey: string, text: string} | null, title: string | null}}
 *   disabled:false হলে reason ও title null; disabled:true হলে title কখনো null নয় (fallback-সহ)।
 */
export function resolveGuardReason(preview) {
  const disabled = Boolean(preview && preview.canMessage === false);
  if (!disabled) return { disabled: false, reason: null, title: null };

  const key = preview.blocked ? "blocked" : preview.reason;
  const reason = REASON_LABELS[key] || null;
  return { disabled: true, reason, title: reason ? reason.text : DISABLED_FALLBACK_TITLE };
}

/** নিজের বায়োডাটা (বা আইডি-ই নেই) — বোতাম রেন্ডার-ই হবে না */
export function isOwnOrMissing(userId, currentUserId) {
  return !userId || (currentUserId != null && currentUserId === userId);
}

/**
 * চ্যাট-পথ ও গেস্ট-লগইন পথ। next= ভেতরের পথসহ আবার এনকোড হয় (কুয়েরি-ভেতরে-কুয়েরি)।
 * @returns {{chatPath: string, loginPath: string}}
 */
export function buildChatTargets(userId) {
  const chatPath = `/profile?tab=${encodeURIComponent(MESSAGING_TAB)}&chat=${userId}`;
  return { chatPath, loginPath: `/login?next=${encodeURIComponent(chatPath)}` };
}
