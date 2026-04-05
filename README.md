<div align="center">

# ConfessionHub

**Receive anonymous messages on your terms.**

A full-stack web app for sharing a link, collecting confessions or feedback, and staying in control with verification and an on/off switch for new messages.

[![Next.js](https://img.shields.io/badge/Next.js-16-000000?style=flat-square&logo=next.js&logoColor=white)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19-61DAFB?style=flat-square&logo=react&logoColor=black)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?style=flat-square&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![MongoDB](https://img.shields.io/badge/MongoDB-Mongoose-47A248?style=flat-square&logo=mongodb&logoColor=white)](https://mongoosejs.com/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-4-38B2AC?style=flat-square&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![Zod](https://img.shields.io/badge/Zod-4-3E67B1?style=flat-square)](https://zod.dev/)

</div>

---

## Why ConfessionHub?

Whether you call them confessions, anonymous notes, or honest feedback, people want a simple way to reach you without exposing their identity. ConfessionHub is built around that idea: **one profile, one inbox, full control** over who can still write to you.

---

## Features (domain model)

| Capability | Details |
|------------|---------|
| **Accounts** | Username, email, and password with strong validation (length, complexity, uniqueness). |
| **Verification** | Email-style flow with a verify code and expiry (`verifySchema` / `verifyCodeExpiresAt`). |
| **Inbox** | Messages stored as embedded documents with content and timestamp. |
| **Privacy toggle** | `isAcceptingMessages` lets you pause new submissions without deleting history. |
| **Input safety** | Zod schemas cap message length (5–300 chars) and normalize sign-up rules in one place. |

---

## Tech stack

- **[Next.js 16](https://nextjs.org/)** — App Router, React Server Components–ready layout.
- **[React 19](https://react.dev/)** — UI with the React Compiler plugin enabled in dev tooling.
- **[MongoDB + Mongoose](https://mongoosejs.com/)** — `User` model with nested `Message` subdocuments.
- **[Zod](https://zod.dev/)** — Shared validation for sign-up, sign-in, verify, messages, and accept-message settings.
- **[Tailwind CSS v4](https://tailwindcss.com/)** — Utility-first styling with PostCSS integration.

---

## Project layout

```
confessionhub/
├── src/
│   ├── app/                 # Next.js App Router (pages, layout, global styles)
│   ├── model/
│   │   └── User.ts          # Mongoose User + Message schemas
│   └── schemas/             # Zod validators (API / form contracts)
│       ├── acceptMessageSchema.ts
│       ├── messageSchema.ts
│       ├── signInSchema.ts
│       ├── signUpSchema.ts
│       └── verifySchema.ts
├── public/
├── next.config.ts
├── package.json
└── tsconfig.json
```

---

## Getting started

### Prerequisites

- **Node.js** 20+ (matches `@types/node` in the project)
- **MongoDB** — local instance or [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)

### Install

```bash
npm install
```

### Environment

Create a `.env.local` in the project root (values depend on how you connect Mongoose):

```env
MONGODB_URI=mongodb://localhost:27017/confessionhub
# Add other secrets (e.g. auth, email) as you wire routes and services.
```

> **Note:** Wire `MONGODB_URI` (or your chosen variable name) in your database connection module when you add API routes or server actions.

### Run locally

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Other scripts

| Command | Purpose |
|---------|---------|
| `npm run dev` | Development server with hot reload |
| `npm run build` | Production build |
| `npm run start` | Start production server |
| `npm run lint` | ESLint (Next.js config) |

---

## Design notes

- Validation rules in `src/schemas/` mirror constraints on the Mongoose `User` model so API and UI can stay aligned.
- The `User` model uses the standard Next.js + Mongoose pattern: reuse `mongoose.models.User` in dev to avoid **OverwriteModelError**.

---

## License

This project is **private** (`"private": true` in `package.json`). Adjust licensing if you open-source it.

---

<div align="center">

Built with Next.js · Ready to grow into routes, auth, and a polished inbox UI.

</div>
