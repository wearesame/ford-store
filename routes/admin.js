const express = require("express");
const { requireAuth } = require("../middleware/auth");
const { prisma } = require("../lib/prisma");
const router = express.Router();

const get7WeeksAgo = () => {
  const date = new Date();
  date.setDate(date.getDate() - 7 * 7);  // Subtract 7 weeks
  return date;
};

router.get("/", requireAuth(["ADMIN"]), async (req, res) => {
  // Get date 7 weeks ago
  const sevenWeeksAgo = get7WeeksAgo();

  try {
    // Fetch users created in the last 7 weeks
    const users = await prisma.user.findMany({
      where: {
        createdAt: {
          gte: sevenWeeksAgo, // Created after 7 weeks ago
        },
      },
      include: {
        endpoints: true, // Include related endpoints for each user
      },
    });

    // Prepare data for the graph
    const userStats = users.map(user => ({
      username: user.username,
      newEndpointsCount: user.endpoints.length, // Count endpoints per user
    }));

    res.render("dashboard/index", {
      title: "Admin Dashboard",
      user: req.session.user,
      layout: "layouts/admin",
      userStats, // Pass data to frontend
    });
  } catch (error) {
    console.error("Error fetching user data:", error);
    res.status(500).send("Internal Server Error");
  }
});

router.get("/addProduct", requireAuth(["ADMIN"]), (req, res) => {
  res.render("dashboard/addProduct", {
    title: "Admin",
    user: req.session.user,
    layout: "layouts/admin",
  });
});

router.get("/users", requireAuth(["ADMIN"]), async (req, res) => {
  try {
    const users = await prisma.user.findMany();
    res.render("dashboard/users", {
      title: "Admin",
      users: users,
      layout: "layouts/admin",
    });
  } catch (error) {
    console.log(error);
  }
});

router.post("/users/delete/:id", requireAuth(["ADMIN"]), async (req, res) => {
  try {
    const userIdToDelete = req.params.id; // user ID ที่ต้องการลบ
    const loggedInUserId = req.session.user.id; // user ID ของผู้ที่ล็อกอินอยู่

    // ตรวจสอบว่า admin จะลบตัวเองหรือไม่
    if (userIdToDelete === loggedInUserId) {
      return res.status(400).send("คุณไม่สามารถลบตัวเองได้");
    }

    // ลบผู้ใช้จากฐานข้อมูล
    await prisma.user.delete({
      where: {
        id: userIdToDelete
      }
    });

    // Redirect กลับไปที่หน้า users
    res.redirect("/dashboard/users");
  } catch (error) {
    console.log("Error deleting user: ", error);
    res.status(500).send("Error deleting user.");
  }
});

module.exports = router;
