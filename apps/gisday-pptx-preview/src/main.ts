import { DEFAULT_MAX_BYTES, createPreviewServer } from './app/server';
import { sofficeConverter } from './app/soffice';

/**
 * GIS Day's PowerPoint preview service (#3346): a submission's deck in, its PDF out, for the admins' review page. The
 * API calls it on a deck's first preview and keeps the PDF beside the deck; see `PptxPreviewConverter` in
 * libs/gisday/platform/data-api.
 *
 * PORT (8080), MAX_BYTES (104857600, 100 MB, as the API accepts) and TIMEOUT_MS (60000) can be set from the environment.
 */
const port = Number(process.env.PORT ?? 8080);
const maxBytes = Number(process.env.MAX_BYTES ?? DEFAULT_MAX_BYTES);
const timeoutMs = Number(process.env.TIMEOUT_MS ?? 60_000);

createPreviewServer(sofficeConverter(timeoutMs), { maxBytes }).listen(port, '0.0.0.0', () => {
  console.log(`PowerPoint preview service listening on ${port}`);
});
