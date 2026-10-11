/**
 * অ্যাডমিন অ্যাকশন অডিট-ট্রেইল — কে (actor), কবে (server time), কী (action+target)।
 *
 * কভার:
 *   • রোল-পরিবর্তন (USER_UPDATE) → roleBefore→roleAfter ডিফ
 *   • ম্যানুয়াল আনলক (UNLOCK) → বিস্তারিত কেস loginLockout.test.js-এ
 *   • ডিঅ্যাক্টিভেট/ডিলিট (DELETE)
 *   • ইমেইল মাস্কিং, সার্ভার-টাইমস্ট্যাম্প, অ্যাক্সেস-গার্ড (staff পড়ে, সদস্য 403)
 */
import { describe, it, before, after, beforeEach } from "node:test";
import assert from "node:assert/strict";
import AdminAuditEvent from "../src/models/adminAuditEvent.model.js";
import User from "../src/models/user.model.js";
import {
  startServer,
  stopServer,
  clearDb,
  registerUser,
  createSuperAdmin,
  superAdmin,
  login,
  createStaff,
  auth,
} from "./helpers.js";

describe("ADMIN AUDIT TRAIL", () => {
  let request;

  before(async () => {
    ({ request } = await startServer());
  });

  after(async () => {
    await stopServer();
  });

  beforeEach(async () => {
    await clearDb();
    await AdminAuditEvent.deleteMany({}).catch(() => {});
    // clearDb ফিক্সচার-অ্যাকাউন্টও ধুয়ে দেয় — প্রতিটি টেস্টে SUPERADMIN আবার সিড
    await createSuperAdmin();
  });

  it("রোল-পরিবর্তন → USER_UPDATE রেকর্ড: roleBefore→roleAfter, actor, server-time", async () => {
    const root = await login(request, superAdmin.email, superAdmin.password);
    const admin = await createStaff(request, { role: "ADMIN" });

    const res = await request
      .patch(`/api/v1/users/${admin.user.id}`)
      .set(auth(root.accessToken))
      .send({ role: "EDITOR" });
    assert.equal(res.status, 200);

    const events = await AdminAuditEvent.find({ action: "USER_UPDATE" }).lean();
    assert.equal(events.length, 1, "ঠিক একটি USER_UPDATE রেকর্ড");
    const ev = events[0];
    assert.equal(ev.actorRole, "SUPERADMIN");
    assert.equal(ev.actorId, root.user.id, "কে — actor id");
    assert.equal(ev.roleBefore, "ADMIN", "আগের পদবী");
    assert.equal(ev.roleAfter, "EDITOR", "নতুন পদবী");
    assert.equal(ev.targetId, admin.user.id, "কী — target id");
    assert.ok(ev.actorEmail.startsWith("***@"), "actor ইমেইল মাস্কড");
    const ageSec = (Date.now() - new Date(ev.at).getTime()) / 1000;
    assert.ok(ageSec >= 0 && ageSec < 120, "কবে — সার্ভার টাইমস্ট্যাম্প");
  });

  it("রোল অপরিবর্তিত PATCH-এ কোনো অডিট নেই (ring-বার্বারিতে noise নয়)", async () => {
    const root = await login(request, superAdmin.email, superAdmin.password);
    const admin = await createStaff(request, { role: "ADMIN" });

    const res = await request
      .patch(`/api/v1/users/${admin.user.id}`)
      .set(auth(root.accessToken))
      .send({ firstName: "নতুন নাম" });
    assert.equal(res.status, 200);

    const events = await AdminAuditEvent.find({ action: "USER_UPDATE" }).lean();
    assert.equal(events.length, 0, "রোল-ব্যতীত এডিটে অডিট নেই");
  });

  it("ডিঅ্যাক্টিভেট (DELETE) → DELETE রেকর্ড: actor + target + server-time", async () => {
    const root = await login(request, superAdmin.email, superAdmin.password);
    const member = await registerUser(request);

    const res = await request
      .delete(`/api/v1/users/${member.user.id}`)
      .set(auth(root.accessToken));
    assert.equal(res.status, 200);

    const events = await AdminAuditEvent.find({ action: "DELETE" }).lean();
    assert.equal(events.length, 1, "ঠিক একটি DELETE রেকর্ড");
    const ev = events[0];
    assert.equal(ev.actorRole, "SUPERADMIN");
    assert.equal(ev.actorId, root.user.id, "কে — actor id");
    assert.equal(ev.targetId, member.user.id, "কী — target id");
    assert.ok(ev.actorEmail.startsWith("***@"));
    assert.ok(ev.targetEmail.startsWith("***@"));
    const ageSec = (Date.now() - new Date(ev.at).getTime()) / 1000;
    assert.ok(ageSec >= 0 && ageSec < 120, "কবে — সার্ভার টাইমস্ট্যাম্প");

    // মাস্কড ইমেইল PII-সংকোচন — ডোমেইন আছে, লোকাল-পার্ট নেই
    assert.equal(ev.targetEmail, "***@test.dev");
  });

  it("অডিট রিড: staff পড়তে পারে (নতুন-থেকে-পুরনো), সদস্য 403; action ফিল্টার কাজ করে", async () => {
    const root = await login(request, superAdmin.email, superAdmin.password);
    const member = await registerUser(request);
    const admin = await createStaff(request, { role: "ADMIN" });

    // দুটি ভিন্ন অ্যাকশন
    await request
      .patch(`/api/v1/users/${admin.user.id}`)
      .set(auth(root.accessToken))
      .send({ role: "EDITOR" });
    await request
      .delete(`/api/v1/users/${member.user.id}`)
      .set(auth(root.accessToken));

    // staff — সব
    const all = await request.get("/api/v1/admin/audit/events").set(auth(root.accessToken));
    assert.equal(all.status, 200);
    assert.equal(all.body.data.length, 2, "দুই অ্যাকশন-রেকর্ড");
    // natural order = নতুন আগে: DELETE সবশেষে হয়েছে, তাই প্রথমে
    assert.equal(all.body.data[0].action, "DELETE");
    assert.equal(all.body.data[1].action, "USER_UPDATE");

    // action ফিল্টার
    const filtered = await request
      .get("/api/v1/admin/audit/events")
      .set(auth(root.accessToken))
      .query({ action: "DELETE" });
    assert.equal(filtered.status, 200);
    assert.equal(filtered.body.data.length, 1);
    assert.equal(filtered.body.data[0].action, "DELETE");

    // সদস্য পড়তে পারে না
    const memberLogin = await login(request, member.user.email, "Passw0rd!").catch(() => null);
    if (memberLogin) {
      const denied = await request
        .get("/api/v1/admin/audit/events")
        .set(auth(memberLogin.accessToken));
      assert.equal(denied.status, 403, "সদস্য অডিট পড়তে পারে না");
    } else {
      // member was deactivated — রেজিস্টার করে যাচাই
      const fresh = await registerUser(request);
      const denied = await request
        .get("/api/v1/admin/audit/events")
        .set(auth(fresh.accessToken));
      assert.equal(denied.status, 403, "সদস্য অডিট পড়তে পারে না");
    }
  });

  it("CREATE /users (নতুন স্টাফ) ও রোল-উন্নতি SUPERADMIN-নিয়ন্ত্রিত — অডিট কভারেজ এই দুই ক্ষেত্রে USER_UPDATE/DELETE নয়", async () => {
    // This test verifies the audit surface stays scoped: creating a user and
    // non-role edits don't flood the ring; only the sensitive mutations log.
    const root = await login(request, superAdmin.email, superAdmin.password);
    const staff = await createStaff(request, { role: "EDITOR" });

    await request
      .patch(`/api/v1/users/${staff.user.id}`)
      .set(auth(root.accessToken))
      .send({ firstName: "নত" }); // non-role edit → no audit

    const auditCount = await AdminAuditEvent.countDocuments({});
    assert.equal(auditCount, 0, "create + non-role edit → ring ফাঁকা");
    assert.ok(staff.user.id.length > 0);
  });
});
