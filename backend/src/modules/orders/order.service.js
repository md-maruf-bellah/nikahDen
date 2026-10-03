import mongoose from "mongoose";
import Order from "../../models/order.model.js";
import Coupon from "../../models/coupon.model.js";
import MembershipPlan from "../../models/membershipPlan.model.js";
import ConnectPack from "../../models/connectPack.model.js";
import Subscription from "../../models/subscription.model.js";
import Notification from "../../models/notification.model.js";
import User from "../../models/user.model.js";
import { getNextSequence } from "../../models/counter.model.js";
import { ApiError } from "../../utils/ApiError.js";
import { withTransaction } from "../../config/db.js";
import { emitNewNotification } from "../notifications/notification.service.js";
import { isValidObjectId, randomToken, pick } from "../../utils/helpers.js";
import { parsePagination, buildPagination, parseSort } from "../../utils/pagination.js";
import { addConnectCredit } from "../membership/connect.service.js";
import {
  CONNECT_TYPES,
  NOTIFICATION_TYPES,
  ORDER_KINDS,
  ORDER_STATUSES,
  ROLES,
} from "../../constants/index.js";

const STAFF_ROLES = [ROLES.SUPERADMIN, ROLES.ADMIN];

async function resolveCoupon(code) {
  if (!code) return null;
  const coupon = await Coupon.findOne({ code: code.toUpperCase(), isActive: true });
  if (!coupon) throw ApiError.badRequest("Invalid coupon code.", "INVALID_COUPON");

  const now = new Date();
  if (coupon.validFrom && coupon.validFrom > now) {
    throw ApiError.badRequest("This coupon is not valid yet.", "INVALID_COUPON");
  }
  if (coupon.validUntil && coupon.validUntil < now) {
    throw ApiError.badRequest("This coupon has expired.", "COUPON_EXPIRED");
  }
  if (coupon.maxUses != null && coupon.usedCount >= coupon.maxUses) {
    throw ApiError.badRequest("This coupon has reached its usage limit.", "COUPON_EXHAUSTED");
  }
  return coupon;
}

async function loadItem(kind, refId) {
  if (kind === ORDER_KINDS.PLAN) {
    if (!isValidObjectId(refId)) throw ApiError.badRequest("Invalid planId", "INVALID_ID");
    const plan = await MembershipPlan.findOne({ _id: refId, isActive: true });
    if (!plan) throw ApiError.notFound("Plan not found or inactive", "PLAN_NOT_FOUND");
    return {
      refId: plan._id,
      title: plan.name,
      titleBn: plan.nameBn,
      unitPrice: plan.price,
      connectCount: plan.connectCount,
      durationDays: plan.durationDays,
      extra: { slug: plan.slug },
    };
  }
  if (!isValidObjectId(refId)) throw ApiError.badRequest("Invalid packId", "INVALID_ID");
  const pack = await ConnectPack.findOne({ _id: refId, isActive: true });
  if (!pack) throw ApiError.notFound("Connect pack not found or inactive", "PACK_NOT_FOUND");
  return {
    refId: pack._id,
    title: pack.name,
    titleBn: pack.name,
    unitPrice: pack.price,
    connectCount: pack.connects,
    durationDays: 0,
    extra: {},
  };
}

/** Integer arithmetic — no floats for money. */
function applyCoupon(unitPrice, coupon) {
  if (!coupon) return { discount: 0, total: unitPrice };
  const discount = Math.floor((unitPrice * coupon.discountPercent) / 100);
  return { discount, total: unitPrice - discount };
}

export async function createOrder(userId, payload) {
  const { kind } = payload;
  const item = await loadItem(kind, payload.kind === ORDER_KINDS.PLAN ? payload.planId : payload.packId);

  const coupon = await resolveCoupon(payload.couponCode);
  const { discount, total } = applyCoupon(item.unitPrice, coupon);
  if (total < 0) throw ApiError.badRequest("Discount exceeds price", "BAD_DISCOUNT");

  const seq = await getNextSequence("order_no");
  const orderNo = `ORD-${new Date().getFullYear()}-${String(seq).padStart(6, "0")}`;

  const order = await Order.create({
    orderNo,
    user: userId,
    kind,
    item: {
      refId: item.refId,
      title: item.title,
      titleBn: item.titleBn,
      unitPrice: item.unitPrice,
      quantity: 1,
      connectCount: item.connectCount,
      durationDays: item.durationDays,
    },
    subtotal: item.unitPrice,
    discount,
    couponCode: coupon?.code || null,
    total,
    status: ORDER_STATUSES.PENDING,
    billing: payload.billing || {},
  });

  const doc = await Order.findById(order._id).lean();
  return decorate(doc);
}

