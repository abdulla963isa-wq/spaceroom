export const ALL_TIME_SLOTS = [
  "9:00 AM",
  "10:00 AM",
  "11:00 AM",
  "12:00 PM",
  "1:00 PM",
  "2:00 PM",
  "3:00 PM",
  "4:00 PM",
  "5:00 PM",
  "6:00 PM",
];

const convertTo24Hour = (time: string) => {
  const [clock, modifier] = time.split(" ");
  let [hours] = clock.split(":").map(Number);
  if (modifier === "PM" && hours !== 12) hours += 12;
  if (modifier === "AM" && hours === 12) hours = 0;
  return hours;
};

const format24Hour = (hour: number) => {
  const normalized = ((hour % 24) + 24) % 24;
  const period = normalized >= 12 ? "PM" : "AM";
  const displayHour = normalized % 12 === 0 ? 12 : normalized % 12;
  return `${displayHour}:00 ${period}`;
};

export const getDistanceKm = (
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number => {
  const toRadians = (degrees: number) => (degrees * Math.PI) / 180;
  const earthRadiusKm = 6371;
  const dLat = toRadians(lat2 - lat1);
  const dLon = toRadians(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRadians(lat1)) *
      Math.cos(toRadians(lat2)) *
      Math.sin(dLon / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(earthRadiusKm * c * 10) / 10;
};

export const getImageSource = (image?: string) => {
  if (!image) return require("../assets/images/diwan.jpg");
  if (image === "diwan") return require("../assets/images/diwan.jpg");
  if (image === "savoy") return require("../assets/images/savoy.jpg");
  if (image === "meeting_room_diwan") return require("../assets/images/Meeting_room_diwan.jpg");
  if (image === "board_room_diwan") return require("../assets/images/board_room_diwan.png");
  if (image === "event_space_diwan") return require("../assets/images/event_space_diwan.jpg");
  if (image === "day_pass_diwan") return require("../assets/images/day_pass_diwan.jpeg");
  if (image === "day_office_diwan") return require("../assets/images/day_office_diwan.png");
  if (image === "aurora_savoy") return require("../assets/images/aurora_savoy.jpg");
  if (image === "lumainia_savoy") return require("../assets/images/lumainia_savoy.jpg");
  if (image === "reef_graden_pool_deck_savoy") return require("../assets/images/reef_graden_pool_deck_savoy.jpg");
  if (image.startsWith("http://") || image.startsWith("https://")) {
    return { uri: image };
  }
  return { uri: image };
};

export const getCoveredSlots = (
  startTime: string,
  duration: number,
  allSlots: string[]
): string[] => {
  const startIndex = allSlots.indexOf(startTime);
  if (startIndex === -1) return [];
  return allSlots.slice(startIndex, startIndex + duration);
};

export const calculateEndTime = (
  startTime: string,
  duration: number,
  allSlots: string[]
): string => {
  const covered = getCoveredSlots(startTime, duration, allSlots);
  if (covered.length === 0) return "";
  const lastSlot = covered[covered.length - 1];
  const endHour = convertTo24Hour(lastSlot) + 1;
  return format24Hour(endHour);
};

export const isBookingOverlap = (
  existingReservedSlots: string[],
  requestedReservedSlots: string[]
) =>
  requestedReservedSlots.some((slot) =>
    existingReservedSlots.includes(slot)
  );

export const getUpcomingDateIds = (days = 2): string[] => {
  const now = new Date();
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Bahrain",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  const parts = formatter.formatToParts(now);
  const get = (type: string) =>
    parts.find((p) => p.type === type)?.value || "";
  const year = Number(get("year"));
  const month = Number(get("month"));
  const day = Number(get("day"));

  return Array.from({ length: days }, (_, i) => {
    const date = new Date(Date.UTC(year, month - 1, day + i));
    return date.toISOString().split("T")[0];
  });
};
