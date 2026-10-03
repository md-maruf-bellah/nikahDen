/**
 * Guard reason — দুই-দিকের সম্পূর্ণতা ক্রস-চেক (এক সত্যের উৎস: shared/guardReasons.mjs)।
 *
 * যা যাচাই হয়:
 *   ১. ম্যানিফেস্টের ভেতরের সম্পূর্ণতা — প্রতিটি প্রিভিউ-কারণের বাটন+রো-লেবেল,
 *      প্রতিটি errorCode-র notice (বা সচেতন null), দুই পরিবারের ১:১ সেতু।
 *   ২. **backend → ম্যানিফেস্ট**: user.service/messagingGuard/block.service লিটারেল
 *      ছাড়া শুধু manifest-কনস্ট্যান্ট ব্যবহার করে + প্রতিটি কোড নির্দিষ্ট এমিটারে টানা হয়।
 *   ৩. **ম্যানিফেস্ট → frontend**: কোরগুলো একই অবজেক্ট রি-এক্সপোর্ট করে (কপি নয়),
 *      guardNoticeFor/resolveGuardReason/memberRowState ম্যানিফেস্ট-আচরণ মেনে চলে।
 *   ৪. **অজানা কারণ নীতি** — backend "PENDING" পাঠায় না (সেটিকে reason:null ধরে);
 *      তারিভ ভবিষ্যতের অজানা কোডও fallback-লেবেলে যায়, কোড টুকরো হয় না।
 *
 * backend ফাইল-স্ক্যান ইচ্ছাকৃতভাবে heuristik: কমেন্ট বাদ দিয়ে SCREAMING_SNAKE
 * স্ট্রিং-লিটারেল খোঁজে — guard শব্দ-ভাণ্ডারের (LIMIT/UPGRADE/PACKAGE/MESSAGING/BLOCKED)
 * নতুন লিটারেল এলেই ধরা পড়ে, তাই কোড ম্যানিফেস্ট ছাড়া বদলানো যায় না।
 */

import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

import {
  PREVIEW_REASONS,
  BLOCKED_KEY,
  GUARD_ERROR_CODES,
  GUARD_STATES,
  REASON_LABELS,
  MEMBER_ROW_LABELS,
  GUARD_NOTICES,
  PREVIEW_TO_ERROR,
  DISABLED_FALLBACK_TITLE,
} from "../shared/guardReasons.mjs";
import {
  REASON_LABELS as BUTTON_LABELS,
  DISABLED_FALLBACK_TITLE as BUTTON_FALLBACK,
  resolveGuardReason,
} from "../src/components/StartChatButton.core.mjs";
import {
  MEMBER_ROW_LABELS as ROW_LABELS,
  guardNoticeFor,
  memberRowState,
} from "../src/components/Messenger.core.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const BACKEND_SOURCES = [
  "backend/src/modules/users/user.service.js", // preview-কারণ এমিটার
  "backend/src/modules/messages/messagingGuard.service.js", //পাঠানোর-সময় errorCode এমিটার
  "backend/src/modules/blocks/block.service.js", // BLOCKED এমিটার (নীরব দেয়াল)
];

const readSource = (rel) => readFileSync(path.join(ROOT, rel), "utf8");

/** কমেন্ট বাদ দিয়ে কোড-অংশ ফেরত (heuristik — এই তিন ফাইলে কমেন্টে string-literal নেই) */
function stripComments(src) {
  return src
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/\/\/[^\n]*/g, "");
}

/** কমেন্ট-ছাড়া অংশের SCREAMING_SNAKE স্ট্রিং-লিটারেল */
function screamingLiterals(src) {
  return [...stripComments(src).matchAll(/"([A-Z][A-Z0-9_]*)"/g)].map((m) => m[1]);
}

const GUARD_VOCAB = /LIMIT|UPGRADE|PACKAGE|MESSAGING|BLOCKED/;

