
# HomeBase Pro - Provider Features Implementation Guide

## 🎯 Overview

This implementation adds comprehensive provider management features to HomeBase Pro, including:
- Schedule management with multiple views
- Client relationship management (CRM)
- Service catalog management
- Financial management (invoices, payments)
- Route optimization
- Google Calendar integration

## 📁 File Structure

```
app/
├── (provider)/
│   ├── (tabs)/
│   │   ├── schedule.tsx          # Main schedule screen
│   │   ├── clients.tsx            # Client list screen
│   │   └── index.tsx              # Provider dashboard
│   ├── schedule/
│   │   ├── create-job.tsx         # Create new booking
│   │   ├── block-time.tsx         # Block calendar time
│   │   └── [id].tsx               # Booking detail screen
│   ├── clients/
│   │   ├── add.tsx                # Add new client
│   │   └── [id].tsx               # Client detail screen
│   ├── services/
│   │   └── index.tsx              # Services list
│   └── money/
│       ├── index.tsx              # Money dashboard (tabs)
│       ├── create-invoice.tsx     # Create invoice
│       └── payment-link.tsx       # Generate payment link
├── components/
│   ├── EmptyState.tsx             # Reusable empty state
│   └── Toast.tsx                  # Toast notifications
└── contexts/
    └── ToastContext.tsx           # Global toast management
```

## 🗄️ Database Schema

### New Tables

#### calendar_connections
Stores Google Calendar integration settings:
```sql
- id: UUID (primary key)
- organization_id: UUID (foreign key)
- provider: TEXT ('google', 'outlook', etc.)
- access_token: TEXT
- refresh_token: TEXT
- token_expiry: TIMESTAMPTZ
- calendar_id: TEXT
- sync_enabled: BOOLEAN
- last_sync_at: TIMESTAMPTZ
```

### Modified Tables

#### bookings
Added columns:
- `route_order`: INTEGER - Order in optimized route
- `end_time`: TIME - End time of booking
- `status`: Added 'blocked' option for time blocking

#### payments
Added column:
- `payment_link_url`: TEXT - Stripe payment link URL

## 🔧 Edge Functions

### stripe_payment_link
Creates Stripe Payment Links for quick payments.

**Endpoint**: `/functions/v1/stripe_payment_link`

**Request**:
```json
{
  "amount": 100.00,
  "description": "Service payment"
}
```

**Response**:
```json
{
  "success": true,
  "payment_link_url": "https://buy.stripe.com/...",
  "payment_link_id": "plink_..."
}
```

### calendar_sync
Syncs bookings with Google Calendar.

**Endpoint**: `/functions/v1/calendar_sync`

**Request**:
```json
{
  "organization_id": "uuid",
  "action": "pull" | "push"
}
```

**Response**:
```json
{
  "success": true,
  "events_synced": 5
}
```

## 🚀 Usage Guide

### Creating a Booking

1. Navigate to Schedule tab
2. Tap the "+" button
3. Select client and service
4. Set date, start time, and end time
5. Add address, notes, and price
6. Tap "Create Job"

### Blocking Time

1. Navigate to Schedule tab
2. Tap "Block Time" button
3. Select date and time range
4. Add optional reason
5. Tap "Block Time"

### Managing Bookings

1. Tap on any booking to view details
2. Update status: Confirm → Start → Complete
3. Add photos to document work
4. Cancel if needed

### Adding Clients

1. Navigate to Clients tab
2. Tap the "+" button
3. Enter client information
4. Tap "Add Client"

### Creating Invoices

1. Navigate to Money → Invoices
2. Tap "Create Invoice"
3. Select client
4. Add line items
5. Set tax and due date
6. Tap "Create Invoice"

### Generating Payment Links

1. Navigate to Money
2. Tap "Payment Link"
3. Enter amount and description
4. Tap "Generate Payment Link"
5. Copy and share the link

## 🎨 UI Components

