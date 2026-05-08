# Navyoga Backend — API Reference

Base URL (dev): `http://localhost:5001`
All routes are mounted under `/api`.

---

## Conventions

### Authentication

Most endpoints require a Bearer JWT in the `Authorization` header:

```
Authorization: Bearer <token>
```

Tokens are HS256, signed with `JWT_SECRET`, and expire after `JWT_EXPIRES_IN` (default `30d`). The payload contains `{ sub: <userId>, role: <Role> }`.

The `role` claim is one of: `SUPERADMIN`, `TUTOR`, `OPERATIONS`, `FRONTLINE`, `STUDENT`. Each protected route restricts access to a specific role; a token from another role gets `403`.

### Request bodies

`Content-Type: application/json`. Body size limit: `1mb`.

Every endpoint listing below has a **Body fields** table with these columns:

- **Field** — JSON key
- **Type** — JSON type
- **Required** — ✅ required, ⬜ optional
- **Constraints / Notes** — length, format, default, etc.

### Standard response shape

Success:

```json
{
  "success": true,
  "message": "…",
  "data": {
    /* … */
  }
}
```

Failure:

```json
{ "success": false, "message": "…", "error": null | { /* details */ } }
```

### Common error codes

| Code  | Meaning                                                       |
| ----- | ------------------------------------------------------------- |
| `400` | Validation failed (zod issues in `error[]`) or malformed JSON |
| `401` | Missing / invalid / expired token, or bad credentials         |
| `403` | Role not allowed for this route                               |
| `404` | Resource not found                                            |
| `409` | Email already registered, or duplicate unique key             |
| `500` | Internal error (message hidden in production)                 |

A `400` validation error looks like:

```json
{
  "success": false,
  "message": "Validation failed",
  "error": [
    { "path": "email", "message": "Invalid email" },
    { "path": "password", "message": "Password must be at least 8 characters" }
  ]
}
```

### Shared field reference

These fields appear on multiple endpoints with the same constraints:

| Field      | Type   | Constraints                                      |
| ---------- | ------ | ------------------------------------------------ |
| `email`    | string | Valid email; lowercased + trimmed server-side    |
| `password` | string | 8–128 chars (only on register / change-password) |
| `phone`    | string | 7–15 chars                                       |
| `avatar`   | string | Must be a valid URL                              |

### Login (all roles, same shape)

**Body fields:**

| Field      | Type   | Required | Constraints                         |
| ---------- | ------ | :------: | ----------------------------------- |
| `email`    | string |    ✅    | Valid email                         |
| `password` | string |    ✅    | 1+ chars (no length check on login) |

**Response:** `{ user, token }`. `401` if credentials are wrong, the account is inactive, or status is `TERMINATED` (staff). Inactive students return `401`.

### Change password (all roles)

**Auth:** matching role (e.g., SUPERADMIN for `/superadmin/change-password`).

**Body fields:**

| Field             | Type   | Required | Constraints                                     |
| ----------------- | ------ | :------: | ----------------------------------------------- |
| `currentPassword` | string |    ✅    | 1+ chars                                        |
| `newPassword`     | string |    ✅    | 8–128 chars; must differ from `currentPassword` |

### Logout (all roles)

**Auth:** matching role. Stateless — server returns success and the client should discard the token.

### Pagination envelope

Most list endpoints return:

```json
{
  "items": [ /* … */ ],
  "page": 1,
  "limit": 20,
  "total": 42,
  "totalPages": 3
}
```

`page` defaults to `1`, `limit` defaults to `20` (clamped to `[1, 100]`). Non-numeric values fall back to defaults.

---

## SuperAdmin — `/api/auth/superadmin`

### `POST /register`

Creates a SuperAdmin. Three ways to authorize:

1. **Bootstrap** — when zero SuperAdmins exist in the DB, no auth is required.
2. **Authenticated SuperAdmin** — pass an existing SuperAdmin's `Authorization: Bearer <token>`.
3. **Setup secret** — pass `setupSecret` in the body equal to `JWT_SECRET`.

**Body fields:**

| Field         | Type   | Required | Constraints                                                              |
| ------------- | ------ | :------: | ------------------------------------------------------------------------ |
| `email`       | string |    ✅    | Valid email; unique                                                      |
| `name`        | string |    ✅    | 1–100 chars                                                              |
| `phone`       | string |    ✅    | 7–15 chars                                                               |
| `password`    | string |    ✅    | 8–128 chars                                                              |
| `avatar`      | string |    ⬜    | Valid URL                                                                |
| `setupSecret` | string |    ⬜    | Required if not bootstrapping and no auth token; must equal `JWT_SECRET` |

**201 Response:**

```json
{
  "success": true,
  "message": "Super admin created",
  "data": {
    "user": {
      "id": "uuid",
      "email": "…",
      "name": "…",
      "phone": "…",
      "avatar": null,
      "isActive": true,
      "createdAt": "…"
    },
    "token": "eyJhbGciOiJIUzI1…"
  }
}
```

### `POST /login`

