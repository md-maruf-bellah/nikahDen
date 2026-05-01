"use client";
import React, { useState, useEffect, useRef } from "react";
import { Search, Send, ArrowLeft, MoreVertical } from "lucide-react";

const MessagingApp = () => {
  // ডামি ডাটা
  const [users] = useState([
    {
      id: 1,
      name: "Robert Brown",
      role: "Head of Development",
      online: true,
      unread: 2,
      color: "bg-orange-500",
    },
    {
      id: 2,
      name: "Jane Doe",
      role: "UI/UX Designer",
      online: false,
      unread: 4,
      color: "bg-cyan-500",
    },
    {
      id: 3,
      name: "Michael Smith",
      role: "CTO",
      online: true,
      unread: 1,
      color: "bg-purple-500",
    },
  ]);

  const [activeChat, setActiveChat] = useState(users[0]);
  const [messages, setMessages] = useState([
    {
      id: 1,
      userId: 1,
      text: "How likely are you to recommend our company to your friends and family?",
      time: "35 mins",
      isMe: false,
    },
    {
      id: 2,
      userId: 1,
      text: "How likely are you to recommend our company to your friends and family?",
      time: "35 mins",
      isMe: true,
    },
  ]);

  const [inputText, setInputText] = useState("");
  const [showChatWindow, setShowChatWindow] = useState(false); // মোবাইলের জন্য
  const scrollRef = useRef(null);

  // অটো স্ক্রল টু বটম
  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSendMessage = () => {
    if (!inputText.trim()) return;
    const newMessage = {
      id: Date.now(),
      userId: activeChat.id,
      text: inputText,
      time: "Just now",
      isMe: true,
    };
    setMessages([...messages, newMessage]);
    setInputText("");
  };

  return (
    <div className="flex h-[75vh]  lg:h-[100vh] lg:max-w-full w-full m-auto bg-base-200 border rounded-lg border-red-100 overflow-hidden relative">
      {/* Left Side: Chat List (মোবাইলে হাইড হবে যদি চ্যাট উইন্ডো ওপেন থাকে) */}
      <div
        className={`w-full lg:w-80 border-r border-gray-100 flex flex-col bg-white ${showChatWindow ? "hidden lg:flex" : "flex"}`}
      >
        <div className="p-5">
          <div className="relative">
            <Search
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
              size={18}
            />
            <input
              type="text"
              placeholder="Search"
              className="w-full pl-10 pr-4 py-2.5 bg-gray-50 rounded-xl text-sm focus:outline-none border border-transparent focus:border-red-200 transition-all"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {users.map((user) => (
            <div
              key={user.id}
              onClick={() => {
                setActiveChat(user);
                setShowChatWindow(true);
              }}
              className={`flex items-center gap-3 p-4 cursor-pointer transition-all ${activeChat.id === user.id ? "bg-red-50/50 border-r-4 border-red-400" : "hover:bg-gray-50"}`}
            >
              <div className="relative">
                <img
                  src={`https://i.pravatar.cc/150?u=${user.id}`}
                  className="w-12 h-12 rounded-full object-cover"
                  alt="user"
                />
                {user.online && (
                  <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white rounded-full"></div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-center">
                  <h4 className="font-bold text-gray-800 text-sm truncate">
                    {user.name}
                  </h4>
                  <span className="text-[10px] text-gray-400">35 mins</span>
                </div>
                <p className="text-[11px] text-gray-500 truncate">
                  {user.role}
                </p>
              </div>
              {user.unread > 0 && (
                <div
                  className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] text-white font-bold ${user.color}`}
                >
                  {user.unread}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Right Side: Conversation Area */}
      <div
        className={`flex-1 flex flex-col bg-white transition-all duration-300 ${!showChatWindow ? "hidden lg:flex" : "flex"}`}
      >
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
                src={`https://i.pravatar.cc/150?u=${activeChat.id}`}
                className="w-10 h-10 rounded-full"
                alt="active user"
              />
              {activeChat.online && (
                <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 border-2 border-white rounded-full"></div>
              )}
            </div>
            <div>
              <h3 className="font-bold text-gray-800 text-sm">
                {activeChat.name}
              </h3>
              <p
                className={`text-[10px] font-medium ${activeChat.online ? "text-green-500" : "text-gray-400"}`}
              >
                {activeChat.online ? "Active" : "Offline"}
              </p>
            </div>
          </div>
          <button className="text-[11px] font-bold text-gray-400 hover:text-red-500 transition-colors uppercase tracking-tight">
            Delete Conversation
          </button>
        </div>

        {/* Message Container */}
        <div className="flex-1 p-4 md:p-8 overflow-y-auto space-y-8 chat-scroll">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex flex-col ${msg.isMe ? "items-end" : "items-start"}`}
            >
              <div
                className={`flex items-center gap-3 mb-2 ${msg.isMe ? "flex-row-reverse" : ""}`}
              >
                <img
                  src={
                    msg.isMe
                      ? "https://i.pravatar.cc/150?u=me"
                      : `https://i.pravatar.cc/150?u=${activeChat.id}`
                  }
                  className="w-8 h-8 rounded-full"
                  alt="avatar"
                />
                <div className={msg.isMe ? "text-right" : "text-left"}>
                  <h5 className="text-[12px] font-bold text-gray-800">
                    {msg.isMe ? "Me" : activeChat.name}
                  </h5>
                  <p className="text-[10px] text-gray-400">{msg.time}</p>
                </div>
              </div>

              <div
                className={`max-w-[85%] md:max-w-[70%] p-4 rounded-2xl text-sm shadow-sm ${
                  msg.isMe
                    ? "bg-[#fff5f5] text-gray-700 rounded-tr-none border border-red-50"
                    : "bg-gray-50 text-gray-700 rounded-tl-none border border-gray-100"
                }`}
              >
                {msg.text}
              </div>
            </div>
          ))}
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
      </div>
    </div>
  );
};

export default MessagingApp;
