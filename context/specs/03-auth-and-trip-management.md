# Unit 03: Auth & Trip Management Engine — GalaPH

This specification details the user authentication system, JWT token lifecycle, and group trip management engine tailored for Philippine barkada travel dynamics.

---

## 1. Scope & Objectives

1. **Authentication & Identity System**:
   - Password hashing with `bcryptjs` (salt rounds: 10).
   - Access token issuance using `jsonwebtoken` (JWT) signed with `JWT_SECRET`.
   - Normalization and validation of Philippine mobile numbers (`09XX` and `+639XX`) and GCash/Maya wallet numbers via `@gala-ph/shared`.
   - Endpoints:
     - `POST /api/v1/auth/register`: Register new user with hashed password and normalized phone.
     - `POST /api/v1/auth/login`: Authenticate email + password, returns JWT and user profile.
     - `GET /api/v1/auth/me`: Authenticated endpoint returning user profile and active memberships.

2. **JWT & Security Middlewares**:
   - `auth.middleware.ts`: Extracts Bearer token from `Authorization` header, verifies signature, loads user, rejects invalid/expired tokens with structured 401.
   - `validate.middleware.ts`: Express middleware wrapping Zod schemas for `body`, `query`, and `params`.
   - `error.middleware.ts`: Centralized error handler returning structured JSON with `correlationId`.

3. **Barkada Trip Lifecycle & Invite System**:
   - Unique, memorable barkada invite code generation (e.g. `ELYU-XXXX`, alphanumeric uppercase).
   - Trip creation (`POST /api/v1/trips`):
     - Auto-assigns the creator as `TRIP_LEAD`.
     - Records trip dates, destination, and travel mode (`PRIVATE_CAR`, `MOTORCYCLE`, `COMMUTE_BUS`, `COMMUTE_VAN`, `HYBRID`).
   - Trip listing (`GET /api/v1/trips`):
     - Returns all trips where the authenticated user is a member or organizer.
   - Trip retrieval (`GET /api/v1/trips/:id`):
     - Returns full trip details, member list with roles, dietary restrictions, and vehicle assignments.
   - Joining a trip via invite code (`POST /api/v1/trips/join`):
     - Allows friends to join using the invite code without requiring upfront admin approval.
     - Prevents duplicate joins.

4. **Barkada Role & Preference Management**:
   - Role assignment (`PATCH /api/v1/trips/:id/members/:userId`):
     - Roles: `TRIP_LEAD`, `MEMBER`, `DRIVER`, `COMMUTER`.
     - Flags: `isDriver` (with `vehicleId`), `isNonDrinker` (for KKB exclusion), `dietaryNotes` (allergies).
     - Guard: Only `TRIP_LEAD` or the member themselves can update member preferences.

5. **Automated Testing & Verification**:
   - Comprehensive test suite in `apps/api/src/__tests__/unit-03-auth-trip.test.ts`.
   - Verifying auth flows, token rejection, invite code joins, and role updates.

---

## 2. Invariants & Rules

1. **Password Security**:
   Passwords must never be stored in plaintext. Passwords must be hashed using `bcryptjs` with a work factor of 10. Passwords must never be returned in API response bodies.
2. **Invite Code Uniqueness**:
   Every trip invite code must be unique in the database and formatted in uppercase for ease of sharing across messaging apps (Messenger, Viber, WhatsApp).
3. **Trip Lead Guarantee**:
   The creator of a trip is automatically granted the `TRIP_LEAD` role upon trip creation within a single atomic database transaction.
4. **Philippine Phone Standardization**:
   All mobile phone numbers (registration, GCash, Maya) must be validated and normalized to E.164 format (`+639XXXXXXXXX`) via `@gala-ph/shared` before database persistence.
