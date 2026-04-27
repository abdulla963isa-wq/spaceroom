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
