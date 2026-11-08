import { LayerSource } from '@tamu-gisc/common/types';
import { Connections, commonLayerProps } from '@tamu-gisc/aggiemap/ngx/common';
import { Popups } from '@tamu-gisc/aggiemap/ngx/popups';

import {
  AggiemapCustomMapConfiguration,
  EventConfiguration,
  SpecialEventOptions
} from '../interfaces/special-event.interface';
import { DINING_KIOSK_LAYERS } from './kiosk-layer-ids';

// The layer ids live in kiosk-layer-ids.ts, which has no imports, so the smoke suite can read them (#2701).
export { DINING_KIOSK_LAYERS };

/**
 * The buildings every kiosk map draws, as the main map draws them by default. A kiosk loads none of the
 * main map's layers, so each kiosk adds this one itself: the Dining kiosk and the Football Tailgating
 * kiosk (#1975) both do.
 *
 * Not `essential`: an essential layer is made at start-up, as soon as it loads, so its place among the kiosk's own
 * layers depended on timing. Each kiosk's `references` place it instead, below what the kiosk is for (#2552).
 */
export const KioskBuildingsLayerSource: LayerSource = {
  type: 'feature',
  id: DINING_KIOSK_LAYERS.BUILDINGS,
  title: 'Buildings',
  url: `${Connections.basemapUrl}/1`,
  popupComponent: Popups.BuildingPopupComponent,
  listMode: 'hide',
  visible: true,
  native: {
    ...commonLayerProps,
    legendEnabled: false
  }
};

export const DiningKioskLayerSources: LayerSource[] = [
  KioskBuildingsLayerSource,
  {
    type: 'geojson',
    id: DINING_KIOSK_LAYERS.DINING_LOCATIONS,
    title: 'Dining Locations',
    url: Connections.diningLocationsUrl,
    // On, unlike the main map's toggle of the same id: dining is what this map is for.
    listMode: 'show',
    visible: true,
    popupComponent: Popups.DiningPopupComponent,
    native: {
      ...commonLayerProps,
      // Overridden deliberately (#1576): this is a GeoJSON feed, which carries no symbology, so without
      // a renderer ArcGIS draws a plain default marker. The icons show open and closed, food truck or not.
      renderer: {
        type: 'unique-value',
        field: 'label',
        field2: 'type',
        fieldDelimiter: ',',
        uniqueValueInfos: [
          {
            value: 'open,food-truck',
            label: 'Food Truck - Open',
            symbol: {
              type: 'picture-marker',
              url: '/assets/images/icons/FoodTruck_open.png',
              width: '24px',
              height: '32px'
            }
          },
          {
            value: 'closed,food-truck',
            label: 'Food Truck - Closed',
            symbol: {
              type: 'picture-marker',
              url: '/assets/images/icons/FoodTruck_closed.png',
              width: '24px',
              height: '32px'
            }
          },
          {
            value: 'open,fixed',
            label: 'Dining - Open',
            symbol: {
              type: 'picture-marker',
              url: '/assets/images/icons/Dining_open.png',
              width: '24px',
              height: '32px'
            }
          },
          {
            value: 'closed,fixed',
            label: 'Dining - Closed',
            symbol: {
              type: 'picture-marker',
              url: '/assets/images/icons/Dining_closed.png',
              width: '24px',
              height: '32px'
            }
          }
        ]
      }
    }
  }
];

export const DiningKioskConfiguration: EventConfiguration = {
  id: 'dining',
  name: 'Dining',
  applicationName: 'Aggie Map - Dining',
  shortApplicationName: 'Dining',
  introductionText: 'Campus dining locations.',
  eventDates: [],
  mapCenter: [-96.344672, 30.61306],
  zoom: 16,
  hideSidebar: true
};

export const DiningKioskOptions: SpecialEventOptions = [];

export const DiningKioskTs: AggiemapCustomMapConfiguration = {
  configuration: DiningKioskConfiguration,
  options: DiningKioskOptions,
  sources: DiningKioskLayerSources,
  references: DINING_KIOSK_LAYERS,
  type: 'general-map',
  discover: {
    id: DiningKioskConfiguration.id,
    name: DiningKioskConfiguration.name,
    description: 'Preset dining locations map with no sidebar/search UI, for embedding elsewhere (e.g., a mobile app webview).',
    source: 'internal',
    type: 'kiosk',
    mapType: 'kiosk'
  }
};
