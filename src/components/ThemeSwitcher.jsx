"use client";

import { useEffect, useState } from "react";

const themes = [
  "light",
  "dark",
  "cupcake",
  "bumblebee",
  "emerald",
  "corporate",
  "synthwave",
  "retro",
  "cyberpunk",
  "valentine",
  "halloween",
  "garden",
  "forest",
  "aqua",
  "lofi",
  "pastel",
  "fantasy",
  "luxury",
  "dracula",
  "cmyk",
  "autumn",
  "acid",
  "lemonade",
  "night",
  "coffee",
  "winter",
  "dim",
  "nord",
  "sunset",
  "black",
  "business",
  "wireframe",
];

// simple color map (preview)
const themeColors = {
  light: "bg-white",
  dark: "bg-black",
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
  const [theme, setTheme] = useState("cupcake");

  useEffect(() => {
    const saved = localStorage.getItem("theme");
    if (saved) {
      setTheme(saved);
      document.documentElement.setAttribute("data-theme", saved);
    }
  }, []);

  const changeTheme = (t) => {
    setTheme(t);
    document.documentElement.setAttribute("data-theme", t);
    localStorage.setItem("theme", t);
  };

  return (
    <div className="dropdown dropdown-end">
      {/* button */}
      {/* <label tabIndex={0} className="btn btn-sm btn-ghost">
        Theme: {theme}
      </label> */}

      <label
        tabIndex={0}
        className="btn btn-sm gap-2 rounded-xl border border-base-300 
             bg-base-100 hover:bg-base-200 
             shadow-sm hover:shadow-md 
             transition-all duration-200 ease-in-out
             active:scale-95"
      >
        {/* small dot indicator */}
        <span className="w-2 h-2 rounded-full bg-primary animate-pulse"></span>

        <span className="font-medium">Theme: {theme}</span>
      </label>

      {/* menu */}
      <ul
        tabIndex={0}
        className="dropdown-content menu p-2 shadow bg-base-100 rounded-box w-56 max-h-80 overflow-y-auto"
      >
        {themes.map((t) => (
          <li key={t}>
            <button
              onClick={() => changeTheme(t)}
              className="flex items-center gap-3"
            >
              {/* color preview box */}
              <span
                className={`w-4 h-4 rounded-full border ${
                  themeColors[t] || "bg-gray-400"
                }`}
              ></span>

              {t}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
