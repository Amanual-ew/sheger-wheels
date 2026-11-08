# Sheger Wheels

Sheger Wheels is a modern peer-to-peer car rental marketplace built for Addis Ababa. It connects car owners with renters, enabling them to discover available vehicles, request bookings, and manage rental activity through a streamlined web experience.

## Overview

This application is designed as a polished demo marketplace for local car rentals. It includes:

- a searchable inventory of cars by price, neighbourhood, and text query
- rental booking workflow for customers
- owner-side management for car listings and bookings
- admin moderation and operational oversight
- a responsive, user-friendly interface built with Next.js and Tailwind CSS

## Key Features

### For renters

- Browse approved vehicle listings
- Search by make/model, price range, and neighbourhood
- View car details and listing information
- Request a booking for a chosen date range
- Complete a simulated checkout flow for demo purposes
- Explore popular areas across Addis Ababa

### For owners

- Create and manage car listings
- Add pricing, location, and vehicle information
- Review incoming booking requests
- Track booking activity and status
- Publish or update listings as needed

### For admins

- Review listings before publication
- Monitor bookings and marketplace activity
- Manage announcements and other operational content
- Support dispute and moderation workflows

## Tech Stack

- Next.js 16
- React 19
- TypeScript
- Tailwind CSS
- Prisma ORM
- PostgreSQL
- NextAuth
- shadcn/ui-style components
- Lucide Icons
- Recharts and other UI libraries for dashboard functionality

## Project Structure

```text
sheger-wheel/
├── prisma/
│   └── schema.prisma
├── public/
│   └── sheger-wheels-og.png
├── scripts/
│   └── seed-admin.ts
├── src/
│   ├── app/
│   │   ├── admin/
│   │   ├── api/
│   │   ├── bookings/
│   │   ├── cars/
│   │   ├── checkout/
│   │   ├── dashboard/
│   │   ├── owner/
│   │   ├── signin/
│   │   ├── signup/
│   │   ├── globals.css
│   │   ├── layout.tsx
│   │   └── page.tsx
│   ├── components/
│   ├── hooks/
│   └── lib/
├── .env.example
├── .gitignore
├── eslint.config.mjs
├── next.config.ts
├── package.json
├── postcss.config.mjs
├── tailwind.config.ts
├── tsconfig.json
└── README.md
```

## Prerequisites

Before running the project, make sure you have:

- Node.js 20 or later
- npm installed
- PostgreSQL database access
- a valid environment configuration file

## Installation

1. Clone the repository and open the project folder:

```bash
git clone <your-repository-url>
cd module-03-react-nextjs/mini-projects/sheger-wheel
```

2. Install dependencies:

```bash
npm install
```

3. Create your environment file:

```bash
cp .env.example .env.local
```

4. Update the values in `.env.local` with your local configuration, especially:

- `DATABASE_URL`
- `NEXTAUTH_SECRET`
- `NEXTAUTH_URL`
- optional OAuth values if enabled

## Database Setup

Generate Prisma client and sync the schema to your database:

```bash
npx prisma generate
npx prisma db push
```

If you want to seed an admin user, use:

```bash
npm run seed:admin
```

## Running the App

Start the development server:

```bash
npm run dev
```

Then open:

```text
http://localhost:3000
```

## Available Scripts

```bash
npm run dev      # start the development server
npm run build    # build the production app
npm run start    # run the production server
npm run lint     # lint the project
npm run seed:admin # seed an admin account
```

## Production Build

To create a production build:

```bash
npm run build
```

## Notes

- This project is a demonstration marketplace and uses a simulated checkout flow rather than live payment processing.
- The app is tailored to the Addis Ababa car rental market and includes region-based search behaviour.
- A strong Next.js and Prisma foundation makes it easy to extend with live payments, messaging, reviews, or a richer admin dashboard.

## License

This project is intended for educational and portfolio use.
