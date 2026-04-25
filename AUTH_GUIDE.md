# Authentication & Role-Based Access Control

This application now includes a complete authentication system with role-based access control.

## Features

### 🔐 Authentication System

- **Sign Up**: Create new user accounts
- **Login**: Secure authentication
- **Session Management**: Persistent login state using localStorage
- **Protected Routes**: Automatic redirection for unauthenticated users

### 👥 User Roles

#### 🎓 Student Role (Default)

- Access to all learning resources:
  - Interactive Visualizer
  - Documentation
  - Quizzes
  - Achievements
  - Dashboard
- Track learning progress
- Take quizzes and earn badges

#### 👑 Admin Role

- **All Student privileges** plus:
- **Manage Documentation**: Edit and add documentation content
- **User Management**: View, edit, and delete users
- **Analytics Dashboard**: View platform statistics (coming soon)
- Change user roles
- Full content management capabilities

## Getting Started

### Default Admin Account

```
Email: admin@shamir.edu
Password: admin123
```

### Creating New Users

1. Click "Login" in the navigation
2. Select "Sign up"
3. Enter your details (email, password, name)
4. New users are assigned the "Student" role by default

### Admin Workflow

1. **Login as Admin** using the credentials above
2. Navigate to **Dashboard** to see admin panel
3. Access admin features:
   - **Manage Documentation**: `/admin/docs` - Edit content sections
   - **Manage Users**: `/admin/users` - View and manage all users
   - **Analytics**: `/admin/analytics` - View statistics (placeholder)

## File Structure

```
src/
├── lib/
│   └── auth.ts                    # Authentication utilities & functions
├── contexts/
│   └── AuthContext.tsx            # React context for auth state
├── app/
│   ├── login/
│   │   └── page.tsx               # Login/Signup page
│   ├── dashboard/
│   │   └── page.tsx               # User dashboard (role-based)
│   └── admin/
│       ├── docs/
│       │   └── page.tsx           # Documentation management
│       ├── users/
│       │   └── page.tsx           # User management
│       └── analytics/
│           └── page.tsx           # Analytics (coming soon)
└── components/
    └── Navigation.tsx             # Updated with auth-aware navigation
```

## Key Components

### Authentication Context (`AuthContext.tsx`)

Provides authentication state and functions throughout the app:

- `user`: Current logged-in user object
- `isAdmin`: Boolean indicating admin status
- `isLoading`: Loading state
- `signIn(email, password)`: Login function
- `signUp(email, password, name)`: Registration function
- `signOut()`: Logout function

### Protected Routes

Routes automatically redirect to login if user is not authenticated:

- `/dashboard`
- `/admin/*`

Admin-only routes redirect non-admin users to login:

- `/admin/docs`
- `/admin/users`
- `/admin/analytics`

## Usage Examples

### Using Auth in Components

```typescript
import { useAuth } from '@/contexts/AuthContext';

export default function MyComponent() {
  const { user, isAdmin, signOut } = useAuth();

  return (
    <div>
      {user && <p>Welcome, {user.name}!</p>}
      {isAdmin && <p>You have admin access</p>}
      <button onClick={signOut}>Logout</button>
    </div>
  );
}
```

### Protecting Routes

```typescript
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function ProtectedPage() {
  const { user, isAdmin, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/login');
    }
    if (!isLoading && user && !isAdmin) {
      router.push('/dashboard'); // Redirect if not admin
    }
  }, [user, isAdmin, isLoading, router]);

  if (isLoading || !user) return <div>Loading...</div>;

  return <div>Protected Content</div>;
}
```

## Admin Capabilities

### Documentation Management

- **Add new sections**: Click "+ Add" button
- **Edit content**: Select section and modify content
- **Delete sections**: Click delete button on any section
- **Markdown support**: Full markdown formatting in content
- **Auto-save**: Changes saved to localStorage

### User Management

- **View all users**: See complete user list with roles
- **Filter users**: Filter by role (All/Admin/Student)
- **Change roles**: Dropdown to switch between admin/student
- **Delete users**: Remove users from the system
- **User statistics**: View counts and join dates

## Security Notes

⚠️ **Important**: This is a demo/educational implementation:

- Passwords are stored in plain text in localStorage
- No backend authentication server
- Not suitable for production use
- For production, implement:
  - Server-side authentication
  - Password hashing (bcrypt, argon2)
  - JWT tokens or session cookies
  - Database storage
  - HTTPS connections
  - Rate limiting
  - CSRF protection

## Customization

### Adding New Roles

Edit `src/lib/auth.ts`:

```typescript
export type UserRole = "admin" | "student" | "teacher" | "moderator";
```

### Changing Default Admin

Edit `DEFAULT_ADMIN` in `src/lib/auth.ts`

### Adding Role-Based Features

```typescript
// In your component
if (isAdmin) {
  // Show admin features
}

// Or check specific user properties
if (user?.role === "teacher") {
  // Show teacher features
}
```

## Data Storage

All data is stored in browser localStorage:

- `shamir_users`: User account data
- `shamir_current_user`: Currently logged-in user
- `doc_sections`: Documentation content (admin-editable)

To reset all data, clear browser localStorage or open DevTools Console:

```javascript
localStorage.clear();
location.reload();
```

## Next Steps

To make this production-ready:

1. Set up a backend API (Node.js, Python Flask/Django, etc.)
2. Implement proper authentication (JWT, OAuth)
3. Use a real database (PostgreSQL, MongoDB, etc.)
4. Add password hashing and security measures
5. Implement email verification
6. Add password reset functionality
7. Add audit logging for admin actions
8. Implement rate limiting and brute-force protection
