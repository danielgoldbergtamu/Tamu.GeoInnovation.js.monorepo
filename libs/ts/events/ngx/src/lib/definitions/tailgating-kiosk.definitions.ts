import {
  AggiemapCustomMapConfiguration,
  EventConfiguration,
  SpecialEventOptions
} from '../interfaces/special-event.interface';
import { KioskBuildingsLayerSource } from './dining.definitions';
import { TAILGATING_KIOSK_LAYERS } from './kiosk-layer-ids';
import { TailgatingColdLayerSources, TailgatingConfiguration, TailgatingLinkSources } from './tailgating.definitions';

/**
 * The Football Tailgating kiosk (#1975): the tailgating map with no sidebar, for embedding or a fixed
 * screen, as the Dining kiosk is for dining (#1392).
 *
 * It draws what the Football Tailgating map draws on opening, from that map's own definitions: every
 * one of its layers (zones, tents, zone numbers and the construction that affects tailgating), with the
 * symbology their services publish, plus the buildings, which the tailgating map shows by default from
 * the main map. As a kiosk it loads none of the main map's layers, so these and the basemap are all it
 * draws.
 *
 * Its layer ids, `TAILGATING_KIOSK_LAYERS`, live in kiosk-layer-ids.ts, which has no imports, so the smoke suite can
 * read them (#2701).
 */
export { TAILGATING_KIOSK_LAYERS };

export const TailgatingKioskConfiguration: EventConfiguration = {
  id: 'football-tailgating',
  name: 'Football Tailgating',
  applicationName: 'Aggie Map - Football Tailgating',
  shortApplicationName: TailgatingConfiguration.shortApplicationName,
  introductionText: 'Tailgating zones and tents at Aggie Park and West Campus.',
  // No dates, and so no "Football season is over" window and no game-day toast: nobody at a kiosk
  // screen can dismiss one, and kiosk routes raise no notifications anyway.
  eventDates: [],
  // The tailgating map's own opening view and basemap.
  mapCenter: TailgatingConfiguration.mapCenter,
  zoom: TailgatingConfiguration.zoom,
  basemap: TailgatingConfiguration.basemap,
  // `?tent=` and `?zone=` links, as on the tailgating map. Its search sources are left out: a kiosk has no search.
  searchSources: TailgatingLinkSources,
  hideSidebar: true
};

export const TailgatingKioskOptions: SpecialEventOptions = [];

export const TailgatingKioskTs: AggiemapCustomMapConfiguration = {
  configuration: TailgatingKioskConfiguration,
  options: TailgatingKioskOptions,
  sources: [...TailgatingColdLayerSources, KioskBuildingsLayerSource],
  references: TAILGATING_KIOSK_LAYERS,
  type: 'general-map',
  discover: {
    id: TailgatingKioskConfiguration.id,
    name: TailgatingKioskConfiguration.name,
    description:
      'Preset Football Tailgating map with no sidebar/search UI, for embedding elsewhere or a fixed screen. Takes ?tent= and ?zone= links.',
    source: 'internal',
    type: 'kiosk',
    mapType: 'kiosk'
  }
};
