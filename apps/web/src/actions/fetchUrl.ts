"use server";
import * as Sentry from "@sentry/nextjs";

export interface UrlMetadata {
  url: string;
  title: string | null;
  description: string | null;
  imageUrl: string | null;
  domain: string;
}

export async function fetchUrlMetadataAction(
  rawUrl: string
): Promise<{ success: true; data: UrlMetadata } | { success: false; error: string }> {
  try {
    const url = rawUrl.startsWith("http") ? rawUrl : `https://${rawUrl}`;
    const parsed = new URL(url);
    const domain = parsed.hostname.replace(/^www\./, "");

    const res = await fetch(url, {
      headers: { "User-Agent": "Signalboard/1.0 (link preview)" },
      signal: AbortSignal.timeout(8000),
    });

    if (!res.ok) {
      return { success: false, error: `Failed to fetch URL: ${res.status}` };
    }

    const contentType = res.headers.get("content-type") || "";
    if (!contentType.includes("text/html")) {
      // Non-HTML resource — just record the URL with no metadata
      return {
        success: true,
        data: { url, title: domain, description: null, imageUrl: null, domain },
      };
    }

    const html = await res.text();

    const title =
      html.match(/<meta\s+property="og:title"\s+content="([^"]+)"/i)?.[1] ||
      html.match(/<meta\s+name="twitter:title"\s+content="([^"]+)"/i)?.[1] ||
      html.match(/<title[^>]*>([^<]+)<\/title>/i)?.[1]?.trim() ||
      null;

    const description =
      html.match(/<meta\s+property="og:description"\s+content="([^"]+)"/i)?.[1] ||
      html.match(/<meta\s+name="description"\s+content="([^"]+)"/i)?.[1] ||
      null;

    const imageUrl =
      html.match(/<meta\s+property="og:image"\s+content="([^"]+)"/i)?.[1] ||
      html.match(/<meta\s+name="twitter:image"\s+content="([^"]+)"/i)?.[1] ||
      null;

    return {
      success: true,
      data: { url, title: title ?? domain, description, imageUrl, domain },
    };
  } catch (err: unknown) {
    Sentry.captureException(err instanceof Error ? err : new Error(String(err)));
    return { success: false, error: err instanceof Error ? err.message : "Failed to fetch URL" };
  }
}
