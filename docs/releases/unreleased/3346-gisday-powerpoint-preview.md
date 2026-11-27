---
issue: 3346
app: gisday
title: PowerPoints preview on a submission's review page
testOnDev: |
  | GIS Day: preview a submission's PowerPoint ([#3346](https://github.com/TamuGeoInnovation/Tamu.GeoInnovation.js.monorepo/issues/3346)) | Not on dev: GIS Day has no dev site yet ([#1525](https://github.com/TamuGeoInnovation/Tamu.GeoInnovation.js.monorepo/issues/1525)). After release, once the preview service runs beside the API, as an admin: Admin, Research Competition, a submission with a .pptx attached | The PowerPoint has a Preview beside its name, as each PDF does. Pressing it reads "Preparing preview…" for a second or two the first time, then shows the slides under the list; a second Preview of it is immediate. Previous and Next page through the PowerPoints and PDFs together. With the service stopped, Preview downloads the deck and says it cannot be previewed right now |
---

### PowerPoints preview on a submission's review page

An admin reviewing a research competition submission could preview its PDFs in the page, but a PowerPoint had no
Preview and had to be downloaded and opened. A PowerPoint now previews too: the first time, the server turns it into a
PDF, which takes a second or two while Preview reads "Preparing preview…", and keeps that PDF, so every later preview is
immediate. Previous and Next page through a submission's PowerPoints and PDFs together. If a PowerPoint cannot be
converted, Preview downloads it, as before, and says so.
([#3346](https://github.com/TamuGeoInnovation/Tamu.GeoInnovation.js.monorepo/issues/3346))

| Desktop, 1280 pixels | Before | After |
| --- | --- | --- |
| A submission's files | ![A Preview beside the PDF only; the PowerPoint is a download](../screenshots/3346-gisday-powerpoint-preview/before-files.png) | ![A Preview beside the PowerPoint and the PDF](../screenshots/3346-gisday-powerpoint-preview/after-files.png) |
| A PowerPoint previewed | | ![The made-up deck's two slides shown under the list, with Previous, Next and Close](../screenshots/3346-gisday-powerpoint-preview/after-preview-pptx.png) |

The submission and its files are made up.
