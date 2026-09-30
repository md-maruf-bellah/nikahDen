/**
 * GuardPreview কোর — React-মুক্ত, শুধু-লজিক মডিউল।
 *
 * GuardPreviewProvider.jsx এটাকে ব্যবহার করে; ইউনিট টেস্টও এটাকেই চালায়
 * (tests/guard-preview.core.test.mjs, node --test — কোনো DOM/React লাগে না)।
 *
 * দায়িত্ব (প্রোভাইডারের আচরণ হুবহু):
 *   - ব্যাচিং: ২৫০ms ডিবাউন্সে একত্রিত করে এক কলে পাঠায় (টাইমার inject করা — টেস্টে নিয়ন্ত্রিত)
 *   - ≤25 ব্যাচ: বেশি আইডি হলে বাকিটা পরের ব্যাচে
 *   - dedup: একবার লোড হওয়া আইডি আর যায় না
 *   - inflight কোলেসিং: টাইমার চলাকালে নতুন আইডি সেই ব্যাচেই যোগ হয়
 *   - গেস্ট/বিচ্ছিন্ন অবস্থায় কোনো কল নয়
 *   - API ব্যর্থ হলে নীরব (previews অপরিবর্তিত, বোতাম সক্রিয় থাকে)
 *   - user পরিবর্তনে ক্যাশ পরিষ্কার (দেখার দায়িত্ব কলারের — dispose() এখানে)
 *   - unmount (dispose) হলে পেন্ডিং টাইমার বাতিল, ফলাফল আর স্টেটে লেখা হয় না
 */

export const MAX_BATCH = 25;
export const DEBOUNCE_MS = 250;

/**
 * @param {object} opts
 * @param {(ids: string[]) => Promise<Array<{id: string}>>} opts.fetchIntent  API কল (userApi.searchIntent-এর মতো rows ফেরায়)
 * @param {(previews: Record<string, object>) => void} opts.setPreviews       স্টেট-রাইটার (React setState)
 * @param {() => string | null | undefined} opts.getUserId                    বর্তমান ইউজার-আইডি (null = গেস্ট)
 * @param {{setTimeout, clearTimeout}} [opts.timers]                          টেস্টে নিয়ন্ত্রিত টাইমার (default: global)
 */
export function createGuardPreviewEngine({ fetchIntent, setPreviews, getUserId, timers = globalThis }) {
  let inflight = null; // { ids:Set, timer }
  const loadedIds = new Set();
  let alive = true;
  let fetchSeq = 0; // পুরনো (কিন্তু এখনো চলমান) fetch-এর ফলাফল নতুন স্টেটে লেখা আটকায়

  function schedule(ids) {
    if (!alive || !getUserId()) return;
    const unseen = (ids || []).filter((id) => id && !loadedIds.has(id));
    if (!unseen.length) return;

    if (inflight) {
      unseen.forEach((id) => inflight.ids.add(id));
      return;
    }

    const entry = { ids: new Set(unseen), timer: null };
    inflight = entry;
    entry.timer = timers.setTimeout(async () => {
      inflight = null;
      const batch = [...entry.ids].slice(0, MAX_BATCH);
      batch.forEach((id) => loadedIds.add(id));
      // ব্যাচে বাকি থাকলে পরের টিকে আবার (নতুন ডিবাউন্স — প্রোভাইডারের আচরণই)
      if (entry.ids.size > MAX_BATCH) schedule([...entry.ids].slice(MAX_BATCH));

      const seq = ++fetchSeq;
      try {
        const res = await fetchIntent(batch);
        if (!alive) return;
        const rows = Array.isArray(res) ? res : [];
        setPreviews((prev) => {
          const next = { ...prev };
          for (const r of rows) next[r.id] = r;
          return next;
        });
      } catch {
        /* নীরব — বোতাম সক্রিয় থাকে, সার্ভার guard-ই শেষ কথা */
      }
      void seq; // seq শুধু ভবিষ্যৎ প্রুফিংয়ের জন্য রাখা (dispose আগেই alive দিয়ে আটকায়)
    }, DEBOUNCE_MS);
  }

  function clearCache() {
    loadedIds.clear();
  }

  function dispose() {
    alive = false;
    if (inflight) {
      timers.clearTimeout(inflight.timer);
      inflight = null;
    }
  }

  return {
    schedule,
    clearCache,
    dispose,
    /** টেস্ট-ইন্ট্রোস্পেকশন: কোন আইডি লোড-মার্কড */
    get loaded() {
      return [...loadedIds];
    },
    /** টেস্ট-ইন্ট্রোস্পেকশন: পেন্ডিং ব্যাচের আইডি (কোনো টাইমার না থাকলে []) */
    get pending() {
      return inflight ? [...inflight.ids] : [];
    },
  };
}
