---
issue: 2701
title: AVP Parking's lot links open the same lot on every server
testOnDev: |
  | AVP Parking's popup copies a lot link that works everywhere ([#2701](https://github.com/TamuGeoInnovation/Tamu.GeoInnovation.js.monorepo/issues/2701)) | [dev.aggiemap.tamu.edu/parking/avp-parking/map?lot=043](https://dev.aggiemap.tamu.edu/parking/avp-parking/map?lot=043) | Lot 043's popup opens; its Copy field ends in `?lot=043`, not `?feature=AVP-parking-lots:34694`. Change `dev.` to production's address in that copied link: Lot 043 opens there too |
---

### AVP Parking's lot links open the same lot on every server

A lot's popup on AVP Parking copied a link naming the lot by its object id, `?feature=AVP-parking-lots:26135`. The
development and production GIS servers numbered the same lots independently - Lot 043 is 26135 on one and 34694 on the
other - so a link copied on one opened nothing on the other, and any link would have stopped working the next time the
service was republished. The popup now copies `?lot=043`, the lot's own facility number, which both servers know. Links
already shared with an object id still open the lot they named.
([#2701](https://github.com/TamuGeoInnovation/Tamu.GeoInnovation.js.monorepo/issues/2701))

| Before | After |
| --- | --- |
| ![The popup's Copy field holds a link ending in feature=AVP-parking-lots:34694](../screenshots/2701-avp-lot-links/before-copied-link.png) | ![The popup's Copy field holds a link ending in lot=043](../screenshots/2701-avp-lot-links/after-copied-link.png) |
| ![That link, opened on production, opens nothing](../screenshots/2701-avp-lot-links/before-opened-on-production.png) | ![The ?lot=043 link, opened on production, opens Lot 043](../screenshots/2701-avp-lot-links/after-opened-on-production.png) |
