# College Art Club Website

A Next.js website for a college art club, built to showcase recent events, club information, member artwork, and a future-ready contact workflow.

## Repository Description

Public website for a college art club with events, about, gallery, and contact pages, plus a Next.js foundation for future admin, membership, attendance, and submission workflows.

## Current Features

- Events homepage focused on recent completed club events
- About page with club mission, meeting time, and officers
- Gallery page for member-submitted artwork
- Artwork detail modal with artist, medium, dimensions, and statement
- Contact page with validated form UI
- Server-side contact route prepared for future email sending
- Responsive design for desktop and mobile
- Automated tests for public content, navigation, gallery behavior, contact validation, and contact form states

## Planned Future Features

- Admin-only login for officers
- Membership list with semester/year payment tracking and expiration
- QR-code meeting attendance check-in
- Searchable attendance and member records
- Admin-reviewed gallery artwork submissions
- Admin content editing for events, officers, gallery items, and meeting info
- Email sending after a domain/email provider decision is finalized

## Tech Stack

- Next.js App Router
- React
- TypeScript
- CSS in `app/globals.css`
- Vitest
- Testing Library

## Getting Started

Install dependencies:

```bash
npm install
```

Run the development server:

```bash
npm run dev
```

Open:

```text
http://localhost:3000
```

## Available Scripts

```bash
npm test
npm run lint
npm run build
npm start
```

## Environment Variables

Copy `.env.example` to `.env.local` when testing email configuration locally.

```env
RESEND_API_KEY=
CONTACT_TO_EMAIL=studio.collective@example.edu
CONTACT_FROM_EMAIL=Studio Collective <contact@example.edu>
CONTACT_REPLY_NAME=Studio Collective
```

Email sending is intentionally safe when these values are missing: the contact form will show a fallback message instead of pretending a message was sent.

## Notes For Future Maintainers

This project is currently public-site first. The admin side, database, attendance, membership management, gallery submissions, and production email setup are planned but not fully implemented yet.

For the next major phase, choose and configure the data backend before building admin features. Supabase is a strong candidate because it can support the database, admin auth, file storage, and future dashboard workflows in one place.
