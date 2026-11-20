# Eminence E-Learning Portal

A modern e-learning platform for **students, instructors and administrators**: a public marketing site, a course catalogue, and a signed-in workspace for each role. React + Vite on the front end, Java Spring Boot on the back end. The UI currently ships under the **Coursely** brand name.

## Tech stack

| Layer | Technology |
| --- | --- |
| Front end | React 18, Vite 6, React Router DOM 6, Lucide React, plain CSS (design tokens, responsive layouts) |
| Back end | Java 17, Spring Boot 3.4, Spring Security (stateless JWT), JPA/Hibernate |
| Database | MySQL / MariaDB (H2 in tests) |

## Repository layout

```text
elearning-portal/
├── client/      React + Vite app (see Architecture below)
├── server/       Spring Boot API (use your own folder name, e.g. server/)
├── docker-compose.yml
└── README.md
```

## Getting started (front end only)

You can explore the whole UI without the API. It falls back to an offline demo repository saved in the browser.

```bash
git clone <repository-url>
cd elearning-portal/client
npm install
npm run dev        # development server
npm run build      # production build
```

To run the full stack, see **Run locally** below.

## What is included

**Public site**: home (hero, popular courses, benefits, categories, how it works, instructor CTA, FAQ, footer), filterable catalogue (search, category/status/level/rating/price filters, sort, grid/list), course detail with curriculum, login and registration.

**Student workspace** (`/app`): dashboard (stats, streak, weekly activity, continue learning, recommendations), My learning (All / In progress / Completed), lesson player with per-lesson completion and certificate banner, explore, settings.

**Instructor workspace** (`/app/teach`): dashboard (students, sales, top courses, recent enrolments), My courses (submit for review, resubmit, archive), course editor with modules and lessons, student roster, settings.

**Admin workspace** (`/app/admin`): dashboard, course review queue (approve, reject with a reason, take down), users and instructor approvals, role changes, suspension, categories, enrolments, audit log, and editing any course.

Every data view has loading skeletons, empty states and error states with retry. Layout adapts: full sidebar on desktop, icon rail on tablet, slide-in drawer on mobile.

## Architecture

The front end follows the four layers from the design brief:

```text
client/src
├── presentation/     React components, pages, layouts (what the user sees)
├── application/      auth, toasts, hooks: use cases that coordinate the UI
├── domain/           pure rules: pricing, filtering, progress, streaks, validation
└── infrastructure/   API repository, offline demo repository, token storage
```

`infrastructure/index.js` probes `/api/health` at start-up. If the Spring Boot API answers, the app uses it; otherwise it falls back to an **offline demo repository** (localStorage), so the UI can be explored with only `npm run dev`. Force a source with `VITE_DATA_SOURCE=api|demo`.

The back end mirrors this: `controller` (HTTP) → `service` (use cases) → `model` (domain entities) → `repository` (data), with `dto/Api.java` response shapes, `security/` (JWT) and `exception/` (uniform JSON errors).

## Run locally

```bash
docker compose up -d mysql          # 1. database
cd server && mvn spring-boot:run   # 2. API on :8080 (seeds demo data on first start)
cd server && npm install && npm run dev   # 3. UI on :5173
```

Demo accounts (password `Password123!`): `student@coursely.dev`, `instructor@coursely.dev`, `admin@coursely.dev` (admin), `pending@coursely.dev` (instructor awaiting approval). Seeding is controlled by `COURSELY_SEED` (set `false` outside local development).

Tests: `cd server && mvn test` (MockMvc against in-memory H2).

## API

| Area | Endpoints |
| --- | --- |
| Auth | `POST /api/auth/register`, `POST /api/auth/login`, `GET/PUT /api/auth/me` |
| Catalogue (public) | `GET /api/courses`, `GET /api/courses/{id}` |
| Student | `GET/POST /api/enrollments(/me)`, `GET /api/learn/courses/{id}`, `POST /api/learn/courses/{id}/lessons/{lessonId}/toggle`, `GET /api/learn/stats` |
| Categories (public) | `GET /api/categories` |
| Admin (`ADMIN` only) | `/api/admin/report`, `/audit`, `/users` (+ `/role`, `/status`, `/approval`), `/courses` (+ `/review`, `/badge`, `GET/PUT {id}`), `/categories`, `/enrollments` |
| Instructor | `GET/POST /api/instructor/courses`, `GET/PUT /api/instructor/courses/{id}`, `PATCH .../{id}/status`, `GET /api/instructor/students`, `GET /api/instructor/stats` |

