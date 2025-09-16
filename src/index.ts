import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import { fetch } from 'undici';

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(morgan('dev'));

app.get('/health', (_req:any, res:any) => res.json({ ok: true }));

// Proxy endpoint: returns upstream response verbatim (JSON or text)
app.get('/balance/:address', async (req:any, res:any) => {
  const { address } = req.params;
  if (!address) {
    res.status(400).json({ error: 'Missing address' });
    return;
  }

  const httpsBase = process.env.TRAC_BASE_URL || 'https://trac.intern.ungueltig.com:1337';
  const httpBase = 'http://trac.intern.ungueltig.com:1337';
  const httpsUrl = `${httpsBase}/balance/${encodeURIComponent(address)}`;
  const httpUrl = `${httpBase}/balance/${encodeURIComponent(address)}`;

  async function fetchWithTlsBypass(targetUrl: string) {
    const prev = process.env.NODE_TLS_REJECT_UNAUTHORIZED;
    process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
    try {
      return await fetch(targetUrl, { method: 'GET' });
    } finally {
      if (prev === undefined) delete process.env.NODE_TLS_REJECT_UNAUTHORIZED;
      else process.env.NODE_TLS_REJECT_UNAUTHORIZED = prev;
    }
  }

  try {
    let upstream = null as any;
    try {
      upstream = await fetchWithTlsBypass(httpsUrl);
    } catch (e: any) {
      console.warn('[proxy] HTTPS failed, fallback to HTTP:', e?.message || e);
      upstream = await fetch(httpUrl, { method: 'GET' });
    }

    const status = upstream.status;
    const contentType = upstream.headers.get('content-type') || '';
    const body = await upstream.text();

    if (contentType.includes('application/json')) {
      try {
        const json = JSON.parse(body);
        res.status(status).json(json);
        return;
      } catch {}
    }

    res.status(status).set('Content-Type', contentType || 'text/plain; charset=utf-8').send(body);
  } catch (err: any) {
    console.error('[proxy] error:', err);
    res.status(500).json({ error: 'Proxy fetch failed', message: err?.message || String(err) });
  }
});

app.listen(PORT, () => {
  // eslint-disable-next-line no-console
  console.log(`TRAC proxy listening on :${PORT}`);
});
