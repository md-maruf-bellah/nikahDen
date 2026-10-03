/**
 * Messenger কোর — React-মুক্ত, শুধু-লজিক মডিউল।
 *
 * src/app/profile/message/MessagingPage.jsx এটাকে ব্যবহার করে; ইউনিট টেস্টও
 * এটাকেই চালায় (tests/messenger.core.test.mjs, node --test — কোনো DOM/React লাগে না)।
 *
 * দায়িত্ব (পেজের আচরণ হুবহু):
 *   - guard errorCode → বাংলা ইনলাইন-নোটিস (আপগ্রেড-লিংকসহ বা নীরব)
 *   - সার্চে কথোপকথন-ফিল্টার + সদস্য-row-স্টেট (already/disabled/reasonLabel)
 *   - অপটিমিস্টিক মেসেজ: বানানো → সার্ভার-আইডিতে রেজলভ → ব্যর্থতায় প্রত্যাহার
 *   - ?chat= ডিপ-লিংক গেট (একবারই) + URL পরিষ্কার-করার পথ
 *   - কথোপকথন নির্বাচন হেল্পার (existing/fresh/fallback) + প্রথম-প্রিভিউ সিদ্ধান্ত
 *   - সদস্য-খোঁজা ইঞ্জিন: ডিবাউন্স + guard-প্রিভিউ মার্জ (টাইমার/API inject করা)
 */

// কারণ-লেবেল ও errorCode-নোটিসের সত্যের উৎস: shared/guardReasons.mjs
// (backend কোড-সেটের সাথে দুই-দিকের সম্পূর্ণতা tests/guard-reasons.core.test.mjs-এ)।
import { MEMBER_ROW_LABELS, GUARD_NOTICES } from "../../shared/guardReasons.mjs";

export { MEMBER_ROW_LABELS };

/** নতুন কথোপকথনের আইস-ব্রেকার — openChatWithUser ও startChatWith একই টেক্সট পাঠায় */
export const ICE_BREAKER_TEXT = "আসসালামু আলাইকুম, আপনার সাথে কথা বলতে চাই।";

/** সদস্য-খোঁজার টিউনিং — handleSearchInput-এর আচরণের সাথে যুক্ত */
export const SEARCH_DEBOUNCE_MS = 300;
export const SEARCH_MIN_CHARS = 2;
export const MEMBER_SEARCH_LIMIT = 8;

export const MESSAGING_TAB = "মেসেজিং";

/** ?chat= খাওয়ার পর URL পরিষ্কার — শুধু ট্যাব থাকে (retrigger হয় না) */
export function buildCleanMessagingUrl() {
  return `/profile?tab=${encodeURIComponent(MESSAGING_TAB)}`;
}

/**
 * guard errorCode → বাংলা নোটিস (আপগ্রেড লিংকসহ)।
 * অজানা কোডে সার্ভার-মেসেজ থাকলে সেটাই, নইলে null (নীরব — যেমন BLOCKED)।
 * @returns {{upgrade: boolean, text: string} | null}
 */
export function guardNoticeFor(errorCode, serverMessage) {
  const curated = Object.prototype.hasOwnProperty.call(GUARD_NOTICES, errorCode)
    ? GUARD_NOTICES[errorCode]
    : undefined;
  // কিউরেটেড নোটিস থাকলে সেটাই (ম্যানিফেস্টে null মানে সচেতনভাবে নীরব — যেমন BLOCKED)
  if (curated) return { ...curated };
  // অজানা কোড বা নীরব-নোটিস কোড → কলারের সার্ভার-মেসেজ, নইলে null (নীরব)
  return serverMessage ? { upgrade: false, text: serverMessage } : null;
}

/** API ফল নিরাপদে অ্যারে বানানো — null/অবজেক্ট এলে খালি তালিকা */
export function asArray(x) {
  return Array.isArray(x) ? x : [];
}

/** সার্চ-বক্সের সাথে কথোপকথন-ফিল্টার — শুধু partner-নামে, কেস-ইনসেনসিটিভ */
export function filterConversations(conversations, search) {
  const q = (search || "").toLowerCase();
  return (conversations || []).filter((c) =>
    (c.partner?.name || "").toLowerCase().includes(q)
  );
}

/**
 * বাংলা টাইম-লেবেল: আজকের হলে সময়, নইলে "দিন মাস"।
 * @param {string | null | undefined} iso
 * @param {Date} [now] টেস্টে নিয়ন্ত্রিত ঘড়ি (default: এখন)
 */
export function timeLabel(iso, now = new Date()) {
  if (!iso) return "";
  const d = new Date(iso);
  const sameDay = d.toDateString() === now.toDateString();
  return sameDay
    ? d.toLocaleTimeString("bn-BD", { hour: "numeric", minute: "2-digit" })
    : d.toLocaleDateString("bn-BD", { day: "numeric", month: "short" });
}

