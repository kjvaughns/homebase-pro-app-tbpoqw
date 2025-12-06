
# Test Profile Creation Guide

## Overview
The HomeBase app includes a comprehensive test profile generator that creates a fully-integrated demo account with sample data across all features.

## How to Access

### Method 1: Hidden Developer Mode (In-App)
1. Open the app and navigate to the **More** tab (Settings)
2. Tap the HomeBase logo at the top **7 times**
3. A "Developer Mode" alert will appear
4. A new "Developer Tools" section will appear with "Create Test Profile" button
5. Tap the button to create the test profile

### Method 2: Direct URL
Navigate directly to: `/admin/create-test-profile`

## What Gets Created

The test profile generator creates:

### 1. **Provider Account**
- Email: `test@homebase.demo`
- Password: `TestDemo2024!`
- Role: Provider
- Name: Test Provider
- Phone: +1-555-0100

### 2. **Organization**
- Business Name: HomeBase Test Services
- Description: Full-service home maintenance and repair company
- Service Categories: Plumbing, Electrical, HVAC, Handyman, Lawn Care
- Location: Austin, TX
- Service Radius: 50 miles
- Subscription Plan: Pro (Active)
- Verified & Published to Marketplace

### 3. **Marketplace Profile**
- Slug: `homebase-test-services`
- Published: Yes
- Hero Image: Professional service image
- Logo: Business logo
- Social Media: Instagram, Facebook, Twitter handles
- Business Hours: Mon-Fri 8am-6pm, Sat 9am-3pm
- Address: 123 Main Street, Austin, TX 78701
- Portfolio: 3 sample project photos

### 4. **Services (5 total)**
- **Plumbing Repair** - $150 fixed (120 min)
- **Electrical Repair** - $100-$300 range (90 min)
- **HVAC Maintenance** - $200 fixed (180 min)
- **General Handyman** - Quote-based (60 min)
- **Lawn Mowing** - $75 fixed (60 min)

### 5. **Clients (5 total)**
- John Smith - VIP, Recurring tags - $500 LTV
- Sarah Johnson - Commercial tag - $1,000 LTV
- Michael Brown - Active - $1,500 LTV
- Emily Davis - Lead - $2,000 LTV
- Robert Wilson - Lead - $2,500 LTV

Each client includes:
- Full contact information (email, phone)
- Home address in Austin, TX
- Initial contact notes

### 6. **Invoices (4 total)**
- **INV-2024-001** - Paid ($162.38) - Plumbing Repair
- **INV-2024-002** - Paid ($216.50) - HVAC Maintenance
- **INV-2024-003** - Open ($324.75) - Electrical Repair (Due in 15 days)
- **INV-2024-004** - Open ($81.19) - Lawn Mowing (Due in 7 days)

### 7. **Payments (2 total)**
- Payment for INV-2024-001 - $162.38 (Card)
- Payment for INV-2024-002 - $216.50 (Card)

### 8. **Payment Links (2 total)**
- Quick Payment - Service Call ($150)
- Emergency Repair Payment ($250)

### 9. **Pricing Rules (3 total)**
- Standard Labor Rate: $85/hour
- VIP Client Discount: 10% off
- Emergency Service Markup: 50% extra

### 10. **Bookings/Jobs (3 total)**
- **Upcoming**: Plumbing Repair (in 2 days at 10:00 AM)
- **Upcoming**: HVAC Maintenance (in 5 days at 2:00 PM)
- **Completed**: Lawn Mowing (3 days ago at 9:00 AM)

## Features Demonstrated

The test profile allows you to demo:

### Money Hub
- ✅ MTD Revenue calculation (from paid invoices)
- ✅ Outstanding invoices tracking
- ✅ Payment history
- ✅ Payment link generation
- ✅ Financial analytics

### CRM
- ✅ Client list with tags and status
- ✅ Client details and notes
- ✅ Lifetime value tracking
- ✅ Contact information management

### Schedule
- ✅ Upcoming bookings
- ✅ Completed jobs
- ✅ Job details and addresses

### Services
- ✅ Service catalog
- ✅ Different pricing types (fixed, range, quote)
- ✅ Service categories

### Business Profile
- ✅ Marketplace listing
- ✅ Public profile page at `/p/homebase-test-services`
- ✅ Portfolio gallery
- ✅ Business hours
- ✅ Contact information
- ✅ Social media links

### Invoicing
- ✅ Invoice creation and management
- ✅ Payment tracking
- ✅ Due date management
- ✅ Line items and tax calculation

## Login Instructions

After creating the test profile, use these credentials:

```
Email: test@homebase.demo
Password: TestDemo2024!
```

## Important Notes

1. **One-Time Creation**: The test profile can only be created once. If it already exists, you'll receive an error with the existing credentials.

2. **Data Integrity**: All data is fully integrated:
   - Invoices link to clients
   - Payments link to invoices
   - Bookings link to services and addresses
   - Everything connects to the organization

3. **Realistic Data**: All sample data uses realistic:
   - Names and contact information
   - Addresses in Austin, TX
   - Service pricing
   - Invoice amounts with tax
   - Dates (past, present, and future)

4. **Marketplace Ready**: The business profile is published and can be viewed at:
   - Internal: `/provider/business-profile/preview`
   - Public: `/p/homebase-test-services`

## Troubleshooting

### "Test profile already exists"
The profile has already been created. Use the credentials provided in the error message.

### "Failed to create test profile"
Check the console logs for detailed error information. Common issues:
- Network connectivity
- Supabase connection
- Edge function deployment

### Can't find the Developer Tools button
Make sure you tapped the logo exactly 7 times in the More/Settings tab.

## Technical Details

The test profile is created using a Supabase Edge Function (`create-test-profile`) that:
1. Creates an authenticated user account
2. Generates a profile record
3. Creates an organization with all settings
4. Populates all related tables with interconnected data
5. Ensures RLS policies are satisfied
6. Returns comprehensive success information

All data follows the same structure and relationships as production data, making it perfect for:
- Feature demonstrations
- User training
- Development testing
- UI/UX validation
- Integration testing
