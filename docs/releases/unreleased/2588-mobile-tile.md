---
issue: 2588
title: A phone menu tile can be tapped anywhere, not only on its word
testOnDev: |
  | Phone menus: the whole tile is tappable ([#2588](https://github.com/TamuGeoInnovation/Tamu.GeoInnovation.js.monorepo/issues/2588)) | Not on dev for GIS Day, which has no dev site yet ([#1525](https://github.com/TamuGeoInnovation/Tamu.GeoInnovation.js.monorepo/issues/1525)). On production after release: [txgisday.org](https://txgisday.org) on a phone, or a desktop browser narrowed to phone width, then the menu button | Tap a tile's icon or the space around its word: Sessions, Presenters, Competitions and FAQs open their pages, About opens its submenu, and Login goes to sign-in. With a keyboard, Tab reaches each tile in turn, with an outline around it, and Enter opens it |
---

### Phone menu tiles can be tapped anywhere

In the GIS Day phone menu, only a tile's word was a link. The word is a tenth of the tile or less, so a tap on the
icon, or anywhere else on the white square, did nothing, and a keyboard could not reach the tiles at all.

The whole tile now follows its link, opens its submenu, or does what its word does (Login). A tile with a link is a
link to a keyboard and a screen reader, and About a button: Tab reaches each in turn, with an outline, and Enter opens
it. The change is in the shared tile library, so the GeoServices documentation's phone menu, which uses the same tiles,
gets it too ([#2588](https://github.com/TamuGeoInnovation/Tamu.GeoInnovation.js.monorepo/issues/2588)).

The red boxes below mark what can be tapped. They were drawn for these pictures and are not part of the menu.

| | Before | After |
| --- | --- | --- |
| The menu, as it looks | ![The GIS Day phone menu](../screenshots/2588-mobile-tile/before-menu.png) | |
| What can be tapped | ![Only each word](../screenshots/2588-mobile-tile/before-menu-tap-areas.png) | ![Each whole tile](../screenshots/2588-mobile-tile/after-menu-tap-areas.png) |
| A keyboard on the first tile | | ![Sessions outlined](../screenshots/2588-mobile-tile/after-keyboard-focus.png) |
