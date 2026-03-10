import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Builds a proxied URL by prepending the proxy base URL and URL-encoding
 * the original URL. Returns the original URL unchanged if no proxy is configured.
 */
export function buildProxiedUrl(url: string, proxyUrl?: string): string {
  if (!proxyUrl) return url;
  return `${proxyUrl}${encodeURIComponent(url)}`;
}
