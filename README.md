# Real-time Leaderboard

A full-stack application that allows users to compete in various activities, track their scores, and view their rankings on a leaderboard.

## Features

- **User Authentication & Authorization**
  - Sign-up, sign-in, and sign-out with role-based access control (`ADMIN` / `NADMIN`).
  - `ADMINS` are authenticated and authorized with JWT.
  - `NADMINS` are authenticated and authorized with Clerk.

- **Activity Management** (`ADMIN` only)
  - Add, update, and delete activities.
  
- **Score Submission**
  - Users can submit scores for various activities.
  - Scores are added to specific activities and globally.

- **Leaderboard**
  - Real-time leaderboard showing the top users, their scores, and ranks.
  - Global and activity-specific leaderboards.
  - Top 3 users have trophies or medals and are displayed in the leaderboard.
  - Data table automatically navigates to user's position page.

- **Report**
  - View reports on the top players for a specific period.

## Tech Stack

- **Backend:** NestJS
- **Frontend:** Next.js, ShadCN UI, TailwindCSS
- **Database:** MongoDB with PrismaORM
- **Authentication:** Clerk, Passport.js, JWT, Cookies
- **Deployment:** Render, Vercel

## Installation

### Backend Setup

```bash
git clone https://github.com/gideonadeti/realtime-leaderboard.git
cd realtime-leaderboard
npm install
```

#### Environment Setup

Create a `.env` file with the following:

```env
DATABASE_URL="<your-mongodb-database-url>"

JWT_ACCESS_SECRET="<your-jwt-access-secret>"   # Use `openssl rand -base64 32` to generate

CLERK_PUBLISHABLE_KEY="<your-clerk-publishable-key>"
CLERK_SECRET_KEY="<your-clerk-secret-key>"

FRONTEND_BASE_URL="<your-frontend-base-url>"
SWAGGER_BASE_URL="<your-swagger-ui-base-url>"        # Optional, defaults to FRONTEND_BASE_URL
BATTLESHIP_BASE_URL="<your-battleship-frontend-url>" # Optional, include when serving the game separately

REDIS_USERNAME="<your-redis-username>"
REDIS_PASSWORD="<your-redis-password>"
REDIS_HOST="<your-redis-host>"
REDIS_PORT="<your-redis-port>"
```

#### Prisma Setup

```bash
npx prisma db push
```

#### Running the Project

```bash
npm run start:dev
```

### Frontend Setup

```bash
git clone https://github.com/gideonadeti/realtime-leaderboard-frontend.git
cd realtime-leaderboard-frontend
npm install
```

#### Environment Setup

Create a `.env` file with the following:

```env
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY="<your-clerk-publishable-key>"
CLERK_SECRET_KEY="<your-clerk-secret-key>"

NEXT_PUBLIC_API_BASE_URL="<your-api-base-url>"
```

#### Running the Project

```bash
npm run dev
```

Swagger API docs will be available at:
`http://localhost:3000/api/documentation`

Next.js app will be available at:
`http://localhost:3001`

## Live Deployment

Check out the live Swagger API docs on [Render](https://realtime-leaderboard-6qg2.onrender.com/api/documentation).

Check out the live Next.js app on [Vercel](https://realtime-leaderboard-frontend.vercel.app).

## Background

This project is inspired by the [roadmap.sh](https://roadmap.sh) backend developer roadmap:
[Real-time Leaderboard](https://roadmap.sh/projects/realtime-leaderboard-system).
