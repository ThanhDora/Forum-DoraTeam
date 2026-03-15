const BACKEND_URL = process.env.API_URL ?? process.env.BACKEND_URL;
const BACKEND_TIMEOUT_MS = 15000;

export const dynamic = "force-dynamic";

async function proxy(path: string, request: Request) {
  let body: unknown = null;
  if (request.method !== "GET" && request.method !== "HEAD") {
    try {
      body = await request.json();
    } catch { }
  }

  const authHeader = request.headers.get("authorization");
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), BACKEND_TIMEOUT_MS);

  // Construct target URL correctly avoiding double slashes or missing slashes
  const targetUrl = path 
    ? `${BACKEND_URL}/api/tutorials/${path}`
    : `${BACKEND_URL}/api/tutorials`;

  const { search } = new URL(request.url);
  try {
    const res = await fetch(`${targetUrl}${search}`, {
      method: request.method,
      headers: {
        "Content-Type": "application/json",
        ...(authHeader ? { Authorization: authHeader } : {}),
      },
      ...(body ? { body: JSON.stringify(body) } : {}),
      signal: controller.signal,
    });
    clearTimeout(timeoutId);
    const data = await res.json().catch(() => ({}));
    return Response.json(data, { status: res.status });
  } catch (err) {
    clearTimeout(timeoutId);
    return Response.json({ error: "Backend unavailable" }, { status: 502 });
  }
}

export async function GET(
  request: Request,
  context: { params: Promise<{ path?: string[] }> | { path?: string[] } }
) {
  const params = await Promise.resolve(context.params);
  const path = params?.path?.join("/");
  return proxy(path ?? "", request);
}

export async function PATCH(
  request: Request,
  context: { params: Promise<{ path?: string[] }> | { path?: string[] } }
) {
  const params = await Promise.resolve(context.params);
  const path = params?.path?.join("/");
  return proxy(path ?? "", request);
}

export async function DELETE(
  request: Request,
  context: { params: Promise<{ path?: string[] }> | { path?: string[] } }
) {
  const params = await Promise.resolve(context.params);
  const path = params?.path?.join("/");
  return proxy(path ?? "", request);
}

export async function POST(
  request: Request,
  context: { params: Promise<{ path?: string[] }> | { path?: string[] } }
) {
  const params = await Promise.resolve(context.params);
  const path = params?.path?.join("/");
  return proxy(path ?? "", request);
}
