import { Router } from "express";
import { requireAdmin } from "../middleware/requireAdmin";
import { getWaQr, getWaStatus, getConnectedWaSessions, createNewSessionId } from "../services/wa-simple-final.service";

const r = Router();

// Note: CORS is handled globally in app.ts, but adding extra protection for QR endpoint
// Additional CORS protection specifically for WhatsApp QR endpoint
r.use('/login/qr', (req: any, res: any, next: any) => {
  const origin = req.headers.origin;
  if (origin && ['https://www.evolution-x.io', 'https://frontend-production-56b7.up.railway.app'].includes(origin)) {
    res.header('Access-Control-Allow-Origin', origin);
    res.header('Access-Control-Allow-Credentials', 'true');
    res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Accept, Origin');
    console.log('🔒 QR ENDPOINT CORS: Headers set for:', origin, 'method:', req.method);
  }
  next();
});

// @ts-ignore
r.get("/login/qr", requireAdmin, async (req: any, res: any) => {
  try {
    const id = String(req.query.sessionId);
    if (!id || id === 'undefined') {
      // Set CORS headers even for error responses
      const origin = req.headers.origin;
      if (origin && ['https://www.evolution-x.io', 'https://frontend-production-56b7.up.railway.app'].includes(origin)) {
        res.header('Access-Control-Allow-Origin', origin);
        res.header('Access-Control-Allow-Credentials', 'true');
      }
      return res.status(400).json({ 
        ok: false, 
        code: "MISSING_SESSION_ID", 
        message: "必须提供sessionId参数" 
      });
    }
    console.log(`📱 请求WhatsApp QR码: ${id}`);
    
    // 🔒 BULLETPROOF CORS: Set headers directly in response
    const origin = req.headers.origin;
    if (origin && ['https://www.evolution-x.io', 'https://frontend-production-56b7.up.railway.app'].includes(origin)) {
      res.header('Access-Control-Allow-Origin', origin);
      res.header('Access-Control-Allow-Credentials', 'true');
      res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
      res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Accept, Origin');
      console.log('🔒 BULLETPROOF CORS: Direct headers set for QR endpoint:', origin);
    }
    
    const dataUrl = await getWaQr(id);
    
    console.log(`🔍 获取到QR数据: ${id}, 有数据: ${!!dataUrl}, 长度: ${dataUrl?.length || 0}`);
    
    if (dataUrl && dataUrl.length > 0) {
      console.log(`✅ 返回WhatsApp QR码: ${id}`);
      res.json({ dataUrl }); // front-end expects JSON
    } else {
      console.log(`⏳ WhatsApp QR码未就绪: ${id}`);
      res.status(202).json({ pending: true });
    }
  } catch (error: any) {
    console.error("❌ WhatsApp QR生成失败:", error);
    // Set CORS headers even for error responses
    const origin = req.headers.origin;
    if (origin && ['https://www.evolution-x.io', 'https://frontend-production-56b7.up.railway.app'].includes(origin)) {
      res.header('Access-Control-Allow-Origin', origin);
      res.header('Access-Control-Allow-Credentials', 'true');
    }
    res.status(500).json({ 
      ok: false, 
      code: "INTERNAL_ERROR", 
      message: error.message || "生成WhatsApp二维码失败" 
    });
  }
});

// ===============================
// 🔹 GET /wa/login/qr-proxy (CORS-Free Alternative)
// ===============================
// @ts-ignore
r.get("/login/qr-proxy", requireAdmin, async (req: any, res: any) => {
  try {
    const id = String(req.query.sessionId);
    if (!id || id === 'undefined') {
      return res.status(400).json({
        ok: false,
        code: "MISSING_SESSION_ID",
        message: "必须提供sessionId参数"
      });
    }
    console.log(`🚀 PROXY: 请求WhatsApp QR码: ${id}`);

    const dataUrl = await getWaQr(id);

    console.log(`🚀 PROXY: 获取到QR数据: ${id}, 有数据: ${!!dataUrl}, 长度: ${dataUrl?.length || 0}`);

    if (dataUrl && dataUrl.length > 0) {
      console.log(`🚀 PROXY: 返回WhatsApp QR码: ${id}`);
      // Return as plain text to avoid any CORS issues
      res.setHeader('Content-Type', 'text/plain');
      res.send(dataUrl);
    } else {
      console.log(`🚀 PROXY: WhatsApp QR码未就绪: ${id}`);
      res.status(202).json({ pending: true });
    }
  } catch (error: any) {
    console.error("🚀 PROXY: WhatsApp QR生成失败:", error);
    res.status(500).json({
      ok: false,
      code: "INTERNAL_ERROR",
      message: error.message || "生成WhatsApp二维码失败"
    });
  }
});

