/**
 * Capped-collection হেল্পার — event-ring ধরনের কালেকশনের জন্য শেয়ার্ড ইউটিলিটি।
 *
 * ব্যবহার: প্রতিটি মনিটর-মডেল (oauth_events, contact_events, ...) নিজের নাম-ক্যাপ
 * দিয়ে defineCappedModel() কল করে + সার্ভার স্টার্টআপে/টেস্টে ensureCappedCollection()।
 *
 * কেন capped: append-only ring buffer — পুরনো ডক অটো-ওভাররাইট, কোনো ক্লিনআপ জব
 * লাগে না; natural order == সময়ের ক্রম। মনিটরিং লেখা মূল রিকোয়েস্টকে বাধা দেয় না।
 */
import mongoose from "mongoose";

/** ডিফল্ট ক্যাপ — ৫০০ ডক / ২৫৬KB (oauth_events-এর সাথে মিলিয়ে) */
export const DEFAULT_EVENT_CAP = { size: 256 * 1024, max: 500 };

/**
 * Capped মডেল ডিফাইন করে (dev-mode re-register সেফ)।
 * নোট: mongoose-এর capped option শুধু কালেকশন *নতুন তৈরি হলে* প্রযোজ্য —
 * কালেকশন আগে থেকে অন্য অপশনে থাকলে ensureCappedCollection() দিয়ে ম্যানেজ করতে হয়।
 */
export function defineCappedModel(name, schema, collection, cap = DEFAULT_EVENT_CAP) {
  const alreadyDefined = mongoose.models[name];
  if (alreadyDefined) return alreadyDefined;
  return mongoose.model(name, schema, collection, { capped: cap });
}

/** কালেকশনটা capped হিসেবে আছে কি না নিশ্চিত করে — না থাকলে সঠিক ক্যাপে বানায়। */
export async function ensureCappedCollection(collection, cap = DEFAULT_EVENT_CAP, conn = mongoose.connection) {
  const names = await conn.db.listCollections({ name: collection }).toArray();
  if (names.length === 0) {
    await conn.createCollection(collection, { capped: true, ...cap });
  }
}

/**
 * টেস্টে capped কালেকশন পরিষ্কার — capped-এ deleteMany নিষিদ্ধ, তাই drop → recreate।
 * ড্রপের পর প্রথম insert কালেকশন non-capped বানিয়ে দিতে পারে বলে সাথে সাথেই recreate।
 */
export async function resetCappedCollection(collection, cap = DEFAULT_EVENT_CAP, conn = mongoose.connection) {
  const names = await conn.db.listCollections({ name: collection }).toArray();
  if (names.length > 0) await conn.dropCollection(collection);
  await conn.createCollection(collection, { capped: true, ...cap });
}

export default { DEFAULT_EVENT_CAP, defineCappedModel, ensureCappedCollection, resetCappedCollection };
