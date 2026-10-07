/**
 * কম্পোনেন্ট-লেভেল টেস্টের চালক — jsdom + esbuild, নতুন টেস্ট-রানার ছাড়া।
 *
 * node --test সরাসরি .jsx পার্স করতে পারে না; তাই:
 *   1. setupDom()  — jsdom-এর window/document/localStorage global-এ বসায় (React DOM-এর আগে)
 *   2. bundleModule(source) — esbuild দিয়ে ভার্চুয়াল এন্ট্রি বানিয়ে ESM হিসেবে import করে
 *      (src/** এর @/ এলিয়াস ও next/navigation স্টাব এখানেই সামলানো)
 *
 * বান্ডল node_modules/.cache/-এ লেখা হয় — যাতে external "react" import
 * প্রজেক্টের node_modules থেকেই রেজলভ হয় (RTL-এর CJS react-এর সাথে একই ইনস্ট্যান্স)।
 */
import fs from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { createRequire } from "node:module";
import { JSDOM } from "jsdom";
import esbuild from "esbuild";

const require = createRequire(import.meta.url);

export const ROOT = path.resolve(import.meta.dirname, "..", "..");
const BUNDLE_DIR = path.join(ROOT, "node_modules", ".cache", "nkd-test-bundles");

let dom = null;
let rtl = null;
const bundleCache = new Map();

/** jsdom global বসানো — react-dom/client লোডের আগে একবারই দরকার */
export function setupDom() {
  if (dom) return dom;
  dom = new JSDOM('<!doctype html><html><body><div id="root"></div></body></html>', {
    url: "http://localhost/",
    pretendToBeVisual: true,
  });
  const { window } = dom;
  for (const key of ["window", "document", "localStorage", "location", "HTMLElement", "Element", "Node", "Event", "CustomEvent", "FormData"]) {
    globalThis[key] = window[key];
  }
  // Node ≥21-এ global navigator getter — defineProperty দিয়েই নিরাপদ
  Object.defineProperty(globalThis, "navigator", { value: window.navigator, configurable: true, writable: true });
  // jsdom-এ scrollIntoView নেই — অটো-স্ক্রল ইফেক্ট চালু কম্পোনেন্ট (মেসেঞ্জার) নইলে ফাটে
  if (typeof window.Element.prototype.scrollIntoView !== "function") {
    window.Element.prototype.scrollIntoView = function scrollIntoView() {};
  }
  globalThis.requestAnimationFrame = window.requestAnimationFrame?.bind(window) ?? ((cb) => setTimeout(() => cb(Date.now()), 16));
  globalThis.cancelAnimationFrame = window.cancelAnimationFrame?.bind(window) ?? ((id) => clearTimeout(id));
  // React 19-এর act() — RTL ছাড়া চালালে এই পতাকা চাই
  globalThis.IS_REACT_ACT_ENVIRONMENT = true;
  return dom;
}

/** @testing-library/react — CJS require (ESM import-এর চেয়ে নির্ভরযোগ্য), DOM সেটআপের পরে */
export function ensureRtl() {
  setupDom();
  if (!rtl) rtl = require("@testing-library/react");
  return rtl;
}

/** @/ → src/ এলিয়াস (এক্সটেনশনসহ রেজলভ — esbuild ঠিক পাথ চায়) */
const aliasAt = {
  name: "alias-at",
  setup(build) {
    build.onResolve({ filter: /^@\// }, (args) => {
      const base = path.join(ROOT, "src", args.path.slice(2));
      for (const cand of [base + ".js", base + ".jsx", base + ".mjs", path.join(base, "index.js"), path.join(base, "index.jsx")]) {
        if (fs.existsSync(cand)) return { path: cand };
      }
      return { path: base }; // মেলেনি — esbuild-ই স্পষ্ট ত্রুটি দিক
    });
  },
};

