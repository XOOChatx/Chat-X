// src/utils/cookieOptions.ts
import { CookieOptions } from "express";

export function getCookieOptions(
  maxAgeMs: number,
  { crossDomain = false, isRefresh = false, domain }: { crossDomain?: boolean; isRefresh?: boolean; domain?: string } = {}
): CookieOptions {
  const isProd = process.env.NODE_ENV === "production";

  const baseOptions: CookieOptions = {
    httpOnly: true,
    secure: isProd,
    sameSite: isProd ? (crossDomain ? "none" : "strict") : "lax",
    maxAge: maxAgeMs,
    path: isRefresh ? "/auth/refresh" : "/",
  };

  // Add domain if specified (useful for cross-domain scenarios)
  if (domain) {
    baseOptions.domain = domain;
  }

  return baseOptions;
}
