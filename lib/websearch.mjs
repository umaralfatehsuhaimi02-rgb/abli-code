function clean(t) {
  return String(t || '').replace(/<[^>]+>/g, '').replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#x27;|&#39;/g, "'").replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/\s+/g, ' ').trim();
}
export async function searchWeb(q) {
  const r = await fetch('https://html.duckduckgo.com/html/', {
    method: 'POST',
    headers: { 'content-type': 'application/x-www-form-urlencoded', 'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120 Safari/537.36' },
    body: 'q=' + encodeURIComponent(q),
    signal: AbortSignal.timeout(8000)
  });
  if (!r.ok) return [];
  const h = await r.text();
  const out = [];
  const re = /class="result__a"[^>]*href="([^"]+)"[^>]*>([\s\S]*?)<\/a>[\s\S]*?class="result__snippet"[^>]*>([\s\S]*?)<\/a>/g;
  for (const m of h.matchAll(re)) {
    let url = m[1].replace(/&amp;/g, '&');
    const u = url.match(/[?&]uddg=([^&]+)/);
    if (u) { try { url = decodeURIComponent(u[1]); } catch {} }
    if (url.startsWith('//')) url = 'https:' + url;
    if (!/^https?:\/\//.test(url)) continue;
    out.push({ title: clean(m[2]).slice(0, 140), url, snippet: clean(m[3]).slice(0, 320) });
    if (out.length >= 5) break;
  }
  return out;
}
