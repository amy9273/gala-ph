import { describe, it, after, before } from "node:test";
import assert from "node:assert/strict";
import request from "supertest";
import { app } from "../app.js";
import { disconnectPrisma } from "../lib/prisma.js";
import { getRedisClient } from "../lib/redis.js";

describe("Unit 03: Auth & Trip Management Engine", () => {
  const testEmail1 = `organizer_${Date.now()}@gala-ph.dev`;
  const testEmail2 = `barkada_${Date.now()}@gala-ph.dev`;
  const testPassword = "SecureP@ssword2026!";

  let tokenLead = "";
  let userLeadId = "";
  let tokenMember = "";
  let userMemberId = "";
  let createdTripId = "";
  let generatedInviteCode = "";

  after(async () => {
    // Teardown connections to prevent hanging CI test workers
    const redis = getRedisClient();
    if (redis) {
      redis.disconnect();
    }
    await disconnectPrisma();
  });

  describe("1. User Registration & Philippine Phone Validation", () => {
    it("should successfully register a new user with valid PH mobile number", async () => {
      const res = await request(app).post("/api/v1/auth/register").send({
        email: testEmail1,
        password: testPassword,
        name: "Trip Leader Juan",
        phone: "09171234567",
        gcashNumber: "+639171234567",
      });

      assert.strictEqual(res.status, 201);
      assert.ok(res.body.token, "JWT token should be returned");
      assert.ok(res.body.user, "User object should be returned");
      assert.strictEqual(res.body.user.email, testEmail1.toLowerCase());
      assert.strictEqual(res.body.user.phone, "+639171234567");
      assert.strictEqual(
        res.body.user.passwordHash,
        undefined,
        "Password hash must not be leaked",
      );

      tokenLead = res.body.token;
      userLeadId = res.body.user.id;
    });

    it("should reject duplicate email registration with 409 Conflict", async () => {
      const res = await request(app).post("/api/v1/auth/register").send({
        email: testEmail1,
        password: testPassword,
        name: "Duplicate Juan",
        phone: "09171234567",
      });

      assert.strictEqual(res.status, 409);
      assert.strictEqual(res.body.error.code, "CONFLICT");
    });

    it("should reject registration with invalid Philippine phone format", async () => {
      const res = await request(app)
        .post("/api/v1/auth/register")
        .send({
          email: `invalid_phone_${Date.now()}@gala-ph.dev`,
          password: testPassword,
          name: "Invalid Phone User",
          phone: "123456",
        });

      assert.strictEqual(res.status, 400);
      assert.strictEqual(res.body.error.code, "VALIDATION_ERROR");
    });

    it("should register a second user to test barkada membership", async () => {
      const res = await request(app).post("/api/v1/auth/register").send({
        email: testEmail2,
        password: testPassword,
        name: "Barkada Member Maria",
        phone: "09189876543",
      });

      assert.strictEqual(res.status, 201);
      tokenMember = res.body.token;
      userMemberId = res.body.user.id;
    });
  });

  describe("2. Authentication & JWT Session Lifecycle", () => {
    it("should successfully authenticate with valid credentials", async () => {
      const res = await request(app).post("/api/v1/auth/login").send({
        email: testEmail1,
        password: testPassword,
      });

      assert.strictEqual(res.status, 200);
      assert.ok(res.body.token);
      assert.strictEqual(res.body.user.email, testEmail1.toLowerCase());
    });

    it("should reject login with incorrect password with 401 Unauthorized", async () => {
      const res = await request(app).post("/api/v1/auth/login").send({
        email: testEmail1,
        password: "WrongPassword999!",
      });

      assert.strictEqual(res.status, 401);
      assert.strictEqual(res.body.error.code, "UNAUTHORIZED");
    });

    it("should fetch current user profile via GET /api/v1/auth/me", async () => {
      const res = await request(app)
        .get("/api/v1/auth/me")
        .set("Authorization", `Bearer ${tokenLead}`);

      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.body.user.id, userLeadId);
      assert.strictEqual(res.body.user.email, testEmail1.toLowerCase());
      assert.ok(Array.isArray(res.body.user.memberships));
    });

    it("should reject requests without authorization header with 401 Unauthorized", async () => {
      const res = await request(app).get("/api/v1/auth/me");
      assert.strictEqual(res.status, 401);
      assert.strictEqual(res.body.error.code, "UNAUTHORIZED");
    });

    it("should reject invalid or forged token with 401 Unauthorized", async () => {
      const res = await request(app)
        .get("/api/v1/auth/me")
        .set("Authorization", "Bearer invalid_fake_token_12345");

      assert.strictEqual(res.status, 401);
      assert.strictEqual(res.body.error.code, "UNAUTHORIZED");
    });
  });

  describe("3. Barkada Trip Creation & Leader Assignment", () => {
    it("should create a trip and auto-assign the creator as TRIP_LEAD", async () => {
      const res = await request(app)
        .post("/api/v1/trips")
        .set("Authorization", `Bearer ${tokenLead}`)
        .send({
          title: "Batangas Beach Getaway",
          destination: "Nasugbu, Batangas",
          startDate: "2026-11-20T00:00:00.000Z",
          endDate: "2026-11-22T23:59:59.000Z",
          travelMode: "HYBRID",
        });

      assert.strictEqual(res.status, 201);
      assert.ok(res.body.trip);
      assert.ok(res.body.trip.id);
      assert.ok(res.body.trip.inviteCode);

      createdTripId = res.body.trip.id;
      generatedInviteCode = res.body.trip.inviteCode;

      // Assert organizer is member with role TRIP_LEAD
      const members = res.body.trip.members;
      assert.strictEqual(members.length, 1);
      assert.strictEqual(members[0].userId, userLeadId);
      assert.strictEqual(members[0].role, "TRIP_LEAD");
    });

    it("should list user trips on GET /api/v1/trips", async () => {
      const res = await request(app)
        .get("/api/v1/trips")
        .set("Authorization", `Bearer ${tokenLead}`);

      assert.strictEqual(res.status, 200);
      assert.ok(Array.isArray(res.body.trips));
      assert.ok(res.body.trips.length >= 1);
    });
  });

  describe("4. Barkada Join Trip via Invite Code", () => {
    it("should allow a friend to join trip using valid invite code", async () => {
      const res = await request(app)
        .post("/api/v1/trips/join")
        .set("Authorization", `Bearer ${tokenMember}`)
        .send({
          inviteCode: generatedInviteCode,
        });

      assert.strictEqual(res.status, 200);
      assert.ok(res.body.membership);
      assert.strictEqual(res.body.membership.userId, userMemberId);
      assert.strictEqual(res.body.membership.role, "MEMBER");
    });

    it("should reject duplicate join with 409 Conflict", async () => {
      const res = await request(app)
        .post("/api/v1/trips/join")
        .set("Authorization", `Bearer ${tokenMember}`)
        .send({
          inviteCode: generatedInviteCode,
        });

      assert.strictEqual(res.status, 409);
      assert.strictEqual(res.body.error.code, "CONFLICT");
    });

    it("should return 404 when joining with non-existent invite code", async () => {
      const res = await request(app)
        .post("/api/v1/trips/join")
        .set("Authorization", `Bearer ${tokenMember}`)
        .send({
          inviteCode: "NONEXISTENT-999",
        });

      assert.strictEqual(res.status, 404);
      assert.strictEqual(res.body.error.code, "NOT_FOUND");
    });
  });

  describe("5. Role & Barkada Travel Preference Management", () => {
    it("should allow member to update their own driver and dietary preferences", async () => {
      const res = await request(app)
        .patch(`/api/v1/trips/${createdTripId}/members/${userMemberId}`)
        .set("Authorization", `Bearer ${tokenMember}`)
        .send({
          isDriver: true,
          vehicleId: "car-honda-city",
          isNonDrinker: true,
          dietaryNotes: "Vegetarian, no pork or alcohol",
        });

      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.body.member.isDriver, true);
      assert.strictEqual(res.body.member.vehicleId, "car-honda-city");
      assert.strictEqual(res.body.member.isNonDrinker, true);
      assert.strictEqual(
        res.body.member.dietaryNotes,
        "Vegetarian, no pork or alcohol",
      );
    });

    it("should prevent non-lead member from assigning roles with 403 Forbidden", async () => {
      const res = await request(app)
        .patch(`/api/v1/trips/${createdTripId}/members/${userMemberId}`)
        .set("Authorization", `Bearer ${tokenMember}`)
        .send({
          role: "TRIP_LEAD",
        });

      assert.strictEqual(res.status, 403);
      assert.strictEqual(res.body.error.code, "FORBIDDEN");
    });

    it("should allow TRIP_LEAD to promote member role", async () => {
      const res = await request(app)
        .patch(`/api/v1/trips/${createdTripId}/members/${userMemberId}`)
        .set("Authorization", `Bearer ${tokenLead}`)
        .send({
          role: "DRIVER",
        });

      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.body.member.role, "DRIVER");
    });
  });

  describe("6. Multi-Tenant Trip Boundary Security", () => {
    let outsiderToken = "";

    before(async () => {
      const res = await request(app)
        .post("/api/v1/auth/register")
        .send({
          email: `outsider_${Date.now()}@gala-ph.dev`,
          password: testPassword,
          name: "Outsider Non-Member",
          phone: "09170001122",
        });
      outsiderToken = res.body.token;
    });

    it("should deny outsider access to private trip details with 403 Forbidden", async () => {
      const res = await request(app)
        .get(`/api/v1/trips/${createdTripId}`)
        .set("Authorization", `Bearer ${outsiderToken}`);

      assert.strictEqual(res.status, 403);
      assert.strictEqual(res.body.error.code, "FORBIDDEN");
    });
  });
});
