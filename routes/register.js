const express = require("express");
const bcrypt = require("bcrypt");
const { prisma } = require("../lib/prisma"); // ใช้ shared instance
const { requireGuest } = require("../middleware/auth");
const router = express.Router();

// GET - แสดงหน้า register
router.get("/", requireGuest(),(_req, res) => {
  res.render("auth/register", {
    title: "Register",
  });
});

// POST - ลงทะเบียนผู้ใช้ใหม่
router.post("/", async (req, res) => {
  try {
    const {
      username,
      password,
      address,
      phone,
      fname,
      lname,
      confirmPassword,
    } = req.body;

    // 1. Validation
    if (
      !username ||
      !password ||
      !confirmPassword ||
      !address ||
      !phone ||
      !fname ||
      !lname
    ) {
      return res.status(400).json({
        status: "error",
        msg: "กรุณากรอกข้อมูลให้ครบถ้วน",
      });
    }

    if (password !== confirmPassword) {
      return res.status(400).json({
        status: "error",
        msg: "รหัสผ่านไม่ตรงกัน",
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        status: "error",
        msg: "รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร",
      });
    }

    // 2. ตรวจสอบว่า username ซ้ำหรือไม่
    const existingUser = await prisma.user.findUnique({
      where: { username },
    });

    if (existingUser) {
      return res.status(400).json({
        status: "error",
        msg: "ชื่อผู้ใช้นี้มีอยู่ในระบบแล้ว",
      });
    }

    // 3. Hash password
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // 4. บันทึกข้อมูลลง database
    const newUser = await prisma.user.create({
      data: {
        username,
        password: hashedPassword,
        fname,
        lname,
        phone,
        address,
      },
    });

    // 5. ส่งข้อมูลกลับ (ไม่รวม password)
    res.status(201).json({
      status: "success",
      msg: "ลงทะเบียนสำเร็จ",
      data: {
        id: newUser.id,
        username: newUser.username,
        createdAt: newUser.createdAt,
      },
    });
  } catch (error) {
    console.error("Register error:", error);
    res.status(500).json({
      status: "error",
      msg: "เกิดข้อผิดพลาดในการลงทะเบียน",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
});

module.exports = router;
