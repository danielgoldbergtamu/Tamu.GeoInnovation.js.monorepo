/** A tab in a map's desktop sidebar. */
export interface AggiemapSidebarTab {
  /** What a map names to keep only some tabs (an event map's `sidebarTabs`). */
  id: 'features' | 'directions' | 'bus' | 'experiments' | 'settings';
  title: string;
  description: string;
  material_icon: string;
  /** The sidebar route the tab opens, relative to the map's desktop route. */
  route: string;
  /** Why the tab is development-only, when it is: it is then shown only where the build is testing (`isTesting`). */
  developmentOnly?: string;
}

/**
 * Every map's desktop sidebar tabs, in order: the main map's, and every event, parking and campus map's (#2758).
 *
 * The two sidebars kept their own copies of this list until 9 November 2026, and they drifted: Bus Routes and Experiments
 * were added to the main map's and never to the other, so no event or parking map offered bus routes. A tab is added or
 * gated here, once, and every map has it. An event map keeps only some of them by naming them in its `sidebarTabs`, as
 * the satellite campuses do.
 */
export const AGGIEMAP_SIDEBAR_TABS: ReadonlyArray<AggiemapSidebarTab> = [
  {
    id: 'features',
    title: 'Features',
    description: 'Toggle Features (Search, Layers, Legend)',
    material_icon: 'menu',
    route: ''
  },
  {
    id: 'directions',
    title: 'Directions',
    description: 'Toggle directions controls (routing and way-finding)',
    material_icon: 'directions',
    route: 'trip',
    developmentOnly: 'routing is unpublished (#1003)'
  },
  // On every environment since #2789 (the maintainer, 9 November 2026). It was development-only until then (#1090, #1229);
  // the smoke suite's `SECTIONS_ON_EVERY_ENVIRONMENT` now fails if it is gated again.
  {
    id: 'bus',
    title: 'Bus Routes',
    description: 'Toggle bus controls (list and timetable)',
    material_icon: 'directions_bus',
    route: 'bus'
  },
  {
    id: 'experiments',
    title: 'Experiments',
    description: 'Aggiemap Experiments',
    material_icon: 'science',
    route: 'experiments',
    developmentOnly: 'development-only since it was added, with no reason recorded'
  },
  {
    id: 'settings',
    title: 'Settings',
    description: 'Settings',
    material_icon: 'settings',
    route: 'settings'
  }
];
