import mongoose from "mongoose";
import User from "../../models/user.model.js";
import Biodata from "../../models/biodata.model.js";
import Order from "../../models/order.model.js";
import Subscription from "../../models/subscription.model.js";
import ContactMessage from "../../models/contactMessage.model.js";
import Like from "../../models/like.model.js";
import Conversation from "../../models/conversation.model.js";
import Message from "../../models/message.model.js";
import { ORDER_STATUSES, ROLES } from "../../constants/index.js";

const startOfDay = (daysAgo = 0) => {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  d.setHours(0, 0, 0, 0);
  return d;
};

const singleTotal = (rows, fallback = 0) => (rows.length ? rows[0].total : fallback);

/** Mutual like rows come in pairs (A→B + B→A); count distinct matches. */
async function mutualMatchCount() {
  const pairs = await Like.aggregate([
    { $match: { isMutual: true } },
    {
      $group: {
        _id: {
          a: { $min: ["$user", "$targetOwner"] },
          b: { $max: ["$user", "$targetOwner"] },
        },
      },
    },
  ]);
  return pairs.length;
}

export async function dashboardStats() {
  const today = startOfDay();
  const weekAgo = startOfDay(7);
  const monthAgo = startOfDay(30);
  const now = new Date();

  const [
    userTotal,
    userActive,
    userPending,
    userInactive,
    admins,
    grooms,
    brides,
    biodataTotal,
    biodataApproved,
    biodataPending,
    biodataRejected,
    biodataHidden,
    newUsersToday,
    newUsersWeek,
    newBiodatasWeek,
    viewAgg,
    likesSentAgg,
    likesWeekAgg,
    mutualMatches,
    conversationsTotal,
    conversationsActive,
    unreadAgg,
    ordersPending,
    ordersFailed,
    paidOrders,
    revenueAgg,
    activeSubs,
    expiredSubs,
    contactNew,
  ] = await Promise.all([
    User.countDocuments(),
    User.countDocuments({ status: "ACTIVE" }),
    User.countDocuments({ status: "PENDING" }),
    User.countDocuments({ status: "INACTIVE" }),
    User.countDocuments({ role: { $in: [ROLES.ADMIN, ROLES.SUPERADMIN, ROLES.EDITOR] } }),
    Biodata.countDocuments({ status: "APPROVED", gender: "MALE" }),
    Biodata.countDocuments({ status: "APPROVED", gender: "FEMALE" }),
    Biodata.countDocuments(),
    Biodata.countDocuments({ status: "APPROVED" }),
    Biodata.countDocuments({ status: "PENDING" }),
    Biodata.countDocuments({ status: "REJECTED" }),
    Biodata.countDocuments({ status: "HIDDEN" }),
    User.countDocuments({ createdAt: { $gte: today } }),
    User.countDocuments({ createdAt: { $gte: weekAgo } }),
    Biodata.countDocuments({ createdAt: { $gte: weekAgo } }),
    Biodata.aggregate([
      { $group: { _id: null, total: { $sum: "$viewCount" } } },
    ]),
    Like.countDocuments(),
    Like.countDocuments({ createdAt: { $gte: weekAgo } }),
    mutualMatchCount(),
    Conversation.countDocuments({ deletedFor: { $size: 0 } }),
    Conversation.countDocuments({
      deletedFor: { $size: 0 },
      lastMessageAt: { $gte: weekAgo },
    }),
    Message.countDocuments({ status: "SENT" }),
    Order.countDocuments({ status: ORDER_STATUSES.PENDING }),
    Order.countDocuments({ status: ORDER_STATUSES.FAILED }),
    Order.countDocuments({ status: ORDER_STATUSES.PAID }),
    Order.aggregate([
      { $match: { status: ORDER_STATUSES.PAID } },
      { $group: { _id: null, total: { $sum: "$total" }, count: { $sum: 1 } } },
    ]),
    Subscription.countDocuments({ status: "ACTIVE", expiresAt: { $gt: now } }),
    Subscription.countDocuments({ status: "EXPIRED" }),
    ContactMessage.countDocuments({ status: "NEW" }),
  ]);

  // revenue this week / this month
  const [weekRev, monthRev, todayRev] = await Promise.all([
    revenueSince(weekAgo),
    revenueSince(monthAgo),
    revenueSince(today),
  ]);

  const revenue = singleTotal(revenueAgg);

  return {
    users: {
      total: userTotal,
      active: userActive,
      pending: userPending,
      inactive: userInactive,
      staff: admins,
      newToday: newUsersToday,
      newThisWeek: newUsersWeek,
      newThisMonth: await User.countDocuments({ createdAt: { $gte: monthAgo } }),
    },
    biodatas: {
      total: biodataTotal,
      approved: biodataApproved,
      pending: biodataPending,
      rejected: biodataRejected,
      hidden: biodataHidden,
      grooms,
      brides,
      totalViews: singleTotal(viewAgg),
      newThisWeek: newBiodatasWeek,
    },
    interests: {
      sent: likesSentAgg,
      accepted: mutualMatches,
      newThisWeek: likesWeekAgg,
    },
    messaging: {
      conversations: conversationsTotal,
      activeThisWeek: conversationsActive,
      unreadMessages: unreadAgg,
    },
    revenue: {
      totalPaidOrders: paidOrders,
      revenueBdt: revenue,
      todayBdt: todayRev,
      thisWeekBdt: weekRev,
      thisMonthBdt: monthRev,
    },
    payments: {
      pendingOrders: ordersPending,
      failedOrders: ordersFailed,
    },
    membership: {
      activeSubscriptions: activeSubs,
      expiredSubscriptions: expiredSubs,
    },
    support: { newMessages: contactNew },
  };
}

async function revenueSince(since) {
  const res = await Order.aggregate([
    { $match: { status: ORDER_STATUSES.PAID, paidAt: { $gte: since } } },
    { $group: { _id: null, total: { $sum: "$total" } } },
  ]);
  return singleTotal(res);
}

/** Public landing counters (accounts, grooms, brides, marriages). */
export async function siteStats() {
  const [accounts, grooms, brides] = await Promise.all([
    User.countDocuments({ status: "ACTIVE" }),
    Biodata.countDocuments({ status: "APPROVED", gender: "MALE" }),
    Biodata.countDocuments({ status: "APPROVED", gender: "FEMALE" }),
  ]);
  // Marriages completed — placeholder counter; connect to a future
  // "marriageConfirmed" event/collection when the feature ships.
  const marriagesCompleted = 0;
  return { accounts, grooms, brides, marriagesCompleted };
}

export default { dashboardStats, siteStats };
