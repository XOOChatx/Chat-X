import { Router } from "express";
import cors from "cors";
import { requireAdmin } from "../middleware/requireAdmin";
import { corsOptions } from "../config/cors.config";
import {
  getWaQr,
  getWaStatus,
  getConnectedWaSessions,
  createNewSessionId,
} from "../services/wa-simple-final.service";

const r = Router();

// ✅ Enable CORS for all /wa routes (handles OPTIONS automatically)
r.use(cors(corsOptions));
r.options("*", cors(corsOptions));

// ===============================
// 🔹 GET /wa/login/qr
// ===============================
r.get("/login/qr", requireAdmin, async (req, res) => {
  try {
    const id = String(req.query.sessionId);
    if (!id || id === "undefined") {
      return res.status(400).json({
        ok: false,
        code: "MISSING_SESSION_ID",
        message: "必须提供sessionId参数",
      });
    }

    console.log(`📱 请求WhatsApp QR码: ${id}`);

    const dataUrl = await getWaQr(id);

    console.log(
      `🔍 获取到QR数据: ${id}, 有数据: ${!!dataUrl}, 长度: ${dataUrl?.length || 0}`
    );

    if (dataUrl && dataUrl.length > 0) {
      console.log(`✅ 返回WhatsApp QR码: ${id}`);
      res.json({ dataUrl });
    } else {
      console.log(`⏳ WhatsApp QR码未就绪: ${id}`);
      res.status(202).json({ pending: true });
    }
  } catch (error: any) {
    console.error("❌ WhatsApp QR生成失败:", error);
    res.status(500).json({
      ok: false,
      code: "INTERNAL_ERROR",
      message: error.message || "生成WhatsApp二维码失败",
    });
  }
});

// ===============================
// 🔹 GET /wa/login/status
// ===============================
r.get("/login/status", requireAdmin, async (req, res) => {
  try {
    const id = String(req.query.sessionId);
    if (!id || id === "undefined") {
      return res.status(400).json({
        ok: false,
        code: "MISSING_SESSION_ID",
        message: "必须提供sessionId参数",
      });
    }

    const status = await getWaStatus(id);
    res.json({ ok: true, status });
  } catch (error: any) {
    console.error("❌ WhatsApp状态查询失败:", error);
    res.status(500).json({
      ok: false,
      code: "INTERNAL_ERROR",
      message: error.message || "查询WhatsApp状态失败",
    });
  }
});

// ===============================
// 🔹 GET /wa/sessions/connected
// ===============================
r.get("/sessions/connected", requireAdmin, async (req, res) => {
  try {
    const connectedSessions = getConnectedWaSessions();
    res.json({ sessions: connectedSessions });
  } catch (error: any) {
    console.error("❌ 获取已连接会话失败:", error);
    res.status(500).json({
      ok: false,
      code: "INTERNAL_ERROR",
      message: error.message || "获取已连接会话失败",
    });
  }
});

// ===============================
// 🔹 POST /wa/sessions/create
// ===============================
r.post("/sessions/create", requireAdmin, async (req, res) => {
  try {
    const newSessionId = createNewSessionId();
    console.log(`🆕 创建新Session ID: ${newSessionId}`);
    res.json({ sessionId: newSessionId });
  } catch (error: any) {
    console.error("❌ 创建Session ID失败:", error);
    res.status(500).json({
      ok: false,
      code: "INTERNAL_ERROR",
      message: error.message || "创建Session ID失败",
    });
  }
});

export default r;
