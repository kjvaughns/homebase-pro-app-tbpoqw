
# Account Switcher Fix - Implementation Summary

## Problem Identified

The account switcher was not working due to **401 Unauthorized errors** when calling the Supabase Edge Functions. The root cause was that the Authorization header was not being properly passed to the edge functions.

### Issues Found:

1. **Missing Authorization Header**: The `supabase.functions.invoke()` calls were not explicitly passing the Authorization header with the session token
2. **Session Not Verified**: The component wasn't checking if the session was available before making API calls
3. **Poor Error Handling**: Errors from the edge functions weren't being displayed to the user
4. **Insufficient Logging**: Not enough console logs to debug the issue

## Solution Implemented

### 1. Fixed AccountSwitcherDropdown Component

**File**: `components/AccountSwitcherDropdown.tsx`

**Changes**:
- Added explicit Authorization header to all edge function calls:
  ```typescript
  const { data: { session: currentSession } } = await supabase.auth.getSession();
  
  const { data, error } = await supabase.functions.invoke('create-homeowner-account', {
    headers: {
      Authorization: `Bearer ${currentSession.access_token}`,
    },
  });
  ```
- Added session verification before making API calls
- Improved error handling with user-friendly Alert messages
- Added comprehensive console logging for debugging
- Added loading states for better UX

### 2. Enhanced AuthContext

**File**: `contexts/AuthContext.tsx`

**Changes**:
- Added more detailed logging throughout the authentication flow
- Improved session management
- Better error handling in all auth methods
- More robust profile loading with retries

### 3. Edge Functions (Already Correct)

The edge functions `create-homeowner-account` and `set-user-role` were already correctly implemented:
- They properly extract the Authorization header
- They validate the user session
- They have proper error handling
- They return appropriate status codes

## How It Works Now

### Account Switching Flow:

1. **User clicks "Switch Account"** in the More tab
2. **Dropdown opens** showing available roles (Provider/Homeowner)
3. **User selects a role**:
   - If switching to Homeowner and no homeowner profile exists:
     - Calls `create-homeowner-account` edge function with auth token
     - Creates homeowner_profiles record
     - Creates person record if needed
   - Calls `set-user-role` edge function with auth token
   - Updates the profile role in the database
4. **Role is persisted** to AsyncStorage for offline access
5. **Profile is refreshed** from the database
6. **User is navigated** to the appropriate dashboard
7. **Success message** is shown

### Key Improvements:

- ✅ **Proper Authentication**: Authorization header is now explicitly passed
- ✅ **Error Handling**: Users see clear error messages if something fails
- ✅ **Logging**: Comprehensive console logs for debugging
- ✅ **Loading States**: Users see "Switching account..." while processing
- ✅ **Session Verification**: Checks for active session before API calls
- ✅ **User Feedback**: Success/error alerts inform the user of the outcome

## Testing Checklist

To verify the fix works:

1. ✅ Open the app and log in as a provider
2. ✅ Navigate to More tab
3. ✅ Click "Switch Account"
4. ✅ Select "Create Homeowner Account" or "Homeowner"
5. ✅ Verify the account switches successfully
6. ✅ Check console logs for detailed flow information
7. ✅ Switch back to Provider
8. ✅ Verify role persists after app restart

## Console Log Output

When switching accounts, you should see logs like:

```
AccountSwitcher: Checking homeowner profile for user: [user-id]
AccountSwitcher: Homeowner profile exists: false
=== ACCOUNT SWITCHER: Starting switch to homeowner ===
Current role: provider
Session user ID: [user-id]
Profile ID: [profile-id]
AccountSwitcher: Creating homeowner account...
AccountSwitcher: Session token available: true
AccountSwitcher: Homeowner account created: { success: true, id: [id] }
AccountSwitcher: Setting user role to: homeowner
AccountSwitcher: Role set successfully: { success: true, role: 'homeowner' }
AccountSwitcher: Role persisted to AsyncStorage
AccountSwitcher: Profile refreshed
AccountSwitcher: Navigating to dashboard...
=== ACCOUNT SWITCHER: Switch complete ===
```

## Edge Function Logs

The edge functions should now return 200 status codes instead of 401:

```
POST | 200 | /functions/v1/create-homeowner-account
POST | 200 | /functions/v1/set-user-role
```

## Database Schema

The following tables are used:

- **profiles**: Stores user role (provider/homeowner)
- **homeowner_profiles**: Links users to person records for homeowner role
- **people**: Global identity layer for contacts
- **user_person_links**: Links auth.users to people records

## RLS Policies

All tables have proper RLS policies:
- Users can only view/update their own records
- Homeowner profiles are protected by user_id checks

## Next Steps

If issues persist:

1. Check the Supabase Edge Function logs for detailed error messages
2. Verify the session is active: `await supabase.auth.getSession()`
3. Check console logs in the app for the full flow
4. Verify RLS policies allow the operations
5. Check that the Authorization header is being passed correctly

## Files Modified

1. `components/AccountSwitcherDropdown.tsx` - Fixed auth header passing
2. `contexts/AuthContext.tsx` - Enhanced logging and error handling

## Files Already Correct

1. Edge function: `create-homeowner-account`
2. Edge function: `set-user-role`
3. Database tables and RLS policies
