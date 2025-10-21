// src/routes/auth.routes.ts
import { Router } from "express";
import { AuthController } from "../controller/auth.controller";
import { requireAuth } from "../middleware/requireAuth";
import { requirePermission } from "../middleware/requirePerm";
//import { requirePermission } from "../middleware/requirePerm";

const router = Router();
const ctrl = new AuthController();

router.post("/login", (req, res) => ctrl.login(req, res))
router.get("/me", requireAuth, (req, res) => ctrl.me(req, res))
//router.post("/change-password", requireAuth, (req, res) => ctrl.changePassword(req, res));
router.post("/logout", (req, res) => {
    console.log("🚪 LOGOUT: Backend logout endpoint called");
    
    // Import getCookieOptions to ensure consistent cookie clearing
    const { getCookieOptions } = require("../utils/cookieOptions");
    
    // Clear access_token with same options as login
    res.clearCookie("access_token", getCookieOptions(0));
    
    // Clear refresh_token with same options as login (including correct path)
    res.clearCookie("refresh_token", getCookieOptions(0, { crossDomain: true, isRefresh: true }));
    
    console.log("🚪 LOGOUT: Cookies cleared successfully");
    return res.status(200).json({ success: true, message: "Logged out successfully" });
});
router.post("/refresh", (req, res) => ctrl.refreshToken(req, res));

router.get("/managers", requireAuth, AuthController.getAllManagers)
router.get("/users", requireAuth, AuthController.getAllUsers)
router.get("/roles", requireAuth, AuthController.getAllRoles)
router.get("/permissions", requireAuth, AuthController.getAllPermisssions)

export default router;
