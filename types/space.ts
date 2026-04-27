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
}
