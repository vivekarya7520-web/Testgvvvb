const ORIGIN = "https://beu-bih.ac.in";
const H = {
  accept: "application/json, text/plain, */*",
  referer: ORIGIN + "/result-three",
  "user-agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
};

export default async function handler(req, res) {
  res.setHeader("content-type", "application/json");

  const p = (k) => String(req.query[k] || "");
  const year = p("year");
  const reg = p("redg_no").replace(/\D/g, "");
  const sem = p("semester");
  const held = p("exam_held");
  const examId = p("exam_id");
  const captcha = p("captcha");

  if (!year || reg.length !== 11 || !sem || !held || !captcha) {
    return res.status(400).json({ error: "invalid" });
  }

  let tj;
  try {
    const tRes = await fetch(
      ORIGIN + "/backend/v1/result/token?captcha=" + encodeURIComponent(captcha),
      { headers: H }
    );
    tj = await tRes.json().catch(() => null);
  } catch {
    return res.status(502).json({ error: "upstream" });
  }
  if (!tj || !tj.token) return res.status(403).json({ error: "captcha" });

  const q = new URLSearchParams({
    year,
    redg_no: reg,
    semester: sem,
    exam_held: held,
    exam_id: examId,
    token: tj.token,
  });

  let r;
  try {
    r = await fetch(ORIGIN + "/backend/v1/result/get-result?" + q, {
      headers: { ...H, referer: ORIGIN + "/" },
    });
  } catch {
    return res.status(502).json({ error: "upstream" });
  }
  if (r.status === 403) return res.status(403).json({ error: "captcha" });
  if (!r.ok) return res.status(502).json({ error: "upstream", status: r.status });

  const body = await r.json().catch(() => null);
  if (!body || body.message === "Access denied.") return res.status(403).json({ error: "captcha" });
  if (!body.data) return res.status(404).json({ error: "not_found" });

  res.setHeader("cache-control", "s-maxage=600, stale-while-revalidate=3600");
  res.status(200).json(body);
}
headers: {
  "Origin": "https://beu-bih.ac.in",
  "Referer": "https://beu-bih.ac.in/result-two",
  "User-Agent": "Mozilla/5.0 (Linux; Android 13) AppleWebKit/537.36 Chrome/120 Mobile Safari/537.36",
  "Accept": "application/json, text/plain, */*"
}
