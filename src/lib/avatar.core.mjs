/**
 * Gender-based default avatar selection — PURE logic (no asset imports so the
 * node test runner can load it directly).
 *
 * Rules:
 *   - FEMALE  → the female placeholder photo
 *   - MALE    → the male placeholder photo
 *   - unknown → male placeholder (legacy behavior: every card fell back to the
 *     boy image). A default avatar is ONLY a fallback for a missing/hidden
 *     photo — it never unlocks or replaces a protected original.
 */

export const AVATAR_KEYS = Object.freeze({ FEMALE: "female", MALE: "male" });

export function defaultAvatarKey(gender) {
  const g = String(gender || "").trim().toUpperCase();
  return g === "FEMALE" ? AVATAR_KEYS.FEMALE : AVATAR_KEYS.MALE;
}

const avatarCore = { AVATAR_KEYS, defaultAvatarKey };
export default avatarCore;
