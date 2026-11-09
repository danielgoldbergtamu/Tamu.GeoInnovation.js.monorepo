---
issue: 2758
title: Every map has the main map's sidebar tabs, Bus Routes included
testOnDev: |
  | Bus Routes on an event map ([#2758](https://github.com/TamuGeoInnovation/Tamu.GeoInnovation.js.monorepo/issues/2758)) | [dev.aggiemap.tamu.edu/events/mens-basketball](https://dev.aggiemap.tamu.edu/events/mens-basketball) | The sidebar has the same tabs as the main map: Features, Directions, Bus Routes, Experiments and Settings. Bus Routes lists the AggieSpirit routes, and choosing route 01 draws its line and stops and lists them. Before, the map had only Features, Directions and Settings. With `?as=production`, the tabs are Features, Bus Routes and Settings, as on the main map. A satellite campus map, such as Galveston, still has Features alone |
---

### Every map has the main map's sidebar tabs, Bus Routes included

Bus routes were in the main map's sidebar but on none of the event and parking maps, because the two
sidebars kept separate lists of their tabs and only the main map's had been updated. Every map now
offers the same tabs from one list: the event and parking maps gain Bus Routes, and, on dev,
Experiments. Choosing a bus route on an event map draws it and its stops, as on the main map. Satellite
campus maps keep the Features tab alone, as before.
([#2758](https://github.com/TamuGeoInnovation/Tamu.GeoInnovation.js.monorepo/issues/2758))

| Before | After |
| --- | --- |
| ![The Men's Basketball parking map with only the Features, Directions and Settings tabs](../screenshots/2758-sidebar-tabs-every-map/before-dev-desktop.png) | ![The same map with a Bus Routes tab, showing route 01 drawn with its stops](../screenshots/2758-sidebar-tabs-every-map/after-local-event-bus.png) |
