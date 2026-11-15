---
issue: 3026
title: "GIS Day admin: the Research Competitions table fits 1280 px without scrolling"
testOnDev: |
  | GIS Day admin: the submissions table fits 1280 px ([#3026](https://github.com/TamuGeoInnovation/Tamu.GeoInnovation.js.monorepo/issues/3026)) | Not on dev: GIS Day has no dev site. After release, as an admin open [Research Competitions](https://txgisday.org/admin/research-competition) in a window 1280 px and then 1024 px wide | At 1280 px every column, Final file and Status included, is in view with no sideways scroll in the table or the page; Type, Format, Classification, Final file and Status read whole ("Pending Review", "Presentation", "Undergraduate"); Name, Submitted by and Department / major are narrow and wrap, the Department heading may be cut; at 1024 px the table scrolls sideways in its own box to Final file and Status |
---

### GIS Day admin: the Research Competitions table fits 1280 px without scrolling

At 1280 px the submissions table still scrolled sideways in its own box to reach Final file and Status: its columns
at their narrowest added up to 1100 px, in a box of 879. The columns whose text wraps, Name, Submitted by and
Department / major, now give up that width, so the table fits the box and every column is in view at 1280 px. The
columns that hold a value whole keep their widths, so Status, Type, Format, Classification and Final file still read
whole. The cost is that the three wrapping columns are narrow at 1280 px, their text running over many lines, and
the Department / major heading is cut; they widen wherever the screen is wider. Below 1280 px the table still
scrolls in its own box.
([#3026](https://github.com/TamuGeoInnovation/Tamu.GeoInnovation.js.monorepo/issues/3026))

| Research Competitions, sorted by Status, local test submissions (other rows greyed out) | Before | After |
| --- | --- | --- |
| 1280 pixels wide | ![The table scrolling in its own box, Final file and Status out of view](../screenshots/3026-columns-fit-1280/before-1280.png) | ![Every column in view with no scrolling; Name, Submitted by and Department / major narrow and wrapping over many lines](../screenshots/3026-columns-fit-1280/after-1280.png) |
| 1024 pixels wide | ![The table scrolling in its own box from Format on](../screenshots/3026-columns-fit-1280/before-1024.png) | ![The table scrolling in its own box to Final file and Status, the wrapping columns narrow](../screenshots/3026-columns-fit-1280/after-1024.png) |
