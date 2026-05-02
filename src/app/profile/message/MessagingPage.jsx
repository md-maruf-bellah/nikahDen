// "use client";
// import React, { useState, useEffect, useRef } from "react";
// import { Search, MoveRight, ArrowLeft } from "lucide-react";

// const MessagingApp = () => {
//   // ডামি ইউজার ডাটা
//   const [users] = useState([
//     {
//       id: 1,
//       name: "Robert Brown",
//       role: "Head of Development",
//       time: "35 mins",
//       unread: 2,
//       color: "bg-[#FF7F5C]",
//       img: "https://i.pravatar.cc/150?u=1",
//       active: true,
//     },
//     {
//       id: 2,
//       name: "Jane Cooper",
//       role: "UI/UX Designer",
//       time: "12 mins",
//       unread: 4,
//       color: "bg-[#01D9D9]",
//       img: "https://i.pravatar.cc/150?u=2",
//       active: false,
//     },
//     {
//       id: 3,
//       name: "Wade Warren",
//       role: "CTO",
//       time: "1 hour",
//       unread: 1,
//       color: "bg-[#4632B5]",
//       img: "https://i.pravatar.cc/150?u=3",
//       active: true,
//     },
//     {
//       id: 4,
//       name: "Esther Howard",
//       role: "DevOps",
//       time: "2 days",
//       unread: 0,
//       color: "",
//       img: "https://i.pravatar.cc/150?u=4",
//       active: false,
//     },
//   ]);

//   const [activeChat, setActiveChat] = useState(users[0]);
//   const [messages, setMessages] = useState([
//     {
//       id: 1,
//       text: "How likely are you to recommend our company to your friends and family?",
//       time: "35 mins",
//       isMe: false,
//     },
//     {
//       id: 2,
//       text: "How likely are you to recommend our company to your friends and family?",
//       time: "32 mins",
//       isMe: true,
//     },
//     { id: 3, text: "Ok, Understood!", time: "30 mins", isMe: false },
//   ]);
//   const [inputText, setInputText] = useState("");
//   const [isMobileChatOpen, setIsMobileChatOpen] = useState(false);
//   const scrollRef = useRef(null);

//   // অটো স্ক্রল টু বটম
//   useEffect(() => {
//     scrollRef.current?.scrollIntoView({ behavior: "smooth" });
//   }, [messages]);

//   const handleSendMessage = (e) => {
//     e.preventDefault();
//     if (!inputText.trim()) return;

//     const newMessage = {
//       id: Date.now(),
//       text: inputText,
//       time: "Just now",
//       isMe: true,
//     };

//     setMessages([...messages, newMessage]);
//     setInputText("");
//   };

//   return (
//     <div className="flex h-screen w-full  p-0  font-sans text-[#111111]">
//       <div className="mx-auto flex border border-red-200 rounded-xl w-full max-w-[1300px] gap-0 md:gap-8 overflow-hidden relative">
//         {/* --- Left Sidebar (Chat List) --- */}
//         <div
//           className={`w-full md:w-[380px] bg-white p-6 md:p-8 md:rounded-[20px] shadow-sm flex flex-col h-full transition-all duration-300 ${isMobileChatOpen ? "-translate-x-full md:translate-x-0 absolute md:relative" : "translate-x-0 relative"}`}
//         >
//           <div className="mb-8">
//             <h1 className="text-2xl font-bold mb-6 md:hidden">Messages</h1>
//             <div className="relative">
//               <Search
//                 className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400"
//                 size={20}
//               />
//               <input
//                 type="text"
//                 placeholder="Search"
//                 className="w-full rounded-xl bg-[#F1F3F5] py-4 pl-14 pr-5 text-lg outline-none"
//               />
//             </div>
//           </div>

//           <div className="flex-1 space-y-6 overflow-y-auto custom-scrollbar">
//             {users.map((user) => (
//               <div
//                 key={user.id}
//                 onClick={() => {
//                   setActiveChat(user);
//                   setIsMobileChatOpen(true);
//                 }}
//                 className={`flex cursor-pointer items-center gap-4 p-2 rounded-xl transition-all ${activeChat.id === user.id ? "bg-gray-50" : "hover:bg-gray-50"}`}
//               >
//                 <div className="relative shrink-0">
//                   <img
//                     src={user.img}
//                     alt="avatar"
//                     className="h-14 w-14 rounded-full object-cover"
//                   />
//                 </div>
//                 <div className="flex-1 min-w-0">
//                   <div className="flex items-center justify-between">
//                     <h4 className="text-[17px] font-semibold truncate">
//                       {user.name}
//                     </h4>
//                     <span className="text-sm text-gray-400 shrink-0">
//                       {user.time}
//                     </span>
//                   </div>
//                   <div className="flex items-center justify-between mt-1">
//                     <p className="text-[14px] text-gray-400 truncate">
//                       {user.role}
//                     </p>
//                     {user.unread > 0 && (
//                       <span
//                         className={`flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-bold text-white shrink-0 ${user.color}`}
//                       >
//                         {user.unread}
//                       </span>
//                     )}
//                   </div>
//                 </div>
//               </div>
//             ))}
//           </div>
//         </div>

