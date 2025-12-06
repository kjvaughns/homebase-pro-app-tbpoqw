
# HomeBase CRM Architecture - Provider-Client System

## Overview

HomeBase CRM has been upgraded with a complete provider-client architecture aligned with modern home service software (Jobber, Housecall Pro, ServiceTitan). This document outlines the new normalized schema, edge functions, and workflows.

## Core Concepts

### Global Client Identity Layer

The system uses a **global identity layer** for people that is shared across all organizations. This allows:

- **Deduplication**: One person record across multiple service providers
- **Data Consistency**: Shared contact information (name, email, phone)
- **Privacy**: Organization-specific data (notes, tags, pricing) remains private

### Organization-Specific CRM Profiles

Each organization has its own `org_clients` records that link to the global `people` table. This provides:

- **Isolated Data**: Notes, tags, LTV, and custom fields are organization-specific
- **Flexible Status**: Each org can mark a person as lead, active, or inactive independently
- **Custom Settings**: Pricing tiers, tax rates, and custom fields per organization

## Database Schema

### People & Contact Information

```sql
-- Global identity layer
people(
  id uuid,
  first_name text,
  last_name text,
  primary_email text,
  primary_phone_e164 text,
  avatar_url text,
  created_at timestamptz
)

-- Multiple emails per person
person_emails(
  id uuid,
  person_id uuid → people,
  email text,
  is_primary bool
)

-- Multiple phones per person
person_phones(
  id uuid,
  person_id uuid → people,
  phone_e164 text,
  is_primary bool
)

-- Multiple addresses per person
addresses(
  id uuid,
  person_id uuid → people,
  label text,
  address1 text,
  address2 text,
  city text,
  state text,
  postal text,
  country text,
  lat numeric,
  lng numeric
)
```

### Organization-Specific Client Data

```sql
-- Organization-specific client profiles
org_clients(
  id uuid,
  organization_id uuid → organizations,
  person_id uuid → people,
  status enum('lead', 'active', 'inactive'),
  tags text[],
  ltv_cents int,
  notes jsonb,
  default_address_id uuid → addresses,
  created_at timestamptz
)

-- Custom settings per org-client
org_client_settings(
  id uuid,
  org_client_id uuid → org_clients,
  pricing_tier text,
  custom_fields jsonb,
  tax_rate numeric
)

-- Consent management
consents(
  id uuid,
  person_id uuid → people,
  email_opt_in bool,
  sms_opt_in bool,
  updated_at timestamptz
)
```

### Jobs, Invoices, Payments

```sql
-- Jobs (replaces bookings for provider workflow)
jobs(
  id uuid,
  organization_id uuid → organizations,
  org_client_id uuid → org_clients,
  service_id uuid → services,
  start_at timestamptz,
  end_at timestamptz,
  address_id uuid → addresses,
  status enum('scheduled', 'in_progress', 'completed', 'canceled', 'blocked'),
  price_cents int,
  notes text
)

-- Invoices
invoices(
  id uuid,
  organization_id uuid → organizations,
  org_client_id uuid → org_clients,
  total_cents int,
  status enum('draft', 'open', 'paid', 'void'),
  due_date date,
  notes text
)

-- Payments
payments(
  id uuid,
  invoice_id uuid → invoices,
  amount_cents int,
  status enum('pending', 'succeeded', 'refunded'),
  captured_at timestamptz
)
```

### Campaigns & Reminders

```sql
-- Marketing campaigns
campaigns(
  id uuid,
  organization_id uuid → organizations,
  channel enum('email', 'sms'),
  name text,
  segment jsonb,
  template jsonb,
  scheduled_at timestamptz
)

-- Campaign sends
campaign_sends(
  id uuid,
  campaign_id uuid → campaigns,
  person_id uuid → people,
  status enum('queued', 'sent', 'failed'),
  error text
)

-- Automated reminders
reminders(
  id uuid,
  organization_id uuid → organizations,
  org_client_id uuid → org_clients,
  type enum('job_upcoming', 'invoice_due'),
  send_at timestamptz,
  payload jsonb,
  sent_at timestamptz
)
```

## Row Level Security (RLS)

### Global Data (Readable by All)

- `people`: Readable by all authenticated users, updatable only via edge functions
- `person_emails`: Readable by all authenticated users
- `person_phones`: Readable by all authenticated users
- `addresses`: Readable by all authenticated users
- `consents`: Readable by all authenticated users

