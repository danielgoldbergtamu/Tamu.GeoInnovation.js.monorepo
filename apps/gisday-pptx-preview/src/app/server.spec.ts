import { AddressInfo } from 'net';
import { Server } from 'http';

import { SUBMISSION_FILE_RULES } from '@tamu-gisc/gisday/common';

import { ConversionTimedOut, createPreviewServer, Converter, DEFAULT_MAX_BYTES } from './server';

/**
 * The conversion service's HTTP side (#3346), with the conversion itself replaced: what it accepts, what it refuses, and
 * what it answers when LibreOffice fails or takes too long. The real conversion is soffice.spec.ts's.
 */
describe('the PowerPoint preview service', () => {
  let server: Server;
  let url: string;
  let convert: ReturnType<typeof vi.fn>;

  async function start(limits: { maxBytes?: number } = {}) {
    server = createPreviewServer(convert as unknown as Converter, { maxBytes: limits.maxBytes ?? 1024 });
    await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve));
    url = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
  }

  const deck = (name: string, body: string | Buffer = 'a made-up deck') =>
    fetch(`${url}/convert?name=${encodeURIComponent(name)}`, {
      method: 'POST',
      // A Buffer is not a fetch body to TypeScript, though Node takes one.
      body: typeof body === 'string' ? body : new Blob([Uint8Array.from(body)])
    });

  beforeEach(() => {
    convert = vi.fn(async () => Buffer.from('%PDF-1.7 made up'));
  });

  afterEach(async () => {
    await new Promise((resolve) => server?.close(resolve));
  });

  it('answers a PowerPoint deck with its PDF', async () => {
    await start();

    const response = await deck('Texas Watersheds.pptx');

    expect(response.status).toBe(200);
    expect(response.headers.get('content-type')).toBe('application/pdf');
    expect(await response.text()).toBe('%PDF-1.7 made up');
    expect(convert).toHaveBeenCalledWith(Buffer.from('a made-up deck'), '.pptx');
  });

  it('takes the older .ppt too', async () => {
    await start();

    expect((await deck('old.ppt')).status).toBe(200);
    expect(convert).toHaveBeenCalledWith(expect.any(Buffer), '.ppt');
  });

  it('refuses anything that is not a PowerPoint file, without converting it', async () => {
    await start();

    expect((await deck('notes.docx')).status).toBe(415);
    expect((await deck('no-extension')).status).toBe(415);
    expect(convert).not.toHaveBeenCalled();
  });

  it('refuses a deck over its size limit, without converting it', async () => {
    await start({ maxBytes: 10 });

    expect((await deck('big.pptx', Buffer.alloc(11))).status).toBe(413);
    expect(convert).not.toHaveBeenCalled();
  });

  it('answers 502 when LibreOffice cannot convert the deck', async () => {
    convert.mockRejectedValue(new Error('soffice exited 1'));
    await start();

    expect((await deck('broken.pptx')).status).toBe(502);
  });

  it('answers 504 when the conversion takes too long', async () => {
    convert.mockRejectedValue(new ConversionTimedOut());
    await start();

    expect((await deck('slow.pptx')).status).toBe(504);
  });

  it('serves only POST /convert, and a health check', async () => {
    await start();

    expect((await fetch(`${url}/convert?name=a.pptx`)).status).toBe(405);
    expect((await fetch(`${url}/elsewhere`, { method: 'POST' })).status).toBe(404);
    expect((await fetch(`${url}/health`)).status).toBe(200);
  });

  it('takes by default as large a deck as the API accepts, so no deck the API kept is refused for its size', () => {
    expect(DEFAULT_MAX_BYTES).toBe(SUBMISSION_FILE_RULES.maxBytes);
  });
});
