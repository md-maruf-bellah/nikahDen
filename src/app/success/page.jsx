import React from "react";

const ThankYouPage = () => {
  return (
    <div className="min-h-screen bg-white pb-20">
      {/* Header Banner Section */}
      <div className="bg-[#ff6b6b] py-10 text-center text-white mb-24">
        <h1 className="text-3xl font-bold mb-1">Thank You</h1>
        <p className="text-xs tracking-wide text-red-100">
          Home / <span className="font-semibold text-white">Thank You</span>
        </p>
      </div>

      {/* Success Content Area */}
      <div className="flex flex-col items-center justify-center text-center px-4">
        {/* Animated/Styled Red Success Checkmark */}
        <div className="mb-6 text-[#ff6b6b]">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth="1.8"
            stroke="currentColor"
            className="w-16 h-16"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
            />
          </svg>
        </div>

        {/* Success Message Headlines */}
        <h2 className="text-2xl font-bold text-gray-800 mb-2 tracking-wide">
          Payment Successfully Completed
        </h2>
        <p className="text-sm text-gray-500 font-medium">
          Thanks for the upgrade membership
        </p>
      </div>
    </div>
  );
};

export default ThankYouPage;
