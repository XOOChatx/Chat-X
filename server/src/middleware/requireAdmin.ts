import { Request, Response, NextFunction } from 'express';
import { config } from '../config/env';
import { ErrorResponse } from '../types/auth';

export interface AuthenticatedRequest extends Request {
  isAdmin: boolean;
}

/**
 * 管理员身份验证中间件
 * 检查请求头中的 Authorization: Bearer <ADMIN_TOKEN>
 * 🚀 自动跳过 CORS 预检请求 (OPTIONS)
 */
export function requireAdmin(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  // ✅ Step 1: Skip preflight (CORS) requests — they don't need auth
  if (req.method === 'OPTIONS') {
    console.log(`🟡 Skipping admin auth for preflight request: ${req.path}`);
    return next();
  }

  // ✅ Step 2: Check Authorization header
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    const errorResponse: ErrorResponse = {
      ok: false,
      code: 'AUTH_FORBIDDEN',
      message: '缺少授权头或格式错误'
    };
    return res.status(401).json(errorResponse);
  }

  // ✅ Step 3: Validate token
  const token = authHeader.slice(7); // remove "Bearer "
  if (token !== config.ADMIN_TOKEN) {
    const errorResponse: ErrorResponse = {
      ok: false,
      code: 'AUTH_FORBIDDEN',
      message: '无效的管理员令牌'
    };
    return res.status(403).json(errorResponse);
  }

  // ✅ Step 4: Authorized
  req.isAdmin = true;
  next();
}
