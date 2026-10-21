import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { AVATAR_KEYS, defaultAvatarKey } from "../src/lib/avatar.core.mjs";

describe("gender-based default avatar (fallback only)", () => {
  it("maps FEMALE to the female placeholder", () => {
    assert.equal(defaultAvatarKey("FEMALE"), AVATAR_KEYS.FEMALE);
    assert.equal(defaultAvatarKey("female"), AVATAR_KEYS.FEMALE);
    assert.equal(defaultAvatarKey(" Female "), AVATAR_KEYS.FEMALE);
  });

  it("maps MALE to the male placeholder", () => {
    assert.equal(defaultAvatarKey("MALE"), AVATAR_KEYS.MALE);
    assert.equal(defaultAvatarKey("male"), AVATAR_KEYS.MALE);
  });

  it("unknown/missing gender keeps the legacy male fallback (never breaks a card)", () => {
    assert.equal(defaultAvatarKey(null), AVATAR_KEYS.MALE);
    assert.equal(defaultAvatarKey(undefined), AVATAR_KEYS.MALE);
    assert.equal(defaultAvatarKey(""), AVATAR_KEYS.MALE);
    assert.equal(defaultAvatarKey("OTHER"), AVATAR_KEYS.MALE);
  });

  it("exposes exactly two keys (assets: alem.png / alema.png)", () => {
    assert.deepEqual(Object.values(AVATAR_KEYS).sort(), ["female", "male"]);
  });
});
