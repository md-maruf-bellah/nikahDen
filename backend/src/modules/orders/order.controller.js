import { asyncHandler } from "../../utils/asyncHandler.js";
import { sendSuccess } from "../../utils/ApiResponse.js";
import * as orderService from "./order.service.js";

export const create = asyncHandler(async (req, res) => {
  const order = await orderService.createOrder(req.user.id, req.body);
  return sendSuccess(res, "Order created. Proceed to payment.", order, undefined, 201);
});

export const mine = asyncHandler(async (req, res) => {
  const { items, pagination } = await orderService.myOrders(req.user.id, req.query);
  return sendSuccess(res, "My orders fetched", items, pagination);
});

export const getOne = asyncHandler(async (req, res) => {
  const order = await orderService.getOrder(req.user.id, req.params.id, req.user);
  return sendSuccess(res, "Order fetched", order);
});

export const cancel = asyncHandler(async (req, res) => {
  const order = await orderService.cancelOrder(req.user.id, req.params.id);
  return sendSuccess(res, "Order cancelled", order);
});

export const pay = asyncHandler(async (req, res) => {
  const order = await orderService.payOrder(req.user.id, req.params.id, req.body);
  return sendSuccess(res, "Payment successful", order);
});

export const validateCoupon = asyncHandler(async (req, res) => {
  const coupon = await orderService.validateCouponPublic(req.body.code);
  return sendSuccess(res, "Coupon is valid", coupon);
});

export const adminList = asyncHandler(async (req, res) => {
  const { items, pagination } = await orderService.adminOrders(req.query);
  return sendSuccess(res, "Orders fetched", items, pagination);
});
