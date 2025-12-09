"use client";

import { useEffect, useState } from "react";

interface URLPreview {
  title?: string;
  description?: string;
  image?: string;
  url: string;
  favicon?: string;
}

interface URLPreviewProps {
  url: string;
}

export function URLPreview({ url }: URLPreviewProps) {
  const [preview, setPreview] = useState<URLPreview | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!url || !isValidUrl(url)) {
      setPreview(null);
      return;
    }

    const fetchPreview = async () => {
      setLoading(true);
      setError(null);

      try {
        // Try to fetch page and extract Open Graph meta tags
        const response = await fetch(url, {
          mode: "no-cors",
          headers: {
            "User-Agent":
              "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
          },
        });

        // For CORS-blocked requests, we'll try a different approach
        if (response.type === "opaque") {
          // Try server-side extraction via a proxy (if available)
          await extractViaServer(url);
        } else {
          const html = await response.text();
          extractMetaTags(html, url);
        }
      } catch (err) {
        // Silently fail - show basic URL info instead
        console.log("Preview unavailable for URL:", url);
        setLoading(false);
      }
    };

    fetchPreview();
  }, [url]);

  const extractViaServer = async (targetUrl: string) => {
    try {
      const response = await fetch("/api/preview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: targetUrl }),
      });

      if (response.ok) {
        const data = await response.json();
        setPreview({
          url: targetUrl,
          title: data.title,
          description: data.description,
          image: data.image,
        });
      }
      setLoading(false);
    } catch (err) {
      setLoading(false);
    }
  };

  const extractMetaTags = (html: string, targetUrl: string) => {
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, "text/html");

    const getMetaContent = (property: string) => {
      const element =
        doc.querySelector(`meta[property="${property}"]`) ||
        doc.querySelector(`meta[name="${property}"]`);
      return element?.getAttribute("content");
    };

    const title = getMetaContent("og:title") || doc.title;
    const description = getMetaContent("og:description") || undefined;
    const image = getMetaContent("og:image") || undefined;

    if (title || description || image) {
      setPreview({
        title,
        description,
        image,
        url: targetUrl,
      });
    }

    setLoading(false);
  };

  if (!url || loading || !preview) {
    return null;
  }

  const domain = new URL(preview.url).hostname;

  return (
    <a
      href={preview.url}
      target="_blank"
      rel="noopener noreferrer"
      className="block border rounded-lg overflow-hidden hover:shadow-lg transition-shadow"
    >
      {preview.image && (
        <div className="aspect-video w-full overflow-hidden bg-muted">
          <img
            src={preview.image}
            alt={preview.title || "Preview"}
            className="w-full h-full object-cover"
            onError={() => {
              // Image failed to load
            }}
          />
        </div>
      )}
      <div className="p-3">
        {preview.title && (
          <h4 className="font-semibold text-sm line-clamp-2">
            {preview.title}
          </h4>
        )}
        {preview.description && (
          <p className="text-xs text-muted-foreground line-clamp-2 mt-1">
            {preview.description}
          </p>
        )}
        <p className="text-xs text-muted-foreground mt-2">{domain}</p>
      </div>
    </a>
  );
}

function isValidUrl(string: string): boolean {
  try {
    new URL(string);
    return true;
  } catch (_) {
    return false;
  }
}
