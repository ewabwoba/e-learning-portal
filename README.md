
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
