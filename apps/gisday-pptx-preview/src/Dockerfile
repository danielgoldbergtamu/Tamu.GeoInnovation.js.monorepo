# GIS Day's PowerPoint preview service (#3346): built with `nx build gisday-pptx-preview --configuration=production`,
# then `docker build` in dist/apps/gisday-pptx-preview. The service has no dependencies, so main.js is all of the app.
#
# The full libreoffice package, not libreoffice-impress: the smaller one crashed on conversion when the laptop measured
# it (laptop/reports/2026-11-23-8.md on work-mailbox), and the full one adds about 426 MB. Kept out of the API's image on
# purpose (#3346, the maintainer's choice B): the API stays small, and a LibreOffice crash cannot take it down.
FROM node:24.22.3-alpine
# Fonts for the slides' text; without any, LibreOffice draws text in boxes.
RUN apk add --no-cache libreoffice ttf-dejavu \
  && rm -rf /usr/local/lib/node_modules/npm /usr/local/lib/node_modules/corepack /usr/local/bin/npm /usr/local/bin/npx /usr/local/bin/corepack
WORKDIR /app
COPY main.js .
# As the APIs do (#2425): the base image's node user, not root. LibreOffice writes its profile and the deck under /tmp.
USER node
ENV HOME=/tmp
EXPOSE 8080
CMD ["node", "main.js"]
