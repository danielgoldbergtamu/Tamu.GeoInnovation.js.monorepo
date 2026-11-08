/**
 * The layer ids of the kiosk maps, and of the tailgating map the Football Tailgating kiosk draws from.
 *
 * Kept in a file of their own, with no imports, so the AggieMap smoke suite can read them: `kiosk.spec.ts`
 * checks a kiosk draws exactly these and nothing else, and a copy kept by hand there went stale the day a
 * tailgating layer was added (#2661, #2701). The definitions import these from here too, so a new layer is
 * added in one place.
 */

/**
 * The tailgating zones are a hosted feature layer in TAMU's ArcGIS Online organization, maintained
 * in ArcGIS Pro. Their colors, outlines and the circled zone numbers come from the service's own
 * drawing info, so styling is changed by republishing the layer, not here. Popups read the `name`
 * and `type` fields, so keep those field names when editing the data.
 *
 * The event service adds these in reverse order, and a layer added later draws above the ones before
 * it, so the first entry draws on top: the circled numbers, then the tents, then the zones.
 */
export enum TAILGATING_LAYERS {
  ZONE_NUMBERS = 'tailgating-zone-numbers',
  RESTROOMS = 'tailgating-restrooms',
  TENTS = 'tailgating-tents',
  SIMPSON_TENTS = 'tailgating-simpson-tents',
  AGGIE_PARK = 'tailgating-aggie-park',
  WEST_CAMPUS = 'tailgating-west-campus',
  CONSTRUCTION = 'tailgating-construction'
}

/**
 * Layer ids used by the Dining kiosk map. `BUILDINGS` is the same always-on basemap layer shown by
 * default on the main map, and `DINING_LOCATIONS` is the one layer this kiosk map exists to show, on
 * from the start. As a kiosk map it loads none of the main map's layers, so these two and the
 * basemap are all it draws (#1392). Future kiosk maps for other layers can follow the same
 * pattern: reuse `BUILDINGS` as the standard basemap layer and add their own single layer.
 */
export enum DINING_KIOSK_LAYERS {
  // First, so it draws on top (docs/map-layers.md, "Drawing order"): the buildings are a near-invisible click layer,
  // and above the dining locations they took every click on one inside a building (#2552).
  DINING_LOCATIONS = 'dining-locations-layer',
  BUILDINGS = 'buildings-layer'
}

/**
 * The Football Tailgating kiosk's layers: every one of the tailgating map's, then the buildings.
 *
 * The tailgating layers come first, so they keep the drawing order the tailgating map gives them, with
 * the buildings beneath them (the event service adds references in reverse order).
 */
export const TAILGATING_KIOSK_LAYERS = {
  ...TAILGATING_LAYERS,
  BUILDINGS: DINING_KIOSK_LAYERS.BUILDINGS
} as const;