describe("guard reasons — ম্যানিফেস্টের ভেতরের সম্পূর্ণতা", () => {
  it("প্রতিটি প্রিভিউ-কারণের (LIMIT_REACHED/UPGRADE_REQUIRED/NO_PACKAGE/blocked) বাটন-ও রো-লেবেল আছে", () => {
    const previewKeys = [...Object.keys(PREVIEW_REASONS), BLOCKED_KEY].sort();
    assert.deepEqual(Object.keys(REASON_LABELS).sort(), previewKeys);
    assert.deepEqual(Object.keys(MEMBER_ROW_LABELS).sort(), previewKeys);
    for (const s of GUARD_STATES) {
      assert.ok(s.button?.iconKey, `${s.preview}: iconKey নেই`);
      assert.ok(s.button?.text?.length > 0, `${s.preview}: বাটন-টেক্সট নেই`);
      assert.ok(s.row?.length > 0, `${s.preview}: রো-লেবেল নেই`);
    }
  });

  it("প্রতিটি errorCode-র notice আছে — বা সচেতনভাবে null (BLOCKED = নীরব দেয়াল)", () => {
    assert.deepEqual(Object.keys(GUARD_NOTICES).sort(), Object.keys(GUARD_ERROR_CODES).sort());
    assert.equal(GUARD_NOTICES[GUARD_ERROR_CODES.BLOCKED], null, "BLOCKED-notice null হতেই হবে");
    for (const [code, notice] of Object.entries(GUARD_NOTICES)) {
      if (code === GUARD_ERROR_CODES.BLOCKED) continue;
      assert.equal(notice?.upgrade, true, `${code}: আপগ্রেড-লিংকসহ notice হতে হবে`);
      assert.ok(notice?.text?.length > 0, `${code}: notice-টেক্সট নেই`);
    }
  });

  it("দুই পরিবার (প্রিভিউ-reason ↔ errorCode) পরস্পর ১:১ সেতুযুক্ত", () => {
    const previewKeys = [...Object.keys(PREVIEW_REASONS), BLOCKED_KEY].sort();
    assert.deepEqual(Object.keys(PREVIEW_TO_ERROR).sort(), previewKeys);
    assert.deepEqual(
      Object.values(PREVIEW_TO_ERROR).sort(),
      Object.values(GUARD_ERROR_CODES).sort(),
      "প্রতিটি প্রিভিউ-কারণের একটি করে সমতুল্য errorCode — কোনোটাই বাদ পড়ে না"
    );
    for (const s of GUARD_STATES) {
      assert.equal(PREVIEW_TO_ERROR[s.preview], s.error, `${s.preview} ↔ ${s.error} সেতু নেই`);
    }
  });

  it("বাটন-আইকন কম্পোনেন্টের ICONS চুক্তির মধ্যে (ban/shield-check/credit-card)", () => {
    // StartChatButton.jsx-এর ICONS ম্যাপে এই তিনটিই আছে — নতুন iconKey সেখানেও যোগ দিতে হবে
    const allowed = new Set(["ban", "shield-check", "credit-card"]);
    for (const s of GUARD_STATES) {
      assert.ok(allowed.has(s.button.iconKey), `অনুমোদিত iconKey নয়: ${s.button.iconKey}`);
    }
  });
});

describe("guard reasons — backend থেকে ম্যানিফেস্ট (এমিটার ক্রস-চেক)", () => {
  it("তিনটি এমিটার-ফাইলই shared/guardReasons.mjs থেকে ইমপোর্ট করে", () => {
    for (const rel of BACKEND_SOURCES) {
      assert.match(
        readSource(rel),
        /from\s+"[^"]*shared\/guardReasons\.mjs"/,
        `${rel} manifest থেকে ইমপোর্ট করছে না`
      );
    }
  });

  it("এমিটার-ফাইলে guard-শব্দভাণ্ডারের কোনো হার্ডকোড স্ট্রিং-লিটারেল নেই", () => {
    for (const rel of BACKEND_SOURCES) {
      const strays = screamingLiterals(readSource(rel)).filter((s) => GUARD_VOCAB.test(s));
      assert.deepEqual(strays, [], `${rel}-এ ম্যানিফেস্ট-বাইরের guard-কোড: ${strays.join(", ")}`);
    }
  });

  it("ম্যানিফেস্টের প্রতিটি প্রিভিউ-কারণ user.service-এর এমিটারে ব্যবহৃত হয়", () => {
    const src = readSource("backend/src/modules/users/user.service.js");
    for (const key of Object.keys(PREVIEW_REASONS)) {
      assert.ok(src.includes(`PREVIEW_REASONS.${key}`), `user.service-এ PREVIEW_REASONS.${key} নেই`);
    }
    assert.match(src, /blocked:\s*true/, "blocked:true ফ্ল্যাগ-এমিটার নেই");
  });

  it("ম্যানিফেস্টের প্রতিটি errorCode তার এমিটারে ব্যবহৃত হয় (messagingGuard / block)", () => {
    const guardSrc = readSource("backend/src/modules/messages/messagingGuard.service.js");
    const blockSrc = readSource("backend/src/modules/blocks/block.service.js");
    assert.ok(guardSrc.includes("GUARD_ERROR_CODES.NO_MESSAGING_PACKAGE"));
    assert.ok(guardSrc.includes("GUARD_ERROR_CODES.MESSAGING_UPGRADE_REQUIRED"));
    assert.ok(guardSrc.includes("GUARD_ERROR_CODES.MESSAGING_LIMIT_REACHED"));
    assert.ok(blockSrc.includes("GUARD_ERROR_CODES.BLOCKED"), "BLOCKED block.service-এর চৌকাঠে ছাড়তে হবে");
  });

  it("backend \"PENDING\" নামে কোনো guard-কোড পাঠায় না — সেটিকে reason:null ধরা হয়", () => {
    for (const rel of BACKEND_SOURCES) {
      assert.ok(
        !screamingLiterals(readSource(rel)).includes("PENDING"),
        `${rel}-এ "PENDING" লিটারেল আছে — ম্যানিফেস্টে কারণ হিসেবে যোগ করুন`
      );
    }
  });
});

