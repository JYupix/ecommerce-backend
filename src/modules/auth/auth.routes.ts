import { Router } from 'express';
import { adminCheckController, changePasswordController, forgotPasswordController, loginController, logoutController, refreshController, registerController, resetPasswordController, verifyEmailController } from './auth.controller.js';
import { authMiddleware } from '../../middleware/auth.middleware.js';
import { requireRole } from '../../middleware/role.middleware.js';
import { forgotPasswordLimiter, loginLimiter, resetPasswordLimiter } from '../../middleware/rate-limit.middleware.js';

const router = Router();

router.post('/register', registerController);
router.get('/verify-email', verifyEmailController);
router.post("/login", loginLimiter, loginController);
router.post("/refresh", refreshController);
router.post("/forgot-password", forgotPasswordLimiter, forgotPasswordController);
router.post("/reset-password", resetPasswordLimiter, resetPasswordController);
router.post("/change-password", authMiddleware, changePasswordController);
router.post("/logout", authMiddleware, logoutController);
router.get("/admin/check", authMiddleware, requireRole("ADMIN"), adminCheckController);

export default router;