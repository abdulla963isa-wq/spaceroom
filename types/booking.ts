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
  total: number;
  status: string;
  createdAt: any;
}
