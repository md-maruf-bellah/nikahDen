"use client";

import React, { useState, useEffect } from "react";
// Image import (image_76dff6.png এর রেফারেন্স অনুযায়ী)
import img from "./../../../assets/contact/img.png";

const ComingSoon = () => {
  const [timeLeft, setTimeLeft] = useState({
    days: 20,
    hours: 12,
    minutes: 18,
    seconds: 6,
  });

  // Countdown Logic
  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev.seconds > 0) return { ...prev, seconds: prev.seconds - 1 };
        if (prev.minutes > 0)
          return { ...prev, minutes: prev.minutes - 1, seconds: 59 };
        if (prev.hours > 0)
          return { ...prev, hours: prev.hours - 1, minutes: 59, seconds: 59 };
        if (prev.days > 0)
          return {
            ...prev,
            days: prev.days - 1,
            hours: 23,
            minutes: 59,
            seconds: 59,
          };
        return prev;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div
      className="min-h-screen flex items-center justify-center bg-cover bg-center relative"
      style={{
        // এখানে পরিবর্তন করা হয়েছে: src প্রপার্টি ব্যবহার করা হয়েছে
        backgroundImage: `url(${img.src})`,
        backgroundPosition: "",
      }}
    >
      {/* Overlay - ইমেজ অনুযায়ী লালচে আভা */}
      <div className="absolute inset-0 bg-red-400/60 mix-blend-multiply"></div>

      <div className="relative z-10 text-center text-white px-4 max-w-2xl">
        {/* Logo & Brand */}
        <div className="flex flex-col items-center mb-8">
          <div className="text-6xl mb-2">❤️</div>
          <h1 className="text-4xl md:text-5xl font-bold">নিকাহ্ দ্বীন</h1>
        </div>

        {/* Text Content */}
        <h2 className="text-2xl md:text-3xl font-semibold mb-2">Coming Soon</h2>
        <p className="text-sm md:text-base opacity-90 mb-10 leading-relaxed">
          This website is underconstruction mood. We'll <br /> be back after
        </p>

        {/* daisyUI Countdown Timer */}
        <div className="grid grid-flow-col gap-5 text-center auto-cols-max justify-center mb-12">
          <div className="flex flex-col">
            <span className="countdown font-mono text-4xl md:text-5xl">
              <span style={{ "--value": timeLeft.days }}></span>
            </span>
            <span className="text-sm">Days</span>
          </div>
          <div className="text-4xl md:text-5xl font-mono">:</div>
          <div className="flex flex-col">
            <span className="countdown font-mono text-4xl md:text-5xl">
              <span style={{ "--value": timeLeft.hours }}></span>
            </span>
            <span className="text-sm">Hours</span>
          </div>
          <div className="text-4xl md:text-5xl font-mono">:</div>
          <div className="flex flex-col">
            <span className="countdown font-mono text-4xl md:text-5xl">
              <span style={{ "--value": timeLeft.minutes }}></span>
            </span>
            <span className="text-sm">Minutes</span>
          </div>
          <div className="text-4xl md:text-5xl font-mono">:</div>
          <div className="flex flex-col">
            <span className="countdown font-mono text-4xl md:text-5xl">
              <span style={{ "--value": timeLeft.seconds }}></span>
            </span>
            <span className="text-sm">Seconds</span>
          </div>
        </div>

        {/* Subscription Form */}
        <div className="space-y-4">
          <p className="text-lg">Subscribe now to get the latest update.</p>
          <div className="flex max-w-md mx-auto overflow-hidden rounded-lg border border-white/40">
            <input
              type="email"
              placeholder="Enter your email"
              className="w-full px-4 py-3 bg-white/20 backdrop-blur-sm text-white placeholder:text-gray-200 outline-none"
            />
            <button className="bg-[#ef4444] hover:bg-red-600 transition-colors px-8 font-bold uppercase text-sm">
              Send
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ComingSoon;
