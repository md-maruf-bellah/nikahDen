import mongoose from "mongoose";
import Conversation from "../../models/conversation.model.js";
import Message from "../../models/message.model.js";
import User from "../../models/user.model.js";
import Notification from "../../models/notification.model.js";
import { ApiError } from "../../utils/ApiError.js";
import { parsePagination, buildPagination } from "../../utils/pagination.js";
import { isValidObjectId } from "../../utils/helpers.js";
import { NOTIFICATION_TYPES, USER_STATUSES } from "../../constants/index.js";

const OID = mongoose.Types.ObjectId;

async function assertRecipient(recipientId, senderId) {
  if (!isValidObjectId(recipientId)) throw ApiError.badRequest("Invalid recipientId", "INVALID_ID");
  if (recipientId === senderId) throw ApiError.badRequest("You cannot message yourself.", "SELF_MESSAGE");
  const user = await User.findOne({ _id: recipientId, status: USER_STATUSES.ACTIVE }).select("_id firstName lastName").lean();
  if (!user) throw ApiError.notFound("Recipient not found", "RECIPIENT_NOT_FOUND");
  return user;
}

export async function myConversations(userId, { page = 1, limit = 20, search } = {}) {
  const filter = { participants: userId, deletedFor: { $ne: userId } };
  const partnerQuery = [
    { $match: { participants: new OID(userId), deletedFor: { $ne: new OID(userId) } } },
    { $sort: { lastMessageAt: -1, _id: -1 } },
  ];
  if (search) {
    const rx = search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    partnerQuery.unshift({ $match: { lastMessage: { $regex: rx, $options: "i" } } });
  }
  const total = await Conversation.countDocuments(filter);

  const conversations = await Conversation.aggregate([
    ...partnerQuery,
    { $skip: (page - 1) * limit },
    { $limit: limit },
    {
      $lookup: {
        from: "messages",
        localField: "_id",
        foreignField: "conversation",
        as: "allMessages",
        pipeline: [
          { $sort: { createdAt: -1 } },
          { $limit: 1 },
          { $project: { text: 1, createdAt: 1, sender: 1, status: 1 } },
        ],
      },
    },
    { $unwind: { path: "$allMessages", preserveNullAndEmptyArrays: true } },
    {
      $lookup: {
        from: "users",
        localField: "participants",
        foreignField: "_id",
        as: "participantUsers",
        pipeline: [{ $project: { firstName: 1, lastName: 1, avatar: 1, role: 1 } }],
      },
    },
  ]);

  const items = conversations.map((c) => {
    const partner = c.participantUsers.find((u) => u._id.toString() !== userId) || null;
    const me = c.participantUsers.find((u) => u._id.toString() === userId) || null;
    return {
      id: c._id.toString(),
      partner: partner ? { id: partner._id.toString(), name: `${partner.firstName} ${partner.lastName}`.trim(), avatar: partner.avatar } : null,
      me: me ? { id: me._id.toString(), name: `${me.firstName} ${me.lastName}`.trim() } : null,
      lastMessage: c.allMessages || null,
      lastMessageAt: c.lastMessageAt,
      updatedAt: c.updatedAt,
    };
  });
  return { items, pagination: buildPagination(total, page, limit) };
}

export async function startConversation(userId, { recipientId, text }) {
  await assertRecipient(recipientId, userId);

  let conversation = await Conversation.findOne({
    participants: { $all: [userId, recipientId], $size: 2 },
    // not deleted for me (restarting a deleted conversation is allowed)
  }).populate("participants");

  if (!conversation) {
    conversation = await Conversation.create({
      participants: [userId, recipientId],
      createdBy: userId,
    });
  } else {
    // Re-add to my inbox if I had deleted it.
    await Conversation.updateOne(
      { _id: conversation._id },
      { $pull: { deletedFor: userId }, $set: { lastMessageAt: conversation.lastMessageAt || new Date() } }
    );
  }

  let message = null;
  if (text) {
    message = await sendMessageTo(userId, conversation._id.toString(), text);
  }

  const final = await Conversation.findById(conversation._id).lean();
  return { conversation: { id: final._id.toString(), createdAt: final.createdAt }, message };
}

