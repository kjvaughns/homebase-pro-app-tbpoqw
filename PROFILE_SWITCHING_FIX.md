
# Profile Switching Fix - Complete Analysis and Solution

## Issues Identified

### 1. **Complex Alert Flow with Navigation Issues**
- The original `switchProfile` function had multiple nested alerts with navigation happening inside alert callbacks
- This caused timing issues where navigation would be called before state updates completed
- Alert callbacks don't always execute in the expected order, leading to inconsistent behavior

### 2. **Inconsistent Navigation Paths**
- Some navigation calls used trailing slashes: `router.replace('/(provider)/(tabs)/')`
- This can cause routing issues in Expo Router
- Fixed to use consistent paths without trailing slashes

### 3. **State Not Refreshing Properly**
- After updating the database, the local state wasn't being refreshed before navigation
- This meant the UI would show stale data or incorrect role information
- Added proper `loadUserData` calls after all database updates

### 4. **Missing Error Handling**
- Database errors weren't properly caught and handled
- Users could be left in an inconsistent state if an error occurred mid-switch
- Added comprehensive try-catch blocks with user-friendly error messages

### 5. **Race Conditions**
- Navigation was happening immediately after database updates without waiting for state to sync
- Added `setTimeout` delays (100ms) to ensure state updates complete before navigation

### 6. **No Loading State**
- Users could click the switch button multiple times while a switch was in progress
- Added `switching` state to disable the button during the switch operation

## Solutions Implemented

### 1. **Simplified Alert Flow**
```typescript
// Before: Navigation inside alert callback
Alert.alert('Title', 'Message', [{
  text: 'OK',
  onPress: () => {
    router.replace('/some/path'); // This could fail
  }
}]);

// After: Navigation after state update with delay
await loadUserData(session.user.id);
setTimeout(() => {
  router.replace('/some/path');
}, 100);
```

### 2. **Proper State Management**
```typescript
// Always refresh profile data after database updates
const { error } = await supabase
  .from('profiles')
  .update({ role: targetRole })
  .eq('id', profile.id);

if (error) throw error;

// Refresh local state
await loadUserData(session.user.id);

// Navigate after state is updated
setTimeout(() => {
  router.replace(targetPath);
}, 100);
```

### 3. **Better Error Handling**
```typescript
try {
  // Database operations
  const { error } = await supabase...
  if (error) throw error;
  
  // Success flow
} catch (error: any) {
  console.error('Error:', error);
  Alert.alert('Error', 'User-friendly message');
}
```

### 4. **Loading State in UI**
```typescript
const [switching, setSwitching] = useState(false);

const handleSwitchProfile = async () => {
  if (switching) return; // Prevent multiple clicks
  
  try {
    setSwitching(true);
    await switchProfile('provider');
  } finally {
    setSwitching(false);
  }
};

// In UI
<TouchableOpacity 
  onPress={handleSwitchProfile} 
  disabled={switching}
>
  <Text>{switching ? 'Switching...' : 'Switch Profile'}</Text>
</TouchableOpacity>
```

### 5. **Consistent Navigation**
All navigation now uses consistent paths:
- Provider: `router.replace('/(provider)/(tabs)')`
- Homeowner: `router.replace('/(homeowner)/(tabs)')`
- Onboarding: `router.replace('/(provider)/onboarding/business-basics')`

### 6. **Better User Experience**
- Clear loading states ("Switching..." text)
- Disabled buttons during operations
- User-friendly error messages
- Proper confirmation dialogs for creating new accounts

## Testing Checklist

- [x] Switch from Provider to Homeowner (with existing homeowner data)
- [x] Switch from Provider to Homeowner (without homeowner data - should prompt)
- [x] Switch from Homeowner to Provider (with existing provider data)
- [x] Switch from Homeowner to Provider (without provider data - should prompt)
- [x] Handle database errors gracefully
- [x] Prevent multiple simultaneous switches
- [x] Proper navigation after switch
- [x] State updates correctly after switch
- [x] UI reflects new role immediately

## Key Changes Made

### `contexts/AuthContext.tsx`
- Simplified `switchProfile` function logic
- Added proper error handling throughout
- Fixed navigation timing with setTimeout
- Improved state refresh logic
- Better handling of organization and home checks
- Used `maybeSingle()` instead of `single()` to avoid errors when no data exists

### `app/(provider)/(tabs)/settings.tsx`
- Added `switching` state
- Disabled button during switch operation
- Improved button text to show loading state
- Better error handling in switch handler

### `app/(homeowner)/(tabs)/settings.tsx`
- Added `switching` state
- Disabled button during switch operation
- Improved button text to show loading state
- Better error handling in switch handler

## How It Works Now

1. User clicks "Switch Profile" button
2. Button is disabled and shows "Switching..." text
3. `switchProfile` function checks current role and target role
4. If switching to a role without required data (org/home), shows alert to create
5. Updates database with new role
6. Refreshes local state with `loadUserData`
7. Waits 100ms for state to sync
8. Navigates to appropriate dashboard
9. Shows success message
10. Button is re-enabled

## Database Schema Notes

The profile switching relies on these tables:
- `profiles`: Stores user role (provider/homeowner)
- `organizations`: Required for provider role
- `homes`: Optional for homeowner role (can be added later)

RLS policies ensure users can only update their own profiles.
