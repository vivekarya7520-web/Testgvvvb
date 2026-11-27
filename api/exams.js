const SEMGET = "https://beu-bih.ac.in/backend/v1/result/sem-get";

export default async function handler(req, res) {
  try {
    const r = await fetch(SEMGET, { headers: { accept: "application/json" } });
    if (!r.ok) throw 0;
    const d = await r.json();
    res.setHeader("cache-control", "s-maxage=21600, stale-while-revalidate=86400");
    res.status(200).json(d);
  } catch {
    res.status(502).json({ error: "exams fetch fail" });
  }
}