// ===============================
// 🔹 GET /wa/login/qr-image (Direct Image Response)
// ===============================
// @ts-ignore
r.get("/login/qr-image", requireAdmin, async (req: any, res: any) => {
  try {
    const id = String(req.query.sessionId);
    if (!id || id === 'undefined') {
      return res.status(400).json({
        ok: false,
        code: "MISSING_SESSION_ID",
        message: "必须提供sessionId参数"
      });
    }
    console.log(`🖼️ IMAGE: 请求WhatsApp QR码: ${id}`);

    const dataUrl = await getWaQr(id);

    console.log(`🖼️ IMAGE: 获取到QR数据: ${id}, 有数据: ${!!dataUrl}, 长度: ${dataUrl?.length || 0}`);

    if (dataUrl && dataUrl.length > 0) {
      console.log(`🖼️ IMAGE: 返回WhatsApp QR码: ${id}`);
      // Convert data URL to buffer and return as image
      const base64Data = dataUrl.split(',')[1];
      const imageBuffer = Buffer.from(base64Data, 'base64');
      
      res.setHeader('Content-Type', 'image/png');
      res.setHeader('Cache-Control', 'no-cache');
      res.send(imageBuffer);
    } else {
      console.log(`🖼️ IMAGE: WhatsApp QR码未就绪: ${id}`);
      res.status(202).json({ pending: true });
    }
  } catch (error: any) {
    console.error("🖼️ IMAGE: WhatsApp QR生成失败:", error);
    res.status(500).json({
      ok: false,
      code: "INTERNAL_ERROR",
      message: error.message || "生成WhatsApp二维码失败"
    });
  }
});

// @ts-ignore
r.get("/login/status", requireAdmin, async (req: any, res: any) => {
  try {
    const id = String(req.query.sessionId);
    if (!id || id === 'undefined') {
      return res.status(400).json({ 
        ok: false, 
        code: "MISSING_SESSION_ID", 
        message: "必须提供sessionId参数" 
      });
    }
    const status = await getWaStatus(id);
    res.json({ ok: true, status });
  } catch (error: any) {
    console.error("❌ WhatsApp状态查询失败:", error);
    res.status(500).json({ 
      ok: false, 
      code: "INTERNAL_ERROR", 
      message: error.message || "查询WhatsApp状态失败" 
    });
  }
});

// 新的API：获取所有已连接的会话
// @ts-ignore
r.get("/sessions/connected", requireAdmin, async (req: any, res: any) => {
  try {
    const connectedSessions = getConnectedWaSessions();
    res.json({ sessions: connectedSessions });
  } catch (error: any) {
    console.error("❌ 获取已连接会话失败:", error);
    res.status(500).json({ 
      ok: false, 
      code: "INTERNAL_ERROR", 
      message: error.message || "获取已连接会话失败" 
    });
  }
});

// 新的API：创建新的Session ID
// @ts-ignore
r.post("/sessions/create", requireAdmin, async (req: any, res: any) => {
  try {
    const newSessionId = createNewSessionId();
    console.log(`🆕 创建新Session ID: ${newSessionId}`);
    res.json({ sessionId: newSessionId });
  } catch (error: any) {
    console.error("❌ 创建Session ID失败:", error);
    res.status(500).json({ 
      ok: false, 
      code: "INTERNAL_ERROR", 
      message: error.message || "创建Session ID失败" 
    });
  }
});

export default r;
