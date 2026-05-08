const ASSET_MAP: Record<string, string> = {
  diwan: '/images/diwan.jpg',
  savoy: '/images/savoy.jpg',
  aurora_savoy: '/images/aurora_savoy.jpg',
  board_room_diwan: '/images/board_room_diwan.png',
  day_office_diwan: '/images/day_office_diwan.png',
  day_pass_diwan: '/images/day_pass_diwan.jpeg',
  event_space_diwan: '/images/event_space_diwan.jpg',
  lumainia_savoy: '/images/lumainia_savoy.jpg',
  meeting_room_diwan: '/images/Meeting_room_diwan.jpg',
  reef_graden_pool_deck_savoy: '/images/reef_graden_pool_deck_savoy.jpg',
};

export function resolveImage(key: string | undefined): string {
  if (!key) return '';
  if (key.startsWith('http')) return key;
  return ASSET_MAP[key.toLowerCase()] ?? '';
}
