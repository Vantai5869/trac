import express from 'express';
import cors from 'cors';
import morgan from 'morgan';

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(morgan('dev'));

app.get('/health', (_req, res) => {
  res.json({ ok: true });
});

app.get('/balance/:address', async (req, res) => {
  const { address } = req.params;
  if (!address) return res.status(400).json({ error: 'Missing address' });

  const httpsBase = process.env.TRAC_BASE_URL || 'https://trac.intern.ungueltig.com:1337';
  const httpBase = 'http://trac.intern.ungueltig.com:1337';
  const httpsUrl = `${httpsBase}/balance/${encodeURIComponent(address)}`;
  const httpUrl = `${httpBase}/balance/${encodeURIComponent(address)}`;

  // Helper: fetch with TLS bypass (for self-signed certs during dev)
  async function fetchWithTlsBypass(url) {
    const prev = process.env.NODE_TLS_REJECT_UNAUTHORIZED;
    process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
    try {
      const res = await fetch(url);
      return res;
    } finally {
      if (prev === undefined) delete process.env.NODE_TLS_REJECT_UNAUTHORIZED;
      else process.env.NODE_TLS_REJECT_UNAUTHORIZED = prev;
    }
  }

  try {
    let upstream;
    try {
      upstream = await fetchWithTlsBypass(httpsUrl);
    } catch {
      upstream = await fetch(httpUrl);
    }

    const text = await upstream.text();
    const ct = upstream.headers.get('content-type') || '';
    if (ct.includes('application/json')) {
      try {
        return res.status(upstream.status).json(JSON.parse(text));
      } catch {}
    }
    res.status(upstream.status).type(ct || 'text/plain').send(text);
  } catch (err) {
    res.status(500).json({ error: 'Proxy fetch failed', message: err?.message || String(err) });
  }
});

app.listen(PORT, () => {
  console.log(`TRAC proxy listening on :${PORT}`);
});