export async function myOrders(userId, query) {
  const filter = { user: userId };
  if (query.status) filter.status = query.status;
  if (query.kind) filter.kind = query.kind;

  const { page, limit, skip } = parsePagination(query);
  const sort = parseSort(query, ["createdAt", "updatedAt", "total"], "createdAt");

  const [total, docs] = await Promise.all([
    Order.countDocuments(filter),
    Order.find(filter).sort(sort).skip(skip).limit(limit).lean(),
  ]);
  return { items: docs.map(decorate), pagination: buildPagination(total, page, limit) };
}

export async function getOrder(userId, id, actor) {
  if (!isValidObjectId(id)) throw ApiError.badRequest("Invalid order id", "INVALID_ID");
  const order = await Order.findById(id).lean();
  if (!order) throw ApiError.notFound("Order not found", "ORDER_NOT_FOUND");

  const isOwner = order.user.toString() === userId;
  const staff = actor && STAFF_ROLES.includes(actor.role);
  if (!isOwner && !staff) {
    throw ApiError.forbidden("You can only view your own orders.", "OWNER_ONLY");
  }
  return decorate(order);
}

export async function cancelOrder(userId, id) {
  if (!isValidObjectId(id)) throw ApiError.badRequest("Invalid order id", "INVALID_ID");
  const order = await Order.findOne({ _id: id, user: userId });
  if (!order) throw ApiError.notFound("Order not found", "ORDER_NOT_FOUND");
  if (order.status !== ORDER_STATUSES.PENDING) {
    throw ApiError.conflict("Only pending orders can be cancelled.", "ORDER_NOT_CANCELLABLE");
  }
  order.status = ORDER_STATUSES.CANCELLED;
  order.cancelledAt = new Date();
  await order.save();
  return decorate(order.toObject());
}

/**
 * The one place real money changes hands. Everything (order mark-paid,
 * subscription activation, connect credits, invoice number) commits together —
 * or nothing does.
 */
export async function payOrder(userId, id, { paymentMethod = "CARD", transactionRef } = {}) {
  if (!isValidObjectId(id)) throw ApiError.badRequest("Invalid order id", "INVALID_ID");

  // ট্রানজ্যাকশনের ভেতরে তৈরি নোটিফিকেশন-ডক — কমিটের পরে এখান থেকেই emit
  let paidNotification = null;
  const result = await withTransaction(async (session) => {
    const order = await Order.findOne({ _id: id, user: userId }).session(session);
    if (!order) throw ApiError.notFound("Order not found", "ORDER_NOT_FOUND");

    if (order.status === ORDER_STATUSES.PAID) {
      throw ApiError.conflict("This order is already paid.", "ALREADY_PAID");
    }
    if (order.status === ORDER_STATUSES.CANCELLED) {
      throw ApiError.conflict("This order was cancelled and cannot be paid.", "ORDER_CANCELLED");
    }

    // Simulated gateway capture. Swap for a real PSP integration.
    const txnRef = transactionRef || `SIM-${randomToken(6).toUpperCase()}`;
    order.status = ORDER_STATUSES.PAID;
    order.paidAt = new Date();
    order.paymentMethod = paymentMethod;
    order.transactionId = txnRef;
    await order.save({ session });

    if (order.kind === ORDER_KINDS.PLAN) {
      await activateSubscription(userId, order, session);
      await addConnectCredit(
        {
          userId,
          type: CONNECT_TYPES.PLAN_GRANT,
          amount: order.item.connectCount,
          reason: `Connects from ${order.item.title} plan`,
          order: order._id,
          metadata: { plan: order.item.title },
        },
        session
      );
    } else {
      await addConnectCredit(
        {
          userId,
          type: CONNECT_TYPES.PACK_PURCHASE,
          amount: order.item.connectCount,
          reason: `${order.item.title} connect pack`,
          order: order._id,
        },
        session
      );
    }

    const invoiceSeq = await getNextSequence("invoice_no", session);
    order.invoiceNo = `INV-${new Date().getFullYear()}-${String(invoiceSeq).padStart(6, "0")}`;
    await order.save({ session });

    const notifDocs = await Notification.create(
      [{
        user: userId,
        type: NOTIFICATION_TYPES.ORDER_PAID,
        title: "Payment successful",
        body: `${order.item.title} — ৳${order.total}. Invoice ${order.invoiceNo}`,
        data: { kind: "order", id: order._id.toString(), invoiceNo: order.invoiceNo },
      }],
      { session }
    );
    paidNotification = notifDocs[0];

    const finalDoc = await Order.findById(order._id).session(session).lean();
    return decorate(finalDoc);
  });

  // ট্রানজ্যাকশন কমিটের পরেই রিয়েলটাইম emit (রোলব্যাক-হলে result undefined → emit হয় না);
  // পে-লোড সরাসরি DB-ডক থেকে — আসল id সহ, বার্তাও ডকের সাথে হুবহু এক
  if (result) {
    emitNewNotification(paidNotification);
  }

  return result;
}

