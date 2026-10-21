import test, { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  THEMES_CONFIG,
  resolveUserThemeTier,
  isThemeUnlocked,
} from "../src/lib/themes.core.mjs";

describe("Theme System — Package-based Tiers", () => {
  it("exports valid THEMES_CONFIG with correct tiers", () => {
    assert.ok(Array.isArray(THEMES_CONFIG), "THEMES_CONFIG should be an array");
    assert.ok(THEMES_CONFIG.length >= 20, "Should have rich selection of themes");

    const freeThemes = THEMES_CONFIG.filter((t) => t.tier === 0);
    const silverThemes = THEMES_CONFIG.filter((t) => t.tier === 1);
    const royalThemes = THEMES_CONFIG.filter((t) => t.tier === 2);

    assert.ok(freeThemes.length >= 4, "Should have at least 4 free themes");
    assert.ok(silverThemes.length >= 6, "Should have at least 6 silver themes");
    assert.ok(royalThemes.length >= 6, "Should have at least 6 royal VIP themes");

    // Free themes should include clean daylight and sunnah emerald
    assert.ok(freeThemes.some((t) => t.id === "light"), "Light should be free");
    assert.ok(freeThemes.some((t) => t.id === "emerald"), "Emerald should be free");

    // Silver themes should include dark, cupcake, winter
    assert.ok(silverThemes.some((t) => t.id === "dark"), "Dark should be silver");
    assert.ok(silverThemes.some((t) => t.id === "cupcake"), "Cupcake should be silver");

    // Royal VIP themes should include luxury, valentine, sunset
    assert.ok(royalThemes.some((t) => t.id === "luxury"), "Luxury should be royal");
    assert.ok(royalThemes.some((t) => t.id === "valentine"), "Valentine should be royal");
    assert.ok(royalThemes.some((t) => t.id === "night"), "Night should be royal");
  });

  it("ensures every theme has required UI metadata", () => {
    for (const t of THEMES_CONFIG) {
      assert.ok(t.id, "Theme must have an id");
      assert.ok(t.name, `Theme ${t.id} must have a Bengali display name`);
      assert.ok([0, 1, 2].includes(t.tier), `Theme ${t.id} has invalid tier: ${t.tier}`);
      assert.ok(t.tierName, `Theme ${t.id} must have tierName`);
      assert.ok(t.primaryColor, `Theme ${t.id} must have primaryColor class`);
      assert.ok(t.baseColor, `Theme ${t.id} must have baseColor class`);
    }
  });

  it("correctly resolves tier access permissions", () => {
    // Free user (level 0)
    assert.equal(isThemeUnlocked(0, 0), true, "Free user can access tier 0");
    assert.equal(isThemeUnlocked(1, 0), false, "Free user cannot access tier 1");
    assert.equal(isThemeUnlocked(2, 0), false, "Free user cannot access tier 2");

    // Silver user (level 1)
    assert.equal(isThemeUnlocked(0, 1), true, "Silver user can access tier 0");
    assert.equal(isThemeUnlocked(1, 1), true, "Silver user can access tier 1");
    assert.equal(isThemeUnlocked(2, 1), false, "Silver user cannot access tier 2");

    // Royal VIP / Admin (level 2)
    assert.equal(isThemeUnlocked(0, 2), true, "Royal user can access tier 0");
    assert.equal(isThemeUnlocked(1, 2), true, "Royal user can access tier 1");
    assert.equal(isThemeUnlocked(2, 2), true, "Royal user can access tier 2");
  });

  it("resolves user tier correctly from user and subscription", () => {
    // Staff / Admin
    const adminTier = resolveUserThemeTier({ role: "ADMIN" }, null);
    assert.equal(adminTier.level, 2);
    assert.ok(adminTier.label.includes("স্টাফ"));

    // Monthly subscription
    const monthlyTier = resolveUserThemeTier(
      { role: "MEMBER" },
      { subscription: { isActive: true, plan: { slug: "monthly", price: 699 } } }
    );
    assert.equal(monthlyTier.level, 1);
    assert.ok(monthlyTier.label.includes("সিলভার"));

    // Semi-annual VIP subscription
    const vipTier = resolveUserThemeTier(
      { role: "MEMBER" },
      { subscription: { isActive: true, plan: { slug: "semi-annual", price: 1299 } } }
    );
    assert.equal(vipTier.level, 2);
    assert.ok(vipTier.label.includes("রয়্যাল"));

    // Inactive / Free user
    const freeTier = resolveUserThemeTier({ role: "MEMBER" }, { subscription: { isActive: false } });
    assert.equal(freeTier.level, 0);
  });
});
