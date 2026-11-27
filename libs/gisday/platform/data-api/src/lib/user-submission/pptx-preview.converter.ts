import { readFile } from 'fs/promises';

import { Injectable, Logger } from '@nestjs/common';

/** How long a conversion may take before the preview falls back to the download. The service gives up at 60 s itself. */
const CONVERSION_TIMEOUT_MS = 90_000;

/**
 * Turns a submission's PowerPoint into a PDF through GIS Day's preview service (#3346), `apps/gisday-pptx-preview`,
 * found at PPTX_PREVIEW_URL. LibreOffice runs there, not in the API, so the API's image stays small and a LibreOffice
 * crash cannot take the API down.
 *
 * Never throws: null whenever there is no PDF, the service unset, down, slow or refusing the file, so the preview
 * answers as it did before the service existed, and the deck is downloaded.
 */
@Injectable()
export class PptxPreviewConverter {
  public async toPdf(deckPath: string, name: string): Promise<Buffer | null> {
    const base = process.env.PPTX_PREVIEW_URL;

    if (!base) {
      return null;
    }

    try {
      const response = await fetch(`${base.replace(/\/+$/, '')}/convert?name=${encodeURIComponent(name)}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/octet-stream' },
        body: await readFile(deckPath),
        signal: AbortSignal.timeout(CONVERSION_TIMEOUT_MS)
      });

      if (!response.ok) {
        Logger.warn(`The preview service could not convert ${name}: ${response.status}.`, 'PptxPreviewConverter');
        return null;
      }

      return Buffer.from(await response.arrayBuffer());
    } catch (error) {
      Logger.warn(`The preview service did not answer for ${name}: ${(error as Error).message}`, 'PptxPreviewConverter');
      return null;
    }
  }
}
