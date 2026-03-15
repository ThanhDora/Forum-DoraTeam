const BACKEND_URL = process.env.API_URL ?? process.env.BACKEND_URL;
const BACKEND_TIMEOUT_MS = 15000;

export const dynamic = "force-dynamic";

async function proxy(path: string, request: Request) {
  let body: unknown = null;
  if (request.method !== "GET" && request.method !== "HEAD") {
    try {
      body = await request.json();
    } catch {
      // Body might be empty
    }
  }

  const authHeader = request.headers.get("authorization");
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), BACKEND_TIMEOUT_MS);

  const { search } = new URL(request.url);
  try {
    const res = await fetch(`${BACKEND_URL}/api/auth/${path}${search}`, {
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
    if (err instanceof Error && err.name === "AbortError") {
      return Response.json({ error: "Backend timeout" }, { status: 502 });
    }
    return Response.json(
      { error: "Backend unavailable" },
      { status: 502 }
    );
  }
}

export async function POST(
  request: Request,
  context: { params: Promise<{ auth: string[] }> | { auth: string[] } }
) {
  const params = await Promise.resolve(context.params);
  const path = params?.auth?.join("/");
  if (path !== "login" && path !== "register" && path !== "refresh" && path !== "change-password") {
    return Response.json({ error: "Not found" }, { status: 404 });
  }
  return proxy(path, request);
}

export async function GET(
  request: Request,
  context: { params: Promise<{ auth: string[] }> | { auth: string[] } }
) {
  const params = await Promise.resolve(context.params);
  const path = params?.auth?.join("/");
  if (path !== "me") {
    return Response.json({ error: "Not found" }, { status: 404 });
  }
  return proxy(path, request);
}
