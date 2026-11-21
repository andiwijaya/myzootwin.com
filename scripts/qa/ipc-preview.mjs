import { preview } from 'astro';
import { randomUUID } from 'node:crypto';
import { mkdtemp, rmdir } from 'node:fs/promises';
import { Agent, get } from 'node:http';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

/** Exercise Astro's actual preview handler over private local IPC. */
export async function withIpcPreview(root, run) {
  const windows = process.platform === 'win32';
  const directory = windows ? null : await mkdtemp(join(tmpdir(), 'myzootwin-qa-'));
  const socketPath = windows ? '\\\\.\\pipe\\myzootwin-qa-' + randomUUID() : join(directory, 'preview.sock');
  // Reuse one connection so concurrent browser asset requests cannot exhaust the private pipe.
  const agent = new Agent({ keepAlive: true, maxSockets: 1 });
  let instance;
  try {
    instance = await preview({ root, logLevel: 'silent', server: { host: '127.0.0.1', port: 0 } });
    const server = instance.server;
    // Keep the installed Astro/Vite HTTP handler and release its TCP listener.
    await new Promise((resolve, reject) => server.close(error => error ? reject(error) : resolve()));
    await new Promise((resolve, reject) => {
      const onError = error => reject(error);
      server.once('error', onError);
      server.listen(socketPath, () => { server.off('error', onError); resolve(); });
    });
    return await run(path => new Promise((resolve, reject) => {
      const request = get({ agent, socketPath, path, headers: { Host: 'localhost', Accept: '*/*' }, signal: AbortSignal.timeout(15_000) }, response => {
        const chunks = [];
        response.on('data', chunk => chunks.push(chunk));
        response.on('error', reject);
        response.on('end', () => {
          const body = Buffer.concat(chunks);
          const status = response.statusCode;
          resolve({ status, ok: status >= 200 && status < 300, headers: response.headers, body, text: async () => body.toString('utf8') });
        });
      });
      request.on('error', reject);
    }));
  } finally {
    agent.destroy();
    try { await instance?.stop(); }
    finally { if (directory) await rmdir(directory); }
  }
}