async function activateSubscription(userId, order, session) {
  const now = new Date();
  const days = order.item.durationDays || 30;

  let sub = await Subscription.findOne({ user: userId }).session(session);

  // Extend an active subscription of the same plan; otherwise start a new term.
  let startsAt = now;
  let expiresAt = new Date(now.getTime() + days * 86400000);
  if (sub && sub.status === "ACTIVE" && sub.expiresAt > now) {
    if (sub.plan?.toString() === order.item.refId?.toString()) {
      startsAt = sub.expiresAt;
      expiresAt = new Date(sub.expiresAt.getTime() + days * 86400000);
    } else {
      startsAt = sub.expiresAt;
      expiresAt = new Date(sub.expiresAt.getTime() + days * 86400000);
    }
  }

  if (!sub) {
    sub = new Subscription({ user: userId, plan: order.item.refId });
  }
  sub.plan = order.item.refId;
  sub.planSnapshot = {
    name: order.item.title,
    nameBn: order.item.titleBn,
    durationDays: days,
    price: order.item.unitPrice,
    connectCount: order.item.connectCount,
  };
  sub.status = "ACTIVE";
  sub.startsAt = startsAt;
  sub.expiresAt = expiresAt;
  sub.cancelledAt = null;
  await sub.save({ session });
}

export async function validateCouponPublic(code) {
  const coupon = await resolveCoupon(code);
  return {
    code: coupon.code,
    discountPercent: coupon.discountPercent,
    description: coupon.description,
  };
}

export async function adminOrders(query) {
  const filter = {};
  if (query.status) filter.status = query.status;
  if (query.kind) filter.kind = query.kind;
  if (query.search) {
    const rx = { $regex: query.search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), $options: "i" };
    filter.$or = [{ orderNo: rx }, { invoiceNo: rx }, { "item.title": rx }];
  }

  const { page, limit, skip } = parsePagination(query);
  const sort = parseSort(query, ["createdAt", "updatedAt", "total"], "createdAt");
  const [total, docs] = await Promise.all([
    Order.countDocuments(filter),
    Order.find(filter).sort(sort).skip(skip).limit(limit).populate("user", "firstName lastName email phone").lean(),
  ]);
  const items = docs.map((d) => ({
    ...decorate(d),
    customer: d.user ? { id: d.user._id.toString(), name: `${d.user.firstName} ${d.user.lastName}`.trim(), email: d.user.email, phone: d.user.phone } : null,
  }));
  return { items, pagination: buildPagination(total, page, limit) };
}

function decorate(doc) {
  const obj = { ...doc };
  obj.id = obj._id.toString();
  delete obj._id;
  delete obj.__v;
  return obj;
}

export default { createOrder, myOrders, getOrder, cancelOrder, payOrder, adminOrders, validateCouponPublic, decorate };
