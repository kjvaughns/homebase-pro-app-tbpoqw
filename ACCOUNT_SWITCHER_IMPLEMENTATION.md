
# Account Switcher Implementation

## Overview
This implementation provides a fully functional account switcher dropdown that allows users to seamlessly switch between Provider and Homeowner roles in the HomeBase app.

## Features Implemented

### 1. **Dropdown UI Component** (`components/AccountSwitcherDropdown.tsx`)
- Clean, glassy dropdown interface (not a full-screen modal)
- Shows current role with green checkmark
- Options:
  - **Provider** - Switch to provider account
  - **Homeowner** - Switch to homeowner account (if profile exists)
  - **Create Homeowner Account** - Creates homeowner profile if none exists
- Automatically checks for existing homeowner profile
- Smooth animations and blur background
- Closes on outside tap or cancel button

### 2. **Edge Functions**
Three Supabase Edge Functions handle the backend logic:

#### `create-homeowner-account`
- Creates a `homeowner_profiles` record linked to the user
- Automatically creates or links to a `person` record
- Handles duplicate checks
- Returns the new profile ID

#### `set-user-role`
- Updates the user's role in the `profiles` table
- Validates role input (must be 'provider' or 'homeowner')
- Returns success status

#### `get-user-role`
- Retrieves the current user's role from the database
- Returns 'provider' as default if no role found
- Used for role persistence checks

### 3. **Role Persistence**
- Role is stored in AsyncStorage (`user_role` key)
- Survives app restarts
- Synced with database on app launch
- Fallback mechanism if database query fails

### 4. **RoleGuard Component** (`components/RoleGuard.tsx`)
- Protects routes based on user role
- Automatically redirects users to correct dashboard:
  - Provider → `/(provider)/(tabs)`
  - Homeowner → `/(homeowner)/(tabs)`
- Prevents access to wrong role's routes
- Shows loading indicator during initialization

### 5. **Updated AuthContext**
- Enhanced `switchProfile()` function
- Integrated with AsyncStorage for persistence
- Handles homeowner account creation flow
- Manages navigation after role switch
- Syncs stored role with database on app launch

### 6. **Updated More Tabs**
Both Provider and Homeowner More tabs now include:
- Account switcher button that opens the dropdown
- Clean, consistent UI
- Proper integration with the dropdown component

## User Flow

### Switching to Homeowner (No Profile)
1. User taps "Switch Account" in More tab
2. Dropdown opens showing options
3. User taps "Create Homeowner Account"
4. Backend creates homeowner profile
5. Role is updated and persisted
6. User is navigated to homeowner dashboard
7. Success toast is shown

### Switching to Homeowner (Profile Exists)
1. User taps "Switch Account"
2. Dropdown shows "Homeowner" option
3. User taps "Homeowner"
4. Role is updated and persisted
5. User is navigated to homeowner dashboard
6. Success toast is shown

### Switching to Provider
1. User taps "Switch Account"
2. Dropdown shows "Provider" option
3. User taps "Provider"
4. Role is updated and persisted
5. User is navigated to provider dashboard
6. Success toast is shown

## Database Schema

### `homeowner_profiles` Table
```sql
CREATE TABLE homeowner_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users NOT NULL,
  person_id UUID REFERENCES people,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### RLS Policies
The table has Row Level Security enabled with appropriate policies to ensure users can only access their own homeowner profiles.

## Technical Details

### Role Storage
- **Primary**: Database (`profiles.role`)
- **Fallback**: AsyncStorage (`user_role`)
- **Sync**: On app launch and after role changes

### Navigation Flow
```
App Launch
  ↓
RoleGuard checks authentication
  ↓
If authenticated → Check role
  ↓
Navigate to appropriate dashboard
  - Provider → /(provider)/(tabs)
  - Homeowner → /(homeowner)/(tabs)
```

### Error Handling
- Network errors are caught and displayed to user
- Failed role switches show alert with retry option
- Loading states prevent duplicate requests
- Graceful fallbacks for missing data

## QA Checklist ✅

- [x] Tapping "Homeowner" instantly switches role and lands on homeowner dashboard
- [x] Tapping "Provider" returns to provider dashboard
- [x] If no homeowner profile, first click creates it and routes (no second step)
- [x] Role persists after killing app and reopening
- [x] Switcher is a dropdown (not full-screen modal)
- [x] No overlaps with bottom nav or FAB
- [x] Dropdown closes on outside tap
- [x] Active role shows green checkmark
- [x] Loading states prevent duplicate actions
- [x] Error messages are user-friendly

## Files Modified/Created

### Created
- `components/AccountSwitcherDropdown.tsx` - Dropdown UI component
- `components/RoleGuard.tsx` - Route protection component
- `ACCOUNT_SWITCHER_IMPLEMENTATION.md` - This documentation

### Modified
- `contexts/AuthContext.tsx` - Added role persistence and sync
- `app/_layout.tsx` - Added RoleGuard wrapper
- `app/(provider)/(tabs)/settings.tsx` - Integrated dropdown
- `app/(homeowner)/(tabs)/settings.tsx` - Integrated dropdown

### Edge Functions (Deployed)
- `create-homeowner-account` - Creates homeowner profiles
- `set-user-role` - Updates user role
- `get-user-role` - Retrieves current role

## Usage Example

```typescript
import { AccountSwitcherDropdown } from '@/components/AccountSwitcherDropdown';

function MoreScreen() {
  const [showSwitcher, setShowSwitcher] = useState(false);

  return (
    <>
      <AccountSwitcherDropdown
        visible={showSwitcher}
        onClose={() => setShowSwitcher(false)}
      />
      
      <TouchableOpacity onPress={() => setShowSwitcher(true)}>
        <Text>Switch Account</Text>
      </TouchableOpacity>
    </>
  );
}
```

## Future Enhancements

Potential improvements for future iterations:
- Add animation when switching roles
- Show recent role switches in dropdown
- Add role-specific onboarding flows
- Implement role-based feature flags
- Add analytics tracking for role switches
- Support for multiple organizations per user
