/**
 * Guardian মডিউলের অভিন্ন নোটিফিকেশন-হেল্পার — SYSTEM টাইপ + real-time socket emit।
 * guardian.service ও guardianContactRequest.service দুটোই এটিই ব্যবহার করে
 * (ডুপ্লিকেশন নয়, কিন্তু সার্কুলার import-ও নয়)।
 * নোটিফিকেশন ব্যর্থ হলে মূল অ্যাকশন ব্যর্থ হয় না।
 */
import { NOTIFICATION_TYPES } from "../../constants/index.js";
import Notification from "../../models/notification.model.js";
import { emitNewNotification } from "../notifications/notification.service.js";

export async function notify(userId, title, body, data = {}) {
  try {
    const doc = await Notification.create({ user: userId, type: NOTIFICATION_TYPES.SYSTEM, title, body, data });
    emitNewNotification(doc);
  } catch {
    /* নোটিফিকেশন ব্যর্থতা মূল অ্যাকশন ব্যর্থ করে না */
  }
}

export default { notify };
