Healthcare App

Postoperative educational web app (future optional smartphone app).

Run API Locally

Start the API server:

- cd core-skeleton
- npm run dev

The API will run at:

http://localhost:3000
Database Setup

The app uses PostgreSQL running locally via Homebrew.

Check PostgreSQL status
- brew services list | grep postgres

Start PostgreSQL (if not running)
- brew services start postgresql@16

Run Prisma Migrations

Ensure PostgreSQL is running, then run migrations:

- npx prisma migrate dev

This will:

apply database migrations

update the schema

generate the Prisma client

API Endpoints (Current)
Clinics

Create or interact with clinics.

- POST /clinics
Users

Creates a patient user with a role and clinic association.

- POST /users
Pathways

Creates a postoperative pathway for a clinic.

- POST /pathways
Enrollments

Links a patient to a pathway within a clinic.

- POST /enrollments
Audit Logging

The system records audit events for:

clinic creation

pathway enrollment

Quick Local Testing Setup

When opening a new terminal session, run:

- cd core-skeleton && API="http://localhost:3000"

You can then test endpoints easily with curl:

- curl "$API/health"

Example:

- curl "$API/api/users"

End to end test

- cd core-skeleton
- npx prisma studio