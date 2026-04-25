"use client";

import { useEffect, useState } from "react";

const themes = [
  "light",
  "dark",
  //   "cupcake",
  //   "bumblebee",
  //   "emerald",
  //   "corporate",
  //   "synthwave",
  //   "retro",
  //   "cyberpunk",
  //   "valentine",
  //   "halloween",
  //   "garden",
  //   "forest",
  //   "aqua",
  //   "lofi",
  //   "pastel",
  //   "fantasy",
  //   "luxury",
  //   "dracula",
  //   "cmyk",
  //   "autumn",
  //   "acid",
  //   "lemonade",
  //   "night",
  //   "coffee",
  //   "winter",
  //   "dim",
  //   "nord",
  //   "sunset",
  //   "black",
  "business",
  "wireframe",
];

export default function ThemeSwitcher() {
  const [theme, setTheme] = useState("cupcake");

  // Load saved theme
  useEffect(() => {
    const saved = localStorage.getItem("theme");
    if (saved) {
      setTheme(saved);
      document.documentElement.setAttribute("data-theme", saved);
    }
  }, []);

  // Change theme
  const handleChange = (e) => {
    const newTheme = e.target.value;
    setTheme(newTheme);
    document.documentElement.setAttribute("data-theme", newTheme);
    localStorage.setItem("theme", newTheme);
  };

  return (
    <select
      className="select select-bordered w-2 select-sm"
      value={theme}
      onChange={handleChange}
    >
      {themes.map((t) => (
        <option key={t} value={t}>
          {t}
        </option>
      ))}
    </select>
  );
}