//         {/* --- Right Side (Chat Window) --- */}
//         <div
//           className={`flex flex-col flex-1 bg-white md:rounded-[20px] shadow-sm overflow-hidden h-full z-10 transition-all duration-300 ${isMobileChatOpen ? "translate-x-0" : "translate-x-full md:translate-x-0"} fixed inset-0 md:relative`}
//         >
//           {/* Header */}
//           <div className="px-6 py-6 md:px-10 md:pt-10">
//             <div className="flex items-center justify-between">
//               <div className="flex items-center gap-4">
//                 <button
//                   onClick={() => setIsMobileChatOpen(false)}
//                   className="md:hidden p-2 -ml-2 hover:bg-gray-100 rounded-full"
//                 >
//                   <ArrowLeft size={24} />
//                 </button>
//                 <img
//                   src={activeChat.img}
//                   alt="active-user"
//                   className="h-12 w-12 md:h-[60px] md:w-[60px] rounded-full object-cover"
//                 />
//                 <div>
//                   <h3 className="text-lg md:text-xl font-bold">
//                     {activeChat.name}
//                   </h3>
//                   <div className="flex items-center gap-2">
//                     <span className="text-[14px] text-gray-400">Active</span>
//                     <span className="h-2 w-2 rounded-full bg-[#44CE55]"></span>
//                   </div>
//                 </div>
//               </div>
//               <button className="text-sm md:text-[15px] font-medium underline underline-offset-4 hidden sm:block">
//                 Delete Conversation
//               </button>
//             </div>
//             <div className="mt-6 md:mt-8 h-[1px] w-full bg-[#EAEAEA]"></div>
//           </div>

//           {/* Chat Messages */}
//           <div className="flex-1 space-y-8 overflow-y-auto px-6 md:px-10 py-4 custom-scrollbar">
//             {messages.map((msg) => (
//               <div
//                 key={msg.id}
//                 className={`flex flex-col ${msg.isMe ? "items-end" : "items-start"} gap-3`}
//               >
//                 <div
//                   className={`flex items-center gap-3 ${msg.isMe ? "flex-row-reverse" : "flex-row"}`}
//                 >
//                   <img
//                     src={
//                       msg.isMe
//                         ? "https://i.pravatar.cc/150?u=me"
//                         : activeChat.img
//                     }
//                     className="h-12 w-12 md:h-14 md:w-14 rounded-full"
//                     alt=""
//                   />
//                   <div className={msg.isMe ? "text-right" : "text-left"}>
//                     <p className="font-bold text-md md:text-lg">
//                       {msg.isMe ? "You" : activeChat.name}
//                     </p>
//                     <p className="text-xs text-gray-400">{msg.time}</p>
//                   </div>
//                 </div>
//                 <div
//                   className={`max-w-[85%] md:max-w-[70%] px-6 py-4 rounded-2xl text-[15px] md:text-[16px] leading-relaxed shadow-sm ${
//                     msg.isMe
//                       ? "bg-[#FFF4F2] rounded-tr-none text-right"
//                       : "bg-[#F1F3F5] rounded-tl-none text-left"
//                   }`}
//                 >
//                   {msg.text}
//                 </div>
//               </div>
//             ))}
//             <div ref={scrollRef} />
//           </div>

//           {/* Footer Input */}
//           <div className="px-6 pb-6 md:px-10 md:pb-10">
//             <div className="mb-6 md:mb-8 h-[1px] w-full bg-[#EAEAEA]"></div>
//             <form
//               onSubmit={handleSendMessage}
//               className="flex items-center justify-between gap-4"
//             >
//               <input
//                 type="text"
//                 value={inputText}
//                 onChange={(e) => setInputText(e.target.value)}
//                 placeholder="Type a Message"
//                 className="flex-1 bg-transparent text-md md:text-lg outline-none placeholder:text-gray-400"
//               />
//               <button
//                 type="submit"
//                 className="flex items-center gap-2 rounded-xl bg-[#FD7E71] px-5 py-3 md:px-8 md:py-4 font-bold text-white shadow-lg shadow-red-100 hover:bg-[#fc6a5b] transition-all shrink-0"
//               >
//                 <span className="hidden sm:inline">Send Message</span>
//                 <MoveRight size={20} />
//               </button>
//             </form>
//           </div>
//         </div>
//       </div>

//       <style jsx>{`
//         .custom-scrollbar::-webkit-scrollbar {
//           width: 4px;
//         }
//         .custom-scrollbar::-webkit-scrollbar-thumb {
//           background: #e5e7eb;
//           border-radius: 10px;
//         }
//         @media (max-width: 768px) {
//           .custom-scrollbar::-webkit-scrollbar {
//             display: none;
//           }
//         }
//       `}</style>
//     </div>
//   );
// };

// export default MessagingApp;

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
