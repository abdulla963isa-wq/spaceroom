import firestore from "@react-native-firebase/firestore";
import type { Space } from "../types/space";
import type { Venue } from "../types/venue";

const SEED_VENUES: Array<Venue> = [
  {
    id: "diwan-hub",
    name: "Diwan Hub",
    location: "Adliya, Manama",
    description:
      "Flexible workspace with quiet meeting areas and small team rooms.",
    heroImage:
      "https://images.unsplash.com/photo-1524758631624-e2822e304c36?auto=format&fit=crop&w=1200&q=80",
    categories: ["Work", "Study", "Meetings"],
    ownerId: "system",
    latitude: 26.2294,
    longitude: 50.5857,
    isActive: true,
  },
  {
    id: "savoy-lounge",
    name: "Savoy Lounge",
    location: "Juffair, Manama",
    description:
      "Premium lounge space for events, team meetings and relaxed work sessions.",
    heroImage:
      "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=1200&q=80",
    categories: ["Events", "Meetings", "Work"],
    ownerId: "system",
    latitude: 26.236,
    longitude: 50.5973,
    isActive: true,
  },
];

const SEED_SPACES: Array<Space> = [
  {
    id: "diwan-hub-focus-room",
    venueId: "diwan-hub",
    title: "Focus Room",
    type: "Work",
    description:
      "A calm private room for one or two people to work or study.",
    image:
      "https://images.unsplash.com/photo-1497366412874-3415097a27e7?auto=format&fit=crop&w=1200&q=80",
    tags: ["Work", "Study"],
    capacity: 2,
    pricePerHour: 8,
    availabilityText: "Instant booking available",
    isActive: true,
  },
  {
    id: "diwan-hub-meeting-suite",
    venueId: "diwan-hub",
    title: "Meeting Suite",
    type: "Meetings",
    description:
      "A meeting room with whiteboard space and team seating.",
    image:
      "https://images.unsplash.com/photo-1504384308090-c894fdcc538d?auto=format&fit=crop&w=1200&q=80",
    tags: ["Meetings", "Work"],
    capacity: 8,
    pricePerHour: 12,
    availabilityText: "Perfect for small teams.",
    isActive: true,
  },
  {
    id: "savoy-lounge-creative-hall",
    venueId: "savoy-lounge",
    title: "Creative Hall",
    type: "Events",
    description:
      "An open lounge for workshops, small events and group sessions.",
    image:
      "https://images.unsplash.com/photo-1517502884422-41eaead166d4?auto=format&fit=crop&w=1200&q=80",
    tags: ["Events", "Meetings"],
    capacity: 20,
    pricePerHour: 20,
    availabilityText: "Great for team gatherings.",
    isActive: true,
  },
  {
    id: "savoy-lounge-quiet-corner",
    venueId: "savoy-lounge",
    title: "Quiet Corner",
    type: "Study",
    description:
      "A comfortable spot for focused study and solo work.",
    image:
      "https://images.unsplash.com/photo-1524758631624-e2822e304c36?auto=format&fit=crop&w=1200&q=80",
    tags: ["Study", "Work"],
    capacity: 6,
    pricePerHour: 10,
    availabilityText: "Relaxed and private.",
    isActive: true,
  },
];

export const seedAppDataIfEmpty = async (): Promise<void> => {
  try {
    console.log("=== FIRESTORE SEED STARTED ===");

    const venuesSnapshot = await firestore().collection("venues").get();
    const spacesSnapshot = await firestore().collection("spaces").get();

    console.log("venues empty:", venuesSnapshot.empty);
    console.log("spaces empty:", spacesSnapshot.empty);

    const batch = firestore().batch();
    let shouldCommit = false;

    if (venuesSnapshot.empty) {
      console.log("Preparing venue seed...");
      SEED_VENUES.forEach((venue) => {
        const docRef = firestore().collection("venues").doc(venue.id);
        batch.set(docRef, venue);
      });
      shouldCommit = true;
    }

    if (spacesSnapshot.empty) {
      console.log("Preparing space seed...");
      SEED_SPACES.forEach((space) => {
        const docRef = firestore().collection("spaces").doc(space.id);
        batch.set(docRef, space);
      });
      shouldCommit = true;
    }

    if (shouldCommit) {
      await batch.commit();
      console.log("=== FIRESTORE SEED COMMITTED SUCCESSFULLY ===");
    } else {
      console.log("=== SEED SKIPPED: venues/spaces already exist ===");
    }
  } catch (error) {
    console.error("=== FAILED TO SEED FIRESTORE ===", error);
  }
};