describe("guard reasons — কোরগুলো ম্যানিফেস্টের একই অবজেক্ট ব্যবহার করে (কপি নয়)", () => {
  it("StartChatButton REASON_LABELS ও fallback ম্যানিফেস্টের সাথে রেফারেন্স-সমান", () => {
    assert.equal(BUTTON_LABELS, REASON_LABELS);
    assert.equal(BUTTON_FALLBACK, DISABLED_FALLBACK_TITLE);
    assert.equal(DISABLED_FALLBACK_TITLE, "মেসেজিং সম্ভব নয়");
  });

  it("Messenger MEMBER_ROW_LABELS ম্যানিফেস্টের সাথে রেফারেন্স-সমান", () => {
    assert.equal(ROW_LABELS, MEMBER_ROW_LABELS);
  });

  it("guardNoticeFor প্রতিটি errorCode-র notice ম্যানিফেস্ট থেকেই দেয়", () => {
    for (const [code, notice] of Object.entries(GUARD_NOTICES)) {
      if (notice) {
        assert.deepEqual(guardNoticeFor(code), { ...notice }, `${code}-নোটিস ম্যানিফেস্টের সাথে মেলে না`);
      } else {
        assert.equal(guardNoticeFor(code, null), null, `${code} নীরব থাকতে হিচ`);
        assert.deepEqual(
          guardNoticeFor(code, "সার্ভার-বার্তা"),
          { upgrade: false, text: "সার্ভার-বার্তা" },
          `${code}-এ কলারের সার্ভার-মেসেজই দেখাবে`
        );
      }
    }
  });

  it("অজানা errorCode → সার্ভার-মেসেজ বা null (ম্যানিফেস্ট-বাইরে নতুন কোডেও ভাঙে না)", () => {
    assert.deepEqual(guardNoticeFor("FUTURE_CODE", "কাস্টম"), { upgrade: false, text: "কাস্টম" });
    assert.equal(guardNoticeFor("FUTURE_CODE"), null);
  });
});

describe("guard reasons — অজানা কারণ নীতি (PENDING সহ)", () => {
  it('canMessage:false + reason "PENDING" → fallback title, আইকন নেই', () => {
    const r = resolveGuardReason({ canMessage: false, blocked: false, reason: "PENDING" });
    assert.equal(r.disabled, true);
    assert.equal(r.reason, null);
    assert.equal(r.title, DISABLED_FALLBACK_TITLE);
  });

  it("reason null (নিজে/টার্গেট ACTIVE নয় — PENDING/INACTIVE) → fallback title", () => {
    const r = resolveGuardReason({ canMessage: false, reason: null });
    assert.equal(r.title, DISABLED_FALLBACK_TITLE);
  });

  it("সদস্য-রো-তে অজানা কারণ → disabled, কিন্তু reasonLabel null (JSX fallback দেখায়)", () => {
    const r = memberRowState({ id: "u2", guard: { canMessage: false, reason: "PENDING" } }, []);
    assert.equal(r.disabled, true);
    assert.equal(r.reasonLabel, null);
  });

  it("প্রতিটি জ্ঞাত প্রিভিউ-কারণের জন্য resolveGuardReason লেবেল ফেরায় (fallback নয়)", () => {
    for (const key of Object.keys(PREVIEW_REASONS)) {
      const r = resolveGuardReason({ canMessage: false, blocked: false, reason: key });
      assert.ok(r.reason, `${key}-লেবেল পড়ে ফেলা হচ্ছে — ম্যানিফেস্ট-কী বন্ধ হয়ে গেছে?`);
      assert.equal(r.title, r.reason.text);
    }
    const blocked = resolveGuardReason({ canMessage: false, blocked: true });
    assert.equal(blocked.reason.iconKey, "ban");
  });
});
