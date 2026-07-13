"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const studentController_1 = require("../controllers/studentController");
const authMiddleware_1 = require("../middleware/authMiddleware");
const router = (0, express_1.Router)();
// Semua route student membutuhkan JWT yang valid
router.get('/profile', authMiddleware_1.verifyToken, studentController_1.getProfile);
router.get('/dashboard', authMiddleware_1.verifyToken, studentController_1.getDashboard);
exports.default = router;
