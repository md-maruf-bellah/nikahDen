"use client";

import { IoLanguage } from "react-icons/io5";
import { SlArrowDown } from "react-icons/sl";
import { useLanguage } from "@/lib/language-context";

const LANGUAGES = [
  { code: "bn", label: "বাংলা", flag: "🇧🇩" },
  { code: "en", label: "English", flag: "🇬🇧" },
  { code: "ar", label: "العربية", flag: "🇸🇦" },
];

export default function LanguageSelect() {
  const { language, setLanguage } = useLanguage();

  const current = LANGUAGES.find((l) => l.code === language) || LANGUAGES[0];

  return (
    <div className="dropdown dropdown-end">
      {/* Button */}
      <button
        tabIndex={0}
        type="button"
        aria-label="Language selection"
        className="btn btn-ghost flex items-center justify-between gap-2 px-3 min-h-[2.5rem] h-10 border border-base-300 hover:border-[#FD6969]/50 rounded-lg text-sm font-medium"
      >
        <span className="flex items-center gap-1.5">
          <IoLanguage className="text-[#FD6969] shrink-0" size={17} />
          <span>{current.label}</span>
        </span>
        <SlArrowDown size={11} className="text-base-content/60" />
      </button>

      {/* Dropdown menu */}
      <ul
        tabIndex={0}
        className="dropdown-content menu z-[60] p-1.5 shadow-xl bg-base-100 border border-base-300 rounded-xl w-36 mt-1 text-sm font-medium"
      >
        {LANGUAGES.map((item) => (
          <li key={item.code}>
            <button
              type="button"
              className={`flex items-center justify-between px-3 py-2 rounded-lg transition-colors ${
                item.code === language
                  ? "bg-[#FD6969]/10 text-[#FD6969] font-bold"
                  : "hover:bg-base-200"
              }`}
              onClick={(e) => {
                setLanguage(item.code);
                // Close dropdown by removing focus from active element
                if (e?.currentTarget?.blur) e.currentTarget.blur();
              }}
            >
              <span>{item.label}</span>
              <span className="text-base">{item.flag}</span>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
