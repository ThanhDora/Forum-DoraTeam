const BACKEND_URL = process.env.API_URL ?? process.env.BACKEND_URL;

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const authHeader = request.headers.get("authorization");
  const formData = await request.formData();

  try {
    const res = await fetch(`${BACKEND_URL}/api/upload`, {
      method: "POST",
      headers: {
        ...(authHeader ? { Authorization: authHeader } : {}),
      },
      body: formData,
    });

    const data = await res.json();
    return Response.json(data, { status: res.status });
  } catch (err) {
    console.error("Upload proxy error:", err);
    return Response.json({ error: "Backend unavailable" }, { status: 502 });
  }
}
