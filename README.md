<<<<<<< HEAD
# Coursely — Learning Management System

A modern LMS for **students and instructors**: a public marketing site, a course catalogue, and a signed-in workspace for each role. React + Vite on the front end, Java Spring Boot on the back end.

## What is included

**Public site**: home (hero, popular courses, benefits, categories, how it works, instructor CTA, FAQ, footer), filterable catalogue (search, category/status/level/rating/price filters, sort, grid/list), course detail with curriculum, login and registration.

**Student workspace** (`/app`): dashboard (stats, streak, weekly activity, continue learning, recommendations), My learning (All / In progress / Completed), lesson player with per-lesson completion and certificate banner, explore, settings.

**Instructor workspace** (`/app/teach`): dashboard (students, sales, top courses, recent enrolments), My courses (publish / unpublish), course editor with modules and lessons, student roster, settings.

Every data view has loading skeletons, empty states and error states with retry. Layout adapts: full sidebar on desktop, icon rail on tablet, slide-in drawer on mobile.

## Architecture

The front end follows the four layers from the design brief:

```text
frontend/src
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
cd backend && mvn spring-boot:run   # 2. API on :8080 (seeds demo data on first start)
cd frontend && npm install && npm run dev   # 3. UI on :5173
```

Demo accounts (password `Password123!`): `student@coursely.dev`, `instructor@coursely.dev`. Seeding is controlled by `COURSELY_SEED` (set `false` outside local development).

Tests: `cd backend && mvn test` (MockMvc against in-memory H2).

## API

| Area | Endpoints |
| --- | --- |
| Auth | `POST /api/auth/register`, `POST /api/auth/login`, `GET/PUT /api/auth/me` |
| Catalogue (public) | `GET /api/courses`, `GET /api/courses/{id}` |
| Student | `GET/POST /api/enrollments(/me)`, `GET /api/learn/courses/{id}`, `POST /api/learn/courses/{id}/lessons/{lessonId}/toggle`, `GET /api/learn/stats` |
| Instructor | `GET/POST /api/instructor/courses`, `GET/PUT /api/instructor/courses/{id}`, `PATCH .../{id}/status`, `GET /api/instructor/students`, `GET /api/instructor/stats` |

Errors are `{status, message, fields?}`. Lesson content is only returned to enrolled learners and the owning instructor; instructors can only read or change their own courses.

## Configuration

| Variable | Purpose |
| --- | --- |
| `JWT_SECRET` | 32+ character signing key. **Required in any real environment.** |
| `CORS_ORIGINS` | Allowed front-end origins (comma separated) |
| `DB_URL`, `DB_USERNAME`, `DB_PASSWORD` | MySQL connection |
| `COURSELY_SEED` | `true` seeds demo data when the DB is empty |
| `VITE_API_URL` | API base for the front end (default `/api`, proxied by Vite in dev) |

## Known limitations and next steps

- **Back end not compiled in the build environment.** It was written against Spring Boot 3.4 / Java 17 but could not be built where this project was generated (no Maven Central access). Run `mvn test` first; expect to fix small compile errors if any.
- **Payments are not implemented.** Enrolment is instant; add a payment provider and an order/payment model before charging.
- **Ratings are seeded values.** Add a Review entity so ratings come from enrolled learners.
- **Lesson video** is a placeholder unless a lesson's content is a direct `.mp4`/`.webm` URL. Add upload/streaming (e.g. object storage + signed URLs).
- **Auth hardening:** the token lives in `localStorage` (simple, but exposed to XSS). Move to httpOnly cookies with refresh-token rotation, add rate limiting on login, email verification and password reset.
- Replace `ddl-auto: update` with Flyway migrations; add audit logging and secrets management.
- Hero and course photos are hot-linked from Unsplash for demonstration: replace with licensed assets. An illustrated fallback appears if an image cannot load.
- Marketing figures on the home page (e.g. "12K+ certified learners") are placeholder copy.

## Design notes

Primary blue `#3c5be0`, ink `#12162b`, soft lavender surfaces; Open Sans for text and Montserrat for display headings. Catalogue cards, filters, badges (NEW / HOT / FEATURED / SPECIAL), popular-course strip and category tiles follow the supplied references and are reused inside the signed-in app.
=======

# Eminence E-Learning Portal

A modern e-learning platform built with React and Vite, designed to provide an intuitive online learning experience for students and instructors.

## Tech Stack

- React – Frontend UI
- Vite – Development and build tool
- React Router DOM – Application navigation
- Lucide React – Icons
- CSS – Styling and responsive layouts

## Project Structure

```text
elearning-portal/
├── public/
├── src/
│   ├── assets/              # Images, logos and static assets
│   ├── components/          # Reusable UI components
│   │   ├── Navbar.jsx
│   │   ├── Sidebar.jsx
│   │   ├── CourseCard.jsx
│   │   └── Footer.jsx
│   ├── pages/               # Application pages
│   │   ├── Home.jsx
│   │   ├── Login.jsx
│   │   ├── Register.jsx
│   │   ├── Dashboard.jsx
│   │   ├── Courses.jsx
│   │   └── CourseDetails.jsx
│   ├── layouts/             # Shared page layouts
│   │   ├── PublicLayout.jsx
│   │   └── DashboardLayout.jsx
│   ├── data/                # Mock application data
│   │   └── courses.js
│   ├── App.jsx              # Application routes
│   ├── main.jsx             # React entry point
│   └── index.css            # Global styles
├── index.html
├── package.json
├── vite.config.js
└── README.md
```

## Getting Started

### 1. Clone the repository

```bash
git clone <repository-url>
cd elearning-portal
```

### 2. Install dependencies

```bash
npm install
```

### 3. Start development server

```bash
npm run dev
```

### 4. Build for production

```bash
npm run build
```

## Design Direction

The platform follows a modern corporate design system featuring:

- Deep purple and gold brand colors.
- Clean typography and responsive layouts.
- Reusable components and consistent styling.
- Separate public and authenticated user experiences.

## Project Status

🚧 Currently under development.
>>>>>>> cf1f7ee72919c8c07d431fb980fa695d254c05ac
