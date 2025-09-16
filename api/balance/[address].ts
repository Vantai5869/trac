import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const address = req.query.address as string;
  if (!address) {
    res.status(400).json({ error: 'Missing address' });
    return;
  }

  const httpsBase = process.env.TRAC_BASE_URL || 'https://trac.intern.ungueltig.com:1337';
  const httpBase = 'http://trac.intern.ungueltig.com:1337';
  const httpsUrl = `${httpsBase}/balance/${encodeURIComponent(address)}`;
  const httpUrl = `${httpBase}/balance/${encodeURIComponent(address)}`;

  try {
    // Try HTTPS first (Vercel uses valid cert trust). If fails, fallback HTTP.
    let upstream = await fetch(httpsUrl);
    if (!upstream.ok) {
      upstream = await fetch(httpUrl);
    }

    const text = await upstream.text();
    const contentType = upstream.headers.get('content-type') || '';
    if (contentType.includes('application/json')) {
      try {
        const json = JSON.parse(text);
        res.status(upstream.status).json(json);
        return;
      } catch {}
    }
    res
      .status(upstream.status)
      .setHeader('Content-Type', contentType || 'text/plain; charset=utf-8')
      .send(text);
  } catch (err: any) {
    res.status(500).json({ error: 'Proxy fetch failed', message: err?.message || String(err) });
  }
}


