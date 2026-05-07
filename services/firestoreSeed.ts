import firestore from "@react-native-firebase/firestore";
import type { Space } from "../types/space";
import type { Venue } from "../types/venue";

const SEED_VENUES: Array<Venue> = [
  {
    id: "diwan-studio",
    name: "Diwan Studio",
    location: "Adliya, Manama",
    description: "Inspiring coworking space for small teams and shoots.",
    heroImage: "diwan",
    categories: ["Work", "Meetings", "Events"],
    ownerId: "system",
    latitude: 26.2294,
    longitude: 50.5857,
    isActive: true,
  },
  {
    id: "savoy-grande",
    name: "Savoy Grande Hotel",
    location: "Juffair, Manama",
    description:
      "Elegant and professional spaces for meetings, events, and private work sessions.",
    heroImage: "savoy",
    categories: ["Meetings", "Events", "Work"],
    ownerId: "system",
    latitude: 26.236,
    longitude: 50.5973,
    isActive: true,
  },
];

const SEED_SPACES: Array<Space> = [
  // ── Diwan Studio ──────────────────────────────────────────────────────────
  {
    id: "diwan-meeting-room",
    venueId: "diwan-studio",
    title: "Meeting Room",
    type: "Meetings",
    description:
      "A bright in-person meeting space designed for collaboration, calls, and creative work.",
    image: "meeting_room_diwan",
    tags: ["Private Room", "Screen", "Coffee"],
    capacity: 8,
    pricePerHour: 5.5,
    availabilityText: "Available Sunday–Thursday, 9AM–6PM",
    isActive: true,
    quantity: 1,
  },
  {
    id: "diwan-board-room",
    venueId: "diwan-studio",
    title: "Board Room",
    type: "Meetings",
    description:
      "A professional space ideal for silent meetings, presentations, and strategy sessions.",
    image: "board_room_diwan",
    tags: ["Standing Desk", "Smart Screen", "Paper Edition"],
    capacity: 12,
    pricePerHour: 14.5,
    availabilityText: "Available Sunday–Thursday, 9AM–6PM",
    isActive: true,
    quantity: 1,
  },
  {
    id: "diwan-event-space",
    venueId: "diwan-studio",
    title: "Event Space",
    type: "Events",
    description:
      "A versatile space for workshops, seminars, and private sessions — perfect for teams and events.",
    image: "event_space_diwan",
    tags: ["Soundproof", "Projector Area", "Wi-Fi", "Projector", "Refreshments"],
    capacity: 30,
    pricePerHour: 25,
    availabilityText: "Available Sunday–Thursday, 9AM–6PM",
    isActive: true,
    quantity: 1,
  },
  {
    id: "diwan-day-pass",
    venueId: "diwan-studio",
    title: "Day Pass",
    type: "Work",
    description:
      "Access shared desks, lounge, and cafe, with high-speed Wi-Fi and coffee all day long.",
    image: "day_pass_diwan",
    tags: ["Shared Desk", "Hot Desk", "Lounge", "Wi-Fi", "Coffee"],
    capacity: 1,
    pricePerHour: 3.5,
    availabilityText: "Access from 9AM–6PM (Weekdays)",
    isActive: true,
    quantity: 1,
  },
  {
    id: "diwan-day-office",
    venueId: "diwan-studio",
    title: "Day Office",
    type: "Work",
    description:
      "Private, comfortable, and ideal for focused work or short calls with full access to Diwan amenities.",
    image: "day_office_diwan",
    tags: ["Private Desk", "Private Office", "Paper Selection", "Coffee", "Quick Stop"],
    capacity: 2,
    pricePerHour: 11,
    availabilityText: "Access from 9AM–6PM (Weekdays)",
    isActive: true,
    quantity: 1,
  },

  // ── Savoy Grande Hotel ────────────────────────────────────────────────────
  {
    id: "savoy-aurora-board-room",
    venueId: "savoy-grande",
    title: "Aurora Board Room",
    type: "Meetings",
    description:
      "A refined executive space perfect for corporate board meetings, strategy discussions, interviews, and private presentations in a professional and focused environment.",
    image: "aurora_savoy",
    tags: ["Executive Seating", "Wi-Fi", "LCD Projector", "Whiteboard", "Audio System"],
    capacity: 20,
    pricePerHour: 40,
    availabilityText:
      "Hourly: BHD 40 · Half Day: BHD 40 · Full Day: BHD 65. Availability subject to hotel scheduling.",
    isActive: true,
    quantity: 1,
  },
  {
    id: "savoy-lumina-hall",
    venueId: "savoy-grande",
    title: "Lumina Hall",
    type: "Events",
    description:
      "A versatile multi-purpose space designed for corporate seminars, training sessions, product launches, private gatherings, and social celebrations with full event coordination.",
    image: "lumainia_savoy",
    tags: ["Auditorium", "Wi-Fi", "Audio System", "Stage Platform", "Catering"],
    capacity: 150,
    pricePerHour: 42,
    availabilityText:
      "Half Day: BHD 42.00+ · Full Day: BHD 80+. Includes parking.",
    isActive: true,
    quantity: 1,
  },
  {
    id: "savoy-reef-garden-pool-deck",
    venueId: "savoy-grande",
    title: "Reef Garden Pool Deck",
    type: "Events",
    description:
      "An enchanting outdoor poolside venue ideal for networking nights, birthday parties, family celebrations, and corporate socials — blending relaxed charm with Savoy Grande's signature hospitality.",
    image: "reef_graden_pool_deck_savoy",
    tags: ["Outdoor Venue", "Wi-Fi", "Heater & AC", "Catering", "Creative Setup", "Parking"],
    capacity: 80,
    pricePerHour: 70,
    availabilityText:
      "Half Day: BHD 70+. Weather dependent, outdoor year-round.",
    isActive: true,
    quantity: 1,
  },
];

export const seedAppDataIfEmpty = async (): Promise<void> => {
  try {
    // Always upsert the canonical venues
    const venueBatch = firestore().batch();
    SEED_VENUES.forEach((venue) => {
      const { id, ...data } = venue;
      venueBatch.set(firestore().collection("venues").doc(id), data);
    });
    await venueBatch.commit();

    // Always upsert the canonical spaces
    const spaceBatch = firestore().batch();
    SEED_SPACES.forEach((space) => {
      const { id, ...data } = space;
      spaceBatch.set(firestore().collection("spaces").doc(id), data);
    });
    await spaceBatch.commit();

    // Delete any stale spaces not in our list
    const definedSpaceIds = new Set(SEED_SPACES.map((s) => s.id));
    const allSpaces = await firestore().collection("spaces").get();
    const staleSpaceBatch = firestore().batch();
    let hasStaleSpaces = false;
    allSpaces.docs.forEach((doc) => {
      if (!definedSpaceIds.has(doc.id)) {
        staleSpaceBatch.delete(doc.ref);
        hasStaleSpaces = true;
      }
    });
    if (hasStaleSpaces) await staleSpaceBatch.commit();

    // Delete any stale venues not in our list
    const definedVenueIds = new Set(SEED_VENUES.map((v) => v.id));
    const allVenues = await firestore().collection("venues").get();
    const staleVenueBatch = firestore().batch();
    let hasStaleVenues = false;
    allVenues.docs.forEach((doc) => {
      if (!definedVenueIds.has(doc.id)) {
        staleVenueBatch.delete(doc.ref);
        hasStaleVenues = true;
      }
    });
    if (hasStaleVenues) await staleVenueBatch.commit();
  } catch (error) {
    console.error("=== FAILED TO SEED FIRESTORE ===", error);
  }
};
