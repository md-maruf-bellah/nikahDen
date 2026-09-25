"use client";
import React, { useState, useEffect, useRef, useCallback } from "react";
import { Search, Send, ArrowLeft } from "lucide-react";
import { conversationApi } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";

const MessagingApp = () => {
  const { user } = useAuth();
  const [conversations, setConversations] = useState([]);
  const [activeChat, setActiveChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState("");
  const [showChatWindow, setShowChatWindow] = useState(false);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const scrollRef = useRef(null);

  const loadConversations = useCallback(async () => {
    try {
      const list = await conversationApi.list({ limit: 50 });
      const arr = Array.isArray(list) ? list : [];
      setConversations(arr);
      if (arr.length && !activeChat) {
        setActiveChat(arr[0]);
        const first = await conversationApi
          .messages(arr[0].id, { limit: 100 })
          .catch(() => []);
        setMessages(Array.isArray(first) ? first : []);
      }
    } catch {
      setConversations([]);
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
      try {
        const list = await conversationApi.messages(conversation.id, { limit: 100 });
        setMessages(Array.isArray(list) ? list : []);
        conversationApi.markRead(conversation.id).catch(() => {});
      } catch {
        setMessages([]);
      }
    },
    []
  );

  // অটো স্ক্রল টু বটম
  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSendMessage = async () => {
    if (!inputText.trim() || !activeChat) return;
    const text = inputText;
    const tmpId = `tmp-${Date.now()}`;
    setInputText("");
    setMessages((prev) => [
      ...prev,
      {
        id: tmpId,
        sender: user?.id,
        text,
        createdAt: new Date().toISOString(),
      },
    ]);
    try {
      const sent = await conversationApi.send(activeChat.id, text);
      setMessages((prev) =>
        prev.map((m) => (m.id === tmpId ? { ...m, id: sent.id } : m))
      );
      loadConversations();
    } catch {
      /* keep message locally */
    }
  };

  const filtered = conversations.filter((c) =>
    (c.partner?.name || "").toLowerCase().includes(search.toLowerCase())
  );

  const timeLabel = (iso) => {
    if (!iso) return "";
    const d = new Date(iso);
    const now = new Date();
    const sameDay = d.toDateString() === now.toDateString();
    return sameDay
      ? d.toLocaleTimeString("bn-BD", { hour: "numeric", minute: "2-digit" })
      : d.toLocaleDateString("bn-BD", { day: "numeric", month: "short" });
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
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search"
              className="w-full pl-10 pr-4 py-2.5 bg-gray-50 rounded-xl text-sm focus:outline-none border border-transparent focus:border-red-200 transition-all"
            />
          </div>
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
                <p className="text-[11px] text-gray-500 truncate">
                  {c.lastMessage?.text || "কথোপকথন শুরু করুন"}
                </p>
              </div>
            </div>
          ))}
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

            {/* Message Input */}
            <div className="p-4 md:p-6 border-t border-gray-100">
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
                  className="flex-1 text-sm focus:outline-none py-2 bg-transparent"
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
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default MessagingApp;