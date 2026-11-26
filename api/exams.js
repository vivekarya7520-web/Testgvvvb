const SEMGET = 'https://beu-bih.ac.in/backend/v1/result/sem-get';
let cache = { t: 0, d: null };

export default async function handler(req, res) {
  if (cache.d && Date.now() - cache.t < 6 * 3600e3) {
    res.setHeader('cache-control', 's-maxage=21600, stale-while-revalidate=86400');
    return res.json(cache.d);
  }
  try {
    const r = await fetch(SEMGET, { headers: { accept: 'application/json' } });
    const d = await r.json();
    cache = { t: Date.now(), d };
    res.setHeader('cache-control', 's-maxage=21600, stale-while-revalidate=86400');
    res.json(d);
  } catch {
    res.status(502).json({ error: 'exams fetch fail' });
  }
}
