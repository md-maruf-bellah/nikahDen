"use client";
import React, { useState, useEffect, useRef, useCallback } from "react";
import { Search, Send, ArrowLeft, Ban, CheckCircle2, Check, CheckCheck, Clock, CreditCard, TriangleAlert, BookOpen, ChevronDown, ChevronUp, HeartHandshake, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { conversationApi, blockApi, userApi, biodataApi, tokenStore } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { getAdabForReligions, RELIGIOUS_PLEDGE_TEXT } from "@/lib/religiousAdab";
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
  applyReadReceipt,
  presenceTargets,
  receiptKind,
  timeLabel,
  typingEventState,
} from "@/components/Messenger.core.mjs";
import { ensureSocket, emitSocket, onSocketEvent } from "@/lib/socket";

// টাইপিং-সময়: start throttle / কী-নীরবতায় stop / প্রাপকের অটো-মুছে যাওয়া
const TYPING_SEND_MS = 1000;
const TYPING_IDLE_MS = 2000;
const TYPING_SHOW_MS = 4000;

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
  const [myBiodata, setMyBiodata] = useState(null);
  const [showAdabDetails, setShowAdabDetails] = useState(false);
  const [adabPledged, setAdabPledged] = useState(false);
  // সদস্য-খোঁজা: কথোপকথনের বাইরে নতুন মানুষের সাথে শুরু করার জন্য
  const [memberResults, setMemberResults] = useState(null); // null = বন্ধ, [] = ফলাফল নেই
  const [searchBusy, setSearchBusy] = useState(false);
  const [startBusyId, setStartBusyId] = useState(null);
  // messaging guard-এর 402/403 ধরে দেখানোর ইনলাইন নোটিস (null = নেই)
  const [guardNotice, setGuardNotice] = useState(null);
  // রিয়েলটাইম UI — পার্টনার কি টাইপ করছে + পার্টনারদের online-map (presence)
  const [partnerTyping, setPartnerTyping] = useState(false);
  const [onlineMap, setOnlineMap] = useState({});
  const scrollRef = useRef(null);
  // typing/presence-রেফ — টাইমার ও শেষ-পাঠানো অবস্থা (re-render-নিরপেক্ষ)
  const typingExpiryRef = useRef(null);
  const myTypingTimerRef = useRef(null);
  const myTypingActiveRef = useRef(false);
  const lastTypingSentRef = useRef(0);
  const presenceIdsRef = useRef([]);
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

  useEffect(() => {
    if (user?.id) {
      biodataApi.mine().then((b) => setMyBiodata(b)).catch(() => {});
      try {
        const stored = localStorage.getItem("nikahdeen_adab_pledge_accepted");
        if (stored === "true") setAdabPledged(true);
      } catch {}
    }
  }, [user?.id]);

  const handleAcceptPledge = () => {
    setAdabPledged(true);
    try {
      localStorage.setItem("nikahdeen_adab_pledge_accepted", "true");
    } catch {}
  };

  const myReligion = myBiodata?.religion || activeChat?.me?.religion || "Islam";
  const partnerReligion = activeChat?.partner?.religion;
  const isCrossReligion = Boolean(myReligion && partnerReligion && myReligion !== partnerReligion);
  const adabData = getAdabForReligions(myReligion, partnerReligion);

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

  // নিজের typing — এক conversation-এ একবার start (throttle কলার করে),
  // stop শুধু চালু থাকলেই যায় (প্রতি স্টপে অপ্রয়োজনীয় emit নয়)
  const sendMyTyping = useCallback(
    (typing) => {
      const conversationId = activeChat?.id;
      const to = activeChat?.partner?.id;
      if (!conversationId || !to) return;
      if (typing) {
        myTypingActiveRef.current = true;
        lastTypingSentRef.current = Date.now();
      } else if (!myTypingActiveRef.current) {
        return;
      } else {
        myTypingActiveRef.current = false;
      }
      emitSocket("typing", { conversationId, typing });
    },
    [activeChat?.id, activeChat?.partner?.id],
  );

  // ইনপুট-পরিবর্তনে typing:start (১s throttle); ২s কী-নীরবতায় বা পাঠানোর সাথে সাথে stop
  const handleInputChange = (value) => {
    setInputText(value);
    if (myTypingTimerRef.current) {
      clearTimeout(myTypingTimerRef.current);
      myTypingTimerRef.current = null;
    }
    if (!value.trim()) {
      sendMyTyping(false);
      return;
    }
    if (Date.now() - lastTypingSentRef.current >= TYPING_SEND_MS) sendMyTyping(true);
    myTypingTimerRef.current = setTimeout(() => {
      myTypingTimerRef.current = null;
      sendMyTyping(false);
    }, TYPING_IDLE_MS);
  };

  const handleSendMessage = async () => {
    if (!canSendMessage(inputText, activeChat, blockedByMe)) return;
    if (!adabPledged) handleAcceptPledge();
    const text = inputText;
    const tmpId = `tmp-${Date.now()}`;
    setInputText("");
    setGuardNotice(null);
    if (myTypingTimerRef.current) {
      clearTimeout(myTypingTimerRef.current);
      myTypingTimerRef.current = null;
    }
    sendMyTyping(false);
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

  // রিয়েলটাইম — খোলা চ্যাটে মেসেজ/রিড-রসিদ/typing/presence এখানেই জোড়া লাগে
  useEffect(() => {
    if (!tokenStore.getAccess() && !tokenStore.getRefresh()) return;
    ensureSocket(() => tokenStore.getAccess());
    const off = onSocketEvent("message:new", (msg) => {
      if (shouldHandleLiveMessage(msg, activeChat?.id)) {
        setMessages((prev) => appendLiveMessage(prev, msg));
      }
      loadConversations();
    });
    // রিড-রসিদ — পার্টনার পড়লেই নিজের SENT বার্তায় টিক ওঠে
    const offRead = onSocketEvent("message:read", (ev) => {
      setMessages((prev) =>
        applyReadReceipt(prev, ev, { activeConversationId: activeChat?.id, myId: user?.id }),
      );
    });
    // টাইপিং — শুধু এই চ্যাটের পার্টনার; stop না এলেও কয়েক সেকেন্ডে নিজে মুছে যায়
    const offTyping = onSocketEvent("typing", (ev) => {
      const state = typingEventState(ev, {
        activeConversationId: activeChat?.id,
        activePartnerId: activeChat?.partner?.id,
        myId: user?.id,
      });
      if (!state) return;
      if (typingExpiryRef.current) {
        clearTimeout(typingExpiryRef.current);
        typingExpiryRef.current = null;
      }
      if (state === "start") {
        setPartnerTyping(true);
        typingExpiryRef.current = setTimeout(() => setPartnerTyping(false), TYPING_SHOW_MS);
      } else {
        setPartnerTyping(false);
      }
    });
    // presence — পার্টনার সংযোগ/বিচ্ছিন্ন লাইভ; রিকানেক্টে আবার জিজ্ঞেস
    const offPresence = onSocketEvent("presence:update", (ev) => {
      if (!ev?.userId) return;
      setOnlineMap((prev) => ({ ...prev, [ev.userId]: Boolean(ev.online) }));
    });
    const offSnapshot = onSocketEvent("presence:snapshot", (ev) => {
      const online = new Set(ev?.online || []);
      setOnlineMap((prev) => {
        const next = { ...prev };
        for (const id of presenceIdsRef.current) next[id] = online.has(id);
        return next;
      });
    });
    const offConnected = onSocketEvent("connected", () => {
      if (presenceIdsRef.current.length) emitSocket("presence:query", presenceIdsRef.current);
    });
    return () => {
      off();
      offRead();
      offTyping();
      offPresence();
      offSnapshot();
      offConnected();
      if (typingExpiryRef.current) {
        clearTimeout(typingExpiryRef.current);
        typingExpiryRef.current = null;
      }
      if (myTypingTimerRef.current) {
       	clearTimeout(myTypingTimerRef.current);
        myTypingTimerRef.current = null;
      }
      // চ্যাট বদল/আনমাউন্টে অসমাপ্ত typing থেকে যায় না — পুরনো চ্যাটে stop
      if (myTypingActiveRef.current && activeChat?.id && activeChat?.partner?.id) {
        emitSocket("typing", { conversationId: activeChat.id, typing: false });
      }
      myTypingActiveRef.current = false;
      setPartnerTyping(false);
    };
  }, [activeChat?.id, activeChat?.partner?.id, loadConversations, user?.id]);

  // presence — তালিকার সব পার্টনার + খোলা চ্যাটের পার্টনার এক ঝলকে জিজ্ঞেস
  useEffect(() => {
    if (!tokenStore.getAccess() && !tokenStore.getRefresh()) return;
    const targets = presenceTargets(conversations, activeChat, user?.id);
    if (!targets.length) return;
    presenceIdsRef.current = targets;
    emitSocket("presence:query", targets);
  }, [conversations, activeChat, user?.id]);

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
                {onlineMap[c.partner?.id] && (
                  <span
                    className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 rounded-full border-2 border-white"
                    aria-label="online"
                  />
                )}
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
                  {onlineMap[activeChat.partner?.id] && (
                    <span
                      className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 rounded-full border-2 border-white"
                      aria-label="online"
                    />
                  )}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-gray-800 text-sm">
                      {activeChat.partner?.name || "ব্যবহারকারী"}
                    </h3>
                    {activeChat.partner?.religion && (
                      <span className="badge badge-outline badge-xs text-[10px] px-1.5 py-0.5 border-gray-300 text-gray-600">
                        {activeChat.partner.religion === "Islam" ? "ইসলাম" :
                         activeChat.partner.religion === "Hinduism" ? "সনাতন" :
                         activeChat.partner.religion === "Christianity" ? "খ্রিস্টান" :
                         activeChat.partner.religion === "Buddhism" ? "বৌদ্ধ" : activeChat.partner.religion}
                      </span>
                    )}
                  </div>
                  {partnerTyping ? (
                    <p className="text-[11px] text-[#fd6969] animate-pulse">টাইপ করছেন...</p>
                  ) : onlineMap[activeChat.partner?.id] ? (
                    <p className="text-[11px] text-green-600">অনলাইনে</p>
                  ) : null}
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

            {/* Religious Adab Banner */}
            <div className={`px-4 py-2 border-b transition-colors ${adabData.bgColor}`}>
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  <BookOpen size={15} className={`shrink-0 ${adabData.iconColor}`} />
                  <span className="font-semibold text-xs truncate">{adabData.title}</span>
                  <span className="text-[11px] opacity-75 hidden md:inline truncate">— {adabData.subtitle}</span>
                </div>
                <button
                  type="button"
                  onClick={() => setShowAdabDetails((prev) => !prev)}
                  className="btn btn-ghost btn-xs text-[11px] px-2 h-6 min-h-0 flex items-center gap-1 opacity-90 hover:opacity-100 shrink-0"
                >
                  <span>{showAdabDetails ? "সংক্ষিপ্ত" : "আদব নির্দেশিকা"}</span>
                  {showAdabDetails ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
                </button>
              </div>
              {showAdabDetails && (
                <div className="mt-2 pt-2 border-t border-current/15 space-y-1">
                  {adabData.rules.map((rule, idx) => (
                    <div key={idx} className="flex items-start gap-1.5 text-[11px] leading-relaxed">
                      <span className="font-bold shrink-0">•</span>
                      <span>{rule}</span>
                    </div>
                  ))}
                  {isCrossReligion && (
                    <p className="text-[11px] font-semibold mt-1.5 text-purple-800 bg-purple-100/70 rounded px-2 py-1">
                      নোট: এটি একটি আন্তঃধর্মীয় যোগাযোগ। উভয় পক্ষের অনুমোদন সাপেক্ষে উন্মুক্ত। পরস্পরের বিশ্বাসকে পূর্ণ শ্রদ্ধা করুন।
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* Message Container */}
            <div className="flex-1 p-4 md:p-8 overflow-y-auto space-y-8 chat-scroll">
              {messages.length === 0 ? (
                <div className="max-w-md mx-auto my-4 p-5 rounded-2xl bg-white border border-gray-200/80 shadow-sm text-center">
                  <div className={`w-12 h-12 mx-auto rounded-full flex items-center justify-center mb-3 ${adabData.bgColor}`}>
                    <HeartHandshake size={24} className={adabData.iconColor} />
                  </div>
                  <h4 className="font-bold text-gray-800 text-base mb-1">{adabData.title}</h4>
                  <p className="text-xs text-gray-500 mb-4">{adabData.subtitle}</p>

                  <div className="text-left bg-gray-50 rounded-xl p-3.5 border border-gray-100 space-y-2 mb-4 text-xs text-gray-700">
                    <p className="font-semibold text-gray-800 text-[12px] border-b border-gray-200/60 pb-1.5 mb-1.5">
                      যোগাযোগের গুরুত্বপূর্ণ শিষ্টাচার:
                    </p>
                    {adabData.rules.map((rule, idx) => (
                      <div key={idx} className="flex items-start gap-2">
                        <span className="text-[#fd6969] font-bold shrink-0">•</span>
                        <span className="leading-relaxed">{rule}</span>
                      </div>
                    ))}
                  </div>

                  {!adabPledged ? (
                    <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl mb-4 text-left">
                      <div className="flex items-start gap-2 text-xs text-amber-900 mb-2.5">
                        <ShieldCheck size={16} className="text-amber-600 shrink-0 mt-0.5" />
                        <p className="leading-relaxed font-medium">{RELIGIOUS_PLEDGE_TEXT}</p>
                      </div>
                      <button
                        type="button"
                        onClick={handleAcceptPledge}
                        className="btn btn-sm w-full bg-emerald-600 hover:bg-emerald-700 text-white border-none gap-2 shadow-sm"
                      >
                        <CheckCircle2 size={16} /> আমি অঙ্গীকারে সম্মতি জানাচ্ছি
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center justify-center gap-1.5 text-xs text-emerald-700 bg-emerald-50 py-2 px-3 rounded-lg border border-emerald-200 mb-4 font-medium">
                      <CheckCircle2 size={15} /> আপনি ধর্মীয় আদব ও শিষ্টাচার রক্ষার অঙ্গীকার করেছেন
                    </div>
                  )}

                  <p className="text-xs text-gray-400">
                    শালীন সম্ভাষণ ও শুভেচ্ছার মাধ্যমে কথোপকথন শুরু করতে নিচে মেসেজ লিখুন।
                  </p>
                </div>
              ) : (
                messages.map((msg) => {
                  const isMe = msg.sender === user?.id;
                  const kind = receiptKind(msg, user?.id);
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
                      {kind && (
                        <span
                          className="flex items-center gap-1 mt-1 text-gray-400"
                          aria-label={kind}
                          title={
                            kind === "read"
                              ? "পড়েছেন"
                              : kind === "sent"
                                ? "পাঠানো হয়েছে"
                                : "পাঠানো হচ্ছে"
                          }
                        >
                          {kind === "pending" ? (
                            <Clock size={12} />
                          ) : kind === "sent" ? (
                            <Check size={14} />
                          ) : (
                            <CheckCheck size={14} className="text-[#fd6969]" />
                          )}
                        </span>
                      )}
                    </div>
                  );
                })
              )}
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
                    onChange={(e) => handleInputChange(e.target.value)}
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