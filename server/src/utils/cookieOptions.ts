// src/utils/cookieOptions.ts
import { CookieOptions } from "express";

export function getCookieOptions(
  maxAgeMs: number,
  { crossDomain = false, isRefresh = false }: { crossDomain?: boolean; isRefresh?: boolean } = {}
): CookieOptions {
  const isProd = process.env.NODE_ENV === "production";

  if (!isProd) {
    return {
      httpOnly: true,
      secure: false,
      sameSite: "lax",
      maxAge: maxAgeMs,
      path: "/", // you can also set `/auth/refresh` if isRefresh is true
    };
  }

  // 🔧 生产环境：跨域部署时必须使用这些设置
  return {
    httpOnly: true,
    secure: true, // 必须为true（HTTPS）
    sameSite: "none", // 跨域必须为"none"
    maxAge: maxAgeMs,
    path: isRefresh ? "/auth/refresh" : "/",
    // domain不设置，让浏览器自动处理（更安全）
  };
}