export async function getConversationMessages(userId, conversationId, { page = 1, limit = 50 } = {}) {
  await assertParticipant(userId, conversationId);

  const { skip } = parsePagination({ page, limit });
  // Mark everything delivered to me as read (when I am the recipient).
  await Message.updateMany(
    { conversation: conversationId, recipient: userId, status: "SENT" },
    { $set: { status: "READ", readAt: new Date() } }
  );

  const total = await Message.countDocuments({ conversation: conversationId });
  const docs = await Message.find({ conversation: conversationId })
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .lean();

  return {
    items: docs
      .reverse()
      .map((m) => ({
        id: m._id.toString(),
        sender: m.sender.toString(),
        recipient: m.recipient.toString(),
        text: m.text,
        status: m.status,
        readAt: m.readAt,
        createdAt: m.createdAt,
      })),
    pagination: buildPagination(total, page, limit),
  };
}

export async function sendMessage(userId, conversationId, text) {
  await assertParticipant(userId, conversationId);
  return sendMessageTo(userId, conversationId, text);
}

async function sendMessageTo(userId, conversationId, text) {
  const conversation = await Conversation.findById(conversationId);
  if (!conversation) throw ApiError.notFound("Conversation not found", "CONVERSATION_NOT_FOUND");

  const recipientId = conversation.participants.find((p) => p.toString() !== userId);
  if (!recipientId) throw ApiError.badRequest("Conversation is corrupted.", "BAD_CONVERSATION");

  const message = await Message.create({
    conversation: conversationId,
    sender: userId,
    recipient: recipientId,
    text,
  });

  conversation.lastMessage = text.slice(0, 300);
  conversation.lastMessageAt = new Date();
  await conversation.save();

  await Notification.create({
    user: recipientId,
    type: NOTIFICATION_TYPES.MESSAGE,
    title: "You have a new message",
    body: text.slice(0, 160),
    data: { kind: "conversation", id: conversationId },
  });

  return {
    id: message._id.toString(),
    text: message.text,
    createdAt: message.createdAt,
    sender: userId,
    recipient: recipientId.toString(),
  };
}

export async function markRead(userId, conversationId) {
  await assertParticipant(userId, conversationId);
  const res = await Message.updateMany(
    { conversation: conversationId, recipient: userId, status: "SENT" },
    { $set: { status: "READ", readAt: new Date() } }
  );
  return { marked: res.modifiedCount };
}

export async function deleteConversation(userId, conversationId) {
  if (!isValidObjectId(conversationId)) throw ApiError.badRequest("Invalid conversation id", "INVALID_ID");
  const conversation = await Conversation.findOne({ _id: conversationId, participants: userId });
  if (!conversation) throw ApiError.notFound("Conversation not found", "CONVERSATION_NOT_FOUND");

  await Conversation.updateOne({ _id: conversation._id }, { $addToSet: { deletedFor: userId } });

  const bothDeleted = conversation.participants.every((p) => conversation.deletedFor.some((d) => d.toString() === p.toString()) || p.toString() === userId);
  if (bothDeleted) {
    await Message.deleteMany({ conversation: conversation._id });
    await Conversation.deleteOne({ _id: conversation._id });
    return { deleted: true };
  }
  return { deleted: false, hiddenForMe: true };
}

async function assertParticipant(userId, conversationId) {
  if (!isValidObjectId(conversationId)) throw ApiError.badRequest("Invalid conversation id", "INVALID_ID");
  const conversation = await Conversation.findOne({ _id: conversationId, participants: userId });
  if (!conversation) throw ApiError.notFound("Conversation not found", "CONVERSATION_NOT_FOUND");
  if (conversation.deletedFor.some((d) => d.toString() === userId)) {
    throw ApiError.notFound("Conversation not found", "CONVERSATION_NOT_FOUND");
  }
  return conversation;
}

export default { myConversations, startConversation, getConversationMessages, sendMessage, markRead, deleteConversation };
