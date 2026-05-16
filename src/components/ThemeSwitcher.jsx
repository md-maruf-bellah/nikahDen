"use client";

import { useEffect, useState } from "react";
import { Palette, Check } from "lucide-react"; // আইকন ব্যবহারের জন্য

const themes = [
  // "light",
  // "dark",
  // "cupcake",
  // "bumblebee",
  // "emerald",
  // "corporate",
  // "synthwave",
  // "retro",
  // "cyberpunk",
  // "valentine",
  // "halloween",
  // "garden",
  // "forest",
  // "aqua",
  // "lofi",
  // "pastel",
  // "fantasy",
  // "luxury",
  // "dracula",
  // "cmyk",
  // "autumn",
  // "acid",
  // "lemonade",
  // "night",
  // "coffee",
  // "winter",
  // "dim",
  // "nord",
  // "sunset",
  // "black",
  "business",
  "wireframe",
];

const themeColors = {
  light: "bg-white",
  dark: "bg-neutral-focus",
  cupcake: "bg-pink-300",
  bumblebee: "bg-yellow-400",
  emerald: "bg-emerald-500",
  corporate: "bg-blue-500",
  synthwave: "bg-fuchsia-500",
  retro: "bg-orange-400",
  cyberpunk: "bg-lime-400",
  valentine: "bg-red-400",
  halloween: "bg-orange-600",
  garden: "bg-green-400",
  forest: "bg-green-800",
  aqua: "bg-cyan-400",
  lofi: "bg-gray-300",
  pastel: "bg-pink-200",
  fantasy: "bg-purple-400",
  luxury: "bg-yellow-700",
  dracula: "bg-purple-800",
  cmyk: "bg-blue-300",
  autumn: "bg-orange-500",
  acid: "bg-lime-300",
  lemonade: "bg-yellow-200",
  night: "bg-indigo-900",
  coffee: "bg-amber-900",
  winter: "bg-sky-300",
  dim: "bg-gray-700",
  nord: "bg-slate-400",
  sunset: "bg-orange-300",
  black: "bg-black",
  business: "bg-gray-600",
  wireframe: "bg-gray-200",
};

export default function ThemeSwitcher() {
  const [theme, setTheme] = useState("wireframe");

  useEffect(() => {
    const saved = localStorage.getItem("theme") || "wireframe";
    setTheme(saved);
    document.documentElement.setAttribute("data-theme", saved);
  }, []);

  const changeTheme = (t) => {
    setTheme(t);
    document.documentElement.setAttribute("data-theme", t);
    localStorage.setItem("theme", t);
  };

  return (
    <div className="dropdown dropdown-end">
      {/* ===== Styled Button ===== */}
      <label
        tabIndex={0}
        className="btn  btn-ghost  flex items-center justify-around gap-2"
      >
        <Palette size={16} className="text-primary" />
        <span className="font-bold text-xs uppercase tracking-wider hidden sm:inline">
          Theme: <span className="text-primary">{theme}</span>
        </span>
        <div
          className={`w-3 h-3 rounded-full shadow-inner border border-black/5 ${themeColors[theme]}`}
        ></div>
      </label>

      {/* ===== Improved Dropdown Menu ===== */}
      <ul
        tabIndex={0}
        className="dropdown-content z-[100] mt-3 p-2 shadow-2xl bg-base-100 border border-base-300 
                   rounded-2xl w-60 max-h-96 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300"
      >
        <div className="px-4 py-2 mb-2 border-b border-base-200">
          <span className="text-[10px] font-black uppercase text-gray-400 tracking-widest">
            Select Theme
          </span>
        </div>

        <div className="grid grid-cols-1 gap-1">
          {themes.map((t) => (
            <li key={t}>
              <button
                onClick={() => changeTheme(t)}
                className={`flex items-center justify-between px-3 py-2.5 rounded-xl transition-all duration-200 
                  ${
                    theme === t
                      ? "bg-primary/10 text-primary font-bold"
                      : "hover:bg-base-200 text-base-content/70 hover:text-base-content"
                  }`}
              >
                <div className="flex items-center gap-3">
                  {/* Color Indicator Box */}
                  <div className="grid grid-cols-2 gap-0.5 w-6 h-6 rounded-md overflow-hidden border border-base-300 shadow-sm">
                    <div className={`${themeColors[t]} h-full w-full`}></div>
                    <div className="bg-base-100 h-full w-full"></div>
                  </div>
                  <span className="capitalize text-sm">{t}</span>
                </div>

                {theme === t && (
                  <Check
                    size={14}
                    className="text-primary animate-in zoom-in duration-300"
                  />
                )}
              </button>
            </li>
          ))}
        </div>
      </ul>
    </div>
  );
}