### Organization-Specific Data (Limited to Same Org)

All of the following tables have RLS policies that limit access to users in the same organization:

- `org_clients`
- `org_client_settings`
- `jobs`
- `invoices`
- `payments`
- `campaigns`
- `campaign_sends`
- `reminders`

**Policy Example:**
```sql
CREATE POLICY "Users can view org_clients in their organization"
  ON org_clients FOR SELECT
  TO authenticated
  USING (
    organization_id IN (
      SELECT id FROM organizations WHERE owner_id IN (
        SELECT id FROM profiles WHERE user_id = auth.uid()
      )
    )
  );
```

## Edge Functions

### 1. upsert_person

**Purpose**: Create or find a person record by email or phone.

**Endpoint**: `/functions/v1/upsert-person`

**Request:**
```typescript
{
  email?: string;
  phone?: string;
  first_name?: string;
  last_name?: string;
}
```

**Response:**
```typescript
{
  person_id: string;
  is_new: boolean;
}
```

**Logic:**
1. Normalize email (lowercase) and phone (E.164 format)
2. Check if person exists by email or phone
3. If exists, return existing person_id
4. If not, create new person + email/phone records + consent record

### 2. propagate_contact_update

**Purpose**: Update shared contact fields across all organizations.

**Endpoint**: `/functions/v1/propagate-contact-update`

**Request:**
```typescript
{
  person_id: string;
  first_name?: string;
  last_name?: string;
  email?: string;
  phone?: string;
}
```

**Response:**
```typescript
{
  success: boolean;
  person_id: string;
}
```

**Logic:**
1. Update person record with new shared fields
2. Update or create person_emails/person_phones records
3. Set new email/phone as primary
4. All org_clients automatically get updated data through the join

### 3. create_job_with_optional_new_client

**Purpose**: Create a job with either an existing or new client.

**Endpoint**: `/functions/v1/create-job-with-client`

**Request:**
```typescript
{
  organization_id: string;
  // For existing client
  org_client_id?: string;
  // For new client
  client?: {
    first_name: string;
    last_name?: string;
    email?: string;
    phone?: string;
    address?: {
      label?: string;
      address1: string;
      address2?: string;
      city: string;
      state: string;
      postal: string;
      country?: string;
    };
  };
  // Job fields
  service_id?: string;
  start_at: string;
  end_at?: string;
  price_cents?: number;
  notes?: string;
}
```

**Response:**
```typescript
{
  success: boolean;
  job: Job;
}
```

**Logic:**
1. If new client: call upsert_person → create address → create org_client
2. If existing client: get default address
3. Create job with org_client_id and address_id
4. Create automatic reminders (24h and 2h before job)

### 4. reminder_scheduler

**Purpose**: Process and send automated reminders.

**Endpoint**: `/functions/v1/reminder-scheduler`

**Schedule**: Every 15 minutes (via cron job)

**Logic:**
1. Fetch all unsent reminders due in next 15 minutes
2. Send notifications for each reminder
3. Mark reminders as sent
4. Create new reminders for upcoming jobs (24h and 2h before)
5. Create new reminders for invoice due dates (2 days before and on due date)

**Reminder Types:**
- `job_upcoming`: Sent 24h and 2h before job start_at
- `invoice_due`: Sent 2 days before and on due_date if unpaid

## RPC Functions

### 1. client_timeline

**Purpose**: Get a unified timeline of all client activity.

**Usage:**
```typescript
const { data } = await supabase.rpc('client_timeline', {
  p_org_client_id: 'uuid'
});
```

**Returns:**
```typescript
Array<{
  id: string;
  type: 'job' | 'invoice' | 'payment' | 'note';
  created_at: string;
  data: {
    // Type-specific fields
  };
}>
```

### 2. client_stats

**Purpose**: Get aggregate statistics for all clients in an organization.

**Usage:**
```typescript
const { data } = await supabase.rpc('client_stats', {
  p_org_id: 'uuid'
});
```

**Returns:**
```typescript
{
  total_clients: number;
  active_clients: number;
  lead_clients: number;
  inactive_clients: number;
  total_ltv_cents: number;
  avg_ltv_cents: number;
}
```

### 3. search_clients

