import { createServer, IncomingMessage, Server, ServerResponse } from 'http';

/** Turns a deck's bytes into a PDF's, or rejects: `ConversionTimedOut` when it took too long. */
export type Converter = (deck: Buffer, extension: '.ppt' | '.pptx') => Promise<Buffer>;

/** Thrown by a converter that gave up waiting, so the service can say 504 rather than 502. */
export class ConversionTimedOut extends Error {
  constructor() {
    super('The conversion took too long.');
    this.name = 'ConversionTimedOut';
  }
}

/** The extensions the service converts: a PowerPoint deck, old or new. */
function deckExtension(name: string): '.ppt' | '.pptx' | null {
  const extension = /\.[^.]+$/.exec(name.toLowerCase())?.[0];

  return extension === '.ppt' || extension === '.pptx' ? extension : null;
}

/**
 * The PowerPoint preview service (#3346): `POST /convert?name=<file name>` with a deck's bytes answers its PDF.
 *
 * It holds no state and keeps nothing: the API stores the PDF beside the deck and asks once per deck. Only the API can
 * reach it, inside the cluster, so it has no sign-in of its own. A deck over `maxBytes` is refused before any of it is
 * converted, a file that is not a PowerPoint is refused by its name, and a conversion that fails or takes too long is
 * an error the API answers with today's download. `GET /health` answers for the deployment's probes.
 */
export function createPreviewServer(convert: Converter, limits: { maxBytes: number }): Server {
  return createServer((request, response) => {
    handle(request, response, convert, limits).catch(() => answer(response, 500, 'The preview could not be made.'));
  });
}

async function handle(
  request: IncomingMessage,
  response: ServerResponse,
  convert: Converter,
  limits: { maxBytes: number }
): Promise<void> {
  const url = new URL(request.url ?? '/', 'http://service');

  if (url.pathname === '/health') {
    return answer(response, 200, 'ok');
  }

  if (url.pathname !== '/convert') {
    return answer(response, 404, 'Not found.');
  }

  if (request.method !== 'POST') {
    return answer(response, 405, 'POST a deck to /convert.');
  }

  const extension = deckExtension(url.searchParams.get('name') ?? '');

  if (!extension) {
    request.resume();
    return answer(response, 415, 'Only a PowerPoint deck (.ppt, .pptx) converts.');
  }

  const deck = await readUpTo(request, limits.maxBytes);

  if (!deck) {
    return answer(response, 413, `A deck may be at most ${limits.maxBytes} bytes.`);
  }

  try {
    const pdf = await convert(deck, extension);

    response.writeHead(200, { 'content-type': 'application/pdf', 'content-length': pdf.length });
    response.end(pdf);
  } catch (err) {
    if (err instanceof ConversionTimedOut) {
      return answer(response, 504, err.message);
    }

    answer(response, 502, 'The deck could not be converted.');
  }
}

/** The request's body, or null as soon as it passes `maxBytes`, without reading the rest into memory. */
function readUpTo(request: IncomingMessage, maxBytes: number): Promise<Buffer | null> {
  return new Promise((resolve, reject) => {
    const chunks: Array<Buffer> = [];
    let length = 0;
    let over = false;

    request.on('data', (chunk: Buffer) => {
      length += chunk.length;

      if (length > maxBytes) {
        over = true;
        chunks.length = 0;
      } else if (!over) {
        chunks.push(chunk);
      }
    });
    request.on('end', () => resolve(over ? null : Buffer.concat(chunks)));
    request.on('error', reject);
  });
}

function answer(response: ServerResponse, status: number, message: string): void {
  if (response.headersSent) {
    response.end();
    return;
  }

  response.writeHead(status, { 'content-type': 'text/plain; charset=utf-8' });
  response.end(message);
}