/**
 * সদস্য-row-স্টেট — সার্চ-ফলাফলের প্রতিটা row-এর রেন্ডার-সিদ্ধান্ত।
 * মূল আচরণ: reasonLabel disabled-নির্ভর নয়, শুধু guard-এর ওপর নির্ভর করে;
 * blocked reason-এর আগে আসে; canMessage !== false হলে সক্রিয়।
 * @returns {{already: boolean, disabled: boolean, reasonLabel: string | null}}
 */
export function memberRowState(member, conversations) {
  const g = member?.guard || null;
  const already = (conversations || []).some((c) => c.partner?.id === member?.id);
  const disabled = Boolean(g && g.canMessage === false);
  const reasonLabel = g
    ? MEMBER_ROW_LABELS[g.blocked ? "blocked" : g.reason] || null
    : null;
  return { already, disabled, reasonLabel };
}

/** পাঠানোর গেট — খালি/সাদা-স্পেস টেক্সট, চ্যাট নেই বা ব্লকড হলে নয় */
export function canSendMessage(text, activeChat, blockedByMe) {
  return Boolean(text && text.trim()) && Boolean(activeChat) && !blockedByMe;
}

/** নতুন কথোপকথন শুরুর গেট — ব্যস্ত থাকলে বা guard-প্রিভিউতে নিষ্ক্রিয় হলে নয় */
export function canStartChatWith(member, startBusyId) {
  if (startBusyId) return false;
  return !(member?.guard && member.guard.canMessage === false);
}

/** অপটিমিস্টিক মেসেজ-আকৃতি — সার্ভার-রেসপন্স আসার আগেই তালিকায় বসে */
export function makeOptimisticMessage({ tmpId, senderId, text, now = new Date() }) {
  return { id: tmpId, sender: senderId, text, createdAt: now.toISOString() };
}

/** tmp আইডি → সার্ভার-আইডি (শুধু মিলে-যাওয়া row, নতুন অ্যারে) */
export function resolveOptimisticId(messages, tmpId, sentId) {
  return (messages || []).map((m) => (m.id === tmpId ? { ...m, id: sentId } : m));
}

/** ব্যর্থ পাঠানো — tmp row তুলে ফেলা (নতুন অ্যারে) */
export function revertOptimistic(messages, tmpId) {
  return (messages || []).filter((m) => m.id !== tmpId);
}

/**
 * লাইভ (socket) মেসেজ গেট — এই conversation-এর কি না, ডুপ্লিকেট কি না।
 * sender === নিজে হলেও false নয় (অন্য ট্যাব-সিঙ্ক) — ডুপ্লিকেট-গার্ডই আসল রক্ষা।
 */
export function shouldHandleLiveMessage(msg, activeConversationId) {
  return Boolean(msg?.id && msg.conversationId && msg.conversationId === activeConversationId);
}

/** লাইভ মেসেজ তালিকায় জুড়ুন — id দিয়ে ডুপ্লিকেট-গার্ড, নতুন অ্যারে */
export function appendLiveMessage(messages, msg) {
  const arr = messages || [];
  if (arr.some((m) => m.id === msg.id)) return arr;
  return [...arr, msg];
}

/** পরিচিত সদস্য? — কথোপকথন-তালিকায় partner-আইডি মিললে সেটাই খোলে */
export function findExistingConversation(conversations, partnerId) {
  return (conversations || []).find((c) => c.partner?.id === partnerId) || null;
}

/** সার্ভার-রেশেপড না পেলে স্থানীয় ফলব্যাক — পার্টনার-তথ্যসহ ভার্চুয়াল conversation */
export function buildFallbackConversation(convoId, partnerId, name = null, avatar = null) {
  return {
    id: convoId,
    partner: { id: partnerId, name: name ?? null, avatar: avatar ?? null },
    lastMessage: null,
    unreadCount: 0,
  };
}

/** তালিকা-রিলোডের পরে ফ্রেশ অবজেক্ট খোঁজা — পার্টনার-নাম সাথে সাথেই দেখা যায় */
export function pickFreshConversation(arr, convoId, partnerId, name = null, avatar = null) {
  return (
    (arr || []).find((c) => c.id === convoId) ||
    buildFallbackConversation(convoId, partnerId, name, avatar)
  );
}

/** প্রথম কথোপকথন অটো-প্রিভিউ — কিছু না খোলা থাকলেই শুধু প্রথমবার */
export function shouldAutoOpenFirst(arr, activeChat) {
  return Boolean(asArray(arr).length && !activeChat);
}

/**
 * ?chat= ডিপ-লিংক গেট — একই প্যারাম একবারই হ্যান্ডেল হয়।
 * URL পরিষ্কার হ্যান্ডেল-করা মাত্রই হয়; pending শুধু লগইন-অবস্থায়।
 * @returns {null | {chat: string, pending: string | null, cleanUrl: string}}
 */
export function chatParamAction(chat, handledChat, hasAccess) {
  if (!chat || handledChat === chat) return null;
  return { chat, pending: hasAccess ? chat : null, cleanUrl: buildCleanMessagingUrl() };
}

