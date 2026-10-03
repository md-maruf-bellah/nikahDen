/**
 * Messaging permission guard — **একটাই চৌকাঠ** (`assertMessagingPermission`)।
 *
 * মেসেজ পাঠানোর আগে এই চেকগুলো এক জায়গায় হয় (প্রিসিডেন্স ক্রমে):
 *   1. **Match** — দুজনের মধ্যে mutual like (match) না থাকলে একজন অন্যজনকে
 *      মোট `messagingLimit`-টি প্রথম মেসেজই পাঠাতে পারে (per sender+recipient
 *      জোড়া, পুরনো conversation হলেও গণনা হয়)। -1 = সীমাহীন, 0 = মেসেজ বন্ধ।
 *      Match থাকলে সবসময় সীমাহীন।
 *   2. **Package (plan)** — প্রেরকের *active subscription* থাকলে সেই প্ল্যানের
 *      `messagingEnabled: false` হলে ৪০৩ `NO_MESSAGING_PACKAGE` (পরিকল্পনায়
 *      মেসেজিং বন্ধ), `messagingLimit: 0` হলে ৪০২ `MESSAGING_UPGRADE_REQUIRED`
 *      (ম্যাচ-পূর্ব মেসেজ পাঠানোর প্যাকেজ-সীমা নেই)। কোনো active subscription
 *      না থাকলে কোনো প্যাকেজ-সীমা নেই (plan-বহি মেসেজিং plan কেনার মূল উদ্দেশ্য)।
 *   3. **Block** — দুই দিকের যেকোনো block থাকলে নীরব দেয়াল: উভয় পক্ষই একই
 *      নিরপেক্ষ ৪০৩ `BLOCKED` দেখে, তাই কেউ অন্যের block-state অনুমান করতে পারে না।
 *
 * এই মডিউলের প্রতিটি ফাংশন single-user-resolved হয় — একই চৌকাঠ কোনো ভবিষ্যৎ
 * মেসেজিং এন্ট্রি-পয়েন্টেও বসালেই সব নিয়ম একসাথে কাজ করবে।
 */
import Subscription from "../../models/subscription.model.js";
import Like from "../../models/like.model.js";
import Biodata from "../../models/biodata.model.js";
import Message from "../../models/message.model.js";
import { ApiError } from "../../utils/ApiError.js";
import { assertNotBlockedBetween } from "../blocks/block.service.js";
// guard-কোডের সত্যের উৎস — frontend-লেবেলের সাথে সম্পূর্ণতা যাচাই হয়
// tests/guard-reasons.core.test.mjs-এ (shared manifest দুই প্যাকেজ পড়ে)
import { GUARD_ERROR_CODES } from "../../../../shared/guardReasons.mjs";


/**
 * Sender-এর active plan (subscription-based entitlement)।
 * @returns {{ planId: string, name: string, messagingEnabled: boolean, messagingLimit: number } | null} — plan না কিনলে null
 */
async function activePlanFor(senderId) {
  const sub = await Subscription.findOne({
    user: senderId,
    status: "ACTIVE",
    expiresAt: { $gt: new Date() },
  }).populate("plan", "name messagingEnabled messagingLimit");
  if (!sub || !sub.plan || !sub.plan._id) return null;
  return {
    planId: sub.plan._id.toString(),
    name: sub.plan.name,
    messagingEnabled: sub.plan.messagingEnabled !== false,
    // legacy plan-এ ফিল্ড না থাকলে সীমাহীন ধরা হয়
    messagingLimit: sub.plan.messagingLimit ?? -1,
  };
}

/** এই দুজনের মধ্যে mutual like (match) আছে কি না। */
export async function isMatchBetween(userA, userB) {
  const myBiodataIds = await Biodata.find({ user: userA }).select("_id").lean();
  if (!myBiodataIds.length) return false;
  const count = await Like.countDocuments({
    user: userB,
    biodata: { $in: myBiodataIds.map((b) => b._id) },
    targetOwner: userA,
    isMutual: true,
  });
  return count > 0;
}

/** আমি এই recipient-কে এখনও পর্যন্ত কতগুলো মেসেজ পাঠিয়েছি (কোনো conversation-এই নয়)। */
function sentMessageCount(senderId, recipientId) {
  return Message.countDocuments({ sender: senderId, recipient: recipientId });
}

/**
 * মেসেজিং চৌকাঠ। `recipientId` একটি valid ObjectId string হতে হবে
 * (message.service-এর assertRecipient পার হওয়ার পরে)।
 *
 * @throws 403 `NO_MESSAGING_PACKAGE` — active plan-এ messagingEnabled:false
 * @throws 402 `MESSAGING_UPGRADE_REQUIRED` — ম্যাচ নেই আর plan-এর messagingLimit:0
 * @throws 403 `MESSAGING_LIMIT_REACHED` — ম্যাচ নেই, জোড়া-সীমা শেষ
 * @throws 403 `BLOCKED` — যেকোনো দিক থেকে block (নীরব দেয়াল)
 */
export async function assertMessagingPermission(senderId, recipientId) {
  // প্রথমে সস্তা চেকগুলো: match + plan (একটাই batch)
  const [matched, plan] = await Promise.all([isMatchBetween(senderId, recipientId), activePlanFor(senderId)]);

  if (!matched) {
    if (plan && plan.messagingEnabled === false) {
      throw ApiError.forbidden(
        `Messaging on the ${plan.name} plan is limited to matches. Upgrade your package to start conversations.`,
        GUARD_ERROR_CODES.NO_MESSAGING_PACKAGE
      );
    }
    const pairLimit = plan ? plan.messagingLimit : -1;
    if (pairLimit === 0) {
      throw new ApiError(
        402,
        "Your package does not include starting conversations. Upgrade to message members you have not matched with yet.",
        GUARD_ERROR_CODES.MESSAGING_UPGRADE_REQUIRED
      );
    }
    if (pairLimit > 0) {
      const sent = await sentMessageCount(senderId, recipientId);
      if (sent >= pairLimit) {
        throw ApiError.forbidden(
          `Match ছাড়া এই সদস্যকে সর্বোচ্চ ${pairLimit}টি মেসেজ পাঠানো যায়। Match হলে সীমাহীন।`,
          GUARD_ERROR_CODES.MESSAGING_LIMIT_REACHED
        );
      }
    }
  }

  // block সবার শেষে — নীরব দেয়াল সবকিছুকে আড়াল করে।
  await assertNotBlockedBetween(senderId, recipientId);
}

export default { assertMessagingPermission, isMatchBetween };