See [Login (all roles)](#login-all-roles-same-shape).

### `GET /me`

**Auth:** `SUPERADMIN`. Returns the current admin's full profile.

### `PATCH /me`

**Auth:** `SUPERADMIN`.

Update the current SuperAdmin profile. **Immutable fields:** `password`, `isActive`.

**Body fields:**

| Field    | Type   | Required | Constraints                       |
| -------- | ------ | :------: | --------------------------------- |
| `email`  | string |    ⬜    | Valid email; unique               |
| `name`   | string |    ⬜    | 1–100 chars                       |
| `phone`  | string |    ⬜    | 7–15 chars                        |
| `avatar` | string |    ⬜    | Valid URL; may be `null` to clear |

At least one field is required.

### `POST /change-password`

See [Change password](#change-password-all-roles).

### `POST /logout`

See [Logout](#logout-all-roles).

---

## Tutor — `/api/auth/tutor`

### `POST /register`

**Auth:** `SUPERADMIN` or `OPERATIONS`.

**Body fields:**

| Field             | Type     | Required | Constraints                          |
| ----------------- | -------- | :------: | ------------------------------------ |
| `email`           | string   |    ✅    | Valid email; unique                  |
| `name`            | string   |    ✅    | 1–100 chars                          |
| `phone`           | string   |    ✅    | 7–15 chars                           |
| `password`        | string   |    ✅    | 8–128 chars                          |
| `experience`      | integer  |    ✅    | 0–80 (years)                         |
| `specializations` | string[] |    ⬜    | Each item ≥ 1 char; defaults to `[]` |
| `bio`             | string   |    ⬜    | ≤ 2000 chars                         |
| `avatar`          | string   |    ⬜    | Valid URL                            |

The server auto-assigns `tutorId` (`T001`, `T002`, …) and a unique `referralCode` (`<NAME>-<HASH>`, e.g. `ASHA-AB12CD`).

### `POST /login`

See [Login](#login-all-roles-same-shape). `401` if `isActive` is false or status is `TERMINATED`.

### `GET /me`

**Auth:** `TUTOR`.

### `PATCH /me`

**Auth:** `TUTOR`.

Update the current tutor profile. **Immutable fields:** `tutorId`, `password`, `rating`, `referralCode`, `status`, `isActive`.

**Body fields:**

| Field             | Type     | Required | Constraints                          |
| ----------------- | -------- | :------: | ------------------------------------ |
| `email`           | string   |    ⬜    | Valid email; unique                  |
| `name`            | string   |    ⬜    | 1–100 chars                          |
| `phone`           | string   |    ⬜    | 7–15 chars                           |
| `avatar`          | string   |    ⬜    | Valid URL; may be `null` to clear    |
| `specializations` | string[] |    ⬜    | Each item ≥ 1 char                   |
| `experience`      | integer  |    ⬜    | 0–80                                 |
| `bio`             | string   |    ⬜    | ≤ 2000 chars; may be `null` to clear |

At least one field is required.

### `POST /change-password`

See [Change password](#change-password-all-roles).

### `POST /logout`

See [Logout](#logout-all-roles).

---

## Operations Staff — `/api/auth/operations`

### `POST /register`

**Auth:** `SUPERADMIN`.

**Body fields:**

| Field          | Type   | Required | Constraints                              |
| -------------- | ------ | :------: | ---------------------------------------- |
| `email`        | string |    ✅    | Valid email; unique                      |
| `firstName`    | string |    ✅    | 1–50 chars                               |
| `lastName`     | string |    ✅    | 1–50 chars                               |
| `phone`        | string |    ✅    | 7–15 chars                               |
| `password`     | string |    ✅    | 8–128 chars                              |
| `salary`       | number |    ✅    | ≥ 0                                      |
| `joinDate`     | string |    ✅    | ISO date (`YYYY-MM-DD`) or ISO datetime  |
| `department`   | string |    ⬜    | ≤ 50 chars; defaults to `"Operations"`   |
| `workingHours` | string |    ⬜    | ≤ 50 chars                               |
| `timezone`     | string |    ⬜    | ≤ 50 chars; defaults to `"Asia/Kolkata"` |
| `avatar`       | string |    ⬜    | Valid URL                                |

The server auto-assigns `employeeId` (`OPS-<YEAR>-001`, …).

### `POST /login`

See [Login](#login-all-roles-same-shape). `401` if `isActive` is false or status is `TERMINATED`.

### `GET /me`

**Auth:** `OPERATIONS`.

### `PATCH /me`

**Auth:** `OPERATIONS`.

Update the current operations profile. **Immutable fields:** `employeeId`, `password`, `salary`, `joinDate`, `status`, `isActive`.

**Body fields:**

| Field          | Type   | Required | Constraints                       |
| -------------- | ------ | :------: | --------------------------------- |
| `email`        | string |    ⬜    | Valid email; unique               |
| `firstName`    | string |    ⬜    | 1–50 chars                        |
| `lastName`     | string |    ⬜    | 1–50 chars                        |
| `phone`        | string |    ⬜    | 7–15 chars                        |
| `avatar`       | string |    ⬜    | Valid URL; may be `null` to clear |
| `department`   | string |    ⬜    | ≤ 50 chars                        |
| `workingHours` | string |    ⬜    | ≤ 50 chars                        |
| `timezone`     | string |    ⬜    | ≤ 50 chars                        |

At least one field is required.

### `POST /change-password`

See [Change password](#change-password-all-roles).

### `POST /logout`

See [Logout](#logout-all-roles).

---

## Frontline Staff — `/api/auth/frontline`

### `POST /register`

**Auth:** `OPERATIONS`. (SuperAdmin cannot create Frontline staff — they must onboard via an Operations account.)

**Body fields:**

| Field         | Type    | Required | Constraints                                             |
| ------------- | ------- | :------: | ------------------------------------------------------- |
| `email`       | string  |    ✅    | Valid email; unique                                     |
| `firstName`   | string  |    ✅    | 1–50 chars                                              |
| `lastName`    | string  |    ✅    | 1–50 chars                                              |
| `phone`       | string  |    ✅    | 7–15 chars                                              |
| `password`    | string  |    ✅    | 8–128 chars                                             |
| `salary`      | number  |    ✅    | ≥ 0                                                     |
| `joinDate`    | string  |    ✅    | ISO date (`YYYY-MM-DD`) or ISO datetime                 |
| `designation` | string  |    ⬜    | ≤ 100 chars; defaults to `"Lead Generation Specialist"` |
| `department`  | string  |    ⬜    | ≤ 50 chars; defaults to `"Lead Generation"`             |
| `dailyTarget` | integer |    ⬜    | ≥ 0; defaults to `50`                                   |
| `avatar`      | string  |    ⬜    | Valid URL                                               |

The server auto-assigns `employeeId` (`FL-<YEAR>-001`, …).

### `POST /login`

See [Login](#login-all-roles-same-shape). `401` if `isActive` is false or status is `TERMINATED`.

### `GET /me`

**Auth:** `FRONTLINE`.

### `PATCH /me`

**Auth:** `FRONTLINE`.

Update the current frontline profile. **Immutable fields:** `employeeId`, `password`, `salary`, `joinDate`, `status`, `isActive`.

**Body fields:**

| Field         | Type    | Required | Constraints                       |
| ------------- | ------- | :------: | --------------------------------- |
| `email`       | string  |    ⬜    | Valid email; unique               |
| `firstName`   | string  |    ⬜    | 1–50 chars                        |
| `lastName`    | string  |    ⬜    | 1–50 chars                        |
| `phone`       | string  |    ⬜    | 7–15 chars                        |
| `avatar`      | string  |    ⬜    | Valid URL; may be `null` to clear |
| `designation` | string  |    ⬜    | ≤ 100 chars                       |
| `department`  | string  |    ⬜    | ≤ 50 chars                        |
| `dailyTarget` | integer |    ⬜    | ≥ 0                               |

At least one field is required.

### `POST /change-password`

See [Change password](#change-password-all-roles).

### `POST /logout`

See [Logout](#logout-all-roles).

---

## Student — `/api/auth/student`

### `POST /register`

Public — anyone can self-register.

**Body fields:**

| Field               | Type    | Required | Constraints                                                 |
| ------------------- | ------- | :------: | ----------------------------------------------------------- |
| `email`             | string  |    ✅    | Valid email; unique                                         |
| `name`              | string  |    ✅    | 1–100 chars                                                 |
| `phone`             | string  |    ✅    | 7–15 chars                                                  |
| `password`          | string  |    ✅    | 8–128 chars                                                 |
| `avatar`            | string  |    ⬜    | Valid URL                                                   |
| `address`           | string  |    ⬜    | ≤ 500 chars                                                 |
| `age`               | integer |    ⬜    | 1–120                                                       |
| `bloodGroup`        | string  |    ⬜    | ≤ 10 chars                                                  |
| `emergencyContact`  | string  |    ⬜    | 7–15 chars (phone format)                                   |
| `medicalConditions` | string  |    ⬜    | ≤ 2000 chars                                                |
| `yogaExperience`    | string  |    ⬜    | ≤ 20 chars                                                  |
| `currentLevel`      | string  |    ⬜    | ≤ 20 chars                                                  |
| `areasOfInterest`   | string  |    ⬜    | ≤ 500 chars                                                 |
| `referredByCode`    | string  |    ⬜    | ≤ 50 chars; must match an existing student's `referralCode` |

The server auto-assigns a unique `referralCode` (`<NAME>-<HASH>`, e.g. `ARJU-AB12CD`). If `referredByCode` is supplied and matches an existing student, a `Referral` row is created linking referrer → new student. An invalid code returns `400`.

> **Note:** The Student model no longer has `joinDate`, a `status` enum, or `fitnessGoals`. Active state is tracked on the `isActive` boolean alone.

**201 Response:**

```json
{
  "success": true,
  "message": "Account created",
  "data": {
    "user": {
      "id": "uuid",
      "email": "…",
      "name": "…",
      "phone": "…",
      "avatar": null,
      "referralCode": "ARJU-AB12CD",
      "createdAt": "…"
    },
    "token": "eyJ…"
  }
}
```

### `POST /login`

See [Login](#login-all-roles-same-shape). Inactive students return `401`.

### `GET /me`

**Auth:** `STUDENT`. Returns the full student profile.

### `PATCH /me`

**Auth:** `STUDENT`.

Update the current student profile. **Immutable fields:** `id`, `password`, `referralCode`, `isActive`.

**Body fields:**

| Field               | Type    | Required | Constraints                          |
| ------------------- | ------- | :------: | ------------------------------------ |
| `email`             | string  |    ⬜    | Valid email; unique                  |
| `name`              | string  |    ⬜    | 1–100 chars                          |
| `phone`             | string  |    ⬜    | 7–15 chars                           |
| `avatar`            | string  |    ⬜    | Valid URL; may be `null` to clear    |
| `address`           | string  |    ⬜    | ≤ 500 chars; may be `null` to clear  |
| `age`               | integer |    ⬜    | 1–120; may be `null` to clear        |
| `bloodGroup`        | string  |    ⬜    | ≤ 10 chars; may be `null` to clear   |
| `emergencyContact`  | string  |    ⬜    | 7–15 chars; may be `null` to clear   |
| `medicalConditions` | string  |    ⬜    | ≤ 2000 chars; may be `null` to clear |
| `yogaExperience`    | string  |    ⬜    | ≤ 20 chars; may be `null` to clear   |
| `currentLevel`      | string  |    ⬜    | ≤ 20 chars; may be `null` to clear   |
| `areasOfInterest`   | string  |    ⬜    | ≤ 500 chars; may be `null` to clear  |

At least one field is required.

### `POST /change-password`

See [Change password](#change-password-all-roles).

### `POST /logout`

See [Logout](#logout-all-roles).

---

## Employees — `/api/employees`

Generic non-panel staff (Cleaners, Accountants, Marketing, …). The `Employee` model has no password — these accounts cannot log in. CRUD is for record-keeping only.

**All endpoints require `SUPERADMIN` or `OPERATIONS` auth.**

> **Note:** Unlike the auth endpoints, employee routes do not run a strict schema validation. The server enforces (a) presence of required fields on create, (b) email uniqueness, and (c) that at least one field is provided on update. Type/format errors surface as `500` from Prisma.

### `POST /`

Create an employee. Auto-assigns `employeeId` (`E001`, `E002`, …).

**Body fields:**

| Field        | Type   | Required | Notes                                                       |
| ------------ | ------ | :------: | ----------------------------------------------------------- |
| `email`      | string |    ✅    | Lowercased + trimmed server-side; must be unique            |
| `name`       | string |    ✅    |                                                             |
| `phone`      | string |    ✅    |                                                             |
| `role`       | string |    ✅    | Job title (e.g. `"Accountant"`)                             |
| `department` | string |    ✅    |                                                             |
| `salary`     | number |    ✅    | Coerced via `Number(...)`                                   |
| `joinDate`   | string |    ✅    | Anything `new Date(...)` accepts (ISO date or ISO datetime) |
| `avatar`     | string |    ⬜    | Image URL                                                   |
| `status`     | string |    ⬜    | `ACTIVE` \| `ON_LEAVE` \| `TERMINATED` (default `ACTIVE`)   |

A required field is treated as missing if it's `undefined`, `null`, or an empty string — response is `400 Missing required fields: ...`.

**Responses:** `201` — `{ data: <Employee> }`, `400` — required field missing, `409` — email already registered.

### `GET /`

List employees, paginated, with optional filters.

**Query params:**

| Param        | Type    | Required | Notes                                                  |
| ------------ | ------- | :------: | ------------------------------------------------------ |
| `q`          | string  |    ⬜    | Substring match across `name` / `email` / `employeeId` |
| `status`     | string  |    ⬜    | `ACTIVE` \| `ON_LEAVE` \| `TERMINATED`                 |
| `department` | string  |    ⬜    | Case-insensitive substring match                       |
| `role`       | string  |    ⬜    | Case-insensitive substring match                       |
| `page`       | integer |    ⬜    | Default `1`                                            |
| `limit`      | integer |    ⬜    | Default `20`; clamped to `[1, 100]`                    |

Returns the standard paginated envelope.

### `GET /:id`

Get a single employee by primary key (`id`, the UUID — not `employeeId`). `404` if not found.

### `PATCH /:id`

Partial update — send only the fields to change. `avatar` may be passed as `null` to clear it. `employeeId` is immutable.

**Responses:** `200` — `{ data: <Employee> }`, `400` — empty body, `404` — not found, `409` — email collision.

### `DELETE /:id`

Hard-deletes the employee. `404` if not found, `200` on success with `data: null`.

> Tip: prefer `PATCH /:id` with `{"status":"TERMINATED"}` over delete to preserve history.

---

## Tutors — `/api/tutors`

Tutor records for admin management. **All endpoints require `SUPERADMIN` or `OPERATIONS` auth.**

> **Note:** No strict schema validation. Type/format errors surface as `500` from Prisma.

### `POST /`

Create a tutor. Same payload as `/api/auth/tutor/register`.

**Body fields:**

| Field             | Type     | Required | Notes                                |
| ----------------- | -------- | :------: | ------------------------------------ |
| `email`           | string   |    ✅    | Lowercased + trimmed; must be unique |
| `name`            | string   |    ✅    |                                      |
| `phone`           | string   |    ✅    |                                      |
| `password`        | string   |    ✅    | Stored as a hash; not returned       |
| `experience`      | integer  |    ✅    | 0–80                                 |
| `avatar`          | string   |    ⬜    | Image URL                            |
| `specializations` | string[] |    ⬜    | Defaults to `[]`                     |
| `bio`             | string   |    ⬜    | ≤ 2000 chars                         |

The server auto-assigns `tutorId` (`T001`, `T002`, …) and a `referralCode`.

**Responses:** `201` — `{ data: <Tutor> }`, `409` — email already registered.

### `GET /`

List tutors, paginated, with optional search and status filter.

**Query params:**

| Param    | Type    | Required | Notes                                               |
| -------- | ------- | :------: | --------------------------------------------------- |
| `q`      | string  |    ⬜    | Substring match across `name` / `email` / `tutorId` |
| `status` | string  |    ⬜    | `ACTIVE` \| `ON_LEAVE` \| `TERMINATED`              |
| `page`   | integer |    ⬜    | Default `1`                                         |
| `limit`  | integer |    ⬜    | Default `20`; clamped to `[1, 100]`                 |

### `GET /:id`

Get a tutor by primary key (`id`, the UUID). `404` if not found.

### `PATCH /:id`

Partial update. **Immutable fields:** `tutorId`, `password`, `rating`, `referralCode`. Accepts `status` (`ACTIVE | ON_LEAVE | TERMINATED`) and `isActive` (boolean). `avatar` and `bio` may be passed as `null` to clear them.

**Responses:** `200` — `{ data: <Tutor> }`, `400` — empty body, `404` — not found, `409` — email collision.

### `DELETE /:id`

Hard-deletes the tutor. `404` if not found, `200` on success with `data: null`.

---

## Leads — `/api/leads`

Lead pipeline records (potential students). Auto-assigns `leadId` (`L001`, `L002`, …).

**Auth:** Read/create/update accept `SUPERADMIN`, `FRONTLINE`, or `OPERATIONS`. **`DELETE /:id` is restricted to `SUPERADMIN` and `OPERATIONS`** — Frontline cannot delete leads.

> **Note:** No strict schema validation. The server enforces (a) presence of required fields on create, (b) enum validity for `source` / `status`, (c) that `assignedToId` (if provided) matches an existing `FrontlineStaff`, and (d) that at least one field is provided on update.

### Role-aware behavior (FRONTLINE)

When the caller's role is `FRONTLINE`, the server scopes their access to leads they own:

- **`POST /`** — `assignedToId` from the body is ignored; the new lead is auto-assigned to `req.user.id`.
- **`GET /`** — results are filtered to `assignedToId = req.user.id`; the `assignedToId` query param is ignored.
- **`GET /:id`** — returns `403` if the lead is not assigned to the caller.
- **`PATCH /:id`** — returns `403` if the lead is not assigned to the caller; sending `assignedToId` (anything, including `null`) returns `403 You cannot reassign leads`.

`SUPERADMIN` and `OPERATIONS` callers are unrestricted.

### `POST /`

Create a lead.

**Body fields:**

| Field             | Type   | Required | Notes                                                                                               |
| ----------------- | ------ | :------: | --------------------------------------------------------------------------------------------------- |
| `name`            | string |    ✅    |                                                                                                     |
| `email`           | string |    ✅    | Lowercased + trimmed server-side                                                                    |
| `phone`           | string |    ✅    |                                                                                                     |
| `source`          | string |    ✅    | `WEBSITE` \| `REFERRAL` \| `WALK_IN` \| `SOCIAL_MEDIA` \| `FACEBOOK` \| `INSTAGRAM` \| `GOOGLE_ADS` |
| `interest`        | string |    ✅    | Free text                                                                                           |
| `location`        | string |    ⬜    |                                                                                                     |
| `status`          | string |    ⬜    | `NEW` \| `CONTACTED` \| `INTERESTED` \| `CONVERTED` \| `NOT_INTERESTED` (default `NEW`)             |
| `lastContactDate` | string |    ⬜    | ISO date or datetime                                                                                |
| `notes`           | string |    ⬜    |                                                                                                     |
| `assignedToId`    | string |    ⬜    | UUID of a `FrontlineStaff`; `400` if it doesn't exist. Ignored for FRONTLINE callers.               |

**Responses:** `201` — `{ data: <Lead> }`, `400` — required field missing / invalid enum / unknown `assignedToId`.

### `GET /`

**Query params:**

| Param          | Type    | Required | Notes                                                                           |
| -------------- | ------- | :------: | ------------------------------------------------------------------------------- |
| `q`            | string  |    ⬜    | Case-insensitive match across `name` / `email` / `phone` / `leadId`             |
| `status`       | string  |    ⬜    | One of the `LeadStatus` enum values                                             |
| `source`       | string  |    ⬜    | One of the `LeadSource` enum values                                             |
| `assignedToId` | string  |    ⬜    | UUID of a `FrontlineStaff`. Ignored for FRONTLINE callers.                      |
| `page`         | integer |    ⬜    | Default `1`                                                                     |
| `limit`        | integer |    ⬜    | Default `20`; clamped to `[1, 100]`                                             |

Returns the standard paginated envelope.

### `GET /:id`

`200` — `{ data: <Lead> }`, `403` — FRONTLINE caller, lead not assigned to them, `404` — not found.

### `PATCH /:id`

Partial update. `location`, `lastContactDate`, `notes`, and `assignedToId` may be passed as `null` to clear them.

**Responses:** `200` — `{ data: <Lead> }`, `400` — empty body / invalid enum / unknown `assignedToId`, `403` — FRONTLINE caller editing a lead they don't own (or sending `assignedToId`), `404` — not found.

### `DELETE /:id`

**Auth:** `SUPERADMIN` or `OPERATIONS` only. Hard-deletes the lead.

---

## Platform Settings — `/api/platform`

Single-row business / platform configuration (center name, contact info).

### `GET /`

**Auth:** **Public** — no token required.

Returns the current settings, or `404` if none have been created yet.

**200 Response:**

```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "centerName": "Navyoga",
    "email": "hello@navyoga.com",
    "phone": "9999999999",
    "address": "123 Yoga Lane, Indiranagar, Bengaluru, Karnataka 560038, India",
    "createdAt": "…",
    "updatedAt": "…"
  }
}
```

### `PATCH /`

**Auth:** `SUPERADMIN`. At least one field is required. Returns `404` if no settings record exists — one must exist before it can be updated.

**Body fields:** (all optional, but at least one required)

| Field        | Type   | Notes                |
| ------------ | ------ | -------------------- |
| `centerName` | string |                      |
| `email`      | string | Lowercased + trimmed |
| `phone`      | string |                      |
| `address`    | string |                      |

**Responses:** `200` — `{ data: <BusinessSettings> }`, `400` — empty body, `401` / `403` — missing or non-SUPERADMIN token.

---

## Students (admin) — `/api/students`

Admin-facing student collection. **All endpoints require `SUPERADMIN` or `OPERATIONS` auth.**

The Student model exposes: `id`, `email`, `name`, `phone`, `avatar`, `address`, `age`, `bloodGroup`, `emergencyContact`, `medicalConditions`, `yogaExperience`, `currentLevel`, `areasOfInterest`, `referralCode`, `isActive`, `createdAt`, `updatedAt`.

### `POST /`

Create a student record (auto-assigns a `referralCode`). Same body as `/api/auth/student/register`, plus an optional `isActive` boolean. Respects `referredByCode` — creates a `Referral` row when valid.

**Responses:** `201` — `{ data: <Student> }`, `400` — required field missing or invalid `referredByCode`, `409` — email already registered.

### `GET /`

List students, paginated.

**Query params:**

| Param   | Type    | Required | Notes                                                              |
| ------- | ------- | :------: | ------------------------------------------------------------------ |
| `q`     | string  |    ⬜    | Case-insensitive match on `name` / `email` / `phone`               |
| `page`  | integer |    ⬜    | Default `1`                                                        |
| `limit` | integer |    ⬜    | Default `20`; clamped to `[1, 100]`                                |

### `GET /:id`

Get a student by primary key (`id`, the UUID). `404` if not found.

### `PATCH /:id`

Partial update. Accepts the same fields as `POST /` as optional, plus `password` (rehashed if a non-empty string is provided), and `isActive` (boolean). All `null`-clearable fields from `PATCH /api/auth/student/me` may be passed as `null` here too. `id` and `referralCode` are immutable.

**Responses:** `200` — `{ data: <Student> }`, `400` — empty body, `404` — not found, `409` — email collides with another row.

### `DELETE /:id`

Hard-delete a student. Prefer setting `isActive: false` to suppress access while preserving history.

---

## Coupons — `/api/coupons`

Coupon CRUD for promotions and discounts. **All endpoints require `SUPERADMIN` or `OPERATIONS` auth.**

> **Note:** No strict schema validation. Server enforces required fields, enum validity (`discountType` / `status`), parseable dates, `expiryDate > validFrom`, `code` uniqueness, and at least one field on update. Numeric fields are coerced via `String(...)` (decimals) or `Number(...)` (integers).

### `POST /`

Create a coupon. The `code` is normalized to UPPERCASE before storage and uniqueness check.

**Body fields:**

| Field               | Type    | Required | Notes                                                              |
| ------------------- | ------- | :------: | ------------------------------------------------------------------ |
| `code`              | string  |    ✅    | Trimmed and uppercased server-side; unique                         |
| `discountType`      | string  |    ✅    | `PERCENTAGE` \| `FLAT`                                             |
| `discountValue`     | number  |    ✅    | Stored as decimal                                                  |
| `minPurchaseAmount` | number  |    ✅    | Stored as decimal                                                  |
| `usageLimit`        | integer |    ✅    | Coerced via `Number(...)`                                          |
| `validFrom`         | string  |    ✅    | ISO date or datetime                                               |
| `expiryDate`        | string  |    ✅    | ISO date or datetime; must be strictly after `validFrom`           |
| `description`       | string  |    ⬜    |                                                                    |
| `maxDiscount`       | number  |    ⬜    | Stored as decimal                                                  |
| `usageCount`        | integer |    ⬜    | Coerced via `Number(...)`                                          |
| `status`            | string  |    ⬜    | `ACTIVE` \| `EXPIRED` \| `DISABLED` (DB default applies if omitted)|

**Responses:** `201` — `{ data: <Coupon> }`, `400` — validation, `409` — code already exists.

### `GET /`

**Query params:**

| Param          | Type    | Required | Notes                                                              |
| -------------- | ------- | :------: | ------------------------------------------------------------------ |
| `q`            | string  |    ⬜    | Case-insensitive match on `code` / `description`                   |
| `status`       | string  |    ⬜    | `ACTIVE` \| `EXPIRED` \| `DISABLED`                                |
| `discountType` | string  |    ⬜    | `PERCENTAGE` \| `FLAT`                                             |
| `page`         | integer |    ⬜    | Default `1`                                                        |
| `limit`        | integer |    ⬜    | Default `20`; clamped to `[1, 100]`                                |

### `GET /:id`

Get a coupon by primary key (UUID). `404` if not found.

### `PATCH /:id`

Partial update. `code` is uppercased if provided. `description` and `maxDiscount` may be `null` to clear. The `expiryDate > validFrom` invariant is rechecked using existing values for any field omitted from the body.

**Responses:** `200` — `{ data: <Coupon> }`, `400`, `404`, `409`.

### `DELETE /:id`

Hard-delete the coupon.

---

## Notifications — `/api/notifications`

Notifications are broadcast messages targeted at student audiences. Read endpoints are available to `SUPERADMIN`, `OPERATIONS`, and `STUDENT`. Create / update / delete require `SUPERADMIN` or `OPERATIONS`.

### Side effects

- **`recipientCount`** is auto-computed by the server from `targetAudience` on create and on any `targetAudience` change. Clients should not send it.
  - `ALL_USERS` → count of all students
  - `ACTIVE_STUDENTS` → count of `Student` rows where `isActive = true`
  - `PREMIUM_MEMBERS` → count of students with at least one active `LiveEnrollment`
- **`sentAt`** is set to `now()` on create when no `scheduledDate` is provided, or left `null` when the notification is scheduled for a future date.

### Student visibility

When the caller's role is `STUDENT`:

- Only notifications with `sentAt` set (already sent) are visible.
- Only `targetAudience` values matching the student are visible: `ALL_USERS` is universal; active students additionally see `ACTIVE_STUDENTS`; students with an active `LiveEnrollment` additionally see `PREMIUM_MEMBERS`.
- `GET /:id` returns `404` if the notification hasn't been sent yet (`sentAt` is null), and `403` if the audience doesn't match.
- The `targetAudience` query param on `GET /` is ignored for STUDENT callers.

### `GET /`

**Auth:** `SUPERADMIN | OPERATIONS | STUDENT`.

**Query params:**

| Param            | Type    | Required | Notes                                                                              |
| ---------------- | ------- | :------: | ---------------------------------------------------------------------------------- |
| `q`              | string  |    ⬜    | Case-insensitive match on `title` / `message`                                      |
| `targetAudience` | string  |    ⬜    | `ALL_USERS` \| `ACTIVE_STUDENTS` \| `PREMIUM_MEMBERS`. Ignored for STUDENT.        |
| `page`           | integer |    ⬜    | Default `1`                                                                        |
| `limit`          | integer |    ⬜    | Default `20`; clamped to `[1, 100]`                                                |

Items are ordered by `createdAt desc` for staff, `sentAt desc` for students.

### `GET /:id`

`200` / `403` (audience mismatch for STUDENT) / `404` (not found, or STUDENT and `sentAt` is null).

### `POST /`

**Auth:** `SUPERADMIN | OPERATIONS`.

| Field            | Type   | Required | Notes                                                                              |
| ---------------- | ------ | :------: | ---------------------------------------------------------------------------------- |
| `title`          | string |    ✅    |                                                                                    |
| `message`        | string |    ✅    |                                                                                    |
| `targetAudience` | string |    ✅    | `ALL_USERS` \| `ACTIVE_STUDENTS` \| `PREMIUM_MEMBERS`                              |
| `scheduledDate`  | string |    ⬜    | ISO date or datetime; if omitted the notification is sent immediately (`sentAt` is set to now). Rejected with `400` if unparseable |

**Responses:** `201` — `{ data: <Notification> }`, `400` — validation.

### `PATCH /:id`

**Auth:** `SUPERADMIN | OPERATIONS`. All `POST /` fields accepted as optional. Changing `targetAudience` re-runs the audience count.

**Responses:** `200`, `400`, `404`.

### `DELETE /:id`

**Auth:** `SUPERADMIN | OPERATIONS`. Hard-deletes the notification.

---

## Attendance — `/api/attendance`

Unified attendance tracking across all user groups, viewable in one place.

> **AUTH:** All admin endpoints (CRUD) require `SUPERADMIN`. Self check-in / check-out endpoints require the matching staff role (`FRONTLINE` or `OPERATIONS`).

### Common — `status` field

All four sub-resources share the same status enum:

| Value     | Meaning                  |
| --------- | ------------------------ |
| `PRESENT` | Attended / on duty       |
| `ABSENT`  | Did not attend / on duty |

Default on create: `PRESENT`. **The `LATE` status was removed.**

### Common — list response shape

Every `GET /` endpoint returns a `summary` block alongside the paginated items:

```json
{
  "summary": {
    "total": 5,
    "present": 4,
    "absent": 1,
    "attendanceRate": 80
  },
  "items": [ /* … */ ],
  "page": 1,
  "limit": 20,
  "total": 5,
  "totalPages": 1
}
```

`attendanceRate` = `round(present / total × 100)`.

---

### Student Attendance — `/api/attendance/students`

One record per student per calendar day (`@@unique([studentId, date])`). The `subscriptionClass` link was removed — attendance is tracked at the day level only.

**Auth:** `SUPERADMIN`.

#### `POST /`

| Field       | Type   | Required | Notes                                  |
| ----------- | ------ | :------: | -------------------------------------- |
| `studentId` | string |    ✅    | UUID of an existing `Student`          |
| `date`      | string |    ✅    | ISO date or datetime                   |
| `status`    | string |    ⬜    | `PRESENT` \| `ABSENT`; default `PRESENT` |

`409` if a record already exists for the same student + date.

**Responses:** `201`, `400` (missing/invalid status/unknown studentId), `409`.

#### `GET /`

**Query params:**

| Param       | Type    | Required | Notes                                                                  |
| ----------- | ------- | :------: | ---------------------------------------------------------------------- |
| `q`         | string  |    ⬜    | Case-insensitive match on student `name` or `email`                    |
| `status`    | string  |    ⬜    | `PRESENT` \| `ABSENT`                                                  |
| `date`      | string  |    ⬜    | Exact date match. Takes priority over `startDate`/`endDate`            |
| `startDate` | string  |    ⬜    | Lower bound (inclusive) when `date` is absent                          |
| `endDate`   | string  |    ⬜    | Upper bound (inclusive) when `date` is absent                          |
| `page`      | integer |    ⬜    | Default `1`                                                            |
| `limit`     | integer |    ⬜    | Default `20`; clamped to `[1, 100]`                                    |

Items are ordered by `date desc`.

#### `GET /:id`

Get by UUID. `404` if not found.

#### `PATCH /:id`

| Field    | Type   | Required | Notes                  |
| -------- | ------ | :------: | ---------------------- |
| `status` | string |    ⬜    | `PRESENT` \| `ABSENT`  |
| `date`   | string |    ⬜    | ISO date or datetime   |

At least one field required.

#### `DELETE /:id`

Hard-delete.

---

### Tutor Attendance — `/api/attendance/tutors`

One record per tutor per day. Captures classes conducted + teaching hours.

**Auth:** `SUPERADMIN`.

#### `POST /`

| Field             | Type    | Required | Notes                                          |
| ----------------- | ------- | :------: | ---------------------------------------------- |
| `tutorId`         | string  |    ✅    | UUID of an existing `Tutor`                    |
| `date`            | string  |    ✅    | ISO date or datetime                           |
| `classesConducted`| integer |    ⬜    | Default `0`                                    |
| `teachingHours`   | number  |    ⬜    | Decimal (e.g. `4.5`); default `0`              |
| `status`          | string  |    ⬜    | `PRESENT` \| `ABSENT`; default `PRESENT`       |

`409` on duplicate `(tutorId, date)`.

#### `GET /`

Same query params as student attendance, but `q` matches tutor `name` or `tutorId`.

#### `GET /:id`

Get by UUID.

#### `PATCH /:id`

`status`, `date`, `classesConducted`, `teachingHours` (all optional, at least one required).

#### `DELETE /:id`

Hard-delete.

---

### Frontline Attendance — `/api/attendance/frontline`

One record per frontline staff member per day. Captures `checkIn` / `checkOut` times.

#### `POST /checkin` — self check-in

**Auth:** `FRONTLINE`.

No body. Server uses `req.user.id` as `staffId`, sets `checkIn = now()`, `date = today`, `status = PRESENT`.

`409` if already checked in today.

#### `POST /checkout` — self check-out

**Auth:** `FRONTLINE`.

No body. Finds today's record and sets `checkOut = now()`.

`400` if not checked in today, `409` if already checked out.

#### `POST /` — admin create

**Auth:** `SUPERADMIN`.

| Field      | Type   | Required | Notes                                          |
| ---------- | ------ | :------: | ---------------------------------------------- |
| `staffId`  | string |    ✅    | UUID of an existing `FrontlineStaff`           |
| `date`     | string |    ✅    | ISO date or datetime                           |
| `checkIn`  | string |    ⬜    | ISO datetime                                   |
| `checkOut` | string |    ⬜    | ISO datetime                                   |
| `status`   | string |    ⬜    | `PRESENT` \| `ABSENT`; default `PRESENT`       |

`409` on duplicate `(staffId, date)`.

#### `GET /`

**Auth:** `SUPERADMIN`. `q` matches `firstName` / `lastName` / `employeeId`.

#### `GET /:id` `PATCH /:id` `DELETE /:id`

Standard CRUD for `SUPERADMIN`. `PATCH` accepts `status`, `date`, `checkIn`, `checkOut` (last two `null`-able to clear).

---

### Operations Attendance — `/api/attendance/operations`

Identical shape to Frontline. Self check-in / check-out routes require `OPERATIONS` auth; CRUD requires `SUPERADMIN`. The `staff` join returns `firstName` / `lastName` / `employeeId` / `department` (vs. `designation` on frontline).

---

## Dashboard — `/api/dashboard`

Aggregated KPI snapshots. Read-only.

> **Note:** Many fields are placeholders (`0` / `[]`) for sections that are not yet wired up (`classes`, `revenue`, `popularity`, `membership`, `marketing`, `referral`, `activity`, `stats`). They are returned with stable shapes for the frontend.

### `GET /superadmin`

**Auth:** `SUPERADMIN`.

- **`cards.students.total`** — total students; `diff` = (students created this calendar month) − (students created last calendar month).
- **`cards.tutors`** — same shape, scoped to `isActive = true` tutors.
- **`cards.classes`**, **`cards.revenue`** — placeholders.
- **`performance.rating`** — average `rating` across active tutors (`0` if none).

```json
{
  "cards": {
    "students":  { "total": 142, "diff": 8 },
    "tutors":    { "total": 12,  "diff": 1 },
    "classes":   { "total": 0,   "diff": 0 },
    "revenue":   { "total": 0,   "diff": 0 }
  },
  "revenue": [],
  "popularity": [],
  "membership": [],
  "performance": { "rating": 4.6, "capacity": 0, "attendance": 0 },
  "marketing": {},
  "referral": {},
  "activity": [],
  "stats": []
}
```

### `GET /operations`

**Auth:** `OPERATIONS`.

- **`cards.employees|tutors|frontline|students`** — total + this-vs-last-month delta (no `isActive` filter; counts every row).
- **`cards.recorded`** — placeholder.
- **`team`** — flat totals (same numbers as the matching `cards.*.total`).
- **`system.coupons`** — count of `Coupon` rows with `status = ACTIVE`.
- **`system.notifications`** — count of `AppNotification` rows that have been sent (`sentAt` is not null).
- **`system.classes` / `system.recorded`** — placeholders.

```json
{
  "cards": {
    "employees": { "total": 8,   "diff": 1 },
    "tutors":    { "total": 12,  "diff": 1 },
    "frontline": { "total": 4,   "diff": 0 },
    "students":  { "total": 142, "diff": 8 },
    "recorded":  { "total": 0,   "diff": 0 }
  },
  "team": { "employees": 8, "tutors": 12, "frontline": 4 },
  "system": { "coupons": 3, "notifications": 7, "classes": 0, "recorded": 0 }
}
```

---

## Referrals — `/api/referrals`

Referral records linking a referrer (Student or Tutor) to a referee (Student or Tutor). Rows are created automatically when a `referredByCode` is supplied during student registration. There is no `POST` endpoint — these endpoints are read-only.

| Status    | Meaning                                                             |
| --------- | ------------------------------------------------------------------- |
| `PENDING` | Referee has signed up; reward not yet credited                      |
| `ACTIVE`  | Reward has been credited / referral is realized                     |

The `q` query param matches both referrer **and** referee on `name` / `email`. Pagination uses `page` / `limit` defaults.

### SuperAdmin views

The four SuperAdmin endpoints split data by referee type — `/user/*` lists referrals where the referee is a Student, `/tutor/*` where the referee is a Tutor.

#### `GET /user/overview`

**Auth:** `SUPERADMIN`. Aggregate stats for student-as-referee referrals.

```json
{ "total": 42, "active": 28, "pending": 14, "totalRewards": "1400" }
```

#### `GET /user`

**Auth:** `SUPERADMIN`. Paginated list.

| Param    | Type    | Required | Notes                                                                  |
| -------- | ------- | :------: | ---------------------------------------------------------------------- |
| `q`      | string  |    ⬜    | Case-insensitive match on referrer / referee `name` or `email`         |
| `status` | string  |    ⬜    | `PENDING` \| `ACTIVE`                                                  |
| `page`   | integer |    ⬜    | Default `1`                                                            |
| `limit`  | integer |    ⬜    | Default `20`; clamped to `[1, 100]`                                    |

```json
{
  "items": [{
    "id": "uuid",
    "referrer": { "id": "uuid", "name": "Asha", "email": "a@x.com", "type": "student" },
    "referee":  { "id": "uuid", "name": "Bina", "email": "b@x.com" },
    "status": "ACTIVE",
    "reward": "100",
    "date": "2026-04-21T12:00:00.000Z"
  }],
  "page": 1, "limit": 20, "total": 42, "totalPages": 3
}
```

`referrer.type` is `"student"` or `"tutor"`.

#### `GET /tutor/overview`

**Auth:** `SUPERADMIN`. Same shape as `/user/overview`, but counts referrals where the referee is a Tutor.

#### `GET /tutor`

**Auth:** `SUPERADMIN`. Same query params as `/user`. The `referee` block carries tutor-specific fields:

```json
{
  "referee": {
    "id": "uuid",
    "name": "Asha",
    "email": "asha@x.com",
    "specializations": ["Hatha", "Vinyasa"],
    "classes": 3
  }
}
```

`classes` is the count of live classes conducted by the referred tutor.

### Tutor views

#### `GET /me/users`

**Auth:** `TUTOR`. Returns the calling tutor's referral code, an overview block, and a paginated list of students they referred.

```json
{
  "overview": { "totalReferred": 5, "active": 3, "pending": 2, "totalEarned": "300" },
  "referralCode": "ASHA-AB12CD",
  "items": [{
    "id": "uuid", "name": "Bina", "email": "bina@x.com", "avatar": null,
    "reward": "100", "status": "ACTIVE", "date": "2026-04-21T12:00:00.000Z"
  }],
  "page": 1, "limit": 20, "total": 5, "totalPages": 1
}
```

`404` if the tutor record is missing.

#### `GET /me/tutors`

**Auth:** `TUTOR`. Same envelope as `/me/users`, but lists tutors the caller referred. Each item adds `specializations` (string[]) and `classes` (integer).

### Student view

#### `GET /me`

**Auth:** `STUDENT`. Returns the calling student's referral code, an overview block, and a paginated list of students they've referred.

```json
{
  "overview": { "totalReferrals": 3, "active": 2, "pending": 1, "totalEarned": "200" },
  "referralCode": "ARJU-AB12CD",
  "items": [/* … */],
  "page": 1, "limit": 20, "total": 3, "totalPages": 1
}
```

`404` if the student record is missing.

---

## Events — `/api/events`

Standalone events (workshops, retreats, talks). Students can browse upcoming events and check their enrollment; admins manage the full lifecycle.

> **Note:** Server enforces presence of required fields on create and at least one field on update. Other type errors surface from Prisma. Numeric / boolean values are coerced via `Number(...)` / `Boolean(...)`.

### Admin endpoints

**Auth:** `SUPERADMIN | OPERATIONS`.

#### `POST /`

Create an event.

| Field         | Type    | Required | Notes                                                                |
| ------------- | ------- | :------: | -------------------------------------------------------------------- |
| `title`       | string  |    ✅    |                                                                      |
| `description` | string  |    ✅    | Free text                                                            |
| `date`        | string  |    ✅    | ISO date or datetime                                                 |
| `duration`    | string  |    ✅    | Free text (e.g. `"2 hours"`, `"3 days"`)                             |
| `location`    | string  |    ✅    |                                                                      |
| `capacity`    | integer |    ✅    | ≥ 0                                                                  |
| `price`       | number  |    ✅    | Decimal                                                              |
| `thumbnail`   | string  |    ⬜    | Image URL                                                            |
| `featured`    | boolean |    ⬜    | Default `false`                                                      |

`occupancy` defaults to `0` and is only mutated by enrollment flows (not exposed as a write field on this endpoint).

**Responses:** `201` — `{ data: <Event> }`, `400` — required field missing.

#### `GET /`

List events, paginated.

| Param       | Type    | Required | Notes                                                |
| ----------- | ------- | :------: | ---------------------------------------------------- |
| `q`         | string  |    ⬜    | Case-insensitive match on `title` / `location`       |
| `featured`  | string  |    ⬜    | `"true"` / `"false"` to filter on `featured`         |
| `startDate` | string  |    ⬜    | Lower bound on `date` (inclusive)                    |
| `endDate`   | string  |    ⬜    | Upper bound on `date` (inclusive)                    |
| `page`      | integer |    ⬜    | Default `1`                                          |
| `limit`     | integer |    ⬜    | Default `20`; clamped to `[1, 100]`                  |

Items are ordered by `date asc`.

#### `GET /:id`

Get a single event.

#### `PATCH /:id`

Partial update. All `POST /` fields are accepted as optional. `thumbnail` may be `null` to clear. At least one field required.

#### `DELETE /:id`

Hard-delete.

#### `GET /:id/enrollments`

List students enrolled in the event, paginated.

| Param   | Type    | Required | Notes                                                            |
| ------- | ------- | :------: | ---------------------------------------------------------------- |
| `q`     | string  |    ⬜    | Case-insensitive match on student `name` / `email` / `phone`     |
| `page`  | integer |    ⬜    | Default `1`                                                      |
| `limit` | integer |    ⬜    | Default `20`; clamped to `[1, 100]`                              |

Each item: `{ id, enrolledAt, student: { id, name, email, phone } }`.

`404` if the event itself does not exist.

### Student endpoints

#### `GET /upcoming`

**Auth:** `STUDENT`. List events whose `date > now()`, paginated.

| Param   | Type    | Required | Notes                                            |
| ------- | ------- | :------: | ------------------------------------------------ |
| `q`     | string  |    ⬜    | Case-insensitive match on `title` / `location`   |
| `page`  | integer |    ⬜    | Default `1`                                      |
| `limit` | integer |    ⬜    | Default `20`; clamped to `[1, 100]`              |

#### `GET /:id/enrollment`

**Auth:** `STUDENT`. Returns whether the calling student is enrolled in the event.

```json
{
  "enrolled": true,
  "enrollment": { "id": "uuid", "enrolledAt": "2026-04-30T…" }
}
```

`enrollment` is `null` when `enrolled` is `false`. `404` if the event does not exist.

#### `POST /:id/enrollment`

**Auth:** `STUDENT`. Self-enroll the calling student in a **free** event (`price = 0`). Paid events must use the payment flow — this endpoint will reject them.

No request body.

**Success — `201 Created`:**

```json
{
  "enrolled": true,
  "enrollment": { "id": "uuid", "enrolledAt": "2026-04-30T…" }
}
```

On success, `Event.occupancy` is incremented by `1` in the same transaction as the enrollment row creation.

**Errors:**

| Status | Cause                                                        |
| ------ | ------------------------------------------------------------ |
| `400`  | Event is paid (`price > 0`) — must enroll via payment flow.  |
| `400`  | Event has already started or ended (`date <= now()`).        |
| `404`  | Event does not exist.                                        |
| `409`  | Event is full (`occupancy >= capacity`).                     |
| `409`  | Caller is already enrolled in this event.                    |

---

## Self-Paced — `/api/self-paced`

Single unified catalog of pre-recorded yoga classes organized into reorderable modules. All plans grant access to the same content — only validity differs.

**All endpoints require `SUPERADMIN` or `OPERATIONS` auth.**

> **Note:** Server enforces required fields on create, at least one field on update, and parent existence (module → classes). Reorder endpoints expect `{ items: [{ id, sortOrder }, …] }` and run all updates in a single transaction.

### Modules — `/api/self-paced/modules`

A module groups related classes; `sortOrder` controls display order.

#### `GET /modules`

List modules, sorted by `sortOrder asc`. Each module includes its **active** classes (where `isActive = true`), also sorted by `sortOrder`.

#### `POST /modules`

| Field       | Type    | Required | Notes                                                          |
| ----------- | ------- | :------: | -------------------------------------------------------------- |
| `title`     | string  |    ✅    | ≤ 200 chars                                                    |
| `sortOrder` | integer |    ⬜    | If omitted, assigned to `(max(sortOrder) + 1)` over all modules|

#### `PATCH /modules/reorder`

Bulk reorder modules. Body: `{ items: [{ id, sortOrder }, …] }`. `400` if `items` is missing or empty.

#### `GET /modules/:id`

Returns the module with **all** its classes (regardless of `isActive`), sorted by `sortOrder`.

#### `PATCH /modules/:id`

Partial update. Accepts `title` and `sortOrder`. At least one field required.

#### `DELETE /modules/:id`

Hard-delete the module. (Cascading delete behavior depends on Prisma referential rules — child classes referencing the module may need to be removed first.)

### Classes — `/api/self-paced/modules/:moduleId/classes`

Pre-recorded videos.

#### `GET /modules/:moduleId/classes`

List classes for the module, sorted by `sortOrder asc`. `404` if the module does not exist.

#### `POST /modules/:moduleId/classes`

| Field          | Type    | Required | Notes                                                                  |
| -------------- | ------- | :------: | ---------------------------------------------------------------------- |
| `title`        | string  |    ✅    | ≤ 200 chars                                                            |
| `videoUrl`     | string  |    ✅    | Hosted video URL                                                       |
| `duration`     | integer |    ✅    | Minutes                                                                |
| `description`  | string  |    ⬜    |                                                                        |
| `thumbnailUrl` | string  |    ⬜    |                                                                        |
| `sortOrder`    | integer |    ⬜    | Defaults to `(max(sortOrder) + 1)` for that module                     |
| `isActive`     | boolean |    ⬜    | Default `true`                                                         |

`404` if the parent module is missing.

#### `PATCH /modules/:moduleId/classes/reorder`

Bulk reorder. Body: `{ items: [{ id, sortOrder }, …] }`.

#### `PATCH /modules/:moduleId/classes/:id`

Partial update — accepts all `POST /` fields as optional. At least one required. `404` if the class does not belong to the module.

#### `DELETE /modules/:moduleId/classes/:id`

Hard-delete.

### Plans — `/api/self-paced/plans`

A plan defines a price + validity (in days) for accessing the entire self-paced catalog.

> **Auth:** `GET /plans` and `GET /plans/:id` are **public** (no token required). Mutations stay `SUPERADMIN` / `OPERATIONS`.

#### `GET /plans`

Public. List, sorted by `validity asc`.

#### `POST /plans`

| Field           | Type     | Required | Notes                                |
| --------------- | -------- | :------: | ------------------------------------ |
| `name`          | string   |    ✅    | ≤ 100 chars                          |
| `validity`      | integer  |    ✅    | Days                                 |
| `price`         | number   |    ✅    | Decimal                              |
| `description`   | string   |    ⬜    |                                      |
| `originalPrice` | number   |    ⬜    | Decimal — used to display savings    |
| `features`      | string[] |    ⬜    | Display benefits                     |
| `isActive`      | boolean  |    ⬜    | Default `true`                       |

#### `GET /plans/:id` / `PATCH /plans/:id` / `DELETE /plans/:id`

Standard CRUD. `GET /plans/:id` is public; `PATCH` / `DELETE` require admin.

---

## YTT Recorded — `/api/ytt-recorded`

Yoga Teacher Training **recorded** courses. Each course has reorderable modules → classes, plus its own set of plans. Same primitives as Self-Paced, but scoped per course.

**Endpoints require `SUPERADMIN` or `OPERATIONS` auth, except the public flat-plan fetch routes (`GET /plans`, `GET /plans/:planId`) and the role-aware student endpoints documented below.**

> The Prisma model is `YTTRecordedCourse` / `YTTRecordedModule` / `YTTRecordedClass` / `YTTRecordedPlan` with `@@unique([studentId, courseId])` on enrollments (one course per student).

`GET /`, `GET /:courseId`, `GET /:courseId/modules`, and `GET /:courseId/modules/:moduleId/classes` are **role-aware**: when the caller is a `STUDENT`, the response is filtered (active rows only, classes/videoUrls gated by an active enrollment); when the caller is `SUPERADMIN` / `OPERATIONS`, the full admin view is returned.

### Courses

#### `GET /`

Admin: list courses sorted by `createdAt desc`.
Student: list **active** courses only (`isActive = true`), same sort.

#### `POST /`

| Field          | Type    | Required | Notes                                                                  |
| -------------- | ------- | :------: | ---------------------------------------------------------------------- |
| `title`        | string  |    ✅    | ≤ 200 chars                                                            |
| `yogaType`     | string  |    ✅    | ≤ 50 chars                                                             |
| `description`  | string  |    ⬜    |                                                                        |
| `thumbnailUrl` | string  |    ⬜    |                                                                        |
| `level`        | string  |    ⬜    | `BEGINNER` \| `INTERMEDIATE` \| `ADVANCED` \| `ALL_LEVELS` (default)   |
| `isActive`     | boolean |    ⬜    | Default `true`                                                         |

#### `GET /:courseId`

Admin: returns the course with nested `modules` (each containing **active** `classes`) and `plans` (sorted by `validity asc`).
Student: course must be `isActive`. Returns the course shell, active `plans`, and `modules` (sorted by `sortOrder asc`). **Modules omit their `classes` array entirely until the student has an active enrollment** — at which point each module includes its active classes (with `videoUrl`). The response also includes a top-level `enrolled` boolean.

#### `PATCH /:courseId`

Partial update — all `POST /` fields optional. At least one required.

#### `DELETE /:courseId`

Hard-delete the course (cascades subject to Prisma rules).

### Modules — `/api/ytt-recorded/:courseId/modules`

#### `GET /:courseId/modules`

Admin: list modules with their active classes. `404` if the course does not exist.
Student: course must be `isActive`. Returns modules sorted by `sortOrder asc`; **each module's `classes` array is omitted until the caller has an active enrollment**, then includes active classes with `videoUrl`.

#### `POST /:courseId/modules`

| Field       | Type    | Required | Notes                                                                  |
| ----------- | ------- | :------: | ---------------------------------------------------------------------- |
| `title`     | string  |    ✅    | ≤ 200 chars                                                            |
| `sortOrder` | integer |    ⬜    | Defaults to `(max(sortOrder) + 1)` over modules **within this course** |

#### `PATCH /:courseId/modules/reorder`

Bulk reorder. Body: `{ items: [{ id, sortOrder }, …] }`.

#### `PATCH /:courseId/modules/:moduleId` / `DELETE /:courseId/modules/:moduleId`

Standard partial update / delete. The module must belong to the course.

### Classes — `/api/ytt-recorded/:courseId/modules/:moduleId/classes`

Same shape as Self-Paced classes — `title`, `videoUrl`, `duration` (minutes) required; `description`, `thumbnailUrl`, `sortOrder`, `isActive` optional.

`POST` validates that the module belongs to the course; class operations validate that the class belongs to the module.

`GET /:courseId/modules/:moduleId/classes` is **role-aware**: students must have an active enrollment for the course (otherwise `403`), then receive only active classes; admins see the full list.

```
GET    /:courseId/modules/:moduleId/classes
POST   /:courseId/modules/:moduleId/classes
PATCH  /:courseId/modules/:moduleId/classes/reorder
PATCH  /:courseId/modules/:moduleId/classes/:classId
DELETE /:courseId/modules/:moduleId/classes/:classId
```

### Plans — `/api/ytt-recorded/plans` (public flat) and `/api/ytt-recorded/:courseId/plans` (admin nested)

| Field           | Type     | Required | Notes                                |
| --------------- | -------- | :------: | ------------------------------------ |
| `name`          | string   |    ✅    | ≤ 100 chars                          |
| `validity`      | integer  |    ✅    | Days                                 |
| `price`         | number   |    ✅    | Decimal                              |
| `description`   | string   |    ⬜    |                                      |
| `originalPrice` | number   |    ⬜    | Decimal                              |
| `features`      | string[] |    ⬜    |                                      |
| `isActive`      | boolean  |    ⬜    | Default `true`                       |

#### Public flat fetch (no auth)

```
GET    /plans                  # all YTT-recorded plans across courses
GET    /plans/:planId          # single plan by id
```

`GET /plans` accepts an optional `?courseId=<uuid>` query param to scope to a single course. Items are ordered by `(courseId asc, validity asc)`. Each plan includes its parent `courseId` so clients can group/link.

#### Admin nested CRUD (`SUPERADMIN` / `OPERATIONS`)

```
GET    /:courseId/plans
POST   /:courseId/plans
GET    /:courseId/plans/:planId
PATCH  /:courseId/plans/:planId
DELETE /:courseId/plans/:planId
```

The plan must belong to the course; cross-course access returns `404`.

### Student endpoints

All student endpoints require `STUDENT` auth. The student is resolved from the JWT — paths never contain `studentId`.

#### `GET /my-enrollments`

List the caller's currently active YTT Recorded enrollments (`status = ACTIVE` AND `endDate > now`), ordered by `endDate desc`.

```jsonc
{
  "data": [
    {
      "id": "uuid",
      "courseId": "uuid",
      "planId": "uuid",
      "planName": "3-Month Access",
      "startDate": "2026-04-01T00:00:00.000Z",
      "expiresAt": "2026-07-01T00:00:00.000Z",
      "status": "ACTIVE",
      "course": { "id": "...", "title": "...", "thumbnailUrl": "...", "yogaType": "Hatha", "level": "BEGINNER" }
    }
  ]
}
```

#### `GET /:courseId/my-enrollment`

Returns the caller's active enrollment for a single course, or `null` when none.

```jsonc
{ "data": { "enrolled": true, "enrollment": { /* same shape as above */ } } }
```

When inactive/expired/missing: `{ "enrolled": false, "enrollment": null }`.

#### `POST /:courseId/enrollments`

Self-enroll the caller in `:courseId`.

| Field    | Type   | Required | Notes                                          |
| -------- | ------ | :------: | ---------------------------------------------- |
| `planId` | string |    ✅    | Plan must belong to `:courseId` and be active. |

`endDate = now + plan.validity` days.

Behaviour against `@@unique([studentId, courseId])`:

- No existing enrollment → row is created.
- Existing row, currently `ACTIVE` and not yet expired → `409 Conflict`.
- Existing row that is `EXPIRED` / `CANCELLED` (or whose `endDate` has passed) → row is **reactivated** with the new plan, `startDate = now`, recomputed `endDate`, and `status = ACTIVE`.

**Errors:** `400` missing `planId`, `404` plan not found / inactive for this course, `409` already actively enrolled.

#### `GET /:courseId/my-progress`

Returns the caller's per-class progress rows for the active enrollment on `:courseId`. Empty array `[]` when there is no active enrollment.

```jsonc
{
  "data": [
    {
      "id": "uuid",
      "classId": "uuid",
      "progress": 75,
      "isCompleted": false,
      "lastWatchedAt": "2026-05-08T12:00:00.000Z",
      "updatedAt": "2026-05-08T12:00:00.000Z"
    }
  ]
}
```

#### `POST /:courseId/classes/:classId/progress`

Upsert progress for one class within an enrolled course. Requires an active enrollment on `:courseId` and that the class belongs to a module in that course.

| Field         | Type    | Required | Notes                                                                  |
| ------------- | ------- | :------: | ---------------------------------------------------------------------- |
| `progress`    | integer |   one of | 0–100. Rounded to nearest integer.                                     |
| `isCompleted` | boolean |   one of | When `progress` is omitted, this flag toggles completion explicitly.   |

If `progress` reaches `100` and `isCompleted` is omitted, completion is auto-set to `true`. `lastWatchedAt` is always set to `now`.

**Errors:** `400` missing both fields or `progress` out of range, `403` no active enrollment for the course, `404` class does not belong to the course (or is inactive).

---

## YTT Live — `/api/ytt-live`

Yoga Teacher Training **live** courses. Each course is a live cohort with one or more priced plans, plus a flat list of live class sessions (no modules).

**Endpoints require `SUPERADMIN` or `OPERATIONS` auth, except the public flat-plan fetch routes (`GET /plans`, `GET /plans/:planId`) and the role-aware student endpoints documented below.**

> The Prisma model is `YTTLiveCourse` / `YTTLivePlan` / `YTTLiveClass` / `YTTLiveEnrollment` with `@@unique([studentId, courseId])` on enrollments (one course per student). Class visibility is gated on a per-course active enrollment — there is no progress model.

`GET /`, `GET /:courseId`, and `GET /:courseId/classes` are **role-aware**: when the caller is a `STUDENT` the response is filtered (active courses only, classes only when enrolled in that course); when the caller is `SUPERADMIN` / `OPERATIONS` the full admin view is returned.

### Courses

```
GET    /
POST   /
GET    /:courseId
PATCH  /:courseId
DELETE /:courseId
```

`POST /` body matches YTT-Recorded course (`title`, `yogaType` required; `description`, `thumbnailUrl`, `level`, `isActive` optional).

`GET /` (admin): list all courses sorted by `createdAt desc`.
`GET /` (student): list **active** courses only.

`GET /:courseId` (admin): includes the nested `plans` (sorted by `validity asc`) and `classes` (sorted by `scheduledAt asc`).
`GET /:courseId` (student): course must be `isActive`. Returns the course shell, active `plans` (sorted by `validity asc`), and a top-level `enrolled` boolean. **The `classes` array is only included when the student has an active enrollment for this course** — otherwise it is omitted entirely.

### Plans

Plan body matches YTT-Recorded plan: `name`, `validity`, `price` required; `description`, `originalPrice`, `features`, `isActive` optional.

#### Public flat fetch (no auth)

```
GET    /plans                  # all YTT-live plans across courses
GET    /plans/:planId          # single plan by id
```

`GET /plans` accepts an optional `?courseId=<uuid>` query param. Items are ordered by `(courseId asc, validity asc)`. Each plan includes its parent `courseId`.

#### Admin nested CRUD (`SUPERADMIN` / `OPERATIONS`)

```
GET    /:courseId/plans
POST   /:courseId/plans
GET    /:courseId/plans/:planId
PATCH  /:courseId/plans/:planId
DELETE /:courseId/plans/:planId
```

### Classes

```
GET    /:courseId/classes
POST   /:courseId/classes
GET    /:courseId/classes/:classId
PATCH  /:courseId/classes/:classId
DELETE /:courseId/classes/:classId
```

`GET /:courseId/classes` (admin) query params: `q` (case-insensitive substring on `title`).
`GET /:courseId/classes` (student): requires an active enrollment for `:courseId`, otherwise responds `403 Forbidden`. When enrolled, returns the full class list (including `link` and `recording`) sorted by `scheduledAt asc`. The admin-only `q` query filter is not applied.

`POST` body:

| Field         | Type    | Required | Notes                                  |
| ------------- | ------- | :------: | -------------------------------------- |
| `title`       | string  |    ✅    | ≤ 200 chars                            |
| `yogaType`    | string  |    ✅    | ≤ 50 chars                             |
| `difficulty`  | string  |    ✅    | `EASY` \| `MEDIUM` \| `HARD`           |
| `duration`    | number  |    ✅    | Minutes                                |
| `description` | string  |    ⬜    |                                        |
| `link`        | string  |    ⬜    | Live-session URL                       |
| `scheduledAt` | string  |    ⬜    | ISO datetime                           |
| `startedAt`   | string  |    ⬜    | ISO datetime                           |
| `endedAt`     | string  |    ⬜    | ISO datetime                           |
| `recording`   | string  |    ⬜    | Recording URL                          |

`PATCH` accepts the same fields as partial; nullable fields (`description`, `link`, `scheduledAt`, `startedAt`, `endedAt`, `recording`) accept `null` to clear.

### Student endpoints

All student endpoints require `STUDENT` auth. The student is resolved from the JWT — paths never contain `studentId`.

#### `GET /my-enrollments`

List the caller's currently active YTT Live enrollments (`status = ACTIVE` AND `endDate > now`), ordered by `endDate desc`.

```jsonc
{
  "data": [
    {
      "id": "uuid",
      "courseId": "uuid",
      "planId": "uuid",
      "planName": "3-Month Cohort",
      "startDate": "2026-04-01T00:00:00.000Z",
      "expiresAt": "2026-07-01T00:00:00.000Z",
      "status": "ACTIVE",
      "course": { "id": "...", "title": "...", "thumbnailUrl": "...", "yogaType": "Hatha", "level": "BEGINNER" }
    }
  ]
}
```

#### `GET /:courseId/my-enrollment`

Returns the caller's active enrollment for a single course, or `null` when none.

```jsonc
{ "data": { "enrolled": true, "enrollment": { /* same shape as above */ } } }
```

When inactive/expired/missing: `{ "enrolled": false, "enrollment": null }`.

#### `POST /:courseId/enrollments`

Self-enroll the caller in `:courseId`.

| Field    | Type   | Required | Notes                                          |
| -------- | ------ | :------: | ---------------------------------------------- |
| `planId` | string |    ✅    | Plan must belong to `:courseId` and be active. |

`endDate = now + plan.validity` days.

Behaviour against `@@unique([studentId, courseId])`:

- No existing enrollment → row is created.
- Existing row, currently `ACTIVE` and not yet expired → `409 Conflict`.
- Existing row that is `EXPIRED` / `CANCELLED` (or whose `endDate` has passed) → row is **reactivated** with the new plan, `startDate = now`, recomputed `endDate`, and `status = ACTIVE`.

**Errors:** `400` missing `planId`, `404` plan not found / inactive for this course, `409` already actively enrolled.

---

## Batches — `/api/batches`

A `Batch` groups live classes and live-plan enrollments into a cohort (e.g. "Morning 7am Bengaluru").

**All endpoints require `SUPERADMIN` or `OPERATIONS` auth.**

### `POST /`

| Field  | Type   | Required | Notes                                  |
| ------ | ------ | :------: | -------------------------------------- |
| `name` | string |    ✅    | Trimmed; 1–100 chars                   |

**Responses:** `201` — `{ data: <Batch> }`, `400` — missing or oversized `name`.

### `GET /`

List batches.

| Param   | Type    | Required | Notes                                                  |
| ------- | ------- | :------: | ------------------------------------------------------ |
| `q`     | string  |    ⬜    | Case-insensitive substring on `name`                   |
| `page`  | integer |    ⬜    | Default `1`                                            |
| `limit` | integer |    ⬜    | Default `20`; clamped to `[1, 100]`                    |

Items are ordered by `createdAt desc`.

### `GET /:id`

Returns a single batch. `404` if not found.

### `PATCH /:id`

Rename a batch.

| Field  | Type   | Required | Notes                                  |
| ------ | ------ | :------: | -------------------------------------- |
| `name` | string |    ✅    | Trimmed; 1–100 chars                   |

**Responses:** `200`, `400` — invalid `name`, `404` — not found.

### `DELETE /:id`

Hard-delete the batch. **Side effect:** all `LiveClass` rows referencing this batch have their `batchId` set to `null` (via a transaction) before deletion. Live enrollments tied to the batch will fail to delete unless cleared up first.

---

## Live Classes & Live Plans — `/api/live`

Per-session live classes within the shared live-class catalog plus the priced `LivePlan` catalog (validity-based access to all live classes). Each class belongs to (at most) one tutor and one batch; plans are unscoped (apply to the whole live catalog).

**Live-class endpoints require `SUPERADMIN` or `OPERATIONS` auth. Plan GETs (`GET /plans`, `GET /plans/:id`) are public; plan mutations require admin.**

### `GET /`

List live classes (no pagination — returns all matching items, ordered by `scheduledAt desc`). Each item includes a nested `tutor` (`id`, `tutorId`, `name`, `avatar`, `specializations`) and `batch` (`id`, `name`).

| Param     | Type   | Required | Notes                                                                 |
| --------- | ------ | :------: | --------------------------------------------------------------------- |
| `q`       | string |    ⬜    | Case-insensitive substring on `title`                                 |
| `status`  | string |    ⬜    | `DRAFT` \| `SCHEDULED` \| `LIVE` \| `COMPLETED` \| `CANCELLED`        |
| `tutorId` | string |    ⬜    | UUID of a `Tutor`                                                     |
| `batchId` | string |    ⬜    | UUID of a `Batch`                                                     |

### `GET /:id`

Single live class with the same join shape as `GET /`.

### `POST /`

| Field          | Type    | Required | Notes                                                                  |
| -------------- | ------- | :------: | ---------------------------------------------------------------------- |
| `title`        | string  |    ✅    | ≤ 200 chars                                                            |
| `yogaType`     | string  |    ✅    | ≤ 50 chars                                                             |
| `difficulty`   | string  |    ✅    | `EASY` \| `MEDIUM` \| `HARD`                                           |
| `duration`     | integer |    ✅    | Minutes                                                                |
| `description`  | string  |    ⬜    |                                                                        |
| `thumbnailUrl` | string  |    ⬜    |                                                                        |
| `tutorId`      | string  |    ⬜    | UUID of a `Tutor`                                                      |
| `batchId`      | string  |    ⬜    | UUID of a `Batch`                                                      |
| `scheduledAt`  | string  |    ⬜    | ISO datetime                                                           |
| `link`         | string  |    ⬜    | Live join URL (Zoom / Meet / etc.)                                     |
| `recording`    | string  |    ⬜    | Recording URL after the session                                        |
| `status`       | string  |    ⬜    | `DRAFT` (default) \| `SCHEDULED` \| `LIVE` \| `COMPLETED` \| `CANCELLED`|

`startedAt` / `endedAt` are set by other flows (not exposed for write here).

### `PATCH /:id`

Partial update. Accepts all `POST /` fields as optional. `tutorId`, `batchId`, `scheduledAt`, `link`, `recording` may be passed as `null` to clear them.

### `DELETE /:id`

Hard-delete the live class.

### Student endpoints

Read-only access for the calling `STUDENT`. Both endpoints require `STUDENT` auth and resolve the student from the JWT (no path/query identifiers).

#### `GET /my-enrollment`

Returns the student's currently active `LiveEnrollment` (`status = ACTIVE` AND `endDate > now`), or `null` if none.

```jsonc
{
  "data": {
    "enrolled": true,
    "enrollment": {
      "id": "uuid",
      "planId": "uuid",
      "batchId": "uuid",
      "startDate": "2026-04-01T00:00:00.000Z",
      "endDate":   "2026-07-01T00:00:00.000Z",
      "status": "ACTIVE",
      "plan":  { "id": "...", "name": "Quarterly", "validity": 90, "recordingAccess": 1, "...": "..." },
      "batch": { "id": "uuid", "name": "Morning 7am Bengaluru" }
    }
  }
}
```

When the student has no active enrollment: `{ "enrolled": false, "enrollment": null }`.

#### `GET /my-classes`

Returns the entire live-class catalog (`status IN (SCHEDULED, LIVE, COMPLETED)`, ordered by `scheduledAt desc`) with each item using the same join shape as the admin `GET /` (nested `tutor` and `batch`). The student's plan controls recording visibility:

- `recording` is preserved only on classes with `scheduledAt >= now − recordingAccess days`.
- For all older classes, `recording` is forced to `null`.
- Monthly (`recordingAccess = 0`) ⇒ every past recording is hidden.

When the student has no active enrollment, the response is `{ "enrolled": false, "recordingDays": 0, "classes": [] }`.

```jsonc
{
  "data": {
    "enrolled": true,
    "recordingDays": 1,
    "classes": [
      {
        "id": "uuid",
        "title": "Morning Hatha",
        "yogaType": "Hatha",
        "difficulty": "MEDIUM",
        "scheduledAt": "...",
        "duration": 60,
        "link": "https://...",
        "recording": "https://...",
        "status": "COMPLETED",
        "tutor": { "id": "...", "name": "...", "avatar": "...", "specializations": ["..."] },
        "batch": { "id": "...", "name": "Morning 7am Bengaluru" }
      }
    ]
  }
}
```

### Plans — `/api/live/plans`

A `LivePlan` defines a price + validity (days) for accessing the entire live-class catalog, optionally with a `recordingAccess` window.

#### `GET /plans`

Public. List all live plans, sorted by `validity asc`.

#### `GET /plans/:id`

Public. Single plan by id; `404` if not found.

#### `POST /plans` *(admin)*

| Field             | Type     | Required | Notes                                        |
| ----------------- | -------- | :------: | -------------------------------------------- |
| `name`            | string   |    ✅    | ≤ 100 chars                                  |
| `validity`        | integer  |    ✅    | Days                                         |
| `price`           | number   |    ✅    | Decimal                                      |
| `description`     | string   |    ⬜    |                                              |
| `originalPrice`   | number   |    ⬜    | Decimal                                      |
| `features`        | string[] |    ⬜    |                                              |
| `recordingAccess` | integer  |    ⬜    | Days of recording access; default `0`        |
| `isActive`        | boolean  |    ⬜    | Default `true`                               |

#### `PATCH /plans/:id` *(admin)* / `DELETE /plans/:id` *(admin)*

Standard partial update / delete.

---

## Quick test

Bootstrap superadmin (when DB has none):

```bash
curl -s -X POST http://localhost:5001/api/auth/superadmin/register \
  -H "Content-Type: application/json" \
  -d '{"email":"ok@ok.com","name":"Super Admin","phone":"0000000000","password":"12345678"}'
```

Login:

```bash
curl -s -X POST http://localhost:5001/api/auth/superadmin/login \
  -H "Content-Type: application/json" \
  -d '{"email":"ok@ok.com","password":"12345678"}'
```

Use the returned token:

```bash
curl -s http://localhost:5001/api/auth/superadmin/me \
  -H "Authorization: Bearer <token>"
```

---

## Health

`GET /` (root) returns `{ "message": "Server healthy!" }` and requires no authentication. Useful for Docker / Kubernetes liveness probes.
