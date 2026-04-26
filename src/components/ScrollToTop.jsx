"use client";

import { useEffect, useState } from "react";
import { ArrowUp } from "lucide-react";

export default function ScrollToTop() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const toggleVisibility = () => {
      if (window.scrollY > 300) {
        setVisible(true);
      } else {
        setVisible(false);
      }
    };

    window.addEventListener("scroll", toggleVisibility);
    return () => window.removeEventListener("scroll", toggleVisibility);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  if (!visible) return null;

  return (
    <div>
      <button
        onClick={scrollToTop}
        className="
        fixed bottom-6 right-6
        w-12 h-12
        flex items-center justify-center
        rounded-full
      bg-[#fd6969]
        text-white
        shadow-lg
        hover:scale-110
        transition-all duration-300
        z-50 
        cursor-pointer
      "
      >
        <ArrowUp size={20} />
      </button>
    </div>
  );
}
