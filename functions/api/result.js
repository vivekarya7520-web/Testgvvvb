const ORIGIN = "https://beu-bih.ac.in";
const H = {
  accept: "application/json, text/plain, */*",
  referer: ORIGIN + "/result-three",
  "user-agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
};

const out = (b, s = 200, extra = {}) =>
  new Response(JSON.stringify(b), {
    status: s,
    headers: { "content-type": "application/json", ...extra },
  });

export async function onRequestGet({ request }) {
  const u = new URL(request.url);
  const p = (k) => u.searchParams.get(k) || "";
  const year = p("year");
  const reg = p("redg_no").replace(/\D/g, "");
  const sem = p("semester");
  const held = p("exam_held");
  const examId = p("exam_id");
  const captcha = p("captcha");

  if (!year || reg.length !== 11 || !sem || !held || !captcha) return out({ error: "invalid" }, 400);

  const key = new Request("https://c.internal/r/" + reg + "/" + sem);
  const hit = await caches.default.match(key);
  if (hit) {
    return new Response(hit.body, {
      headers: { ...Object.fromEntries(hit.headers), "x-source": "cache" },
    });
  }

  let tj;
  try {
    const tRes = await fetch(ORIGIN + "/backend/v1/result/token?captcha=" + encodeURIComponent(captcha), {
      headers: H,
    });
    tj = await tRes.json().catch(() => null);
  } catch {
    return out({ error: "upstream" }, 502);
  }
  if (!tj || !tj.token) return out({ error: "captcha" }, 403);

  const q = new URLSearchParams({
    year,
    redg_no: reg,
    semester: sem,
    exam_held: held,
    exam_id: examId,
    token: tj.token,
  });

  let res;
  try {
    res = await fetch(ORIGIN + "/backend/v1/result/get-result?" + q, {
      headers: { ...H, referer: ORIGIN + "/" },
    });
  } catch {
    return out({ error: "upstream" }, 502);
  }
  if (res.status === 403) return out({ error: "captcha" }, 403);
  if (!res.ok) return out({ error: "upstream", status: res.status }, 502);

  const body = await res.json().catch(() => null);
  if (!body || body.message === "Access denied.") return out({ error: "captcha" }, 403);
  if (!body.data) return out({ error: "not_found" }, 404);

  const cacheable = new Response(JSON.stringify(body), {
    headers: { "content-type": "application/json", "cache-control": "public, max-age=600" },
  });
  await caches.default.put(key, cacheable.clone());

  return new Response(JSON.stringify(body), {
    headers: { "content-type": "application/json", "x-source": "beu" },
  });
}
