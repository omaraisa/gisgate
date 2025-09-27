# User Management System

A complete user registration and management system for the GIS Gate application, designed to handle migrated WordPress users and provide comprehensive user administration.

## Features

### 🔐 Authentication
- User registration with email verification
- Secure login with JWT tokens and session management
- Password hashing with bcrypt
- Account lockout after failed login attempts
- Password reset functionality

### 👥 User Management
- Role-based access control (Admin, Editor, Author, User)
- User profile management
- Account activation/deactivation
- User search and filtering
- Bulk user operations

### 🔄 WordPress Migration
- Seamless migration of existing WordPress users
- Preservation of user metadata
- Automatic email verification for migrated users
- Migration tracking and statistics

### 🛡️ Security
- JWT-based authentication
- Session management with expiration
- Password complexity requirements
- Account lockout protection
- Secure password reset tokens

## Database Schema

### User Model
```prisma
model User {
  id            String    @id @default(uuid())
  email         String    @unique
  username      String?   @unique
  password      String
  firstName     String?
  lastName      String?
  displayName   String?
  avatar        String?
  bio           String?
  website       String?

  // Authentication
  emailVerified Boolean   @default(false)
  emailVerificationToken String?   @unique
  emailVerificationExpires DateTime?
  passwordResetToken String?   @unique
  passwordResetExpires DateTime?

  // Status
  isActive      Boolean   @default(true)
  lastLogin     DateTime?
  loginAttempts Int       @default(0)
  lockUntil     DateTime?

  // Roles and permissions
  role          UserRole  @default(USER)

  // WordPress migration
  wordpressId   Int?      @unique
  wordpressMeta String?   // JSON string for WordPress user meta

  // Timestamps
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt

  // Relations
  sessions      UserSession[]
  articles      Article[] @relation("UserArticles")
}
```

### User Roles
- **ADMIN**: Full system access, user management
- **EDITOR**: Can edit all articles, moderate content
- **AUTHOR**: Can create and edit own articles
- **USER**: Basic user access, read-only

## API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout
- `POST /api/auth/verify-email` - Email verification
- `POST /api/auth/forgot-password` - Initiate password reset
- `POST /api/auth/reset-password` - Reset password

### User Profile
- `GET /api/user/profile` - Get user profile
- `PUT /api/user/profile` - Update user profile
- `PATCH /api/user/profile/password` - Change password

### Admin User Management
- `GET /api/admin/users` - List all users (paginated)
- `GET /api/admin/users/[id]` - Get user details
- `PUT /api/admin/users/[id]` - Update user
- `DELETE /api/admin/users/[id]` - Delete user

### WordPress Migration
- `POST /api/admin/migrate-wordpress-users` - Migrate WordPress users
- `GET /api/admin/migrate-wordpress-users` - Get migration statistics

## Usage

### User Registration
```javascript
const response = await fetch('/api/auth/register', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    email: 'user@example.com',
    password: 'securepassword',
    firstName: 'John',
    lastName: 'Doe',
    displayName: 'John Doe'
  })
});
```

### User Login
```javascript
const response = await fetch('/api/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    email: 'user@example.com',
    password: 'securepassword'
  })
});

const data = await response.json();
// Store tokens
localStorage.setItem('accessToken', data.tokens.accessToken);
localStorage.setItem('sessionToken', data.tokens.sessionToken);
```

### Admin User Management
```javascript
// List users with filters
const response = await fetch('/api/admin/users?role=USER&status=active&page=1', {
  headers: {
    'Authorization': `Bearer ${adminToken}`
  }
});

// Update user role
await fetch(`/api/admin/users/${userId}`, {
  method: 'PUT',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${adminToken}`
  },
  body: JSON.stringify({ role: 'EDITOR' })
});
```

## WordPress Migration

### Export WordPress Users
Run this SQL query on your WordPress database:

```sql
SELECT
  u.ID,
  u.user_login,
  u.user_email,
  u.user_pass,
  u.user_registered,
  u.display_name,
  umfn.meta_value as first_name,
  umln.meta_value as last_name,
  umurl.meta_value as user_url,
  umdesc.meta_value as description
FROM wp_users u
LEFT JOIN wp_usermeta umfn ON u.ID = umfn.user_id AND umfn.meta_key = 'first_name'
LEFT JOIN wp_usermeta umln ON u.ID = umln.user_id AND umln.meta_key = 'last_name'
LEFT JOIN wp_usermeta umurl ON u.ID = umurl.user_id AND umurl.meta_key = 'user_url'
LEFT JOIN wp_usermeta umdesc ON u.ID = umdesc.user_id AND umdesc.meta_key = 'description'
```

Export the results as JSON and save to a file (e.g., `wordpress-users.json`).

### Run Migration
```bash
# Using the migration script
node scripts/migrate-wordpress-users.ts wordpress-users.json

# Or via API (for admins)
curl -X POST /api/admin/migrate-wordpress-users \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d @wordpress-users.json
```

## Frontend Components

### Authentication Page
- `/auth` - Combined login/registration page
- Handles form validation and API calls
- Stores tokens in localStorage
- Redirects based on user role

### Admin User Management
- `/admin/users` - User management dashboard
- Search and filter users
- Update user roles and status
- Delete users with confirmation

## Security Considerations

1. **Password Security**
   - Minimum 8 characters required
   - Hashed with bcrypt (12 rounds)
   - Password reset tokens expire in 1 hour

2. **Session Management**
   - JWT tokens expire in 7 days
   - Session tokens for additional security
   - Automatic cleanup of expired sessions

3. **Account Protection**
   - Account lockout after 5 failed login attempts
   - 2-hour lockout duration
   - Email verification required for new accounts

4. **API Security**
   - Admin routes require authentication and admin role
   - Input validation with Zod schemas
   - CORS protection
   - Rate limiting recommended

## Environment Variables

```env
# Database
DATABASE_URL="postgresql://username:password@localhost:5432/gisgate"

# JWT
JWT_SECRET="your-super-secret-jwt-key"
JWT_EXPIRES_IN="7d"

# Email (for future email functionality)
SMTP_HOST="smtp.gmail.com"
SMTP_PORT="587"
SMTP_USER="your-email@gmail.com"
SMTP_PASS="your-app-password"
```

## Future Enhancements

- Email notifications for registration and password reset
- Two-factor authentication (2FA)
- Social login integration
- User activity logging
- Advanced permission system
- User groups/teams
- Profile avatars with upload
- User statistics and analytics

## Testing

Run the user management tests:

```bash
npm test -- --testPathPattern=user
```

## Contributing

1. Follow the existing code patterns
2. Add proper TypeScript types
3. Include input validation
4. Add error handling
5. Update documentation
6. Test thoroughly

## License

This user management system is part of the GIS Gate application.