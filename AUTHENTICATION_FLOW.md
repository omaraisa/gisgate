# Authentication Flow Documentation

## Complete Journey from Fresh Incognito to Logged In

### 1. Fresh Visit to /auth (Incognito Mode)

#### What Happens:
```
User Opens /auth
    ↓
middleware.ts runs (Server-side)
    ↓
Checks cookie: auth-token (NOT FOUND)
    ↓
Allows access to /auth page
    ↓
/auth page.tsx loads (Client-side)
    ↓
useAuthStore initializes:
    - sessionToken: null
    - isAuthenticated: false
    - user: null
    ↓
useEffect runs → checkAuth()
    ↓
No token found → setIsCheckingAuth(false)
    ↓
Shows login form
```

### 2. User Enters Credentials and Clicks "تسجيل الدخول"

#### What Happens:
```
Form submits
    ↓
POST /api/auth/login
    ↓
Server validates credentials
    ↓
Server generates:
    - JWT accessToken
    - sessionToken (for database)
    ↓
Server sets HTTP-only cookie:
    - name: auth-token
    - value: accessToken
    - maxAge: 7 days
    ↓
Server returns JSON:
    {
      user: {...},
      tokens: {
        accessToken: "...",
        sessionToken: "..."
      }
    }
    ↓
Client receives response
    ↓
auth-store.login() called with:
    - token: accessToken
    - user: userData
    ↓
Store updates:
    - Sets user data
    - Sets sessionToken (accessToken)
    - Sets isAuthenticated: true
    - Stores in localStorage
    - Stores in cookie (client-side cookie)
    ↓
window.location.href = "/" (HARD REDIRECT)
    ↓
Browser navigates to "/"
```

### 3. Navigation to "/" After Login

#### What Happens:
```
Browser requests "/"
    ↓
middleware.ts runs (Server-side)
    ↓
Checks cookie: auth-token (FOUND)
    ↓
Verifies JWT using JWTUtils.verifyToken()
    ↓
Token is valid → isAuthenticated = true
    ↓
Route is public → allows access
    ↓
Page loads
    ↓
Header component mounts
    ↓
useAuthStore reads state:
    - user: {...}
    - isAuthenticated: true
    ↓
Header shows:
    - User avatar
    - User name
    - Logout button
```

### 4. User Manually Navigates to Any Page

#### What Happens:
```
User clicks on "مقالات" (/articles)
    ↓
Next.js client-side routing
    ↓
NO middleware runs (client-side navigation)
    ↓
/articles page loads
    ↓
Header component already has:
    - user data (from zustand store)
    - isAuthenticated: true
    ↓
Header displays correctly
```

## Current Issues and Fixes

### Issue 1: After login, user stays on /auth page
**Root Cause:** `router.push()` doesn't trigger middleware on client-side navigation
**Fix:** Use `window.location.href` for hard redirect after login

### Issue 2: Header shows "تسجيل الدخول" after navigating
**Root Cause:** Auth store state not properly initialized or persisted
**Fix:** 
- Use zustand persist middleware
- Store token in both localStorage and cookies
- Ensure store rehydration completes before rendering

### Issue 3: Middleware doesn't detect authentication
**Root Cause:** Middleware can't use Node.js `crypto` module in Edge Runtime
**Fix:** 
- Use `jose` library for JWT verification (Web Crypto API compatible)
- Ensure cookie is set correctly by server

## Key Components

### 1. Auth Store (`lib/stores/auth-store.ts`)
- **Purpose:** Client-side state management
- **Storage:** localStorage + cookies
- **State:** user, sessionToken, isAuthenticated
- **Actions:** login, logout, checkAuth, refreshUser

### 2. Middleware (`middleware.ts`)
- **Purpose:** Server-side route protection
- **Runs On:** Every navigation (server-side)
- **Uses:** HTTP-only cookie (auth-token)
- **Verification:** JWTUtils.verifyToken()

### 3. Auth Page (`app/auth/page.tsx`)
- **Purpose:** Login/Register form
- **Redirects:** After successful auth
- **Uses:** Auth store for state management

### 4. Header (`app/components/Header.tsx`)
- **Purpose:** Show user info/login button
- **Reads From:** Auth store
- **Updates On:** Store state changes

### 5. Login API (`app/api/auth/login/route.ts`)
- **Purpose:** Authenticate user
- **Returns:** JWT token + user data
- **Sets:** HTTP-only cookie

## Token Flow

```
Login API
    ↓
Generates JWT: eyJhbGc...
    ↓
    ├── Sets HTTP-only cookie: auth-token=JWT (for middleware)
    └── Returns in JSON: accessToken=JWT (for client store)
    ↓
Client Store
    ↓
    ├── localStorage: sessionToken=JWT (persistence)
    └── document.cookie: auth-token=JWT (backup)
    ↓
Middleware
    ↓
Reads: request.cookies.get('auth-token')
    ↓
Verifies using JWTUtils (jose library)
```

## Critical Points

1. **Use window.location.href for post-login redirect** - Ensures middleware runs
2. **Store token in multiple places** - Redundancy for reliability
3. **HTTP-only cookie for middleware** - Secure and accessible server-side
4. **localStorage for persistence** - Survives page reloads
5. **Zustand persist** - Automatic rehydration
6. **Jose library for JWT** - Edge Runtime compatible

## Testing Checklist

- [ ] Fresh incognito: Can access /auth
- [ ] After login: Redirected to /
- [ ] Header shows user info immediately
- [ ] Refresh page: Still logged in
- [ ] Navigate to /articles: Header still shows user
- [ ] Try to access /auth while logged in: Redirected to /
- [ ] Logout: Returns to /auth, header shows login button
