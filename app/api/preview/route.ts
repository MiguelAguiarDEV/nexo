import { NextResponse } from "next/server";

export async function POST(request: Request) {
  console.log("[API Preview] POST request received");

  try {
    const body = await request.json();
    const { url } = body;

    console.log("[API Preview] URL:", url);

    if (!url) {
      console.log("[API Preview] No URL provided");
      return NextResponse.json({ title: "URL inválido" }, { status: 200 });
    }

    // Validate URL
    try {
      new URL(url);
    } catch {
      console.log("[API Preview] URL validation failed");
      return NextResponse.json({ title: url }, { status: 200 });
    }

    // Use microlink.io API for URL preview
    const microlinkUrl = `https://api.microlink.io/?url=${encodeURIComponent(
      url
    )}`;

    console.log("[API Preview] Calling microlink:", microlinkUrl);

    const response = await fetch(microlinkUrl, {
      headers: {
        "User-Agent": "nexo-app/1.0",
      },
    });

    console.log("[API Preview] Microlink status:", response.status);

    const data = await response.json();
    console.log(
      "[API Preview] Microlink response:",
      JSON.stringify(data, null, 2)
    );

    if (data.status === "success" && data.data) {
      const preview = {
        title: data.data.title || "Sitio web",
        description: data.data.description,
        image: data.data.image?.url || data.data.logo?.url,
      };

      console.log("[API Preview] Returning preview:", preview);

      return NextResponse.json(preview, {
        headers: {
          "Cache-Control": "public, max-age=3600, stale-while-revalidate=86400",
        },
      });
    }

    // Fallback: return URL as title
    console.log("[API Preview] No data from microlink, returning URL as title");
    return NextResponse.json({ title: url }, { status: 200 });
  } catch (error) {
    console.error("[API Preview] Error:", error);
    return NextResponse.json({ title: "Error al cargar" }, { status: 200 });
  }
}
