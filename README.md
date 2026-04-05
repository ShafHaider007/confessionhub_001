<div align="center">

# SpatialX

**Full-stack geospatial workflows — maps, Sentinel Hub imagery, and signed-in dashboards.**

SpatialX is a Next.js app for exploring and building on Earth observation data, with accounts, email verification, and a MongoDB-backed user model you can extend for saved views, layers, and projects.

[![Next.js](https://img.shields.io/badge/Next.js-16-000000?style=flat-square&logo=next.js&logoColor=white)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19-61DAFB?style=flat-square&logo=react&logoColor=black)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?style=flat-square&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![MongoDB](https://img.shields.io/badge/MongoDB-Mongoose-47A248?style=flat-square&logo=mongodb&logoColor=white)](https://mongoosejs.com/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-4-38B2AC?style=flat-square&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![Zod](https://img.shields.io/badge/Zod-4-3E67B1?style=flat-square)](https://zod.dev/)

</div>

---

## What’s in the box

| Area | Details |
|------|---------|
| **Geospatial** | [`@sentinel-hub/sentinelhub-js`](https://www.npmjs.com/package/@sentinel-hub/sentinelhub-js) for Sentinel Hub–style imagery and processing helpers (use **server routes** for secrets). |
| **Accounts** | Sign up, sign in (NextAuth), email verification via Resend. |
| **User model** | Mongoose `User` with optional embedded messages (legacy inbox fields you can repurpose or remove as the product evolves). |
| **Validation** | Zod schemas aligned with the user model for API and forms. |

---

## Tech stack

- **[Next.js 16](https://nextjs.org/)** — App Router, Server Components by default.
- **[React 19](https://react.dev/)** — UI with the React Compiler plugin in dev tooling.
- **[MongoDB + Mongoose](https://mongoosejs.com/)** — `User` model and related data.
- **[Zod](https://zod.dev/)** — Shared validation for auth, verify, and messages.
- **[Tailwind CSS v4](https://tailwindcss.com/)** — Styling via PostCSS.

---

## Project layout

```
spatialx/                    # rename the folder locally if it still says confessionhub
├── src/
│   ├── app/                 # App Router (pages, API routes, layout)
│   ├── model/
│   │   └── User.ts
│   └── schemas/             # Zod validators
├── emails/                  # React Email templates
├── public/
├── next.config.ts
├── package.json
└── tsconfig.json
```

---

## Getting started

### Prerequisites

- **Node.js** 20+
- **MongoDB** — local or [Atlas](https://www.mongodb.com/cloud/atlas)

### Install

```bash
npm install
```

### Environment

Create `.env.local` in the project root (never commit real secrets). Typical variables:

```env
MONGODB_URI=mongodb://localhost:27017/spatialx
# NextAuth, Resend, Sentinel Hub / OAuth client secrets as you wire them
```

Keep Sentinel Hub (or Copernicus) credentials on the **server** only; proxy through `src/app/api/...` routes.

### Run locally

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Scripts

| Command | Purpose |
|---------|---------|
| `npm run dev` | Development server |
| `npm run build` | Production build |
| `npm run start` | Production server |
| `npm run lint` | ESLint |

---

## Agent / contributor notes

Project conventions for AI assistants and humans live in **`AGENTS.md`** and **`.cursor/rules/spatialx.mdc`**.

---

## License

This project is **private** (`"private": true` in `package.json`). Adjust if you open-source it.

---

<div align="center">

SpatialX · Next.js · Sentinel Hub–ready backend patterns

</div>