### EmptyState
Reusable component for empty states:
```tsx
<EmptyState
  ios_icon="calendar"
  android_icon="event"
  title="No Jobs Scheduled"
  message="Create your first job to get started"
  actionLabel="Create Job"
  onAction={() => router.push('/create-job')}
/>
```

### Toast Notifications
Global toast system for feedback:
```tsx
const { showToast } = useToast();

// Success
showToast('Client added successfully', 'success');

// Error
showToast('Failed to save', 'error');

// Warning
showToast('Please fill all fields', 'warning');

// Info
showToast('Syncing calendar...', 'info');
```

## 🔐 Security

All tables implement Row Level Security (RLS):
- Users can only access their own organization's data
- Policies enforce organization_id matching
- Service role key used for edge functions

## 📱 Navigation Flow

```
Provider Dashboard
├── Schedule
│   ├── Create Job
│   ├── Block Time
│   └── Booking Detail
│       ├── Update Status
│       ├── Add Photos
│       └── Cancel
├── Clients
│   ├── Add Client
│   └── Client Detail
│       ├── Overview
│       ├── Bookings
│       ├── Invoices
│       └── Files
├── Services
│   ├── Add Service
│   └── Edit Service
└── Money
    ├── Overview
    ├── Invoices
    │   └── Create Invoice
    ├── Payments
    │   ├── Payment Link
    │   └── Record Payment
    └── Refunds
```

## 🧪 Testing Checklist

- [ ] Create a booking
- [ ] Block time on calendar
- [ ] View booking details
- [ ] Update booking status
- [ ] Add photos to booking
- [ ] Cancel booking
- [ ] Add a client
- [ ] View client details
- [ ] Create an invoice
- [ ] Generate payment link
- [ ] Copy payment link
- [ ] View payment history
- [ ] All navigation works
- [ ] Toasts appear correctly
- [ ] Back buttons work
- [ ] Loading states show
- [ ] Error handling works

## 🐛 Known Limitations

1. **Calendar Views**: Day/Week/Month views need calendar library integration
2. **Drag-and-Drop**: Not yet implemented for rescheduling
3. **Route Optimization**: Algorithm needs implementation
4. **Google Calendar OAuth**: Full OAuth flow not complete
5. **CSV Import**: Client import feature not built
6. **AI Features**: Service generation and insights need API integration

## 🔄 Next Steps

### Immediate (Week 1)
1. Implement calendar library for Day/Week/Month views
2. Add drag-and-drop for booking management
3. Complete invoice detail screen
4. Add record manual payment screen

### Short-term (Week 2-3)
1. Implement route optimization algorithm
2. Complete Google Calendar OAuth flow
3. Add CSV import for clients
4. Build service add/edit screens

### Medium-term (Month 1-2)
1. Add AI service generation
2. Implement client insights
3. Add team management
4. Build reports and analytics

## 📚 Resources

- [Supabase Documentation](https://supabase.com/docs)
- [Stripe API Reference](https://stripe.com/docs/api)
- [Google Calendar API](https://developers.google.com/calendar)
- [React Native Calendars](https://github.com/wix/react-native-calendars)
- [React Native Gesture Handler](https://docs.swmansion.com/react-native-gesture-handler/)

## 💡 Tips

1. **Always use ToastContext** for user feedback
2. **Check organization_id** in all queries
3. **Handle loading states** for better UX
4. **Implement error boundaries** for crash prevention
5. **Test on both iOS and Android**
6. **Use EmptyState** for empty data scenarios
7. **Follow RLS policies** for security

## 🤝 Contributing

When adding new features:
1. Create database migrations first
2. Implement RLS policies
3. Build UI components
4. Add navigation
5. Implement edge functions if needed
6. Add toast notifications
7. Test thoroughly
8. Update documentation

## 📞 Support

For issues or questions:
1. Check IMPLEMENTATION_SUMMARY.md
2. Review existing code patterns
3. Test in development first
4. Document any bugs found

---

**Version**: 1.0.0  
**Last Updated**: January 2025  
**Status**: In Development
