const express = require("express");
const { requireAuth } = require("../middleware/auth");
const { prisma } = require("../lib/prisma");
const upload = require("../lib/multer"); // เรียกใช้งาน multer
const bcrypt = require("bcrypt");

const router = express.Router();

// Route สำหรับแสดงข้อมูลโปรไฟล์ผู้ใช้
router.get("/", requireAuth(), async (req, res) => {
    try {
        const user = await prisma.user.findUnique({
            where: { id: req.session.user.id },
        });
        console.log(user);
        // ตรวจสอบว่า user มีค่าหรือไม่
        if (!user) {
            return res.status(404).send('ไม่พบข้อมูลผู้ใช้');
        }

        res.render("auth/profile", {
            title: "แก้ไขโปรไฟล์ผู้ใช้",
            user,  // ส่งข้อมูล user ไปยัง EJS
        });
    } catch (error) {
        console.error(error);
        res.status(500).send("เกิดข้อผิดพลาดในการดึงข้อมูลผู้ใช้");
    }
});

// API สำหรับแก้ไขโปรไฟล์ผู้ใช้
router.post(
    "/",
    requireAuth(),
    upload.single("profileImage"),
    async (req, res) => {
        try {
            const { fname, lname, password } = req.body;

            let updatedData = { fname, lname };

            if (req.file) {
                updatedData.avatar = `/upload/${req.file.filename}`;
            }

            if (password && password.length >= 6) {
                const hashedPassword = await bcrypt.hash(password, 10);
                updatedData.password = hashedPassword;
            }

            const updatedUser = await prisma.user.update({
                where: { id: req.session.user.id },
                data: updatedData,
            });

            req.session.user = updatedUser;

            res.redirect("/profile");
        } catch (error) {
            console.error(error);
            res.status(500).send("เกิดข้อผิดพลาดในการอัปเดตโปรไฟล์");
        }
    }
);


module.exports = router;
