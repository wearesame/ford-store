const express = require("express");
const bcrypt = require("bcrypt");
const { prisma } = require("../lib/prisma"); // shared instance
const { requireGuest } = require("../middleware/auth");
const router = express.Router();

// GET - แสดงหน้า login
router.get("/", requireGuest(),(_req, res) => {
  res.render("auth/login", {
    title: "Login",
  });
});

// POST - เข้าสู่ระบบ
router.post("/", async (req, res) => {
  try {
    const { username, password } = req.body;

    // 1. Validation
    if (!username || !password) {
      return res.status(400).json({
        status: "error",
        msg: "กรุณากรอกชื่อผู้ใช้และรหัสผ่าน",
      });
    }

    // 2. หา user ในฐานข้อมูล
    const user = await prisma.user.findUnique({
      where: { username },
    });

    if (!user) {
      return res.status(401).json({
        status: "error",
        msg: "ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง",
      });
    }

    // 3. ตรวจสอบรหัสผ่าน
    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      return res.status(401).json({
        status: "error",
        msg: "ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง",
      });
    }

    req.session.regenerate((err) => {
      if (err) throw err;

      req.session.user = {
        id: user.id,
        username: user.username,
        role: user.role,
        avatar: user.avatar
      };

      res.json({
        status: "success",
        msg: "เข้าสู่ระบบสำเร็จ",
        data: {
          id: user.id,
          username: user.username,
          role: user.role,
          avatar: user.avatar
        },
      });
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({
      status: "error",
      msg: "เกิดข้อผิดพลาดในการเข้าสู่ระบบ",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
});

// GET - ออกจากระบบ
router.get("/logout", (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      console.error("Logout error:", err);
    }
    res.redirect("/login");
  });
});

module.exports = router;