/**
 * next/navigation — টেস্ট দুইটি global দিয়ে নিয়ন্ত্রণ করে:
 *   __nkTestRouter     → useRouter().push পর্যবেক্ষণযোগ্য
 *   __nkTestSearchParams → useSearchParams() রিটার্ন (না দিলে undefined; কলার `?.get()` করে)
 */
const stubNextRouter = {
  name: "stub-next-router",
  setup(build) {
    build.onResolve({ filter: /^next\/navigation$/ }, () => ({ path: "next-navigation", namespace: "nk-stub" }));
    build.onLoad({ filter: /.*/, namespace: "nk-stub" }, () => ({
      contents: `
        export function useRouter() { return globalThis.__nkTestRouter || { push() {} }; }
        export function useSearchParams() { return globalThis.__nkTestSearchParams; }
      `,
      loader: "js",
    }));
  },
};

/**
 * next/link — অ্যাঙ্কর-মাত্র স্টাব। আসল Link বান্ডলে app-router-কনটেক্সট টানে আনে,
 * যা টেস্ট-ট্রি-তে (Router প্রোভাইডার ছাড়া) ভাঙা; টেস্টে href+childrenই দরকার।
 */
const stubNextLink = {
  name: "stub-next-link",
  setup(build) {
    build.onResolve({ filter: /^next\/link$/ }, () => ({ path: "next-link", namespace: "nk-stub-link" }));
    build.onLoad({ filter: /.*/, namespace: "nk-stub-link" }, () => ({
      resolveDir: ROOT,
      contents: `export default function Link({ href, children, ...rest }) {
  return <a href={typeof href === "string" ? href : "#"} {...rest}>{children}</a>;
}`,
      loader: "jsx",
    }));
  },
};

/**
 * socket.io-client — বান্ডলে টেনে আনলে xmlhttprequest-ssl-এর dynamic require('fs')
 * ESM-এ ফাটে; আবার আসল সংযোগও টেস্টে নিষিদ্ধ। নিষ্ক্রিয় ফেক-socket দেই
 * (globalThis.__nkTestSocket দিয়ে টেস্ট চাইলে নিয়ন্ত্রণ করতে পারে)।
 */
const stubSocketClient = {
  name: "stub-socket-client",
  setup(build) {
    build.onResolve({ filter: /^socket\.io-client$/ }, () => ({ path: "socket-io-client", namespace: "nk-stub-socket" }));
    build.onLoad({ filter: /.*/, namespace: "nk-stub-socket" }, () => ({
      contents: `
        export function io() {
          return globalThis.__nkTestSocket || { connect() {}, disconnect() {}, on() {}, off() {}, emit() {} };
        }
        export default { io };
      `,
      loader: "js",
    }));
  },
};

/**
 * next/image — টেস্ট-ট্রি-তে সাধারণ <img>। fill/priority ইত্যাদি Next-বিশেষ
 * প্রপস DOM-এ গেলে React চিৎকার করে, তাই আলাদা করে বাদ; ছবি-ইমপোর্ট (png ইত্যাদি)
 * bundleModule-এ dataurl লোডার, তাই src হয়ে থাকে data-URL স্ট্রিং।
 */
const stubNextImage = {
  name: "stub-next-image",
  setup(build) {
    build.onResolve({ filter: /^next\/image$/ }, () => ({ path: "next-image", namespace: "nk-stub-image" }));
    build.onLoad({ filter: /.*/, namespace: "nk-stub-image" }, () => ({
      resolveDir: ROOT,
      contents: `export default function Image({ src, alt = "", fill, priority, placeholder, blurDataURL, loader, unoptimized, ...rest }) {
  const url = typeof src === "string" ? src : (src && src.src) || "";
  return <img src={url} alt={alt} {...rest} />;
}`,
      loader: "jsx",
    }));
  },
};

/**
 * ভার্চুয়াল এন্ট্রি-সোর্স বান্ডল করে ESM মডিউল হিসেবে import করে।
 * react/react-dom external — প্রজেক্টের node_modules-এর একই ইনস্ট্যান্স।
 * @param {string} source  ESM এন্ট্রি-সোর্স (re-export বারেল)
 * @param {string} cacheKey  একই বান্ডল বারবার না বানাতে
 */
