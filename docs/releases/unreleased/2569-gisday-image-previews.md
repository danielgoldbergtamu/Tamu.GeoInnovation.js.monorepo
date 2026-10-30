---
issue: 2569
title: No image upload or logo shows a broken image, and the class banner sits only on a photo
testOnDev: |
  | GIS Day: image previews and the class banner ([#2569](https://github.com/TamuGeoInnovation/Tamu.GeoInnovation.js.monorepo/issues/2569), [#2568](https://github.com/TamuGeoInnovation/Tamu.GeoInnovation.js.monorepo/issues/2568)) | Not on dev: GIS Day has no dev site yet ([#1525](https://github.com/TamuGeoInnovation/Tamu.GeoInnovation.js.monorepo/issues/1525)). On production after release, as an admin: Admin, Affiliations, Add; Sponsors, Add; Venues, Add; Speakers, Add. Public: [Presenters](https://gisday.tamu.edu/presenters) | Each Add form shows an icon (a building, a place, a person), not a broken "Logo preview" or "Speaker photo preview" image, until a picture is chosen; choosing one previews it, and Undo brings the icon back. Speakers, Add with a school and a graduation year but no photo shows no class banner. On Presenters, a card without a photo has no banner |
---

### GIS Day: no image upload or logo shows a broken image

Every admin form with an image upload (Affiliations, Sponsors, Venues and Speakers) showed a broken image until a
picture was chosen. Adding a venue never previewed the chosen logo at all, and none went back on Undo. They now
show an icon (a building, a place or a person) until there is a picture, preview the chosen one, and return on Undo.
The same applies when a saved picture is missing. On the home and About pages, a sponsor or organization with no
logo shows its name rather than a broken image.

The class banner (for example "UTT '13") is drawn on a presenter's photo only, never over the blank person icon, in
the speaker form, on the Presenters cards and on a presenter's own page.

| | Before | After |
| --- | --- | --- |
| Admin, Affiliations, Add | ![A broken "Logo preview" image above Select Logo Image](../screenshots/2569-image-previews/before-affiliation.png) | ![A grey square with a building icon above Select Logo Image](../screenshots/2569-image-previews/after-affiliation.png) |
| Admin, Sponsors, Add | ![A broken "Logo preview" image](../screenshots/2569-image-previews/before-sponsor.png) | ![A grey square with a building icon](../screenshots/2569-image-previews/after-sponsor.png) |
| Admin, Organizations, Add (the place form) | ![A broken "Logo preview" image under Organization Logo](../screenshots/2569-image-previews/before-organization.png) | ![A grey square with a place marker under Organization Logo](../screenshots/2569-image-previews/after-organization.png) |
| Admin, Speakers, Add, with Texas A&M University and 2027 but no photo | ![A "TAMU '27" banner drawn over a thin strip with the person icon](../screenshots/2569-image-previews/before-speaker-no-photo.png) | ![The person icon in a grey square, with no banner](../screenshots/2569-image-previews/after-speaker-no-photo.png) |
| Presenters, a presenter whose photo file is missing | ![A "TAMU '27" banner over the person icon](../screenshots/2569-image-previews/before-presenter-card.png) | ![The person icon, with no banner](../screenshots/2569-image-previews/after-presenter-card.png) |
| Admin, Speakers, Add: a picture chosen, then Undo | | ![The chosen picture previewed, with its file name and Undo](../screenshots/2569-image-previews/after-speaker-photo-chosen.png) ![After Undo, the person icon again](../screenshots/2569-image-previews/after-speaker-photo-undone.png) |
