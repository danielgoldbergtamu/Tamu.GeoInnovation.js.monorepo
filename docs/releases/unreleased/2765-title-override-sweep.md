---
issue: 2765
title: 98 layers take their names from their services
testOnDev: |
  | AggieMap: layer names from the services ([#2765](https://github.com/TamuGeoInnovation/Tamu.GeoInnovation.js.monorepo/issues/2765)) | [Spring Commencement](https://dev.aggiemap.tamu.edu/events/graduation-spring/map/d?date=2026-05-06T05%3A00%3A00.000Z), [Game Day Parking](https://dev.aggiemap.tamu.edu/all-maps/parking), Fish Camp, the Ring Day maps, and the main map's Sustainable Transportation group | Nothing should look different: each layer has the name it had, now read from its service, and none is struck through or missing from the Layers list |
---

### AggieMap: 98 layers take their names from their services

98 layers on 23 maps declared a name of their own that was, word for word, the name their service already publishes.
They no longer declare it, so when the GIS team renames a layer the map shows the new name without a code change. The
names visitors see are the same. Of the names still declared, 39 now record why: some services name a layer with a code
such as `HSI` or `TAMUPrinters_points`, and some maps draw one service layer as several filtered layers that each need
a name.
([#2765](https://github.com/TamuGeoInnovation/Tamu.GeoInnovation.js.monorepo/issues/2765))

| Before: Spring Commencement on dev | After: the same names, read from the services |
| --- | --- |
| ![Before](../screenshots/2765-title-override-sweep/before.png) | ![After](../screenshots/2765-title-override-sweep/after.png) |
