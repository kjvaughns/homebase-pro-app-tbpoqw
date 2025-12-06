
export type UserRole = 'provider' | 'homeowner';

export interface User {
  id: string;
  email: string;
  role: UserRole;
  name: string;
  phone?: string;
  avatar?: string;
  createdAt: Date;
}

export interface Profile {
  id: string;
  user_id: string;
  email: string;
  name: string;
  phone?: string;
  avatar_url?: string;
  role: UserRole;
  created_at: string;
  updated_at: string;
}

export interface Organization {
  id: string;
  owner_id: string;
  business_name: string;
  description?: string;
  logo_url?: string;
  service_categories: string[];
  service_radius: number;
  location?: string;
  slug?: string;
  verified: boolean;
  published_to_marketplace: boolean;
  stripe_account_id?: string;
  subscription_plan: 'free' | 'growth' | 'pro' | 'scale';
  subscription_status: string;
  onboarding_completed: boolean;
  created_at: string;
  updated_at: string;
}

export interface Provider {
  id: string;
  userId: string;
  businessName: string;
  description: string;
  services: Service[];
  rating: number;
  reviewCount: number;
  avatar?: string;
  coverImage?: string;
  location: string;
  verified: boolean;
  slug: string;
}

export interface Service {
  id: string;
  organization_id: string;
  name: string;
  description?: string;
  category: string;
  pricing_type: 'fixed' | 'range' | 'quote';
  price_min?: number;
  price_max?: number;
  duration?: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export type ServiceCategory = 
  | 'handyman'
  | 'lawn-care'
  | 'hvac'
  | 'plumbing'
  | 'cleaning'
  | 'electrical'
  | 'contractor'
  | 'painting';

export interface Client {
  id: string;
  organization_id: string;
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  status: 'lead' | 'active' | 'inactive';
  lifetime_value: number;
  tags: string[];
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface Booking {
  id: string;
  organization_id: string;
  client_id: string;
  service_id?: string;
  homeowner_id?: string;
  service_name: string;
  scheduled_date: string;
  scheduled_time: string;
  duration?: number;
  address: string;
  notes?: string;
  status: 'pending' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled';
  price?: number;
  created_at: string;
  updated_at: string;
}

export type BookingStatus = 'pending' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled';

export interface Quote {
  id: string;
  organization_id: string;
  client_id: string;
  service_id?: string;
  quote_number: string;
  line_items: LineItem[];
  subtotal: number;
  tax: number;
  total: number;
  status: 'draft' | 'sent' | 'accepted' | 'rejected' | 'expired';
  expiry_date?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface Invoice {
  id: string;
  organization_id: string;
  client_id: string;
  booking_id?: string;
  invoice_number: string;
  line_items: LineItem[];
  subtotal: number;
  tax: number;
  total: number;
  status: 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled';
  due_date?: string;
  paid_date?: string;
  payment_method?: string;
  stripe_payment_intent_id?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export type InvoiceStatus = 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled';

export interface LineItem {
  id: string;
  description: string;
  quantity: number;
  unit_price: number;
  total: number;
}

export interface Payment {
  id: string;
  organization_id: string;
  invoice_id?: string;
  client_id: string;
  amount: number;
  payment_method: string;
  stripe_payment_intent_id?: string;
  stripe_charge_id?: string;
  status: 'pending' | 'succeeded' | 'failed' | 'refunded';
  refund_amount: number;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface Notification {
  id: string;
  user_id: string;
  type: string;
  title: string;
  body: string;
  data: any;
  read: boolean;
  created_at: string;
}

export interface Home {
  id: string;
  homeownerId: string;
  address: string;
  nickname?: string;
  isPrimary: boolean;
}

export interface ClientFile {
  id: string;
  client_id: string;
  organization_id: string;
  file_name: string;
  file_url: string;
  file_type?: string;
  file_size?: number;
  uploaded_by?: string;
  created_at: string;
}
