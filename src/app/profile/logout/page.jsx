"use client";
import React, { useState } from "react";
import { Mail, Lock, EyeOff, Info } from "lucide-react";

const LogoutForm = () => {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <div className=" p-4">
      <div className="w-full  space-y-6">
        {/* Header */}
        <h2 className="text-2xl font-bold text-gray-700">Logout</h2>

        <div className="space-y-4">
          {/* Email/Name Input */}
          <div className="relative">
            <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
              <Mail size={18} className="text-gray-400" />
            </div>
            <input
              type="text"
              defaultValue="Maraj Akanda"
              className="w-full pl-10 pr-10 py-2 border border-gray-800 rounded-lg focus:outline-none focus:ring-1 focus:ring-gray-400 font-bold text-gray-800"
            />
            <div className="absolute inset-y-0 right-3 flex items-center">
              <Info size={18} className="text-gray-400 cursor-pointer" />
            </div>
          </div>

          {/* Password Input */}
          <div className="relative">
            <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
              <Lock size={18} className="text-gray-400" />
            </div>
            <input
              type={showPassword ? "text" : "password"}
              defaultValue="password123456"
              className="w-full pl-10 pr-10 py-2 border border-gray-800 rounded-lg focus:outline-none focus:ring-1 focus:ring-gray-400 text-gray-600"
            />
            <div
              className="absolute inset-y-0 right-3 flex items-center cursor-pointer"
              onClick={() => setShowPassword(!showPassword)}
            >
              <EyeOff size={18} className="text-gray-400" />
            </div>
          </div>
        </div>

        {/* Links */}
        <div className="flex justify-between text-xs text-gray-400">
          <button className="hover:underline">Forget password?</button>
          <button className="hover:underline">Generate a password</button>
        </div>

        {/* Logout Button */}
        <button className="w-full bg-[#EF4444] hover:bg-red-600 text-white font-bold py-2 rounded-lg transition-colors text-lg">
          Logout
        </button>
      </div>
    </div>
  );
};

export default LogoutForm;
