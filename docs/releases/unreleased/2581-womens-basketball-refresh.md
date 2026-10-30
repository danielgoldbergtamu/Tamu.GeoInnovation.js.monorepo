---
issue: 2581
title: The Women's Basketball map shows game-day changes without a reload
testOnDev: |
  | Women's Basketball refreshes every minute ([#2581](https://github.com/TamuGeoInnovation/Tamu.GeoInnovation.js.monorepo/issues/2581)) | [The Women's Basketball map](https://dev.aggiemap.tamu.edu/events/womens-basketball/map/d), with the browser's developer tools open on the Network tab, filtered to `WomensBasketballParking_view` | Leave the map open for two or three minutes without touching it. Both layers (`/0` accessible parking, `/1` event lots) ask their service again about once a minute. To see a real change, have someone with the editor close a lot on dev: within a minute the open map shows it, with no reload. The other athletics maps (baseball, soccer, softball and the rest) should not poll: filtered to their own service, nothing repeats |
---

### The Women's Basketball map shows game-day changes without a reload

Staff edit the Women's Basketball parking map on game day. The map now asks for its accessible parking and event
lots every minute, so a visitor who already has it open sees a lot close without reloading, as the Men's Basketball
map does since [#2558](https://github.com/TamuGeoInnovation/Tamu.GeoInnovation.js.monorepo/issues/2558). The first
game is on 2 November ([#2581](https://github.com/TamuGeoInnovation/Tamu.GeoInnovation.js.monorepo/issues/2581)).

The other athletics maps are built the same way, so the refresh is something a map asks for rather than a change to
all of them: none of the others polls.

Nothing about how the map looks changes, so there are no pictures: the difference is that a change made in the
editor appears on its own.
