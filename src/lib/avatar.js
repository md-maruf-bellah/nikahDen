import alemBoy from "../../assets/member/alem.png";
import alemaGirl from "../../assets/member/alema.png";

import muslimBoy from "../../assets/member/new/muslimBoy.png";
import muslimGirl from "../../assets/member/new/muslimGirl.png";
import hinduBoy from "../../assets/member/new/hinduBoy.png";
import hinduGirl from "../../assets/member/new/hinduGirl.png";
import christianBoy from "../../assets/member/new/christianBoy.png";
import christianGirl from "../../assets/member/new/christianGirl.png";
import buddhistBoy from "../../assets/member/new/buddhistBoy.png";
import buddhistGirl from "../../assets/member/new/buddhistGirl.png";
import defaultBoy from "../../assets/member/new/boy.png";
import defaultGirl from "../../assets/member/new/girl.png";

import { defaultAvatarKey } from "./avatar.core.mjs";

/**
 * Gender and religion-based default avatar (fallback only — never reveals a protected
 * photo: callers use it when profileImage is null/hidden).
 */
export function defaultAvatarFor(gender, religion) {
  const isFemale = defaultAvatarKey(gender) === "female";
  const r = String(religion || "").trim().toLowerCase();

  if (r.includes("islam") || r.includes("ইসলাম")) {
    return isFemale ? muslimGirl : muslimBoy;
  }
  if (r.includes("hindu") || r.includes("সনাতন") || r.includes("হিন্দু")) {
    return isFemale ? hinduGirl : hinduBoy;
  }
  if (r.includes("christ") || r.includes("খ্রিস্ট")) {
    return isFemale ? christianGirl : christianBoy;
  }
  if (r.includes("buddh") || r.includes("বৌদ্ধ")) {
    return isFemale ? buddhistGirl : buddhistBoy;
  }

  return isFemale ? (defaultGirl || alemaGirl) : (defaultBoy || alemBoy);
}

export { defaultAvatarKey } from "./avatar.core.mjs";

