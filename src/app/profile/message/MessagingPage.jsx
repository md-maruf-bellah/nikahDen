"use client";
import React, { useState, useEffect, useRef, useCallback } from "react";
import { Search, Send, ArrowLeft, Ban, CheckCircle2, CreditCard, TriangleAlert } from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { conversationApi, blockApi, userApi, tokenStore } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import {
  ICE_BREAKER_TEXT,
  asArray,
  buildFallbackConversation,
  canSendMessage,
  canStartChatWith,
  chatParamAction,
  createMemberSearchEngine,
  filterConversations,
  guardNoticeFor,
  makeOptimisticMessage,
  memberRowState,
  pickFreshConversation,
  planOpenChatWithUser,
  resolveOptimisticId,
  revertOptimistic,
  shouldAutoOpenFirst,
  shouldHandleLiveMessage,
  shouldReleasePendingChat,
  startFailureNotice,
  appendLiveMessage,
  timeLabel,
} from "@/components/Messenger.core.mjs";
import { ensureSocket, onSocketEvent } from "@/lib/socket";

const MessagingApp = () => {
  const { user } = useAuth();
  const [conversations, setConversations] = useState([]);
  const [activeChat, setActiveChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState("");
  const [showChatWindow, setShowChatWindow] = useState(false);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [blockedByMe, setBlockedByMe] = useState(false);
  const [blockBusy, setBlockBusy] = useState(false);
  // সদস্য-খোঁজা: কথোপকথনের বাইরে নতুন মানুষের সাথে শুরু করার জন্য
  const [memberResults, setMemberResults] = useState(null); // null = বন্ধ, [] = ফলাফল নেই
  const [searchBusy, setSearchBusy] = useState(false);
  const [startBusyId, setStartBusyId] = useState(null);
  // messaging guard-এর 402/403 ধরে দেখানোর ইনলাইন নোটিস (null = নেই)
  const [guardNotice, setGuardNotice] = useState(null);
  const scrollRef = useRef(null);
  // সদস্য-খোঁজা ইঞ্জিন — ডিবাউন্স+প্রিভিউ-মার্জ কোর-মডিউলে; setState এখানেই inject
  const memberSearchRef = useRef(null);
  if (!memberSearchRef.current) {
    memberSearchRef.current = createMemberSearchEngine({
      searchUsers: userApi.search,
      searchIntent: userApi.searchIntent,
      setResults: setMemberResults,
      setBusy: setSearchBusy,
    });
  }
  const searchParams = useSearchParams();
  const handledChatRef = useRef(null);
  const [pendingChat, setPendingChat] = useState(null);

  const loadConversations = useCallback(async () => {
    try {
      const arr = asArray(await conversationApi.list({ limit: 50 }));
      setConversations(arr);
      if (shouldAutoOpenFirst(arr, activeChat)) {
        // প্রথম কথোপকথন শুধু প্রিভিউ — মেসেজ GET করলেই সার্ভার mark-read করে দেয়,
        // তাই unread ব্যাজ বাঁচাতে এখানে মেসেজ লোড করা হয় না; ক্লিকে লোড হবে।
        setActiveChat(arr[0]);
        setMessages([]);
      }
      // কলার (openChatWithUser) ফ্রেশ অবজেক্ট থেকে চ্যাট খুলতে পারে — পার্টনার-নামসহ
      return arr;
    } catch {
      setConversations([]);
      return [];
    } finally {
      setLoading(false);
    }
  }, [activeChat]);

  useEffect(() => {
    let cancelled = false;
    Promise.resolve().then(() => {
      if (!cancelled) return loadConversations();
    });
    return () => {
      cancelled = true;
    };
  }, [loadConversations]);

  const openChat = useCallback(
    async (conversation) => {
      setActiveChat(conversation);
      setShowChatWindow(true);
      setBlockedByMe(false);
      setGuardNotice(null);
      // এই পার্টনার-প্রতি আমার block-স্টেট (নীরব — এররে বাটন লুকাবে)
      if (conversation.partner?.id) {
        blockApi
          .statusFor(conversation.partner.id)
          .then((s) => setBlockedByMe(Boolean(s?.blockedByMe)))
          .catch(() => {});
      }
      try {
        const list = await conversationApi.messages(conversation.id, { limit: 100 });
        setMessages(asArray(list));
        // GET মেসেজেই সার্ভার mark-read করে; তালিকার ব্যাজ রিফ্রেশ করুন
        loadConversations();
      } catch {
        setMessages([]);
      }
    },
    [loadConversations]
  );

  // block/unblock — সফল হলে স্টেট টগল; ইনপুট blocked অবস্থায় বন্ধ থাকে
  const toggleBlock = async () => {
    if (!activeChat?.partner?.id || blockBusy) return;
    setBlockBusy(true);
    try {
      if (blockedByMe) {
        await blockApi.unblock(activeChat.partner.id);
        setBlockedByMe(false);
      } else {
        await blockApi.block(activeChat.partner.id);
        setBlockedByMe(true);
        setInputText("");
      }
      // ব্লক-তালিকা পেজ খোলা থাকলে সেটি লাইভ আপডেট হবে
      window.dispatchEvent(new Event("blocks-changed"));
    } catch {
      /* নীরব — বাটন আগের স্টেটেই থাকবে */
    } finally {
      setBlockBusy(false);
    }
  };

  // অটো স্ক্রল টু বটম
  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSendMessage = async () => {
    if (!canSendMessage(inputText, activeChat, blockedByMe)) return;
    const text = inputText;
    const tmpId = `tmp-${Date.now()}`;
    setInputText("");
    setGuardNotice(null);
    setMessages((prev) => [...prev, makeOptimisticMessage({ tmpId, senderId: user?.id, text })]);
    try {
      const sent = await conversationApi.send(activeChat.id, text);
      setMessages((prev) => resolveOptimisticId(prev, tmpId, sent.id));
      loadConversations();
    } catch (err) {
      // অপটিমিস্টিক বার্তা তুলে ফেলে নোটিস দেখাই — guard-এর 402/403-এ আপগ্রেড লিংকসহ
      setMessages((prev) => revertOptimistic(prev, tmpId));
      const notice = guardNoticeFor(err?.errorCode, err?.message);
      if (notice) setGuardNotice(notice);
    }
  };

  const filtered = filterConversations(conversations, search);

  // টাইপ করলে ৩০০ms ডিবাউন্সে সদস্য-খোঁজা — ফলাফল কথোপকথন তালিকার নিচে
  // (ডিবাউন্স+প্রিভিউ-মার্জ ইঞ্জিন Messenger.core.mjs-এ)
  const handleSearchInput = (value) => {
    setSearch(value);
    memberSearchRef.current.onInput(value);
  };

  // বায়োডাটা কার্ডের Message বোতাম → /profile?tab=মেসেজিং&chat=<userId> ডিপ-লিংক:
  // পরিচিত সদস্য হলে সেই conversation খোলে, না হলে আইস-ব্রেকারসহ নতুন শুরু করে।
  const openChatWithUser = useCallback(
    async (partnerId) => {
      // খোলার সিদ্ধান্ত (ignore/open/start) মূল কোরে — Messenger.core.planOpenChatWithUser
      const plan = planOpenChatWithUser({ partnerId, userId: user?.id, conversations });
      if (plan.action === "ignore") return;
      if (plan.action === "open") {
        openChat(plan.conversation);
        return;
      }
      setGuardNotice(null);
      try {
        const res = await conversationApi.start({ recipientId: partnerId, text: ICE_BREAKER_TEXT });
        const convoId = res?.conversation?.id;
        const arr = await loadConversations();
        // সার্ভার-রেশেপড অবজেক্ট থেকে খুলি — পার্টনার-নাম সাথে সাথেই দেখা যায়
        const fresh = pickFreshConversation(arr, convoId, partnerId);
        openChat(fresh);
      } catch (err) {
        const notice = startFailureNotice(err);
        if (notice) setGuardNotice(notice);
      }
    },
    [conversations, user?.id, openChat, loadConversations]
  );

  // ?chat= প্যারামিটার খাওয়া — একবারই; conversation তালিকা লোড হওয়ার পরে প্রসেস হবে
  useEffect(() => {
    const action = chatParamAction(searchParams?.get("chat"), handledChatRef.current, Boolean(tokenStore.getAccess()));
    if (!action) return;
    handledChatRef.current = action.chat;
    if (action.pending) setPendingChat(action.pending);
    // URL পরিষ্কার — ?chat= সরিয়ে শুধু tab রাখি (retrigger হয় না)
    window.history.replaceState(null, "", action.cleanUrl);
  }, [searchParams]);

  // unmount-এ পেন্ডিং সদস্য-খোঁজা বাতিল
  useEffect(() => () => memberSearchRef.current?.clear(), []);

  // রিয়েলটাইম — খোলা চ্যাটে নতুন মেসেজ সাথে সাথেই বসে; তালিকার ব্যাজও রিফ্রেশ
  useEffect(() => {
    if (!tokenStore.getAccess() && !tokenStore.getRefresh()) return;
    ensureSocket(() => tokenStore.getAccess());
    const off = onSocketEvent("message:new", (msg) => {
      if (shouldHandleLiveMessage(msg, activeChat?.id)) {
        setMessages((prev) => appendLiveMessage(prev, msg));
      }
      loadConversations();
    });
    return off;
  }, [activeChat?.id, loadConversations]);

  useEffect(() => {
    // গেট কোরে (shouldReleasePendingChat): তালিকা লোড + pending থাকলেই একবার —
    // পরে সাথে সাথে null করে দেওয়ায় রি-রেন্ডারে আবার খোলে না
    if (!shouldReleasePendingChat(loading, pendingChat)) return;
    setPendingChat(null);
    openChatWithUser(pendingChat);
  }, [pendingChat, loading, openChatWithUser]);

  // খোঁজা সদস্যের সাথে কথোপকথন শুরু — ভার্চুয়াল row দেখানোর জন্য স্থানীয়ভাবে যোগ
  const startChatWith = async (member) => {
    // guard-প্রিভিউতে নিষ্ক্রিয় হলে ক্লিকই নেই
    if (!canStartChatWith(member, startBusyId)) return;
    setStartBusyId(member.id);
    try {
      const res = await conversationApi.start({ recipientId: member.id, text: ICE_BREAKER_TEXT });
      const convoId = res?.conversation?.id;
      setSearch("");
      setMemberResults(null);
      await loadConversations();
      const fresh = buildFallbackConversation(convoId, member.id, member.name, member.avatar);
      openChat(fresh);
    } catch (err) {
      // guard-এর 402/403 — নোটিস দেখাই (আপগ্রেড লিংকসহ); ব্লকড হলে নীরব
      const notice = startFailureNotice(err);
      if (notice) setGuardNotice(notice);
    } finally {
      setStartBusyId(null);
    }
  };

  return (
    <div className="flex h-[75vh]  lg:h-[100vh] lg:max-w-full w-full m-auto bg-base-200 border  border-primary/40 rounded-lg  overflow-hidden relative">
      {/* Left Side: Chat List */}
      <div
        className={`w-full lg:w-80 border-r border-gray-100 flex flex-col ${showChatWindow ? "hidden lg:flex" : "flex"}`}
      >
        <div className="p-5">
          <div className="relative">
            <Search
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
              size={18}
            />
            <input
              type="text"
              value={search}
              onChange={(e) => handleSearchInput(e.target.value)}
              placeholder="Search"
              className="w-full pl-10 pr-4 py-2.5 bg-gray-50 rounded-xl text-sm focus:outline-none border border-transparent focus:border-red-200 transition-all"
            />
          </div>
          {searchBusy && (
            <p className="text-center text-[11px] text-gray-400 mt-2">খোঁজা হচ্ছে...</p>
          )}
        </div>

        <div className="flex-1 overflow-y-auto">
          {loading && (
            <p className="text-center text-xs text-gray-400 py-10">লোড হচ্ছে...</p>
          )}
          {!loading && filtered.length === 0 && (
            <p className="text-center text-xs text-gray-400 py-10">
              কোনো কথোপকথন নেই
            </p>
          )}
          {filtered.map((c) => (
            <div
              key={c.id}
              onClick={() => openChat(c)}
              className={`flex items-center gap-3 p-2 cursor-pointer transition-all ${
                activeChat?.id === c.id
                  ? "bg-red-100 border-r-4 border-red-400"
                  : "hover:bg-gray-50"
              }`}
            >
              <div className="relative">
                <img
                  src={c.partner?.avatar || `https://i.pravatar.cc/150?u=${c.partner?.id || c.id}`}
                  className="w-12 h-12 rounded-full object-cover"
                  alt="user"
                />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-center">
                  <h4 className="font-bold text-gray-800 text-sm truncate">
                    {c.partner?.name || "ব্যবহারকারী"}
                  </h4>
                  <span className="text-[10px] text-gray-400">
                    {timeLabel(c.lastMessage?.createdAt || c.lastMessageAt)}
                  </span>
                </div>
                <div className="flex items-center justify-between gap-2">
                  <p className="text-[11px] text-gray-500 truncate">
                    {c.lastMessage?.text || "কথোপকথন শুরু করুন"}
                  </p>
                  {c.unreadCount > 0 && (
                    <span className="badge badge-error badge-sm text-white shrink-0">
                      {c.unreadCount}
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}

          {/* সদস্য-খোঁজার ফলাফল — নতুন কথোপকথন শুরু করার জন্য */}
          {Array.isArray(memberResults) && (
            <div className="border-t border-gray-100 mt-2 pt-2">
              <p className="px-3 pt-1 pb-2 text-[11px] font-bold text-gray-400 uppercase tracking-wide">
                {memberResults.length > 0 ? "সদস্য পাওয়া গেছে — ক্লিক করে কথা শুরু করুন" : "কোনো সদস্য পাওয়া যায়নি"}
              </p>
              {memberResults.map((m) => {
                const row = memberRowState(m, conversations);
                return (
                  <div
                    key={m.id}
                    onClick={() => !row.disabled && startChatWith(m)}
                    className={`flex items-center gap-3 p-2 transition-all ${
                      row.disabled || row.already ? "opacity-55" : "cursor-pointer hover:bg-gray-50"
                    }`}
                  >
                    <img
                      src={m.avatar || `https://i.pravatar.cc/150?u=${m.id}`}
                      className={`w-10 h-10 rounded-full object-cover ${disabled ? "grayscale" : ""}`}
                      alt="member"
                    />
                    <div className="flex-1 min-w-0">
                      <h4 className="font-bold text-gray-800 text-sm truncate">{m.name}</h4>
                      <p className="text-[11px] text-gray-400">
                        {row.reasonLabel || (row.already ? "ইতিমধ্যে কথোপকথনে আছেন" : "নতুন কথোপকথন শুরু করুন")}
                      </p>
                    </div>
                    {row.disabled ? (
                      <span className="badge badge-xs badge-ghost border-gray-200 text-gray-400 shrink-0">নিষ্ক্রিয়</span>
                    ) : row.already ? (
                      <span className="badge badge-xs badge-ghost border-gray-200 text-gray-400 shrink-0">চালু আছে</span>
                    ) : null}
                    {startBusyId === m.id && (
                      <span className="loading loading-spinner loading-xs text-red-400 shrink-0"></span>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Right Side: Conversation Area */}
      <div
        className={`flex-1 flex flex-col transition-all duration-300 ${!showChatWindow ? "hidden lg:flex" : "flex"}`}
      >
        {!activeChat ? (
          <div className="flex-1 flex items-center justify-center text-gray-400 text-sm">
            একটি কথোপকথন নির্বাচন করুন
          </div>
        ) : (
          <>
            {/* Chat Header */}
            <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-white/80 backdrop-blur-md sticky top-0 z-10">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setShowChatWindow(false)}
                  className="lg:hidden p-1 text-gray-500 hover:bg-gray-100 rounded-full"
                >
                  <ArrowLeft size={20} />
                </button>
                <div className="relative">
                  <img
                    src={activeChat.partner?.avatar || `https://i.pravatar.cc/150?u=${activeChat.partner?.id || activeChat.id}`}
                    className="w-10 h-10 rounded-full"
                    alt="active user"
                  />
                </div>
                <div>
                  <h3 className="font-bold text-gray-800 text-sm">
                    {activeChat.partner?.name || "ব্যবহারকারী"}
                  </h3>
                </div>
              </div>
              {/* Block / Unblock — সবচেয়ে ক্ষুদ্র টাচ-টার্গেট; blocked হলে সবুজ টগল */}
              {activeChat.partner?.id && (
                <button
                  onClick={toggleBlock}
                  disabled={blockBusy}
                  title={blockedByMe ? "আনব্লক করুন" : "ব্লক করুন"}
                  className={`btn btn-xs border-none gap-1 ${
                    blockedByMe
                      ? "bg-green-50 text-green-600 hover:bg-green-100"
                      : "bg-red-50 text-red-500 hover:bg-red-100"
                  }`}
                >
                  {blockedByMe ? <CheckCircle2 size={14} /> : <Ban size={14} />}
                  <span className="hidden sm:inline text-[11px]">
                    {blockedByMe ? "আনব্লক" : "ব্লক"}
                  </span>
                </button>
              )}
            </div>

            {/* Message Container */}
            <div className="flex-1 p-4 md:p-8 overflow-y-auto space-y-8 chat-scroll">
              {messages.map((msg) => {
                const isMe = msg.sender === user?.id;
                return (
                  <div
                    key={msg.id}
                    className={`flex flex-col ${isMe ? "items-end" : "items-start"}`}
                  >
                    <div
                      className={`flex items-center gap-3 mb-2 ${isMe ? "flex-row-reverse" : ""}`}
                    >
                      <img
                        src={`https://i.pravatar.cc/150?u=${isMe ? "me" : activeChat.partner?.id || activeChat.id}`}
                        className="w-8 h-8 rounded-full"
                        alt="avatar"
                      />
                      <div className={isMe ? "text-right" : "text-left"}>
                        <h5 className="text-[12px] font-bold text-gray-800">
                          {isMe ? "আমি" : activeChat.partner?.name || "ব্যবহারকারী"}
                        </h5>
                        <p className="text-[10px] text-gray-400">
                          {timeLabel(msg.createdAt)}
                        </p>
                      </div>
                    </div>

                    <div
                      className={`max-w-[85%] md:max-w-[70%] p-4 rounded-2xl text-sm shadow-sm ${
                        isMe
                          ? "bg-[#fff5f5] text-gray-700 rounded-tr-none border border-red-50"
                          : "bg-gray-50 text-gray-700 rounded-tl-none border border-gray-100"
                      }`}
                    >
                      {msg.text}
                    </div>
                  </div>
                );
              })}
              <div ref={scrollRef} />
            </div>

            {/* Message Input — blocked অবস্থায় বন্ধ (নীরব দেয়াল) */}
            <div className="p-4 md:p-6 border-t border-gray-100">
              {guardNotice && !blockedByMe && (
                <div
                  className={`mb-3 flex flex-wrap items-center gap-2 rounded-lg border px-3 py-2 text-xs ${
                    guardNotice.upgrade
                      ? "bg-amber-50 border-amber-200 text-amber-800"
                      : "bg-red-50 border-red-200 text-red-600"
                  }`}
                >
                  <TriangleAlert size={14} className="shrink-0" />
                  <span className="flex-1 min-w-[12rem]">{guardNotice.text}</span>
                  {guardNotice.upgrade && (
                    <Link
                      href="/member"
                      className="btn btn-xs border-none bg-[#fd6969] text-white hover:bg-[#e85a5a] gap-1"
                    >
                      <CreditCard size={12} /> প্যাকেজ আপগ্রেড করুন
                    </Link>
                  )}
                </div>
              )}
              {blockedByMe ? (
                <p className="text-center text-xs text-gray-400 py-2 flex items-center justify-center gap-2">
                  <Ban size={14} /> আপনি এই ব্যবহারকারীকে ব্লক করেছেন — মেসেজ বন্ধ
                </p>
              ) : (
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleSendMessage();
                  }}
                  className="flex items-center gap-4"
                >
                  <input
                    type="text"
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    placeholder="Type a Message..."
                    className="flex-1 text-base focus:outline-none py-2 bg-transparent"
                  />
                  <button
                    type="submit"
                    className="btn bg-[#ff7675] hover:bg-[#ff5e5d] text-white border-none px-6 py-2 rounded-xl h-auto min-h-0 flex items-center gap-2 group transition-all"
                  >
                    <span className="text-sm font-medium hidden sm:inline">
                      Send Message
                    </span>
                    <Send
                      size={16}
                      className="group-hover:translate-x-1 group-hover:-translate-y-0.5 transition-transform"
                    />
                  </button>
                </form>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default MessagingApp;