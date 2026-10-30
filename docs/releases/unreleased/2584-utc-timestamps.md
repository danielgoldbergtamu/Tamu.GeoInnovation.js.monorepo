---
issue: 2584
title: GIS Day saves times as true UTC instants
testOnDev: |
  | GIS Day: times it saves ([#2584](https://github.com/TamuGeoInnovation/Tamu.GeoInnovation.js.monorepo/issues/2584)) | Not on dev: GIS Day has no dev site yet ([#1525](https://github.com/TamuGeoInnovation/Tamu.GeoInnovation.js.monorepo/issues/1525)). On production after release, with the database migration run first: check in to an event, then read the new row's `created` in the database | `created` is the moment you checked in, with the offset of the database server (`-06:00` in winter), and `SYSUTCDATETIME()` read at the same moment is 6 hours later than the time shown. Editing a speaker, then reading its `updated`, is also the moment of the edit. Before the fix it read 5 to 6 hours early |
---

### GIS Day: the times it saves are the moment they happened

Every row GIS Day saves has a `created` and an `updated` time. The database filled them in with `getdate()`, which is
the database server's **local** time, and the column stores it as if it were UTC. Production's server is on Central
time, so every time was saved 5 hours early in summer and 6 in winter. Nothing on screen showed it, but the VGI
competition compares each submission's `created` with the start and end of its scoring window, and would have
counted submissions from about 6 AM Saturday 14 November to 5 PM Friday 20 November instead of from midnight to 11 AM.

Now the API stamps `created` and `updated` itself with its own clock, which is UTC wherever the database runs, and
the database's defaults for the 68 columns are `SYSDATETIMEOFFSET()`, the true instant. A new migration,
`UtcTimestamps`, changes the 68 defaults and nothing else. **Run the migration before rolling out the new image**
([docs/gisday-migrations.md](../../gisday-migrations.md)). Rows already saved are not changed.

**Times saved before this fix read 5 to 6 hours early**: check-in times, registration times, submission times, and
every row's `created` and `updated`. A report that compares them with the clock needs to allow for that. The new
migration does not correct them, so a VGI submission made before the fix is not placed correctly in the scoring window.
