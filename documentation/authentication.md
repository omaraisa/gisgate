# Authentication System Documentation

This document outlines the design, setup, and usage of the authentication system for the gis-gate.com Next.js project.

## 1. Overview

The authentication system is built using `NextAuth.js`, a flexible and powerful authentication library for Next.js. It provides a secure and scalable solution for user management, supporting both traditional email/password credentials and OAuth providers.

## 2. Core Technologies

- **Next.js:** The core framework for the application.
- **NextAuth.js:** Handles all authentication logic, including session management, providers, and security.
- **Prisma:** The ORM used to interact with the database, providing a type-safe API for data access.
- **SQLite:** The database used for local development. The schema is designed to be portable to PostgreSQL for production.
- **bcryptjs:** Used for hashing and comparing passwords securely.

## 3. Database Schema

The `prisma/schema.prisma` file has been updated to include the necessary models for `NextAuth.js`:

- `User`: Stores user information, including name, email, password (hashed), and role.
- `Account`: Stores information about OAuth accounts linked to a user.
- `Session`: Manages user sessions.
- `VerificationToken`: Used for email verification and password reset flows.

A `Role` enum has been added to the `User` model to support role-based access control:
- `LEARNER`: Default role for new users. Can access public content and their own profile.
- `EDITOR`: Can create, edit, and manage articles.
- `ADMIN`: Has full access to the system, including user management and site settings.

## 4. Authentication Flow

### 4.1. Registration

- Users can register with their name, email, and password.
- A new API route at `/api/register` handles the registration process.
- The user's password is securely hashed using `bcryptjs` before being stored in the database.
- New users are assigned the `LEARNER` role by default.

### 4.2. Login

- Users can log in using their email and password (Credentials provider) or with their Google account (OAuth provider).
- The NextAuth.js configuration at `app/api/auth/[...nextauth]/route.ts` handles the login logic.
- For credentials-based login, the provided password is compared against the stored hash using `bcryptjs`.

### 4.3. Session Management

- `NextAuth.js` manages sessions using JWTs (JSON Web Tokens).
- The session and JWT callbacks are configured to include the user's ID and role in the session object, making them accessible on the client and server.

## 5. Route Protection

- Middleware (`middleware.ts`) is used to protect routes based on authentication status and user roles.
- The `/profile` route is protected, requiring the user to be authenticated.
- The `/admin` routes are protected, requiring the user to be authenticated and have the `ADMIN` role.

## 6. Frontend Implementation

- **Pages:**
  - `/register`: A page for new users to sign up.
  - `/login`: A page for users to sign in.
  - `/profile`: A protected page that displays the current user's information.
- **Components:**
  - `app/components/Providers.tsx`: A client-side component that wraps the application with `SessionProvider` from `next-auth/react`.
  - `app/components/AuthButton.tsx`: A component that displays "Login" and "Register" links for unauthenticated users, and the user's name and a "Sign Out" button for authenticated users.
- **Layout:**
  - The main layout (`app/layout.tsx`) is updated to include the `Providers` component and the `AuthButton`.

## 7. Environment Variables

The following environment variables need to be set in a `.env` file:

- `DATABASE_URL`: The connection string for the database (e.g., `file:./prisma/dev.db`).
- `AUTH_SECRET`: A secret key used to sign JWTs.
- `GOOGLE_CLIENT_ID`: The client ID for the Google OAuth provider.
- `GOOGLE_CLIENT_SECRET`: The client secret for the Google OAuth provider.

## 8. Future Enhancements

- Email verification for new user registrations.
- Password reset functionality.
- Adding more OAuth providers (e.g., GitHub).
- Two-factor authentication (2FA).