"use client";

import { useEffect, useState } from "react";

interface URLPreviewProps {
  url: string;
}

export function URLPreview({ url }: URLPreviewProps) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    console.log("[URLPreview] Starting fetch for URL:", url);

    if (!url) {
      setLoading(false);
      return;
    }

    const fetchData = async () => {
      try {
        console.log("[URLPreview] Calling /api/preview");
        const res = await fetch("/api/preview", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ url }),
        });

        console.log("[URLPreview] Response status:", res.status);
        const json = await res.json();
        console.log("[URLPreview] Response data:", json);

        setData(json);
      } catch (error) {
        console.error("[URLPreview] Error:", error);
        setData({ title: url });
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [url]);

  if (!url || loading) {
    return <div className="p-2 text-xs">{loading ? "Cargando..." : ""}</div>;
  }

  if (!data || !data.title) {
    return (
      <div className="p-2 text-xs text-muted-foreground truncate">{url}</div>
    );
  }

  const domain = (() => {
    try {
      return new URL(data.url || url).hostname;
    } catch {
      return "Sitio web";
    }
  })();

  return (
    <div className="flex gap-2 p-2 h-full">
      {data.image && (
        <div className="w-12 h-12 flex-shrink-0 rounded bg-muted overflow-hidden">
          <img
            src={data.image}
            alt="preview"
            className="w-full h-full object-cover"
            onError={(e) => {
              console.log("[URLPreview] Image failed to load");
              (e.target as HTMLImageElement).style.display = "none";
            }}
          />
        </div>
      )}
      <div className="flex-1 min-w-0 flex flex-col justify-center gap-0.5">
        <h4 className="font-semibold text-xs line-clamp-2">{data.title}</h4>
        <p className="text-xs text-muted-foreground line-clamp-1">{domain}</p>
      </div>
    </div>
  );
}