export async function bundleModule(source, cacheKey) {
  setupDom();
  if (bundleCache.has(cacheKey)) return bundleCache.get(cacheKey);

  fs.mkdirSync(BUNDLE_DIR, { recursive: true });
  const outFile = path.join(BUNDLE_DIR, `bundle-${cacheKey}.mjs`);
  const result = await esbuild.build({
    stdin: { contents: source, resolveDir: ROOT, sourcefile: "virtual-entry.jsx", loader: "jsx" },
    bundle: true,
    platform: "node",
    format: "esm",
    jsx: "automatic",
    write: false,
    outExtension: { ".js": ".mjs" },
    external: ["react", "react-dom", "react/jsx-runtime", "react-dom/client", "lucide-react"],
    // ছবি-অ্যাসেট import (login/register-এর logo/contact) — dataurl হলে কোনো ফাইল-আউটপুট লাগে না
    loader: { ".png": "dataurl", ".jpg": "dataurl", ".jpeg": "dataurl", ".gif": "dataurl", ".webp": "dataurl", ".svg": "dataurl" },
    plugins: [aliasAt, stubNextRouter, stubNextLink, stubSocketClient, stubNextImage],
    logLevel: "silent",
  });
  fs.writeFileSync(outFile, result.outputFiles[0].text);
  const mod = await import(pathToFileURL(outFile).href);
  bundleCache.set(cacheKey, mod);
  return mod;
}

/** টেস্টের fetch মক — URL-ফ্র্যাগমেন্ট ধরে রেসপন্ডার, সব কলের লগ রাখে */
export function installFetchMock() {
  const realFetch = globalThis.fetch;
  const log = [];
  const routes = [];
  globalThis.fetch = async (url, init = {}) => {
    const entry = {
      url: String(url),
      method: (init.method || "GET").toUpperCase(),
      headers: init.headers || null,
      // POST-body (api ক্লায়েন্ট JSON.stringify করে দেয়) — রিকোয়েস্ট-শরীর অ্যাসার্টের জন্য
      body: init.body ?? null,
    };
    log.push(entry);
    for (const route of routes) {
      if (entry.url.includes(route.fragment) && entry.method === route.method) return route.respond(entry);
    }
    return jsonResponse(404, { message: `unrouted: ${entry.method} ${entry.url}` });
  };
  return {
    log,
    /** on("/auth/me", () => jsonResponse(200, { data }), "GET") */
    on(fragment, respond, method = "GET") {
      routes.push({ fragment, respond, method });
    },
    callsTo(fragment) {
      return log.filter((c) => c.url.includes(fragment));
    },
    restore() {
      globalThis.fetch = realFetch;
    },
  };
}

/** api ক্লায়েন্ট json.data আনর‍্যাপ করে — তাই সব রেসপন্স { data } আকারে */
export function jsonResponse(status, data) {
  return new Response(JSON.stringify(data), { status, headers: { "Content-Type": "application/json" } });
}

/** ম্যানুয়ালি রেজলভ করা যায় এমন প্রমিজ — হাইড্রেশন-রেস ধরে রাখতে */
export function deferred() {
  let resolve, reject;
  const promise = new Promise((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}

/** এক মাইক্রোটাস্ক-বার্স্ট ফ্লাশ (useEffect-চেইন চালাতে) */
export function tick(n = 1) {
  let p = Promise.resolve();
  for (let i = 0; i < n; i++) p = p.then(() => {});
  return p;
}

/** অপেক্ষার পরে টেম্প-বান্ডল ফোল্ডার মুছে দেওয়ার জন্য (ঐচ্ছিক) */
export function cleanBundles() {
  try {
    fs.rmSync(BUNDLE_DIR, { recursive: true, force: true });
  } catch {
    /* অন্য প্রসেস ব্যবহার করছে — ছাড় */
  }
}
