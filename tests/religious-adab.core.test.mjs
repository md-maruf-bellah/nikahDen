import test from "node:test";
import assert from "node:assert/strict";
import {
  RELIGIOUS_ADAB_DATA,
  RELIGIOUS_PLEDGE_TEXT,
  getAdabForReligions,
} from "../src/lib/religiousAdab.js";

test("Religious Adab & Etiquette — Data integrity", async (t) => {
  await t.test("exports well-formed adab data for all major religions", () => {
    const requiredReligions = ["Islam", "Hinduism", "Christianity", "Buddhism", "CrossReligion"];
    for (const rel of requiredReligions) {
      assert.ok(RELIGIOUS_ADAB_DATA[rel], `Missing adab data for ${rel}`);
      assert.ok(RELIGIOUS_ADAB_DATA[rel].title, `Missing title for ${rel}`);
      assert.ok(RELIGIOUS_ADAB_DATA[rel].subtitle, `Missing subtitle for ${rel}`);
      assert.ok(RELIGIOUS_ADAB_DATA[rel].bgColor, `Missing bgColor for ${rel}`);
      assert.ok(Array.isArray(RELIGIOUS_ADAB_DATA[rel].rules), `rules must be an array for ${rel}`);
      assert.ok(RELIGIOUS_ADAB_DATA[rel].rules.length >= 3, `${rel} must have at least 3 etiquette rules`);
    }
  });

  await t.test("exports valid religious pledge text", () => {
    assert.ok(typeof RELIGIOUS_PLEDGE_TEXT === "string");
    assert.ok(RELIGIOUS_PLEDGE_TEXT.length > 20);
    assert.ok(RELIGIOUS_PLEDGE_TEXT.includes("অঙ্গীকার"));
  });
});

test("Religious Adab & Etiquette — Resolution helper", async (t) => {
  await t.test("returns Islam adab for same-religion Muslim match or default", () => {
    const adab = getAdabForReligions("Islam", "Islam");
    assert.equal(adab.title, "ইসলামী শিষ্টাচার ও আদব");
    const def = getAdabForReligions(null, null);
    assert.equal(def.title, "ইসলামী শিষ্টাচার ও আদব");
  });

  await t.test("returns Hinduism adab for Sanatan / Hindu match", () => {
    const adab = getAdabForReligions("Hinduism", "Hinduism");
    assert.equal(adab.title, "সনাতন ধর্মীয় শিষ্টাচার ও মর্যাদা");
  });

  await t.test("returns Christianity adab for Christian match", () => {
    const adab = getAdabForReligions("Christianity", "Christianity");
    assert.equal(adab.title, "খ্রিস্টীয় মূল্যবোধ ও শিষ্টাচার");
  });

  await t.test("returns Buddhism adab for Buddhist match", () => {
    const adab = getAdabForReligions("Buddhism", "Buddhism");
    assert.equal(adab.title, "বৌদ্ধ মূল্যবোধ ও মৈত্রী ভাবনা");
  });

  await t.test("returns CrossReligion adab for interfaith pairs", () => {
    const adab1 = getAdabForReligions("Islam", "Hinduism");
    assert.equal(adab1.title, "আন্তঃধর্মীয় পারস্পরিক সম্প্রীতি ও শিষ্টাচার");

    const adab2 = getAdabForReligions("Christianity", "Islam");
    assert.equal(adab2.title, "আন্তঃধর্মীয় পারস্পরিক সম্প্রীতি ও শিষ্টাচার");

    const adab3 = getAdabForReligions("Buddhism", "Hinduism");
    assert.equal(adab3.title, "আন্তঃধর্মীয় পারস্পরিক সম্প্রীতি ও শিষ্টাচার");
  });
});
