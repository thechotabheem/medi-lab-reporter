
# Restricted 5-Account System with Role-Based Access

## Overview

The app will be locked to exactly **5 accounts**: 1 Admin + 4 Staff. Public sign-up will be removed entirely. Only the admin can create staff accounts via a new admin panel. Staff get full CRUD access to patients and reports but cannot access settings, templates, or danger zone features.

## What Changes

### 1. Remove Public Sign-Up from Auth Page
- The Auth page (`src/pages/Auth.tsx`) becomes **login-only** -- no sign-up form, no toggle
- Clean, simple login screen for all 5 users

### 2. Add Role Awareness to Auth Context
- Update `src/contexts/AuthContext.tsx` to fetch the logged-in user's role from the `user_roles` table
- Expose `role` ("admin" or "lab_technician") and `isAdmin` boolean to all components

### 3. Create Admin Account Management Page
- New page `src/pages/AdminPanel.tsx` -- accessible only to admins
- Shows all 5 accounts in a table (name, email, role, status)
- Admin can **create staff accounts** (up to 4) via a backend function
- Admin can **reset passwords** for staff accounts
- Enforces the 5-account hard limit

### 4. Create Backend Function for Account Management
- New edge function `manage-staff` that uses the service role key to:
  - Create new user accounts (with email + password)
  - Reset passwords for existing staff
  - Delete staff accounts
- Only callable by the admin (validates caller's role server-side)

### 5. Guard Admin-Only Routes
- These pages become admin-only:
  - `/settings/clinic` (Clinic Settings)
  - `/settings/templates` (Template Editor)
  - `/admin` (new Admin Panel)
  - Reset Data dialog (Danger Zone in Settings)
- Staff see a simplified Settings page without these options
- Routes redirect non-admin users to dashboard

### 6. Update Settings Page
- Hide "Clinic Settings", "Report Templates", and "Danger Zone" cards for staff users
- Add "Account Management" card for admin only
- Staff still see: Notifications, Documentation, Account (sign out)

### 7. Update Navigation
- Add "Admin" tab to bottom nav for admin users only (replaces or adds to existing nav)

---

## Technical Details

### Files to Create
| File | Purpose |
|------|---------|
| `src/pages/AdminPanel.tsx` | Admin account management UI |
| `supabase/functions/manage-staff/index.ts` | Backend function for creating/managing staff accounts |

### Files to Modify
| File | Changes |
|------|---------|
| `src/pages/Auth.tsx` | Remove sign-up form, login-only |
| `src/contexts/AuthContext.tsx` | Add `role`, `isAdmin` fields by querying `user_roles` |
| `src/pages/Settings.tsx` | Conditionally hide admin-only cards based on role |
| `src/components/AnimatedRoutes.tsx` | Add `/admin` route, guard admin-only routes |
| `src/components/navigation/MobileBottomNav.tsx` | Show admin nav item for admins |
| `src/pages/Dashboard.tsx` | Show admin action card for admin users |

### Edge Function: `manage-staff`
- **POST /manage-staff** with actions: `create`, `reset-password`, `delete`
- Validates that the calling user has the `admin` role using the `has_role` function
- Uses `SUPABASE_SERVICE_ROLE_KEY` to manage auth users
- Automatically assigns `lab_technician` role to new staff and creates their profile
- Enforces max 5 total accounts

### Role Check Flow
```
User logs in -> AuthContext fetches role from user_roles table -> 
isAdmin = (role === 'admin') -> UI conditionally renders admin features
```

### Security
- Role checks happen both client-side (for UI) and server-side (in edge function)
- The edge function verifies the caller's JWT and checks their role in the database before performing any action
- Staff cannot escalate privileges since role management only happens through the edge function with admin validation
