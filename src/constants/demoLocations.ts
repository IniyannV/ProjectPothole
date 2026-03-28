export type DemoMapLocationId =
  | 'live'
  | 'san-francisco'
  | 'new-york'
  | 'chennai'
  | 'bengaluru';

export type DemoMapLocation = {
  id: DemoMapLocationId;
  label: string;
  coord: [number, number];
};

export const DEMO_MAP_LOCATIONS: DemoMapLocation[] = [
  {
    id: 'live',
    label: 'Live GPS',
    coord: [0, 0],
  },
  {
    id: 'san-francisco',
    label: 'San Francisco',
    coord: [-122.4194, 37.7749],
  },
  {
    id: 'new-york',
    label: 'New York',
    coord: [-74.006, 40.7128],
  },
  {
    id: 'chennai',
    label: 'Chennai',
    coord: [80.2707, 13.0827],
  },
  {
    id: 'bengaluru',
    label: 'Bengaluru',
    coord: [77.5946, 12.9716],
  },
];

export const DEFAULT_DEMO_MAP_LOCATION_ID: DemoMapLocationId = 'live';

export function isDemoMapLocationId(value: unknown): value is DemoMapLocationId {
  if (typeof value !== 'string') {
    return false;
  }

  return DEMO_MAP_LOCATIONS.some(location => location.id === value);
}
