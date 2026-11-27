const SEMGET = "https://beu-bih.ac.in/backend/v1/result/sem-get";

export async function onRequestGet() {
  try {
    const r = await fetch(SEMGET, { headers: { accept: "application/json" } });
    const d = await r.json();
    return new Response(JSON.stringify(d), {
      headers: { "content-type": "application/json", "cache-control": "public, max-age=21600" },
    });
  } catch {
    return new Response(JSON.stringify({ error: "exams fetch fail" }), { status: 502 });
  }
}
