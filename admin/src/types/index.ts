import { Timestamp } from 'firebase/firestore';

export interface User {
  id: string;
  fullName: string;
  email: string;
  phoneNumber: string;
  role: 'admin' | 'owner' | 'customer';
  createdAt: Timestamp | string;
  isActive: boolean;
}

export interface Venue {
  id: string;
  name: string;
  location: string;
  description: string;
  heroImage: string;
  categories: string[];
  ownerId: string;
  latitude: number;
  longitude: number;
  isActive: boolean;
}

export interface Space {
  id: string;
  venueId: string;
  title: string;
  description: string;
  image: string;
  tags: string[];
  type: string;
  capacity: number;
  pricePerHour: number;
  availabilityText: string;
  isActive: boolean;
  quantity: number;
}

export interface Booking {
  id: string;
  userId: string;
  venueId: string;
  spaceId: string;
  venueName: string;
  spaceName: string;
  location: string;
  date: string;
  fullDate: string;
  startTime: string;
  endTime: string;
  duration: number;
  reservedSlots: string[];
  pricePerHour: number;
  total: number;
  status: 'Confirmed' | 'Cancelled';
  createdAt: Timestamp | string;
}

export interface Notification {
  id: string;
  receiverId: string;
  receiverRole: 'admin' | 'owner' | 'customer';
  title: string;
  message: string;
  type: 'booking' | 'system' | 'announcement';
  isRead: boolean;
  createdAt: Timestamp | string;
  metadata?: Record<string, unknown>;
}

export interface DashboardStats {
  totalUsers: number;
  totalBookings: number;
  totalVenues: number;
  totalSpaces: number;
  totalRevenue: number;
  activeListings: number;
}

export interface ChartDataPoint {
  date: string;
  count: number;
}

export interface RevenueDataPoint {
  month: string;
  revenue: number;
}

export interface SpacePopularityDataPoint {
  name: string;
  bookings: number;
}

export interface PeakHoursDataPoint {
  hour: string;
  count: number;
}
