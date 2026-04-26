"use client";

import { useState } from "react";
import { IoLanguage } from "react-icons/io5";
import { SlArrowDown } from "react-icons/sl";

export default function LanguageSelect() {
  const [language, setLanguage] = useState("বাংলা");

  return (
    <div className="dropdown dropdown-end">
      {/* Button */}
      <label
        tabIndex={0}
        className="btn btn-ghost btn-sm flex items-center gap-2"
      >
        <IoLanguage className="text-[#FD6969]" size={18} />
        {language}
        <SlArrowDown />
      </label>

      {/* Dropdown menu */}
      <ul
        tabIndex={0}
        className="dropdown-content menu p-2 shadow bg-base-100 rounded-box w-40"
      >
        <li>
          <a
            className="flex items-center gap-2"
            onClick={() => setLanguage("বাংলা")}
          >
            <IoLanguage size={16} />
            বাংলা
          </a>
        </li>

        <li>
          <a onClick={() => setLanguage("English")}>
            {" "}
            <IoLanguage size={16} /> English
          </a>
        </li>
      </ul>
    </div>
  );
}