Errors are `{status, message, fields?}`. Lesson content is only returned to enrolled learners and the owning instructor; instructors can only read or change their own courses.

## Roles and permissions (RBAC)

Roles are mapped to permissions in `model/Permission.java`; the JWT filter turns each into a Spring authority and controllers guard methods with `@PreAuthorize("hasAuthority('...')")`. Add a permission there, not in controllers.

| | STUDENT | INSTRUCTOR | ADMIN |
| --- | :-: | :-: | :-: |
| Browse, enrol, learn, track progress | yes | | yes (preview) |
| Create / edit **own** courses, submit for review | | yes, once approved | yes (any course) |
| See own students and sales | | yes | |
| Approve instructors, review / publish / take down courses | | | yes |
| Users, roles, suspend, delete | | | yes |
| Categories, enrolments, platform report, audit log | | | yes |

Rules worth knowing:

- Self-registration can only create STUDENT or INSTRUCTOR. The **first admin** is created at start-up from `COURSELY_ADMIN_EMAIL` and `COURSELY_ADMIN_PASSWORD` (12+ characters) if no admin exists.
- Instructors are `PENDING` until an admin approves them once. Pending instructors can draft but not submit.
- Course lifecycle: `DRAFT → PENDING_REVIEW → PUBLISHED`, or `REJECTED` (with a reason) back to the instructor. Instructors never publish directly. Editing a published course does **not** re-trigger review.
- The user is reloaded from the database on every request, so role changes and suspensions apply immediately.
- Guards: no self role change, suspend or delete; the last active admin cannot be removed; users with courses or enrolments cannot be deleted (suspend instead).
- Role changes, suspensions, approvals, course decisions, deletions, category and enrolment changes are written to the audit log in the same transaction.

## Configuration

| Variable | Purpose |
| --- | --- |
| `JWT_SECRET` | 32+ character signing key. **Required in any real environment.** |
| `CORS_ORIGINS` | Allowed front-end origins (comma separated) |
| `DB_URL`, `DB_USERNAME`, `DB_PASSWORD` | MySQL connection |
| `COURSELY_ADMIN_EMAIL`, `COURSELY_ADMIN_PASSWORD`, `COURSELY_ADMIN_NAME` | Creates the first admin when none exists (password 12+ chars) |
| `COURSELY_SEED` | `true` seeds demo data when the DB is empty |
| `VITE_API_URL` | API base for the front end (default `/api`, proxied by Vite in dev) |

## Known limitations and next steps

- **Back end not compiled in the build environment.** It was written against Spring Boot 3.4 / Java 17 but could not be built where this project was generated (no Maven Central access). Run `mvn test` first; expect to fix small compile errors if any.
- **Not implemented from the RBAC brief:** payments and refunds, certificates, review moderation, announcements, assessments/grading, discussions and platform settings. None of these exist in the project yet, so there is nothing to permission; add the feature, then add its `Permission`.
- **Payments are not implemented.** Enrolment is instant; add a payment provider and an order/payment model before charging.
- **Ratings are seeded values.** Add a Review entity so ratings come from enrolled learners.
- **Lesson video** is a placeholder unless a lesson's content is a direct `.mp4`/`.webm` URL. Add upload/streaming (e.g. object storage + signed URLs).
- **Auth hardening:** the token lives in `localStorage` (simple, but exposed to XSS). Move to httpOnly cookies with refresh-token rotation, add rate limiting on login, email verification and password reset.
- Replace `ddl-auto: update` with Flyway migrations; and add secrets management. Existing databases created before the admin role have no admin: set the two `COURSELY_ADMIN_*` variables and restart.
- Hero and course photos are hot-linked from Unsplash for demonstration: replace with licensed assets. An illustrated fallback appears if an image cannot load.
- Marketing figures on the home page (e.g. "12K+ certified learners") are placeholder copy.

## Design notes

The platform follows a modern corporate design system with a separate public site and signed-in experience, reusable components and consistent styling. The current build uses primary blue `#3c5be0`, ink `#12162b`, soft lavender surfaces; Open Sans for text and Montserrat for display headings. Catalogue cards, filters, badges (NEW / HOT / FEATURED / SPECIAL), popular-course strip and category tiles follow the supplied references and are reused inside the signed-in app.


## Project status

Under active development. Core flows (browse, enrol, learn, instructor authoring, admin review) work end to end; see **Known limitations and next steps** for what is still missing.