/**
 * pending ?chat= ছাড়ার গেট — কথোপকথন-তালিকা লোড শেষ না হওয়া পর্যন্ত ধরে রাখে;
 * কলার ছাড়ার সাথে সাথেই pending মুছে ফেলে (null) তাই রি-রেন্ডারে বারবার খোলে না —
 * মুছে গেলে এই গেট আর true হয় না (একবারই-সেম্যান্টিকস কলারের এক-লাইনে)।
 */
export function shouldReleasePendingChat(loading, pendingChat) {
  return !loading && Boolean(pendingChat);
}

/**
 * ?chat=<partnerId> → কথোপকথন খোলার সিদ্ধান্ত (pure; API কল ও setState কলারের দায়িত্ব):
 *   - "ignore": খালি আইডি বা নিজের আইডিতে নিজেকে খোলা যায় না
 *   - "open":   পরিচিত কথোপকথন — তালিকার সেই row-টিই সরাসরি খোলে
 *   - "start":  নতুনশুরু — সার্ভারে আইস-ব্রেকারসহ conversation start করতে হবে
 * @param {{partnerId: string | null | undefined, userId?: string | null, conversations?: Array<object>}} opts
 * @returns {{action: "ignore"} | {action: "open", conversation: object} | {action: "start"}}
 */
export function planOpenChatWithUser({ partnerId, userId, conversations }) {
  if (!partnerId || (userId != null && partnerId === userId)) return { action: "ignore" };
  const existing = findExistingConversation(conversations, partnerId);
  if (existing) return { action: "open", conversation: existing };
  return { action: "start" };
}

/**
 * নতুন-শুরু (start) ব্যর্থতার ইনলাইন-নোটিস — BLOCKED নীরব দেয়াল: কারণও নয় সার্ভার-মেসেজও
 * দেখানো হয় না; বাকি গার্ড-কোডে আপগ্রেড-লিংকসহ নোটিস, অজানা এররে সার্ভার-বার্তা।
 */
export function startFailureNotice(err) {
  return guardNoticeFor(err?.errorCode, err?.errorCode === "BLOCKED" ? null : err?.message);
}

/**
 * সদস্য-খোঁজা ইঞ্জিন — MessagingPage-এর handleSearchInput-এর সদস্য-অর্ধেক।
 *
 * টাইপ করলে SEARCH_DEBOUNCE_MS পরে খোঁজে; minChars-এর কম হলে ফলাফল বন্ধ (null)।
 * ফল এলে guard-পূর্ব প্রিভিউ মার্জ করে — preview ব্যর্থ হলে guard:null → ক্লিক
 * অনুমোদিত (সার্ভার চৌকাঠই শেষ কথা); খোঁজা ব্যর্থ হলে []।
 *
 * @param {object} opts
 * @param {(q: string, limit: number) => Promise<Array<{id: string}>>} opts.searchUsers  userApi.search
 * @param {(ids: string[]) => Promise<Array<{id: string}>>} opts.searchIntent            userApi.searchIntent
 * @param {(results: Array<object> | null) => void} opts.setResults                     setMemberResults
 * @param {(busy: boolean) => void} opts.setBusy                                        setSearchBusy
 * @param {{setTimeout, clearTimeout}} [opts.timers]                                    টেস্টে নিয়ন্ত্রিত টাইমার
 */
export function createMemberSearchEngine({
  searchUsers,
  searchIntent,
  setResults,
  setBusy,
  timers = globalThis,
  debounceMs = SEARCH_DEBOUNCE_MS,
  minChars = SEARCH_MIN_CHARS,
  limit = MEMBER_SEARCH_LIMIT,
}) {
  let timer = null;

  function onInput(value) {
    if (timer) {
      timers.clearTimeout(timer);
      timer = null;
    }
    const q = (value || "").trim();
    if (q.length < minChars) {
      setResults(null);
      return;
    }
    timer = timers.setTimeout(async () => {
      timer = null;
      setBusy(true);
      try {
        const res = await searchUsers(q, limit);
        const found = asArray(res);
        if (!found.length) {
          setResults([]);
          return;
        }
        // guard-পূর্ব প্রিভিউ সহ দেখাই — নইলে নিষ্ক্রিয় row-এ ক্লিকের রেস হয়
        // (preview ব্যর্থ হলে guard:null → ক্লিক অনুমোদিত, সার্ভার চৌকাঠই শেষ কথা)
        let guarded = found.map((m) => ({ ...m, guard: null }));
        try {
          const pv = await searchIntent(found.map((m) => m.id));
          const byId = Object.fromEntries(asArray(pv).map((r) => [r.id, r]));
          guarded = found.map((m) => ({ ...m, guard: byId[m.id] || null }));
        } catch {
          /* প্রিভিউ নীরব */
        }
        setResults(guarded);
      } catch {
        setResults([]);
      } finally {
        setBusy(false);
      }
    }, debounceMs);
  }

  /** unmount/পরিষ্কার-করার সময় পেন্ডিং টাইমার বাতিল */
  function clear() {
    if (timer) {
      timers.clearTimeout(timer);
      timer = null;
    }
  }

  return { onInput, clear };
}
