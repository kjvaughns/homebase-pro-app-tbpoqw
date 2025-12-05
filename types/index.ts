
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
  providerId: string;
  name: string;
  description: string;
  price: number;
  duration: number; // in minutes
  category: ServiceCategory;
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

export interface Booking {
  id: string;
  providerId: string;
  homeownerId: string;
  serviceId: string;
  date: Date;
  time: string;
  status: BookingStatus;
  address: string;
  notes?: string;
  price: number;
}

export type BookingStatus = 'pending' | 'confirmed' | 'completed' | 'cancelled';

export interface Invoice {
  id: string;
  bookingId: string;
  amount: number;
  status: InvoiceStatus;
  dueDate: Date;
  paidDate?: Date;
}

export type InvoiceStatus = 'unpaid' | 'paid' | 'overdue';

export interface Home {
  id: string;
  homeownerId: string;
  address: string;
  nickname?: string;
  isPrimary: boolean;
}
