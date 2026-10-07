import { describe, it, beforeEach, afterEach } from "node:test";
import assert from "node:assert/strict";
import React from "react";
import {
  setupDom,
  ensureRtl,
  bundleModule,
  installFetchMock,
} from "./helpers/jsx-env.mjs";

/**
 * অডিট-পাসের অ্যাপ-শেল পরিবর্তনগুলোর টেস্ট:
 *   (১) sitemap.js / robots.js — পাবলিক রুট ইনডেক্স হয়, প্রাইভেট পাথ দূরে থাকে;
 *       NEXT_PUBLIC_SITE_URL দিলে সেটিই বেস-ঠিকানা।
 *   (২) not-found.jsx / error.jsx — কাস্টম ৪০৪ ও error boundary-এর UI + retry-কল।
 *   (৩) login/register — label↔input অ্যাসোসিয়েশন, autoComplete, পাসওয়ার্ড-টগলের aria।
 *
 * সব কম্পোনেন্ট আসল — bundleModule (next/link ও next/image স্টাব, dataurl ছবি-লোডার)
 * + installFetchMock দিয়ে; .mjs তাই JSX ছাড়া createElement-এ গাছ।
 */

const h = React.createElement;

/**
 * সোর্স-ফাইলের "পাসওয়ার্ড" লেখা আছে NFC-প্রি-কম্পোজড য় (U+09DF), আমার টাইপ করা রূপ
 * য+নুক্তা (U+09AF U+09BC) — ভিজুয়ালি এক, বাইটে ভিন্ন। দুই রূপ এক করে মেলাই।
 */
const bn = (s) => String(s).replace(/\u09DF/g, "\u09AF\u09BC");
/** label↔input অ্যাসোসিয়েশন: শুধু INPUT-এর সাথে যুক্ত লেবেলই মেলাই (aria-label বোতাম বাদ) */
const labelOf = (expected, tagName = "INPUT") => (content, el) =>
  el?.tagName === tagName && bn(content).trim() === bn(expected);

const NOT_FOUND_ENTRY = `export { default } from "./src/app/not-found.jsx";`;
const ERROR_ENTRY = `export { default } from "./src/app/error.jsx";`;
const SITEMAP_ENTRY = `export { default } from "./src/app/sitemap.js";`;
const ROBOTS_ENTRY = `export { default } from "./src/app/robots.js";`;
const AUTH_PAGES_ENTRY = `
export { AuthProvider } from "@/lib/auth-context";
export { default as LoginPage } from "@/app/login/page";
export { default as RegisterPage } from "@/app/register/page";
`;

const loadNotFound = () => bundleModule(NOT_FOUND_ENTRY, "app-not-found");
const loadErrorBoundary = () => bundleModule(ERROR_ENTRY, "app-error-boundary");
const loadSitemap = () => bundleModule(SITEMAP_ENTRY, "app-sitemap");
const loadRobots = () => bundleModule(ROBOTS_ENTRY, "app-robots");
const loadAuthPages = () => bundleModule(AUTH_PAGES_ENTRY, "app-auth-pages");

setupDom();
let rtl;
let fetchMock;

beforeEach(() => {
  rtl = ensureRtl();
  fetchMock = installFetchMock();
});

afterEach(() => {
  rtl?.cleanup();
  fetchMock?.restore();
  globalThis.localStorage?.clear();
  delete globalThis.__nkTestRouter;
  delete globalThis.__nkTestSearchParams;
});

