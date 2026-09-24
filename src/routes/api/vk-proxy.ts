import { createFileRoute } from "@tanstack/react-router";

const BROWSER_HEADERS = {
  "User-Agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36",
  Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
  "Accept-Language": "en-US,en;q=0.9",
  "Upgrade-Insecure-Requests": "1",
};

const BLOCKED_RESPONSE_HEADERS = [
  "x-frame-options",
  "content-security-policy",
  "content-security-policy-report-only",
  "cross-origin-opener-policy",
  "cross-origin-embedder-policy",
  "content-encoding",
  "content-length",
];

function isAllowedTarget(raw: string): URL | null {
  try {
    const url = new URL(raw);
    if (url.protocol !== "https:" && url.protocol !== "http:") return null;
    const host = url.hostname.toLowerCase();
    const ok =
      host === "vk.com" ||
      host.endsWith(".vk.com") ||
      host === "vkvideo.ru" ||
      host.endsWith(".vkvideo.ru") ||
      host === "vk.ru" ||
      host.endsWith(".vk.ru") ||
      host.endsWith(".userapi.com") ||
      host.endsWith(".mycdn.me");
    return ok ? url : null;
  } catch {
    return null;
  }
}

// vk.com/video-123_456 endlessly redirects for anonymous visitors; the
// embeddable player URL does not, so normalise to it whenever possible.
function normalizeVkUrl(url: URL): URL {
  const match = url.pathname.match(/^\/video(-?\d+)_(\d+)/);
  if (!match) return url;
  const embed = new URL("https://vk.com/video_ext.php");
  embed.searchParams.set("oid", match[1]!);
  embed.searchParams.set("id", match[2]!);
  embed.searchParams.set("hd", "2");
  const hash = url.searchParams.get("hash");
  if (hash) embed.searchParams.set("hash", hash);
  return embed;
}

// Manual redirect following with a cookie jar: VK bounces anonymous requests
// through cookie-setting hops that a plain follow treats as a redirect loop.
async function fetchWithCookies(start: URL): Promise<Response> {
  let current = start;
  const cookies = new Map<string, string>();

  for (let hop = 0; hop < 8; hop++) {
    const cookieHeader = [...cookies].map(([k, v]) => `${k}=${v}`).join("; ");
    const res = await fetch(current.toString(), {
      redirect: "manual",
      headers: {
        ...BROWSER_HEADERS,
        Referer: `${current.origin}/`,
        ...(cookieHeader ? { Cookie: cookieHeader } : {}),
      },
    });

    for (const raw of res.headers.getSetCookie?.() ?? []) {
      const pair = raw.split(";")[0]?.split("=");
      if (pair && pair[0] && pair[1] !== undefined) cookies.set(pair[0].trim(), pair[1]);
    }

    const location = res.headers.get("location");
    if (res.status >= 300 && res.status < 400 && location) {
      current = new URL(location, current);
      continue;
    }
    return res;
  }

  throw new Error("Too many redirects");
}

function fallbackPage(url: string): Response {
  const safe = url.replace(/"/g, "&quot;");
  return new Response(
    `<!doctype html><html><head><meta charset="utf-8"><title>Stream unavailable</title></head>
<body style="margin:0;display:flex;height:100vh;align-items:center;justify-content:center;background:#0F141C;color:#e2e8f0;font-family:system-ui,sans-serif;text-align:center">
<div><p style="font-size:14px">This VK stream could not be loaded here.</p>
<a href="${safe}" target="_blank" rel="noopener noreferrer" style="display:inline-block;margin-top:12px;padding:10px 18px;border-radius:12px;background:#e11d48;color:#fff;text-decoration:none;font-size:14px">Open on VK</a></div>
</body></html>`,
    { status: 200, headers: { "content-type": "text/html; charset=utf-8" } },
  );
}

function injectBase(html: string, origin: string): string {
  const baseTag = `<base href="${origin}/">`;
  if (/<base\s/i.test(html)) return html;
  if (/<head[^>]*>/i.test(html)) {
    return html.replace(/<head[^>]*>/i, (m) => `${m}${baseTag}`);
  }
  return `${baseTag}${html}`;
}

export const Route = createFileRoute("/api/vk-proxy")({
  server: {
    handlers: {
      OPTIONS: async () =>
        new Response(null, {
          status: 204,
          headers: {
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "GET, OPTIONS",
            "Access-Control-Allow-Headers": "Content-Type",
          },
        }),

      GET: async ({ request }) => {
        const target = new URL(request.url).searchParams.get("url");
        if (!target) {
          return new Response("Missing url parameter", { status: 400 });
        }

        const allowed = isAllowedTarget(target);
        if (!allowed) {
          return new Response("Only VK video URLs can be proxied", { status: 403 });
        }

        let upstream: Response;
        try {
          upstream = await fetchWithCookies(normalizeVkUrl(allowed));
        } catch (error) {
          console.error("vk-proxy upstream failure", error);
          return fallbackPage(allowed.toString());
        }
        if (upstream.status >= 400) {
          return fallbackPage(allowed.toString());
        }

        const headers = new Headers();
        upstream.headers.forEach((value, key) => {
          if (!BLOCKED_RESPONSE_HEADERS.includes(key.toLowerCase())) headers.set(key, value);
        });
        headers.set("Access-Control-Allow-Origin", "*");

        const contentType = upstream.headers.get("content-type") ?? "";
        if (!contentType.includes("text/html")) {
          return new Response(upstream.body, { status: upstream.status, headers });
        }

        const html = injectBase(await upstream.text(), allowed.origin);
        headers.set("content-type", "text/html; charset=utf-8");
        return new Response(html, { status: upstream.status, headers });
      },
    },
  },
});
