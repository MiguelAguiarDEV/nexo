import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const { url } = await request.json();

    if (!url) {
      return NextResponse.json({ error: "URL is required" }, { status: 400 });
    }

    // Validate URL
    try {
      new URL(url);
    } catch {
      return NextResponse.json({ error: "Invalid URL" }, { status: 400 });
    }

    // Fetch the page
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);

    try {
      const response = await fetch(url, {
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
        },
        redirect: "follow",
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        return NextResponse.json(
          { error: "Failed to fetch URL" },
          { status: 400 }
        );
      }

      const html = await response.text();

      // Extract meta tags
      const titleMatch =
        html.match(
          /<meta\s+property=["']og:title["']\s+content=["']([^"']+)["']/
        ) || html.match(/<title[^>]*>([^<]+)<\/title>/);
      const descriptionMatch =
        html.match(
          /<meta\s+property=["']og:description["']\s+content=["']([^"']+)["']/
        ) ||
        html.match(
          /<meta\s+name=["']description["']\s+content=["']([^"']+)["']/
        );
      const imageMatch = html.match(
        /<meta\s+property=["']og:image["']\s+content=["']([^"']+)["']/
      );

      const preview = {
        title: titleMatch?.[1] || undefined,
        description: descriptionMatch?.[1] || undefined,
        image: imageMatch?.[1] || undefined,
      };

      // Set cache headers
      return NextResponse.json(preview, {
        headers: {
          "Cache-Control": "public, max-age=3600, stale-while-revalidate=86400",
        },
      });
    } catch (fetchError) {
      clearTimeout(timeoutId);
      throw fetchError;
    }
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to process request" },
      { status: 500 }
    );
  }
}
