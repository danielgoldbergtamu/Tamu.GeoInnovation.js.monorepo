import { mkdtempSync, rmSync, writeFileSync } from 'fs';
import { createServer, IncomingMessage, Server, ServerResponse } from 'http';
import { AddressInfo } from 'net';
import { tmpdir } from 'os';
import { join } from 'path';

import { PptxPreviewConverter } from './pptx-preview.converter';

/**
 * The API's side of the PowerPoint preview service (#3346), against a stand-in for the service on a local port. The
 * service itself is tested in apps/gisday-pptx-preview.
 */
describe('PptxPreviewConverter', () => {
  let folder: string;
  let deck: string;
  let server: Server;
  let answer: (request: IncomingMessage, body: Buffer, response: ServerResponse) => void;
  let previous: string | undefined;
  const converter = new PptxPreviewConverter();

  beforeEach(async () => {
    previous = process.env.PPTX_PREVIEW_URL;
    folder = mkdtempSync(join(tmpdir(), 'pptx-preview-'));
    deck = join(folder, 'deck.pptx');
    writeFileSync(deck, 'a made-up deck');

    server = createServer((request, response) => {
      const chunks: Array<Buffer> = [];
      request.on('data', (c: Buffer) => chunks.push(c));
      request.on('end', () => answer(request, Buffer.concat(chunks), response));
    });
    await new Promise<void>((done) => server.listen(0, '127.0.0.1', done));
    process.env.PPTX_PREVIEW_URL = `http://127.0.0.1:${(server.address() as AddressInfo).port}/`;
  });

  afterEach(async () => {
    process.env.PPTX_PREVIEW_URL = previous;
    await new Promise((done) => server.close(done));
    rmSync(folder, { recursive: true, force: true });
  });

  it('sends the deck, under its name, and gives back the PDF', async () => {
    let seen: { method?: string; url?: string; body?: string } = {};
    answer = (request, body, response) => {
      seen = { method: request.method, url: request.url, body: body.toString() };
      response.writeHead(200, { 'Content-Type': 'application/pdf' }).end('%PDF-1.7 made up');
    };

    const pdf = await converter.toPdf(deck, 'Texas Watersheds.pptx');

    expect(pdf?.toString()).toBe('%PDF-1.7 made up');
    expect(seen).toEqual({ method: 'POST', url: '/convert?name=Texas%20Watersheds.pptx', body: 'a made-up deck' });
  });

  it('gives null when the service cannot convert the deck', async () => {
    answer = (_request, _body, response) => response.writeHead(502).end('LibreOffice failed');

    expect(await converter.toPdf(deck, 'deck.pptx')).toBeNull();
  });

  it('gives null when the service is not there', async () => {
    await new Promise((done) => server.close(done));
    server = createServer();
    server.listen(0);

    expect(await converter.toPdf(deck, 'deck.pptx')).toBeNull();
  });

  it('gives null, and asks nothing, when no service is set', async () => {
    delete process.env.PPTX_PREVIEW_URL;
    answer = () => {
      throw new Error('The service was asked.');
    };

    expect(await converter.toPdf(deck, 'deck.pptx')).toBeNull();
  });
});
