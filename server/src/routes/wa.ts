import { Router } from "express";
import cors from "cors";
import { requireAdmin } from "../middleware/requireAdmin";
import { getWaQr, getWaStatus, getConnectedWaSessions, createNewSessionId } from "../services/wa-simple-final.service";
import { corsOptions } from "../config/cors.config";

const r = Router();

// ✅ Apply CORS to all /wa routes (especially QR)
r.use(cors(corsOptions));
r.options('*', cors(corsOptions));

// @ts-ignore
r.get("/login/qr", requireAdmin, async (req: any, res: any) => {
  try {
    const id = String(req.query.sessionId);
    if (!id || id === 'undefined') {
      return res.status(400).json({ 
        ok: false, 
        code: "MISSING_SESSION_ID", 
        message: "必须提供sessionId参数" 
      });
    }
    console.log(`📱 请求WhatsApp QR码: ${id}`);
    
    const dataUrl = await getWaQr(id);
    
    console.log(`🔍 获取到QR数据: ${id}, 有数据: ${!!dataUrl}, 长度: ${dataUrl?.length || 0}`);
    
    if (dataUrl && dataUrl.length > 0) {
      console.log(`✅ 返回WhatsApp QR码: ${id}`);
      // ✅ Make sure CORS headers are set explicitly
      res.header("Access-Control-Allow-Origin", req.headers.origin || "*");
      res.header("Access-Control-Allow-Credentials", "true");
      res.json({ dataUrl }); // front-end expects JSON
    } else {
      console.log(`⏳ WhatsApp QR码未就绪: ${id}`);
      res.status(202).json({ pending: true });
    }
  } catch (error: any) {
    console.error("❌ WhatsApp QR生成失败:", error);
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
    res.header("Access-Control-Allow-Origin", req.headers.origin || "*");
    res.header("Access-Control-Allow-Credentials", "true");
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
    res.header("Access-Control-Allow-Origin", req.headers.origin || "*");
    res.header("Access-Control-Allow-Credentials", "true");
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
    res.header("Access-Control-Allow-Origin", req.headers.origin || "*");
    res.header("Access-Control-Allow-Credentials", "true");
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