describe("sitemap.js — পাবলিক রুট", () => {
  it("পাবলিক পাতা আছে, প্রাইভেট পাথ নেই, প্রতিটি URL সুসংগঠিত", async () => {
    const mod = await loadSitemap();
    const entries = mod.default();
    assert.ok(Array.isArray(entries) && entries.length > 0, "sitemap ফাঁকা নয়");

    const paths = entries.map((e) => new URL(e.url).pathname);
    for (const must of ["/", "/list", "/member", "/register", "/about", "/contact", "/terms", "/privacy", "/refund"]) {
      assert.ok(paths.includes(must), `sitemap-এ ${must} থাকা উচিত`);
    }
    for (const hide of ["/profile", "/dashboard", "/message", "/payment", "/checkout"]) {
      assert.ok(!paths.includes(hide), `sitemap-এ প্রাইভেট ${hide} থাকবে না`);
    }
    for (const e of entries) {
      assert.match(e.url, /^https?:\/\//, `URL সুসংগঠিত: ${e.url}`);
      assert.ok(e.priority > 0 && e.priority <= 1, "priority ০-১ এর মধ্যে");
      assert.ok(e.lastModified instanceof Date, "lastModified Date");
    }
  });

  it("NEXT_PUBLIC_SITE_URL থাকলে সেটিই বেস-ঠিকানা", async () => {
    process.env.NEXT_PUBLIC_SITE_URL = "https://nikah.test/";
    try {
      const mod = await bundleModule(SITEMAP_ENTRY, "app-sitemap-env");
      const entries = mod.default();
      assert.ok(entries.every((e) => e.url.startsWith("https://nikah.test/")), "env-ঠিকানা ব্যবহৃত হয়েছে");
    } finally {
      delete process.env.NEXT_PUBLIC_SITE_URL;
    }
  });
});

describe("robots.js — ক্রলার নীতি", () => {
  it("সবের জন্য allow /, প্রাইভেট পাথ disallow, sitemap লিংক", async () => {
    const mod = await loadRobots();
    const r = mod.default();
    assert.equal(r.rules.userAgent, "*");
    assert.equal(r.rules.allow, "/");
    for (const p of ["/dashboard", "/profile", "/message", "/payment", "/checkout"]) {
      assert.ok(r.rules.disallow.includes(p), `disallow-এ ${p} থাকা উচিত`);
    }
    assert.match(r.sitemap, /^https?:\/\/.+\/sitemap\.xml$/, "sitemap লিংক সুসংগঠিত");
  });
});

describe("কাস্টম ৪০৪ ও error boundary", () => {
  it("not-found: ৪০৪ UI + হোম ও বায়োডাটা লিংক", async () => {
    const mod = await loadNotFound();
    const { container } = rtl.render(h(mod.default));
    const screen = rtl.screen;
    assert.match(container.textContent, /৪০৪/, "৪০৪ নম্বর দৃশ্যমান");
    assert.equal(screen.getByRole("link", { name: "হোমে ফিরে যান" }).getAttribute("href"), "/");
    assert.equal(screen.getByRole("link", { name: "বায়োডাটা দেখুন" }).getAttribute("href"), "/list");
  });

  it("error: ত্রুটি লগ হয়, রিট্রাই-বোতাম unstable_retry একবার কল করে", async () => {
    const mod = await loadErrorBoundary();
    let retries = 0;
    let logged = null;
    const origError = console.error;
    console.error = (...args) => {
      if (args[0] instanceof Error) logged = args[0]; // React-এর act-ওয়ার্নিং বাদ, শুধু Error
    };
    try {
      rtl.render(
        h(mod.default, { error: new Error("boom"), unstable_retry: () => { retries += 1; } }),
      );
      const screen = rtl.screen;
      rtl.fireEvent.click(screen.getByRole("button", { name: "আবার চেষ্টা করুন" }));
      assert.equal(retries, 1, "রিট্রাই ঠিক একবার");
      assert.equal(logged?.message, "boom", "মূল ত্রুটি লগ হয়েছে");
      assert.ok(screen.getByRole("link", { name: "হোমে ফিরে যান" }), "বিকল্প হোম-লিংক আছে");
    } finally {
      console.error = origError;
    }
  });
});

describe("login/register ফর্ম — অ্যাক্সেসিবিলিটি", () => {
  it("login: label↔input অ্যাসোসিয়েশন, autoComplete ও টগলের aria", async () => {
    const M = await loadAuthPages();
    rtl.render(h(M.AuthProvider, null, h(M.LoginPage)));
    // AuthProvider-এর async setState (refreshUser/oauthProviders) act-এর ভেতরে ফ্লাশ
    await rtl.act(async () => { await new Promise((r) => setTimeout(r, 0)); });
    const screen = rtl.screen;

    const email = screen.getByLabelText(labelOf("ই-মেইল"));
    assert.equal(email.id, "login-email");
    assert.equal(email.getAttribute("autocomplete"), "email");

    const pass = screen.getByLabelText(labelOf("পাসওয়ার্ড"));
    assert.equal(pass.id, "login-password");
    assert.equal(pass.getAttribute("autocomplete"), "current-password");

    const toggle = screen.getByRole("button", { name: (content) => bn(content) === bn("পাসওয়ার্ড দেখুন") });
    assert.equal(toggle.getAttribute("aria-pressed"), "false");
    assert.equal(toggle.getAttribute("aria-controls"), "login-password");
  });

  it("register: চার ফিল্ডের label↔input অ্যাসোসিয়েশন ও autoComplete", async () => {
    const M = await loadAuthPages();
    rtl.render(h(M.AuthProvider, null, h(M.RegisterPage)));
    await rtl.act(async () => { await new Promise((r) => setTimeout(r, 0)); });
    const screen = rtl.screen;

    const checks = [
      ["নামের প্রথম অংশ", "reg-first-name", "given-name"],
      ["নামের শেষ অংশ", "reg-last-name", "family-name"],
      ["ই-মেইল", "reg-email", "email"],
      ["পাসওয়ার্ড", "reg-password", "new-password"],
    ];
    for (const [label, id, ac] of checks) {
      const input = screen.getByLabelText(labelOf(label));
      assert.equal(input.id, id, `${label}: id`);
      assert.equal(input.getAttribute("autocomplete"), ac, `${label}: autoComplete`);
    }
  });
});