**Purpose**: Search for clients by name, email, or phone.

**Usage:**
```typescript
const { data } = await supabase.rpc('search_clients', {
  p_query: 'john',
  p_org_id: 'uuid'
});
```

**Returns:**
```typescript
Array<{
  org_client_id: string;
  person_id: string;
  first_name: string;
  last_name: string;
  primary_email: string;
  primary_phone_e164: string;
  status: string;
  ltv_cents: number;
  tags: string[];
  created_at: string;
}>
```

## Homeowner Onboarding Hook

When a new user signs up as a homeowner, the system automatically checks if their email matches an existing person record. If so, a link is created in the `user_person_links` table.

**Trigger:**
```sql
CREATE TRIGGER link_user_to_person_trigger
  AFTER INSERT ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION link_user_to_person();
```

**Benefits:**
- Homeowners can see their service history from all providers
- Providers can see if a client has a homeowner account
- Seamless transition from client to homeowner

## Frontend Integration

### Creating a New Client

```typescript
// Call upsert_person edge function
const { data: personData } = await supabase.functions.invoke('upsert-person', {
  body: {
    email: 'john@example.com',
    phone: '+15551234567',
    first_name: 'John',
    last_name: 'Doe'
  }
});

// Create org_client
const { data: orgClient } = await supabase
  .from('org_clients')
  .insert({
    organization_id: currentOrgId,
    person_id: personData.person_id,
    status: 'active'
  })
  .select()
  .single();
```

### Creating a Job with New Client

```typescript
const { data: job } = await supabase.functions.invoke('create-job-with-client', {
  body: {
    organization_id: currentOrgId,
    client: {
      first_name: 'Jane',
      last_name: 'Smith',
      email: 'jane@example.com',
      phone: '+15559876543',
      address: {
        address1: '123 Main St',
        city: 'San Francisco',
        state: 'CA',
        postal: '94102'
      }
    },
    service_id: serviceId,
    start_at: '2025-02-01T10:00:00Z',
    end_at: '2025-02-01T12:00:00Z',
    price_cents: 15000,
    notes: 'First time client'
  }
});
```

### Getting Client Timeline

```typescript
const { data: timeline } = await supabase.rpc('client_timeline', {
  p_org_client_id: orgClientId
});

// timeline is an array of events sorted by created_at desc
timeline.forEach(event => {
  console.log(event.type, event.created_at, event.data);
});
```

### Searching Clients

```typescript
const { data: clients } = await supabase.rpc('search_clients', {
  p_query: searchTerm,
  p_org_id: currentOrgId
});
```

## Migration from Old Schema

The old `clients` table still exists for backward compatibility. To migrate:

1. **Create person records** for all existing clients
2. **Create org_clients** linking to the new person records
3. **Update jobs/invoices** to use org_client_id instead of client_id
4. **Gradually phase out** the old clients table

## Best Practices

### 1. Always Use Edge Functions for Person Updates

Never update the `people`, `person_emails`, or `person_phones` tables directly. Always use the edge functions to ensure data consistency.

### 2. Store Organization-Specific Data in org_clients

Use the `notes` JSONB field in `org_clients` for organization-specific notes. Use `tags` for categorization. Use `org_client_settings` for custom fields.

### 3. Use Cents for Money

All monetary values are stored in cents (e.g., $150.00 = 15000 cents) to avoid floating-point precision issues.

### 4. Normalize Phone Numbers

Always normalize phone numbers to E.164 format (+1XXXXXXXXXX) before storing or searching.

### 5. Use RPC Functions for Complex Queries

Use the provided RPC functions (`client_timeline`, `client_stats`, `search_clients`) instead of writing complex joins in the frontend.

## Future Enhancements

- **Multi-user organizations**: Add team members with different roles
- **Client portal**: Allow clients to view their own timeline
- **Advanced segmentation**: More sophisticated campaign targeting
- **Recurring jobs**: Automatic job creation for subscriptions
- **Client referrals**: Track referral sources and rewards
- **Custom fields**: UI for managing custom fields per organization

## Support

For questions or issues with the new CRM architecture, please refer to:
- Supabase documentation: https://supabase.com/docs
- Edge Functions guide: https://supabase.com/docs/guides/functions
- RLS policies: https://supabase.com/docs/guides/auth/row-level-security
