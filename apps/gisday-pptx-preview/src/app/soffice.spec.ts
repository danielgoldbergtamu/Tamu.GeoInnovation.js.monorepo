import { execFileSync } from 'child_process';
import { readFileSync } from 'fs';
import { join } from 'path';

import { ConversionTimedOut } from './server';
import { sofficeConverter } from './soffice';

/** Whether LibreOffice is here: it is in the service's own image, and not in CI's Node image. */
function hasSoffice(): boolean {
  try {
    execFileSync('soffice', ['--version'], { stdio: 'ignore' });
    return true;
  } catch {
    return false;
  }
}

/**
 * The real conversion (#3346), with a made-up two-slide deck in fixtures/: made-up-deck.pptx, converted by LibreOffice
 * from made-up-deck.fodp, which is kept beside it so the deck can be made again. Runs where `soffice` is on the path,
 * such as inside the service's image; skipped elsewhere, where server.spec.ts covers everything but LibreOffice itself.
 */
describe.skipIf(!hasSoffice())('converting with LibreOffice', () => {
  const deck = readFileSync(join(__dirname, '..', 'fixtures', 'made-up-deck.pptx'));

  it('turns the made-up deck into a two-page PDF', async () => {
    const pdf = await sofficeConverter(60_000)(deck, '.pptx');

    expect(pdf.subarray(0, 5).toString()).toBe('%PDF-');
    expect(pdf.toString('latin1').match(/\/Type\s*\/Page[^s]/g)).toHaveLength(2);
  });

  it('gives up on a conversion that takes too long', async () => {
    await expect(sofficeConverter(1)(deck, '.pptx')).rejects.toBeInstanceOf(ConversionTimedOut);
  });
});
