---
issue: 3038
title: "GIS Day admin: a refused page says which permission the account lacks, rather than \"try again\""
testOnDev: |
  | GIS Day admin: a refused page names the permission ([#3038](https://github.com/TamuGeoInnovation/Tamu.GeoInnovation.js.monorepo/issues/3038)) | Not on dev: GIS Day has no dev site. After release, sign in as an organizer without RSVP access and open [Dashboards > RSVPs](https://txgisday.org/admin/dashboards/rsvps) | "Your account doesn't have permission to read RSVPs (read:rsvps). An administrator adds it in Auth0; then sign out and back in." in place of "Try again in a moment". As a full admin the dashboard shows as before |
---

### GIS Day admin: a refused page says which permission the account lacks

When an admin dashboard's request was refused, the page said "could not be read. Try again in a moment.", which could
never help: on 15 November the Check-ins dashboard did that on production because its permission had not been defined
in Auth0. The RSVPs, Check-ins and User accounts dashboards now say the account doesn't have permission, name the
permission the server says is missing, and say who adds it. An expired sign-in says to sign in again; any other failure
still says to try again.

Behind it, every refused request from the GIS Day API now names the permission it needed, and a check lists every
permission the API's routes ask for against those the Auth0 setup defines, so a new one cannot be forgotten again. It found one already: the bulk delete of competition submissions
(#2992) asks for `delete:competitions`, which the Auth0 setup did not list.
([#3038](https://github.com/TamuGeoInnovation/Tamu.GeoInnovation.js.monorepo/issues/3038))
