import { spawn } from 'child_process';
import { mkdtemp, readFile, rm, writeFile } from 'fs/promises';
import { tmpdir } from 'os';
import { join } from 'path';

import { ConversionTimedOut, Converter } from './server';

/**
 * A converter that runs LibreOffice headless (#3346): the deck is written to a folder of its own, converted with
 * `soffice --convert-to pdf`, and the folder removed whatever happens. `timeoutMs` kills a conversion that hangs.
 *
 * Each conversion gets its own LibreOffice profile folder too (`-env:UserInstallation`), so two at once do not fight
 * over the default profile's lock, which makes the second one exit without converting. The laptop measured about 0.4 s
 * for a 10-slide deck, 1.1 s on a first run (laptop/reports/2026-11-23-8.md on work-mailbox).
 */
export function sofficeConverter(timeoutMs: number, command = 'soffice'): Converter {
  return async (deck, extension) => {
    const folder = await mkdtemp(join(tmpdir(), 'pptx-preview-'));

    try {
      const input = join(folder, `deck${extension}`);

      await writeFile(input, deck);
      await run(
        command,
        [
          '--headless',
          `-env:UserInstallation=file://${join(folder, 'profile')}`,
          '--convert-to',
          'pdf',
          '--outdir',
          folder,
          input
        ],
        timeoutMs
      );

      return await readFile(join(folder, 'deck.pdf'));
    } finally {
      await rm(folder, { recursive: true, force: true });
    }
  };
}

function run(command: string, args: Array<string>, timeoutMs: number): Promise<void> {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, { stdio: 'ignore' });
    const timer = setTimeout(() => {
      child.kill('SIGKILL');
      reject(new ConversionTimedOut());
    }, timeoutMs);

    child.on('error', (err) => {
      clearTimeout(timer);
      reject(err);
    });
    child.on('exit', (code) => {
      clearTimeout(timer);

      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`${command} exited ${code}`));
      }
    });
  });
}
