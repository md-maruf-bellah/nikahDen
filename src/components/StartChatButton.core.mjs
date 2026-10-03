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

// কারণ-লেবেলের সত্যের উৎস একটাই: shared/guardReasons.mjs (backend-এর কোড-সেটের সাথে
// দুই-দিকের সম্পূর্ণতা tests/guard-reasons.core.test.mjs-এ যাচাই হয়)। এখানে শুধু রি-এক্সপোর্ট।
import {
  REASON_LABELS,
  DISABLED_FALLBACK_TITLE,
} from "../../shared/guardReasons.mjs";

/** reason/blocked → { iconKey, text } — canMessage:false হলেই কার্যকর */
export { REASON_LABELS, DISABLED_FALLBACK_TITLE };

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
